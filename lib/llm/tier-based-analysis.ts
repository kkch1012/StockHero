/**
 * 🎯 티어별 분석 로직
 *
 * 구독 등급에 따라 다른 분석 방식 제공
 */

import type { SubscriptionTier } from '@/types/subscription';
import { performCrossValidation, type CrossValidationResult } from './cross-validation';
import { DebateOrchestrator } from './orchestrator';
import { GeminiAdapter } from './gemini';
import { ClaudeAdapter } from './claude';
import type { LLMContext, LLMResponse, CharacterType } from './types';

// ==================== 타입 정의 ====================

export interface TierAnalysisResult {
  tier: SubscriptionTier;
  analysisType: 'single' | 'comparison' | 'cross_validation' | 'debate';
  result: any;
  usedAIs: CharacterType[];
  apiCost: number; // 원
  timestamp: string;
}

// ==================== AI 개수 매핑 ====================

const TIER_AI_COUNT: Record<SubscriptionTier, number> = {
  free: 1, // Gemini만
  lite: 2, // Gemini + Claude
  basic: 3, // 전체 (교차검증)
  pro: 3, // 전체 (교차검증)
};

const TIER_ANALYSIS_TYPE: Record<
  SubscriptionTier,
  'single' | 'comparison' | 'cross_validation' | 'debate'
> = {
  free: 'single',
  lite: 'comparison',
  basic: 'cross_validation',
  pro: 'cross_validation',
};

// ==================== API 비용 ====================

const API_COSTS = {
  gemini_analysis: 5, // 원
  claude_analysis: 15,
  gpt_analysis: 10,
  debate_round: 30, // 3 AI × 평균
};

// ==================== 티어별 분석 실행 ====================

/**
 * 구독 등급에 따른 분석 실행
 */
export async function performTierBasedAnalysis(
  tier: SubscriptionTier,
  symbol: string,
  symbolName: string,
  currentPrice: number,
  context?: {
    userId?: string;
    sector?: string;
    marketData?: any;
    financials?: any;
  }
): Promise<TierAnalysisResult> {
  const startTime = Date.now();
  console.log(`[Tier Analysis] Starting ${tier} analysis for ${symbolName}`);

  let result: any;
  let usedAIs: CharacterType[];
  let apiCost: number;

  switch (tier) {
    case 'free':
      // 1개 AI만 (Gemini)
      result = await performSingleAnalysis(symbol, symbolName, currentPrice, context);
      usedAIs = ['gemini'];
      apiCost = API_COSTS.gemini_analysis;
      break;

    case 'lite':
      // 2개 AI 비교 (Gemini + Claude)
      result = await performComparisonAnalysis(symbol, symbolName, currentPrice, context);
      usedAIs = ['gemini', 'claude'];
      apiCost = API_COSTS.gemini_analysis + API_COSTS.claude_analysis;
      break;

    case 'basic':
    case 'pro':
      // 3개 AI 교차검증
      result = await performCrossValidation(symbol, symbolName, currentPrice, context);
      usedAIs = ['gemini', 'claude', 'gpt'];
      apiCost = API_COSTS.gemini_analysis + API_COSTS.claude_analysis + API_COSTS.gpt_analysis;
      break;

    default:
      throw new Error(`Unknown tier: ${tier}`);
  }

  const elapsed = Date.now() - startTime;
  console.log(`[Tier Analysis] Completed ${tier} analysis in ${elapsed}ms`);

  return {
    tier,
    analysisType: TIER_ANALYSIS_TYPE[tier],
    result,
    usedAIs,
    apiCost,
    timestamp: new Date().toISOString(),
  };
}

// ==================== Free: 단일 AI 분석 ====================

interface SingleAnalysisResult {
  ai: 'gemini';
  analysis: {
    content: string;
    score: number;
    targetPrice?: number;
    risks: string[];
    sources: string[];
  };
  summary: string;
  upgradeMessage: string;
}

async function performSingleAnalysis(
  symbol: string,
  symbolName: string,
  currentPrice: number,
  context?: any
): Promise<SingleAnalysisResult> {
  const adapter = new GeminiAdapter();

  const llmContext: LLMContext = {
    symbol,
    symbolName,
    sector: context?.sector,
    round: 1,
    currentPrice,
    previousMessages: [],
    marketData: context?.marketData,
  };

  const response = await adapter.generateStructured(llmContext);

  return {
    ai: 'gemini',
    analysis: {
      content: response.content,
      score: response.score || 3,
      targetPrice: response.targetPrice,
      risks: response.risks || [],
      sources: response.sources || [],
    },
    summary: `Gemini AI의 트렌드 분석 결과입니다.`,
    upgradeMessage: `더 정확한 분석을 원하시나요?\n• Lite: 2개 AI 비교 분석\n• Basic: 3개 AI 교차검증 + 합의 등급`,
  };
}

// ==================== Lite: 2개 AI 비교 ====================

interface ComparisonAnalysisResult {
  ais: ['gemini', 'claude'];
  analyses: {
    gemini: {
      content: string;
      score: number;
      targetPrice?: number;
      risks: string[];
    };
    claude: {
      content: string;
      score: number;
      targetPrice?: number;
      risks: string[];
    };
  };
  comparison: {
    directionMatch: boolean;
    priceDifference: number;
    priceDifferencePercent: number;
    commonPoints: string[];
    differences: string[];
  };
  summary: string;
  upgradeMessage: string;
}

async function performComparisonAnalysis(
  symbol: string,
  symbolName: string,
  currentPrice: number,
  context?: any
): Promise<ComparisonAnalysisResult> {
  // 2개 AI 병렬 실행
  const [geminiResponse, claudeResponse] = await Promise.all([
    new GeminiAdapter().generateStructured({
      symbol,
      symbolName,
      sector: context?.sector,
      round: 1,
      currentPrice,
      previousMessages: [],
      marketData: context?.marketData,
    }),
    new ClaudeAdapter().generateStructured({
      symbol,
      symbolName,
      sector: context?.sector,
      round: 1,
      currentPrice,
      previousMessages: [],
      financials: context?.financials,
    }),
  ]);

  // 비교 분석
  const geminiScore = geminiResponse.score || 3;
  const claudeScore = claudeResponse.score || 3;
  const directionMatch = geminiScore === claudeScore;

  const geminiPrice = geminiResponse.targetPrice || currentPrice;
  const claudePrice = claudeResponse.targetPrice || currentPrice;
  const priceDifference = Math.abs(geminiPrice - claudePrice);
  const priceDifferencePercent = (priceDifference / currentPrice) * 100;

  // 공통점/차이점 (간단 구현)
  const commonPoints = ['두 AI 모두 분석 완료'];
  const differences = directionMatch ? [] : ['투자 방향 의견 차이'];

  return {
    ais: ['gemini', 'claude'],
    analyses: {
      gemini: {
        content: geminiResponse.content,
        score: geminiScore,
        targetPrice: geminiPrice,
        risks: geminiResponse.risks || [],
      },
      claude: {
        content: claudeResponse.content,
        score: claudeScore,
        targetPrice: claudePrice,
        risks: claudeResponse.risks || [],
      },
    },
    comparison: {
      directionMatch,
      priceDifference,
      priceDifferencePercent,
      commonPoints,
      differences,
    },
    summary: directionMatch
      ? `2개 AI 모두 유사한 판단입니다.`
      : `2개 AI의 의견이 다릅니다.`,
    upgradeMessage: `3개 AI 교차검증을 원하시나요?\n• Basic: 합의 등급 (STRONG/MODERATE/CONFLICT) 제공\n• 더 높은 신뢰도로 투자 판단`,
  };
}

// ==================== 레거시: 토론 방식 (호환성) ====================

/**
 * 기존 토론 방식 (호환성 유지)
 */
export async function performDebateAnalysis(
  symbol: string,
  symbolName: string,
  currentPrice: number,
  rounds: number = 4
): Promise<any> {
  const orchestrator = new DebateOrchestrator();
  orchestrator.setCurrentPrice(currentPrice);

  const allMessages = [];

  for (let round = 1; round <= rounds; round++) {
    const messages = await orchestrator.generateRound(symbol, symbolName, round);
    allMessages.push(...messages);
  }

  const consensus = orchestrator.getConsensus();

  return {
    messages: allMessages,
    consensus,
    analysisType: 'debate',
  };
}

// ==================== 편의 함수 ====================

/**
 * 티어별 AI 개수 조회
 */
export function getAICountForTier(tier: SubscriptionTier): number {
  return TIER_AI_COUNT[tier];
}

/**
 * 티어별 분석 타입 조회
 */
export function getAnalysisTypeForTier(tier: SubscriptionTier): string {
  return TIER_ANALYSIS_TYPE[tier];
}

/**
 * 예상 API 비용 조회
 */
export function getExpectedApiCost(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return API_COSTS.gemini_analysis;
    case 'lite':
      return API_COSTS.gemini_analysis + API_COSTS.claude_analysis;
    case 'basic':
    case 'pro':
      return API_COSTS.gemini_analysis + API_COSTS.claude_analysis + API_COSTS.gpt_analysis;
    default:
      return 0;
  }
}

/**
 * 교차검증 가능 여부
 */
export function canUseCrossValidation(tier: SubscriptionTier): boolean {
  return tier === 'basic' || tier === 'pro';
}
