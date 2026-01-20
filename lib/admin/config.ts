// 관리자 이메일 목록
export const ADMIN_EMAILS = [
  'niceverygood1@gmail.com',
];

// 관리자 여부 확인
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// 구독 티어 목록
export const SUBSCRIPTION_TIERS = [
  { value: 'free', label: '무료', color: 'text-dark-400' },
  { value: 'premium', label: '프리미엄', color: 'text-blue-400' },
  { value: 'pro', label: 'PRO', color: 'text-purple-400' },
  { value: 'vip', label: 'VIP', color: 'text-amber-400' },
] as const;

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number]['value'];
