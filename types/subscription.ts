// =====================================================
// StockHero 구독 시스템 타입 정의
// =====================================================

/**
 * 플랜별 기능 제한 설정
 */
export interface PlanFeatures {
  // AI 상담
  dailyConsultationLimit: number;  // 일일 AI 상담 제한 (-1 = 무제한)
  
  // Top 5 표시
  top5VisibleCount: number;  // 무료는 3개, 나머지 5개
  showTargetPrice: boolean;  // 목표가 표시 여부
  showTargetDate: boolean;   // 목표 날짜 표시 여부
  
  // 토론/디베이트
  showRealTimeDebate: boolean;  // 실시간 토론 시청 가능
  dailyDebateLimit: number;     // 일일 토론 시청 제한
  
  // 알림
  alertsPerDay: number;  // 일일 알림 제한
  
  // 백테스트
  backtestDays: number;  // 백테스트 가능 일수 (0 = 불가)
  
  // 포트폴리오
  portfolioStockLimit: number;  // 포트폴리오 종목 제한
  dailyPortfolioAnalysis: number;  // 일일 포트폴리오 분석 제한
  
  // VIP 전용
  hasVipStocks: boolean;      // VIP 전용 추천 종목
  hasRealTimeSignal: boolean; // 실시간 매매 신호
  hasPrioritySupport: boolean; // 우선 지원
  
  // 기타
  adFree: boolean;        // 광고 제거
  reportDownload: number; // 일일 리포트 다운로드 제한
  
  // 설명
  description: string;
}

/**
 * 구독 플랜
 */
export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'basic' | 'pro' | 'vip';
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  features: PlanFeatures;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 구독 상태
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';

/**
 * 결제 제공자
 */
export type PaymentProvider = 'toss' | 'kakao' | 'portone' | null;

/**
 * 사용자 구독 정보
 */
export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  plan?: SubscriptionPlan;  // JOIN된 플랜 정보
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  trialEnd: string | null;
  paymentProvider: PaymentProvider;
  paymentId: string | null;
  billingKey: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * 일일 사용량
 */
export interface SubscriptionUsage {
  id: string;
  userId: string;
  date: string;
  aiConsultationsUsed: number;
  debatesWatched: number;
  reportsDownloaded: number;
  portfolioAnalyses: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 사용량 체크 결과
 */
export interface UsageLimitResult {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
}

/**
 * 기능 타입 (접근 체크용)
 */
export type FeatureType = 
  | 'ai_consultations'
  | 'debates'
  | 'reports'
  | 'portfolio_analyses'
  | 'backtest'
  | 'backtest_full'      // 전체 기간 백테스트
  | 'realtime_alerts'
  | 'realtime_debate'    // 실시간 토론
  | 'vip_stocks'
  | 'realtime_signal'
  | 'target_price'
  | 'target_date'
  | 'full_top5'
  | 'top5_full';         // 전체 Top 5

/**
 * 결제 트랜잭션
 */
export interface SubscriptionTransaction {
  id: string;
  userId: string;
  subscriptionId: string | null;
  planId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  paymentProvider: string | null;
  paymentId: string | null;
  paymentMethod: string | null;
  receiptUrl: string | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * 업그레이드 모달 상태
 */
export interface UpgradeModalState {
  isOpen: boolean;
  feature?: FeatureType;
  message?: string;
  recommendedPlan?: 'basic' | 'pro' | 'vip';
}

/**
 * 구독 컨텍스트 값
 */
export interface SubscriptionContextValue {
  // 상태
  currentPlan: SubscriptionPlan | null;
  subscription: UserSubscription | null;
  usage: SubscriptionUsage | null;
  isLoading: boolean;
  error: Error | null;
  
  // 액션
  refreshSubscription: () => Promise<void>;
  checkAccess: (feature: FeatureType) => boolean;
  checkUsageLimit: (feature: FeatureType) => UsageLimitResult;
  incrementUsage: (feature: FeatureType) => Promise<boolean>;
  
  // 모달
  upgradeModal: UpgradeModalState;
  openUpgradeModal: (feature?: FeatureType, message?: string) => void;
  closeUpgradeModal: () => void;
}

/**
 * 플랜 비교용
 */
export interface PlanComparison {
  feature: string;
  free: string | boolean | number;
  basic: string | boolean | number;
  pro: string | boolean | number;
  vip: string | boolean | number;
}
