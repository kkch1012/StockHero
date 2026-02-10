// 구독 플랜 설정

/**
 * 구독 기능 활성화 여부
 * false: 모든 사용자가 모든 기능 무제한 이용 가능 (개발/테스트 모드)
 * true: 구독 티어에 따른 기능 제한 적용 (프로덕션 모드)
 *
 * 환경변수로 제어 가능: NEXT_PUBLIC_SUBSCRIPTION_ENABLED=true
 */
export const SUBSCRIPTION_ENABLED = process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED === 'true';

export type SubscriptionTier = 'free' | 'lite' | 'basic' | 'pro';

export interface PlanFeature {
  name: string;
  free: string | boolean | number;
  basic: string | boolean | number;
  pro: string | boolean | number;
  vip: string | boolean | number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  nameKo: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  color: string;
  gradient: string;
  icon: string;
  popular?: boolean;
  features: string[];
}

// 구독 플랜 정의 - 수익성 최적화 설계
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameKo: '무료',
    description: 'AI 주식 분석 체험하기',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    color: 'text-dark-400',
    gradient: 'from-dark-600 to-dark-700',
    icon: '🆓',
    features: [
      '1개 AI 분석 (Gemini)',
      'Top 1 추천만 보임',
      '당일 결과만 보임',
      '교차검증 없음',
    ],
  },
  {
    id: 'lite',
    name: 'Lite',
    nameKo: '라이트',
    description: '2개 AI 비교 분석',
    monthlyPrice: 4900,
    yearlyPrice: 47040,
    yearlyDiscount: 20,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
    icon: '✨',
    features: [
      '2개 AI 분석 (Gemini + Claude)',
      'Top 3 추천 보임',
      'AI 상담 3회/일',
      '7일 이력 조회',
      '주간 알림',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    nameKo: '베이직',
    description: '3 AI 교차검증 (캐시카우)',
    monthlyPrice: 14900,
    yearlyPrice: 143040,
    yearlyDiscount: 20,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-indigo-500',
    icon: '⭐',
    popular: true,
    features: [
      '🎯 3개 AI 교차검증 (핵심!)',
      '🟢 합의 등급 (STRONG/MODERATE/CONFLICT)',
      'Top 5 전체 보기',
      'AI 상담 10회/일',
      '종목 토론 요청 3개/일',
      '30일 이력 + 백테스트',
      '실시간 알림',
      '광고 제거',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameKo: '프로',
    description: '무제한 분석 + VIP 종목',
    monthlyPrice: 39900,
    yearlyPrice: 383040,
    yearlyDiscount: 20,
    color: 'text-brand-400',
    gradient: 'from-brand-500 to-brand-600',
    icon: '💎',
    features: [
      'Basic의 모든 기능',
      'AI 상담 50회/일 (캡 적용)',
      '상세 시나리오 분석',
      '목표가 + 달성 시점',
      '종목 토론 요청 20개/일',
      'VIP 전용 종목 추천',
      '커스텀 심층 분석',
      '90일 백테스트',
      '우선 고객 지원',
    ],
  },
];

// 기능별 접근 권한 정의 - API 비용 기반 설계
export const FEATURE_LIMITS: Record<string, PlanFeature> = {
  // AI 개수 (핵심 차별화!)
  aiCount: {
    name: 'AI 분석 개수',
    free: 1,     // Gemini만
    lite: 2,     // Gemini + Claude
    basic: 3,    // 전체 (교차검증)
    pro: 3,      // 전체
  },

  // 교차검증
  crossValidation: {
    name: '3 AI 교차검증',
    free: false,
    lite: false,
    basic: true,   // 🎯 Basic부터 제공 (캐시카우)
    pro: true,
  },

  // 합의 등급
  consensusGrade: {
    name: '합의 등급 (STRONG/MODERATE/CONFLICT)',
    free: false,
    lite: false,
    basic: true,   // 🎯 Basic부터 제공
    pro: true,
  },

  // Top 5 추천
  koreanTop5: {
    name: 'Top 5 추천 (한국)',
    free: 1,      // Top 1만
    lite: 3,      // Top 3까지
    basic: 5,     // 전체
    pro: 5,       // 전체
  },

  usTop5: {
    name: 'Top 5 추천 (미국)',
    free: 0,
    lite: 0,
    basic: 5,
    pro: 5,
  },

  // AI 상담 (API 비용 핵심!)
  aiConsultation: {
    name: 'AI 상담',
    free: 0,
    lite: 3,
    basic: 10,     // 제한적 (API 비용 관리)
    pro: 50,       // 캡 적용 (₩34,250 방지)
  },

  // 토론 기능
  watchDebate: {
    name: '토론 시청',
    free: 0,
    lite: 1,
    basic: -1,
    pro: -1,
  },

  requestDebate: {
    name: '종목 토론 요청',
    free: 0,
    lite: 0,
    basic: 3,      // 제한적
    pro: 20,
  },

  // 테마 분석
  themeAnalysis: {
    name: '핫 테마 분석',
    free: 0,
    lite: 1,
    basic: -1,
    pro: -1,
  },

  // 포트폴리오
  portfolioDiagnosis: {
    name: '포트폴리오 진단',
    free: false,
    lite: false,
    basic: true,
    pro: true,
  },

  // 알림
  alertType: {
    name: '알림',
    free: 'none',
    lite: 'weekly',
    basic: 'realtime',
    pro: 'realtime',
  },

  // 이력 조회
  historyDays: {
    name: '추천 성과 열람',
    free: 0,      // 당일만
    lite: 7,
    basic: 30,
    pro: 90,
  },

  // 백테스트
  backtestDays: {
    name: '백테스트',
    free: 0,
    lite: 0,
    basic: 30,
    pro: 90,
  },

  // 광고
  adFree: {
    name: '광고 제거',
    free: false,
    lite: true,
    basic: true,
    pro: true,
  },

  // VIP 기능 (Pro 전용)
  vipStocks: {
    name: 'VIP 전용 종목',
    free: false,
    lite: false,
    basic: false,
    pro: true,
  },

  realtimeSignal: {
    name: '실시간 시그널',
    free: false,
    lite: false,
    basic: true,
    pro: true,
  },

  detailedScenario: {
    name: '상세 시나리오 분석',
    free: false,
    lite: false,
    basic: false,
    pro: true,
  },

  targetPrice: {
    name: '목표가 + 달성 시점',
    free: false,
    lite: false,
    basic: false,
    pro: true,
  },

  customAnalysis: {
    name: '커스텀 심층 분석',
    free: false,
    lite: false,
    basic: false,
    pro: true,
  },
};

// 플랜 ID로 플랜 정보 가져오기
export const getPlanById = (id: SubscriptionTier): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

// 기능 접근 가능 여부 확인
export const canAccessFeature = (
  tier: SubscriptionTier,
  feature: keyof typeof FEATURE_LIMITS
): boolean => {
  const limit = FEATURE_LIMITS[feature];
  if (!limit) return false;

  const value = limit[tier];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value !== 'none';
  return false;
};

// 기능 사용 가능 횟수 확인
export const getFeatureLimit = (
  tier: SubscriptionTier,
  feature: keyof typeof FEATURE_LIMITS
): number => {
  const limit = FEATURE_LIMITS[feature];
  if (!limit) return 0;

  const value = limit[tier];
  if (typeof value === 'number') return value;
  return 0;
};

// 가격 포맷팅
export const formatPrice = (price: number): string => {
  if (price === 0) return '무료';
  return `₩${price.toLocaleString()}`;
};

// 주문 ID 생성
export const generateOrderId = (userId: string, planId: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ORDER_${planId.toUpperCase()}_${timestamp}_${random}`;
};

// 결제 금액 계산
export const calculatePaymentAmount = (
  planId: SubscriptionTier,
  billingCycle: 'monthly' | 'yearly',
  discountPercent: number = 0
): number => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  if (!plan) return 0;

  const baseAmount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const discount = Math.floor(baseAmount * (discountPercent / 100));

  return baseAmount - discount;
};
