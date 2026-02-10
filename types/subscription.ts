// 구독 등급 타입 (4단계) - 수익성 중심 설계
export type SubscriptionTier = 'free' | 'lite' | 'basic' | 'pro';

export interface UserSubscription {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: string | null;
}

// 등급별 기능 제한 - API 비용 기반 수익성 설계
export const TIER_LIMITS = {
  free: {
    // API 비용: ₩63/월 (미끼 상품)
    aiCount: 1,               // Gemini 1개만 (가장 저렴)
    crossValidation: false,   // 교차검증 없음
    top5Visible: 1,           // Top 1만 보임
    historyDays: 0,           // 과거 이력 없음 (오늘만)
    showAIScores: false,      // AI별 점수 숨김
    showAIReasoning: false,   // AI 분석 내용 숨김
    showBacktest: false,      // 백테스트 숨김
    alertDelay: 'after_close', // 장 마감 후 공개
    aiChatDaily: 0,           // AI 채팅 불가
  },
  lite: {
    // API 비용: ₩273/월 (마진 19%, 퍼널 상품)
    aiCount: 2,               // Gemini + Claude
    crossValidation: false,   // 교차검증 없음 (단순 비교만)
    top5Visible: 3,           // Top 3까지 보임
    historyDays: 7,           // 7일 이력
    showAIScores: true,       // AI별 점수 공개
    showAIReasoning: false,   // AI 분석 요약만
    showBacktest: false,      // 백테스트 숨김
    alertDelay: '1hour',      // 장 시작 1시간 후
    aiChatDaily: 3,           // AI 채팅 3회/일
  },
  basic: {
    // API 비용: ₩7,770/월 (마진 24%, 캐시카우 🎯)
    aiCount: 3,               // Gemini + Claude + GPT (전체)
    crossValidation: true,    // 교차검증 제공 ✅
    consensusGrade: true,     // 합의 등급 (STRONG/MODERATE/CONFLICT)
    top5Visible: 5,           // Top 5 전체
    historyDays: 30,          // 30일 이력
    showAIScores: true,       // AI별 점수 공개
    showAIReasoning: true,    // AI 분석 전문 공개
    showBacktest: true,       // 백테스트 30일
    alertDelay: 'realtime',   // 실시간
    aiChatDaily: 10,          // AI 채팅 10회/일 (제한적)
    debateRequestDaily: 3,    // 종목 토론 요청 3회/일
  },
  pro: {
    // API 비용: ₩34,250/월 (마진 8.5%, 사용량 캡 필수 ⚠️)
    aiCount: 3,               // Gemini + Claude + GPT (전체)
    crossValidation: true,    // 교차검증 제공
    consensusGrade: true,     // 합의 등급
    detailedScenario: true,   // 상세 시나리오 분석
    targetPrice: true,        // 목표가 제시
    top5Visible: 5,           // Top 5 전체
    historyDays: 90,          // 90일 이력
    showAIScores: true,       // AI별 점수 공개
    showAIReasoning: true,    // AI 분석 전문 공개
    showBacktest: true,       // 백테스트 90일
    alertDelay: 'realtime',   // 실시간
    aiChatDaily: 50,          // AI 채팅 50회/일 (캡 적용 ⚠️)
    debateRequestDaily: 20,   // 종목 토론 요청 20회/일
    vipStocks: true,          // VIP 전용 종목
    customAnalysis: true,     // 커스텀 심층 분석
  },
} as const;

export type TierLimits = typeof TIER_LIMITS[SubscriptionTier];

// 가격 정보 - 수익성 최적화
export const TIER_PRICES = {
  free: { monthly: 0, yearly: 0 },
  lite: { monthly: 4900, yearly: 47040 },      // 20% 할인
  basic: { monthly: 14900, yearly: 143040 },   // 20% 할인 (캐시카우)
  pro: { monthly: 39900, yearly: 383040 },     // 20% 할인
} as const;

// 표시 이름
export const TIER_NAMES = {
  free: 'Free',
  lite: 'Lite',
  basic: 'Basic',
  pro: 'Pro',
} as const;

// API 비용 (내부 참고용)
export const TIER_API_COSTS = {
  free: 63,      // Gemini 1개
  lite: 273,     // Gemini + Claude
  basic: 7770,   // 3 AI 교차검증
  pro: 34250,    // 3 AI + 무제한 채팅
} as const;

// 예상 마진율 (리더 쉐어 40% + PG 3% 제외)
export const TIER_MARGINS = {
  free: 0,       // 미끼
  lite: 0.19,    // 19%
  basic: 0.24,   // 24% (캐시카우 🎯)
  pro: 0.085,    // 8.5% (사용량 주의)
} as const;

// 기능 타입 (구독 관련 기능들) - 모든 사용처 포함
export type FeatureType = 
  | 'ai_consultations'
  | 'debates'
  | 'reports'
  | 'portfolio_analyses'
  | 'backtest'
  | 'backtest_full'
  | 'realtime_alerts'
  | 'realtime_debate'
  | 'vip_stocks'
  | 'realtime_signal'
  | 'target_price'
  | 'target_date'
  | 'full_top5'
  | 'top5_full'
  | 'koreanTop5'
  | 'usTop5'
  | 'themeAnalysis'
  | 'aiConsultation'
  | 'watchDebate'
  | 'requestDebate'
  | 'hiddenGems'
  | 'portfolioDiagnosis'
  | 'alertType'
  | 'historyDays'
  | 'adFree'
  | string; // 확장성을 위해 string 허용

// 플랜 기능 정의 - 유연한 타입으로 정의
export interface PlanFeatures {
  // 모든 필드는 옵셔널 또는 인덱스 서명 허용
  [key: string]: number | boolean | string | undefined;
}

// 구독 플랜 정보
export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeatures;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// 구독 상태
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'canceled' | 'expired';

// 결제 제공자
export type PaymentProvider = 'portone' | 'toss' | 'none';

// 사용량 정보
export interface SubscriptionUsage {
  userId: string;
  featureType: FeatureType;
  usageDate: string;
  usageCount: number;
  // 상세 사용량 필드들
  aiConsultationsUsed: number;
  debatesWatched: number;
  reportsGenerated: number;
  reportsDownloaded: number;
  portfolioAnalysesRun: number;
  portfolioAnalyses: number;
}

// 사용량 제한 결과
export interface UsageLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetTime?: Date;
}

// 구독 트랜잭션
export interface SubscriptionTransaction {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentProvider: PaymentProvider;
  paymentId?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// 업그레이드 모달 상태
export interface UpgradeModalState {
  isOpen: boolean;
  feature?: FeatureType;
  message?: string;
  recommendedPlan?: 'basic' | 'pro' | 'vip';
}

// 구독 컨텍스트 값
export interface SubscriptionContextValue {
  currentPlan: SubscriptionPlan | null;
  subscription: any | null;
  usage: SubscriptionUsage | null;
  isLoading: boolean;
  error: Error | null;
  upgradeModal: UpgradeModalState;
  refreshSubscription: () => Promise<void>;
  openUpgradeModal: (feature?: FeatureType, message?: string) => void;
  closeUpgradeModal: () => void;
  hasAccess: (feature: FeatureType) => boolean;
  checkAccess: (feature: FeatureType) => boolean;
  checkUsageLimit: (feature: FeatureType) => UsageLimitResult;
  incrementUsage: (feature: FeatureType) => Promise<boolean>;
  isPro: boolean;
  isPremium: boolean;
  isVip: boolean;
}

// 플랜 비교
export interface PlanComparison {
  feature: string;
  free: string | boolean;
  basic: string | boolean;
  pro: string | boolean;
  vip: string | boolean;
}
