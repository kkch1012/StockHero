// =====================================================
// 토스페이먼츠 SDK 래퍼
// =====================================================

import { PLAN_PRICES, PLAN_DISPLAY_NAMES } from './subscription';

// 환경변수
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

// 타입 정의
export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

export interface BillingKeyRequest {
  customerKey: string;
  cardNumber: string;
  cardExpirationYear: string;
  cardExpirationMonth: string;
  customerIdentityNumber: string;  // 생년월일 6자리 또는 사업자번호 10자리
}

export interface PaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface BillingPaymentRequest {
  billingKey: string;
  customerKey: string;
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
  requestedAt: string;
  approvedAt?: string;
  method?: string;
  totalAmount: number;
  balanceAmount: number;
  suppliedAmount: number;
  vat: number;
  receipt?: {
    url: string;
  };
  failure?: {
    code: string;
    message: string;
  };
}

export interface TossError {
  code: string;
  message: string;
}

// Authorization 헤더 생성
function getAuthHeader(): string {
  const encoded = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * 결제 금액 계산
 */
export function calculatePaymentAmount(
  planName: string,
  billingCycle: 'monthly' | 'yearly'
): number {
  const prices = PLAN_PRICES[planName as keyof typeof PLAN_PRICES];
  if (!prices) return 0;
  return billingCycle === 'monthly' ? prices.monthly : prices.yearly;
}

/**
 * 주문 ID 생성
 */
export function generateOrderId(userId: string, planName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `SH_${planName.toUpperCase()}_${timestamp}_${random}`;
}

/**
 * 결제창 호출용 데이터 생성
 */
export function createPaymentData(
  userId: string,
  planName: string,
  billingCycle: 'monthly' | 'yearly',
  customerInfo?: { name?: string; email?: string }
): PaymentRequest {
  const amount = calculatePaymentAmount(planName, billingCycle);
  const planDisplayName = PLAN_DISPLAY_NAMES[planName as keyof typeof PLAN_DISPLAY_NAMES] || planName;
  const cycleText = billingCycle === 'monthly' ? '월간' : '연간';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    orderId: generateOrderId(userId, planName),
    orderName: `StockHero ${planDisplayName} ${cycleText} 구독`,
    amount,
    customerName: customerInfo?.name,
    customerEmail: customerInfo?.email,
    successUrl: `${baseUrl}/api/payment/confirm`,
    failUrl: `${baseUrl}/subscription?error=payment_failed`,
  };
}

/**
 * 결제 승인 요청
 */
export async function confirmPayment(
  request: PaymentConfirmRequest
): Promise<PaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Payment confirmation failed');
  }

  return data;
}

/**
 * 결제 조회
 */
export async function getPayment(paymentKey: string): Promise<PaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get payment');
  }

  return data;
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number
): Promise<PaymentResponse> {
  const body: any = { cancelReason };
  if (cancelAmount) {
    body.cancelAmount = cancelAmount;
  }

  const response = await fetch(`${TOSS_API_URL}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Payment cancellation failed');
  }

  return data;
}

/**
 * 빌링키 발급 (자동결제용)
 */
export async function issueBillingKey(
  request: BillingKeyRequest
): Promise<{ billingKey: string; customerKey: string; cardCompany: string; cardNumber: string }> {
  const response = await fetch(`${TOSS_API_URL}/billing/authorizations/card`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to issue billing key');
  }

  return data;
}

/**
 * 빌링키로 자동결제
 */
export async function payWithBillingKey(
  request: BillingPaymentRequest
): Promise<PaymentResponse> {
  const response = await fetch(`${TOSS_API_URL}/billing/${request.billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey: request.customerKey,
      orderId: request.orderId,
      orderName: request.orderName,
      amount: request.amount,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Billing payment failed');
  }

  return data;
}

/**
 * 웹훅 시그니처 검증
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  
  return signature === expectedSignature;
}

/**
 * 다음 결제일 계산
 */
export function calculateNextPaymentDate(
  currentDate: Date,
  billingCycle: 'monthly' | 'yearly'
): Date {
  const nextDate = new Date(currentDate);
  
  if (billingCycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  
  return nextDate;
}

/**
 * 구독 기간 종료일 계산
 */
export function calculatePeriodEnd(
  startDate: Date,
  billingCycle: 'monthly' | 'yearly'
): Date {
  return calculateNextPaymentDate(startDate, billingCycle);
}

/**
 * 토스페이먼츠 클라이언트 키 반환 (프론트엔드용)
 */
export function getTossClientKey(): string {
  return TOSS_CLIENT_KEY;
}
