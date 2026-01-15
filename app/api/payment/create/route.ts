// =====================================================
// 결제 요청 생성 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  createPaymentData, 
  calculatePaymentAmount,
  getTossClientKey,
} from '@/lib/toss-payments';
import { PLAN_PRICES } from '@/lib/subscription';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 요청 바디 파싱
    const body = await request.json();
    const { planId, billingCycle } = body;

    // 유효성 검증
    if (!planId || !['free', 'basic', 'pro', 'vip'].includes(planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // 무료 플랜은 결제 불필요
    if (planId === 'free') {
      return NextResponse.json(
        { success: false, error: 'Free plan does not require payment' },
        { status: 400 }
      );
    }

    // 인증 확인 (Authorization 헤더에서 토큰 추출)
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      userId = user.id;
      userEmail = user.email || null;
      userName = user.user_metadata?.full_name || user.email?.split('@')[0] || null;
    } else {
      // 쿠키에서 세션 확인 시도
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      userEmail = session.user.email || null;
      userName = session.user.user_metadata?.full_name || null;
    }

    // 이미 동일 플랜 구독 중인지 확인
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', userId)
      .in('status', ['active', 'trial'])
      .single();

    if (existingSub?.plan?.name === planId) {
      return NextResponse.json(
        { success: false, error: 'Already subscribed to this plan' },
        { status: 400 }
      );
    }

    // 플랜 정보 조회
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planId)
      .single();

    if (!planData) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    // 결제 금액 계산
    const amount = calculatePaymentAmount(planId, billingCycle);

    // 결제 요청 데이터 생성
    const paymentData = createPaymentData(
      userId,
      planId,
      billingCycle,
      { name: userName || undefined, email: userEmail || undefined }
    );

    // 결제 요청 정보 DB에 임시 저장 (나중에 검증용)
    const { error: insertError } = await supabase
      .from('subscription_transactions')
      .insert({
        user_id: userId,
        plan_id: planData.id,
        amount,
        currency: 'KRW',
        status: 'pending',
        payment_provider: 'toss',
        payment_id: paymentData.orderId,
        metadata: {
          billingCycle,
          planName: planId,
          orderName: paymentData.orderName,
        },
      });

    if (insertError) {
      console.error('Failed to save transaction:', insertError);
    }

    // 클라이언트로 결제 데이터 반환
    return NextResponse.json({
      success: true,
      paymentData: {
        ...paymentData,
        clientKey: getTossClientKey(),
      },
      plan: {
        id: planData.id,
        name: planId,
        displayName: planData.display_name,
        amount,
        billingCycle,
      },
    });

  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment request' },
      { status: 500 }
    );
  }
}
