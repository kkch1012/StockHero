// =====================================================
// 결제 요청 생성 API (포트원 + KG이니시스)
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  generateOrderId, 
  calculatePaymentAmount,
  SUBSCRIPTION_PLANS,
} from '@/lib/subscription/config';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 플랜별 표시 이름
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  basic: 'BASIC',
  pro: 'PRO',
  vip: 'VIP',
};

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

    // 인증 확인
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
      // 로그인하지 않은 경우 - 테스트용으로 임시 ID 생성
      userId = `guest_${Date.now()}`;
      userEmail = 'guest@stockhero.kr';
      userName = '게스트';
    }

    // 결제 금액 계산
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }

    const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const cycleName = billingCycle === 'monthly' ? '월간' : '연간';

    // 주문 ID 생성
    const orderId = generateOrderId(userId, planId);

    // 결제 요청 정보 DB에 임시 저장
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planId)
      .single();

    if (planData) {
      await supabase
        .from('subscription_transactions')
        .insert({
          user_id: userId,
          plan_id: planData.id,
          amount,
          currency: 'KRW',
          status: 'pending',
          payment_provider: 'portone_inicis',
          payment_id: orderId,
          metadata: {
            billingCycle,
            planName: planId,
            pgProvider: 'html5_inicis',
          },
        });
    }

    // 클라이언트로 결제 데이터 반환
    return NextResponse.json({
      success: true,
      orderId,
      orderName: `StockHero ${PLAN_DISPLAY_NAMES[planId]} ${cycleName} 구독`,
      amount,
      customerEmail: userEmail,
      customerName: userName,
      plan: {
        id: planId,
        displayName: PLAN_DISPLAY_NAMES[planId],
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
