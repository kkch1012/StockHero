// =====================================================
// 결제 완료 처리 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmPayment, calculatePeriodEnd } from '@/lib/toss-payments';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// GET: 토스페이먼츠 결제창에서 리다이렉트
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.redirect(
      `${APP_URL}/subscription?error=missing_params`
    );
  }

  try {
    // 기존 트랜잭션 조회 (검증용)
    const { data: transaction, error: txError } = await supabase
      .from('subscription_transactions')
      .select('*, plan:subscription_plans(*)')
      .eq('payment_id', orderId)
      .eq('status', 'pending')
      .single();

    if (txError || !transaction) {
      console.error('Transaction not found:', orderId);
      return NextResponse.redirect(
        `${APP_URL}/subscription?error=invalid_order`
      );
    }

    // 금액 검증
    if (transaction.amount !== parseInt(amount)) {
      console.error('Amount mismatch:', transaction.amount, amount);
      return NextResponse.redirect(
        `${APP_URL}/subscription?error=amount_mismatch`
      );
    }

    // 토스페이먼츠 결제 승인
    const paymentResult = await confirmPayment({
      paymentKey,
      orderId,
      amount: parseInt(amount),
    });

    if (paymentResult.status !== 'DONE') {
      throw new Error(`Payment status: ${paymentResult.status}`);
    }

    // 트랜잭션 상태 업데이트
    await supabase
      .from('subscription_transactions')
      .update({
        status: 'completed',
        payment_id: paymentKey,
        payment_method: paymentResult.method,
        receipt_url: paymentResult.receipt?.url,
        metadata: {
          ...transaction.metadata,
          approvedAt: paymentResult.approvedAt,
          paymentKey,
        },
      })
      .eq('id', transaction.id);

    // 구독 정보 업데이트/생성
    const billingCycle = transaction.metadata?.billingCycle || 'monthly';
    const now = new Date();
    const periodEnd = calculatePeriodEnd(now, billingCycle);

    // 기존 구독이 있으면 업데이트, 없으면 생성
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', transaction.user_id)
      .single();

    if (existingSub) {
      // 기존 구독 업데이트 (플랜 변경)
      await supabase
        .from('user_subscriptions')
        .update({
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          cancelled_at: null,
          payment_provider: 'toss',
          payment_id: paymentKey,
          metadata: {
            billingCycle,
            lastPaymentAmount: parseInt(amount),
          },
          updated_at: now.toISOString(),
        })
        .eq('id', existingSub.id);
    } else {
      // 새 구독 생성
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: transaction.user_id,
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_provider: 'toss',
          payment_id: paymentKey,
          metadata: {
            billingCycle,
            lastPaymentAmount: parseInt(amount),
          },
        });
    }

    // 성공 페이지로 리다이렉트
    return NextResponse.redirect(
      `${APP_URL}/subscription/success?plan=${transaction.plan?.name || ''}`
    );

  } catch (error: any) {
    console.error('Payment confirmation error:', error);

    // 트랜잭션 실패 처리
    if (orderId) {
      await supabase
        .from('subscription_transactions')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('payment_id', orderId);
    }

    return NextResponse.redirect(
      `${APP_URL}/subscription?error=payment_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}

// POST: 프론트엔드에서 직접 호출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 기존 트랜잭션 조회
    const { data: transaction, error: txError } = await supabase
      .from('subscription_transactions')
      .select('*, plan:subscription_plans(*)')
      .eq('payment_id', orderId)
      .eq('status', 'pending')
      .single();

    if (txError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Invalid order' },
        { status: 400 }
      );
    }

    // 금액 검증
    if (transaction.amount !== amount) {
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // 토스페이먼츠 결제 승인
    const paymentResult = await confirmPayment({
      paymentKey,
      orderId,
      amount,
    });

    if (paymentResult.status !== 'DONE') {
      return NextResponse.json(
        { success: false, error: `Payment status: ${paymentResult.status}` },
        { status: 400 }
      );
    }

    // 트랜잭션 및 구독 업데이트 (GET과 동일 로직)
    const billingCycle = transaction.metadata?.billingCycle || 'monthly';
    const now = new Date();
    const periodEnd = calculatePeriodEnd(now, billingCycle);

    await supabase
      .from('subscription_transactions')
      .update({
        status: 'completed',
        payment_id: paymentKey,
        payment_method: paymentResult.method,
        receipt_url: paymentResult.receipt?.url,
      })
      .eq('id', transaction.id);

    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', transaction.user_id)
      .single();

    if (existingSub) {
      await supabase
        .from('user_subscriptions')
        .update({
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'toss',
          payment_id: paymentKey,
          metadata: { billingCycle, lastPaymentAmount: amount },
        })
        .eq('id', existingSub.id);
    } else {
      await supabase
        .from('user_subscriptions')
        .insert({
          user_id: transaction.user_id,
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_provider: 'toss',
          payment_id: paymentKey,
          metadata: { billingCycle, lastPaymentAmount: amount },
        });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        planName: transaction.plan?.name,
        periodEnd: periodEnd.toISOString(),
      },
      receipt: paymentResult.receipt?.url,
    });

  } catch (error: any) {
    console.error('Payment confirm POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
