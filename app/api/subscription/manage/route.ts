// =====================================================
// 구독 관리 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelPayment, calculatePeriodEnd } from '@/lib/toss-payments';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET: 현재 구독 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 구독 정보 조회
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      throw subError;
    }

    // 오늘 사용량 조회
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    // 결제 이력 조회
    const { data: transactions } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // 구독이 없으면 무료 플랜
    if (!subscription) {
      const { data: freePlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'free')
        .single();

      return NextResponse.json({
        success: true,
        subscription: null,
        currentPlan: freePlan,
        usage: usage || null,
        transactions: transactions || [],
      });
    }

    // 구독 상태 확인 (만료 체크)
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    
    if (periodEnd < now && subscription.status === 'active') {
      // 구독 만료 처리
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', subscription.id);
      
      subscription.status = 'expired';
    }

    return NextResponse.json({
      success: true,
      subscription,
      currentPlan: subscription.plan,
      usage: usage || null,
      transactions: transactions || [],
      daysRemaining: Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
    });

  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * POST: 구독 업그레이드/다운그레이드
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, newPlanName, billingCycle } = body;

    if (action === 'upgrade' || action === 'downgrade') {
      // 새 플랜 조회
      const { data: newPlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', newPlanName)
        .single();

      if (!newPlan) {
        return NextResponse.json(
          { success: false, error: 'Plan not found' },
          { status: 404 }
        );
      }

      // 업그레이드는 즉시 결제 필요
      if (action === 'upgrade') {
        return NextResponse.json({
          success: true,
          action: 'redirect_to_payment',
          newPlan,
          billingCycle: billingCycle || 'monthly',
        });
      }

      // 다운그레이드는 기간 종료 후 적용
      if (action === 'downgrade') {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!subscription) {
          return NextResponse.json(
            { success: false, error: 'No active subscription' },
            { status: 400 }
          );
        }

        await supabase
          .from('user_subscriptions')
          .update({
            metadata: {
              ...subscription.metadata,
              scheduledPlanChange: {
                newPlanId: newPlan.id,
                newPlanName: newPlanName,
                effectiveAt: subscription.current_period_end,
              },
            },
          })
          .eq('id', subscription.id);

        return NextResponse.json({
          success: true,
          message: `다운그레이드가 예약되었습니다. ${subscription.current_period_end}부터 ${newPlan.display_name} 플랜이 적용됩니다.`,
          effectiveAt: subscription.current_period_end,
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Subscription POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 구독 해지 (기간 종료 시까지 유지)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // URL에서 즉시 해지 여부 확인
    const url = new URL(request.url);
    const immediate = url.searchParams.get('immediate') === 'true';
    const refundRequested = url.searchParams.get('refund') === 'true';

    // 현재 구독 조회
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription to cancel' },
        { status: 400 }
      );
    }

    const now = new Date();

    if (immediate && refundRequested && subscription.payment_id) {
      // 즉시 해지 + 환불 요청
      try {
        await cancelPayment(
          subscription.payment_id,
          'User requested cancellation with refund'
        );
      } catch (err) {
        console.error('Refund failed:', err);
        // 환불 실패해도 구독은 취소
      }

      await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancel_at_period_end: false,
          metadata: {
            ...subscription.metadata,
            cancelReason: 'User requested immediate cancellation',
            refundRequested: true,
          },
        })
        .eq('id', subscription.id);

      return NextResponse.json({
        success: true,
        message: '구독이 즉시 해지되었습니다. 환불 처리가 진행됩니다.',
        effectiveAt: now.toISOString(),
      });
    }

    // 기간 종료 시 해지 (기본)
    await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: true,
        cancelled_at: now.toISOString(),
        metadata: {
          ...subscription.metadata,
          cancelReason: 'User requested cancellation',
        },
      })
      .eq('id', subscription.id);

    return NextResponse.json({
      success: true,
      message: `구독 해지가 예약되었습니다. ${subscription.current_period_end}까지 프리미엄 기능을 이용할 수 있습니다.`,
      effectiveAt: subscription.current_period_end,
      currentPeriodEnd: subscription.current_period_end,
    });

  } catch (error) {
    console.error('Subscription DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
