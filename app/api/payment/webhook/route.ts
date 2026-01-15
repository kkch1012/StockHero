// =====================================================
// 토스페이먼츠 웹훅 처리 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature, calculatePeriodEnd } from '@/lib/toss-payments';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET || '';

// 웹훅 이벤트 타입
type WebhookEventType = 
  | 'PAYMENT_STATUS_CHANGED'
  | 'BILLING_STATUS_CHANGED'
  | 'DEPOSIT_CALLBACK';

interface WebhookPayload {
  eventType: WebhookEventType;
  createdAt: string;
  data: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    billingKey?: string;
    customerKey?: string;
    canceledAt?: string;
    cancelReason?: string;
    cancelAmount?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 원본 요청 바디
    const rawBody = await request.text();
    
    // 시그니처 검증 (프로덕션에서 활성화)
    const signature = request.headers.get('Toss-Signature');
    if (WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    console.log('Webhook received:', payload.eventType, payload.data);

    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload.data);
        break;

      case 'BILLING_STATUS_CHANGED':
        await handleBillingStatusChanged(payload.data);
        break;

      case 'DEPOSIT_CALLBACK':
        await handleDepositCallback(payload.data);
        break;

      default:
        console.log('Unknown webhook event:', payload.eventType);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * 결제 상태 변경 처리
 */
async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  const { paymentKey, orderId, status } = data;
  
  if (!paymentKey && !orderId) return;

  // 트랜잭션 조회
  const { data: transaction } = await supabase
    .from('subscription_transactions')
    .select('*, plan:subscription_plans(*)')
    .or(`payment_id.eq.${paymentKey},payment_id.eq.${orderId}`)
    .single();

  if (!transaction) {
    console.error('Transaction not found for webhook:', paymentKey, orderId);
    return;
  }

  switch (status) {
    case 'DONE':
      // 결제 완료 (confirm에서 이미 처리되므로 스킵 가능)
      break;

    case 'CANCELED':
    case 'PARTIAL_CANCELED':
      // 결제 취소 처리
      await handlePaymentCanceled(transaction, data);
      break;

    case 'ABORTED':
    case 'EXPIRED':
      // 결제 실패/만료
      await supabase
        .from('subscription_transactions')
        .update({ status: 'failed', error_message: `Payment ${status}` })
        .eq('id', transaction.id);
      break;
  }
}

/**
 * 결제 취소 처리
 */
async function handlePaymentCanceled(transaction: any, data: WebhookPayload['data']) {
  const { canceledAt, cancelReason, cancelAmount } = data;

  // 트랜잭션 상태 업데이트
  await supabase
    .from('subscription_transactions')
    .update({
      status: cancelAmount === transaction.amount ? 'refunded' : 'cancelled',
      metadata: {
        ...transaction.metadata,
        canceledAt,
        cancelReason,
        cancelAmount,
      },
    })
    .eq('id', transaction.id);

  // 전액 환불인 경우 구독 취소
  if (cancelAmount === transaction.amount) {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: canceledAt,
        metadata: {
          ...transaction.metadata,
          cancelReason,
        },
      })
      .eq('user_id', transaction.user_id)
      .eq('status', 'active');

    console.log(`Subscription cancelled for user ${transaction.user_id} due to refund`);
  }
}

/**
 * 빌링(자동결제) 상태 변경 처리
 */
async function handleBillingStatusChanged(data: WebhookPayload['data']) {
  const { billingKey, customerKey, status, paymentKey, orderId } = data;

  if (!customerKey) return;

  // customerKey는 userId로 사용
  const userId = customerKey;

  switch (status) {
    case 'DONE':
      // 정기결제 성공 - 구독 갱신
      if (paymentKey && orderId) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*, plan:subscription_plans(*)')
          .eq('user_id', userId)
          .eq('billing_key', billingKey)
          .single();

        if (subscription) {
          const billingCycle = subscription.metadata?.billingCycle || 'monthly';
          const newPeriodEnd = calculatePeriodEnd(new Date(), billingCycle);

          await supabase
            .from('user_subscriptions')
            .update({
              current_period_start: new Date().toISOString(),
              current_period_end: newPeriodEnd.toISOString(),
              payment_id: paymentKey,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // 트랜잭션 기록
          await supabase
            .from('subscription_transactions')
            .insert({
              user_id: userId,
              subscription_id: subscription.id,
              plan_id: subscription.plan_id,
              amount: subscription.metadata?.lastPaymentAmount || 0,
              currency: 'KRW',
              status: 'completed',
              payment_provider: 'toss',
              payment_id: paymentKey,
              metadata: { billingCycle, type: 'recurring' },
            });

          console.log(`Subscription renewed for user ${userId}`);
        }
      }
      break;

    case 'CANCELED':
      // 빌링키 취소 - 자동결제 중단
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          metadata: {
            billingKeyCanceled: true,
            canceledAt: new Date().toISOString(),
          },
        })
        .eq('user_id', userId)
        .eq('billing_key', billingKey);

      console.log(`Billing key cancelled for user ${userId}`);
      break;

    case 'EXPIRED':
      // 빌링키 만료 - 재등록 필요
      console.log(`Billing key expired for user ${userId}`);
      break;
  }
}

/**
 * 입금 콜백 처리 (가상계좌)
 */
async function handleDepositCallback(data: WebhookPayload['data']) {
  const { orderId, status } = data;

  if (status === 'DONE' && orderId) {
    // 입금 완료 - 결제 완료 처리
    const { data: transaction } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('payment_id', orderId)
      .single();

    if (transaction) {
      // confirm과 동일한 로직으로 구독 활성화
      const billingCycle = transaction.metadata?.billingCycle || 'monthly';
      const now = new Date();
      const periodEnd = calculatePeriodEnd(now, billingCycle);

      await supabase
        .from('subscription_transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: transaction.user_id,
          plan_id: transaction.plan_id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          payment_provider: 'toss',
          payment_id: orderId,
          metadata: { billingCycle },
        }, {
          onConflict: 'user_id',
        });

      console.log(`Virtual account deposit completed for order ${orderId}`);
    }
  }
}
