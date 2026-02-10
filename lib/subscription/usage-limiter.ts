/**
 * API 사용량 제한 및 추적 - 수익성 보호
 *
 * 핵심 전략:
 * - Pro 등급 API 비용 폭발 방지 (₩34,250 → 마진 8.5%)
 * - Basic이 캐시카우 (교차검증 제공하되 채팅 제한)
 */

import { SubscriptionTier, TIER_LIMITS } from '@/types/subscription';
import { createClient } from '@/lib/supabase/server';

export interface UsageLimit {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetTime: Date;
  message?: string;
}

export interface ApiCost {
  gemini: number;
  claude: number;
  gpt: number;
  total: number;
}

// API 호출당 비용 (원)
const API_COSTS = {
  // 분석 (짧은 응답)
  gemini_analysis: 5,
  claude_analysis: 15,
  gpt_analysis: 10,

  // 채팅 (긴 응답)
  gemini_chat: 20,
  claude_chat: 60,
  gpt_chat: 40,

  // 심층 분석 (매우 긴 응답)
  claude_deep: 150,
  gpt_scenario: 120,
} as const;

/**
 * 등급별 일일 API 비용 예상
 */
export function getExpectedDailyApiCost(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      // Gemini 1개 × 분석 1회
      return API_COSTS.gemini_analysis * 1;

    case 'lite':
      // Gemini + Claude × 분석 3회
      return (API_COSTS.gemini_analysis + API_COSTS.claude_analysis) * 3;

    case 'basic':
      // 3 AI 교차검증 × 5회 + 채팅 10회
      const basicAnalysis = (API_COSTS.gemini_analysis + API_COSTS.claude_analysis + API_COSTS.gpt_analysis) * 5;
      const basicChat = API_COSTS.claude_chat * 10;
      return basicAnalysis + basicChat;

    case 'pro':
      // 3 AI 교차검증 × 10회 + 채팅 50회 + 심층 분석 5회
      const proAnalysis = (API_COSTS.gemini_analysis + API_COSTS.claude_analysis + API_COSTS.gpt_analysis) * 10;
      const proChat = API_COSTS.claude_chat * 50;
      const proDeep = (API_COSTS.claude_deep + API_COSTS.gpt_scenario) * 5;
      return proAnalysis + proChat + proDeep;

    default:
      return 0;
  }
}

/**
 * 기능별 사용량 체크
 */
export async function checkUsageLimit(
  userId: string,
  tier: SubscriptionTier,
  featureKey: string
): Promise<UsageLimit> {
  const supabase = createClient();

  // 해당 등급의 제한 조회
  const limits = TIER_LIMITS[tier];
  const featureLimit = (limits as any)[featureKey];

  // -1은 무제한
  if (featureLimit === -1 || featureLimit === true) {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      used: 0,
      resetTime: getNextResetTime(),
    };
  }

  // 0 또는 false는 불가
  if (featureLimit === 0 || featureLimit === false) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      used: 0,
      resetTime: getNextResetTime(),
      message: '이 등급에서는 사용할 수 없는 기능입니다.',
    };
  }

  // 오늘 사용량 조회
  const today = new Date().toISOString().split('T')[0];
  const { data: usage } = await supabase
    .from('feature_usage')
    .select('usage_count')
    .eq('user_id', userId)
    .eq('feature_key', featureKey)
    .eq('usage_date', today)
    .single();

  const used = usage?.usage_count || 0;
  const limit = typeof featureLimit === 'number' ? featureLimit : 0;
  const remaining = Math.max(0, limit - used);
  const allowed = remaining > 0;

  return {
    allowed,
    remaining,
    limit,
    used,
    resetTime: getNextResetTime(),
    message: allowed ? undefined : `일일 한도(${limit}회)를 초과했습니다. 내일 ${getNextResetTime().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 초기화됩니다.`,
  };
}

/**
 * 사용량 증가 (API 호출 후)
 */
export async function incrementUsage(
  userId: string,
  featureKey: string,
  apiCost?: number
): Promise<boolean> {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('feature_usage')
    .upsert({
      user_id: userId,
      feature_key: featureKey,
      usage_date: today,
      usage_count: 1,
      api_cost: apiCost || 0,
    }, {
      onConflict: 'user_id,feature_key,usage_date',
      // 기존 레코드가 있으면 count +1
    });

  return !error;
}

/**
 * 오늘 총 API 비용 조회
 */
export async function getTodayApiCost(userId: string): Promise<ApiCost> {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: usages } = await supabase
    .from('feature_usage')
    .select('feature_key, usage_count, api_cost')
    .eq('user_id', userId)
    .eq('usage_date', today);

  let gemini = 0;
  let claude = 0;
  let gpt = 0;

  usages?.forEach((u) => {
    const cost = u.api_cost || 0;
    if (u.feature_key.includes('gemini')) gemini += cost;
    else if (u.feature_key.includes('claude')) claude += cost;
    else if (u.feature_key.includes('gpt')) gpt += cost;
  });

  return {
    gemini,
    claude,
    gpt,
    total: gemini + claude + gpt,
  };
}

/**
 * Pro 사용자 비용 폭발 방지 (긴급 차단)
 */
export async function checkProUserCostLimit(userId: string): Promise<boolean> {
  const cost = await getTodayApiCost(userId);

  // Pro 일일 예상 비용: ₩1,142 (월 ₩34,250 / 30일)
  // 안전 마진 150% = ₩1,713
  const DAILY_COST_LIMIT = 1713;

  if (cost.total >= DAILY_COST_LIMIT) {
    console.warn(`[Usage Limiter] Pro user ${userId} hit daily cost limit: ₩${cost.total}`);
    return false; // 차단
  }

  return true; // 허용
}

/**
 * 다음 초기화 시간 (자정)
 */
function getNextResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * 사용량 리포트 (관리자용)
 */
export async function generateUsageReport(startDate: string, endDate: string) {
  const supabase = createClient();

  const { data: usages } = await supabase
    .from('feature_usage')
    .select(`
      user_id,
      feature_key,
      usage_count,
      api_cost,
      usage_date,
      subscriptions!inner(tier)
    `)
    .gte('usage_date', startDate)
    .lte('usage_date', endDate);

  // 등급별 집계
  const report = {
    free: { users: 0, apiCost: 0, revenue: 0 },
    lite: { users: 0, apiCost: 0, revenue: 4900 },
    basic: { users: 0, apiCost: 0, revenue: 14900 },
    pro: { users: 0, apiCost: 0, revenue: 39900 },
  };

  usages?.forEach((u: any) => {
    const tier = u.subscriptions?.tier || 'free';
    if (report[tier as SubscriptionTier]) {
      report[tier as SubscriptionTier].apiCost += u.api_cost || 0;
    }
  });

  return report;
}
