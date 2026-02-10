/**
 * 🔍 진짜 교차검증 시스템
 *
 * 3개 AI가 완전 독립적으로 분석한 후
 * StockHero 자체 로직으로 교차검증
 */

import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { GPTAdapter } from './gpt';
import type { CharacterType, LLMContext, LLMResponse } from './types';

// ==================== 타입 정의 ====================

export type ConsensusGrade = 'STRONG' | 'MODERATE' | 'CONFLICT';
export type Direction = 'UP' | 'DOWN' | 'NEUTRAL';

export interface IndependentAnalysis {
  ai: CharacterType;
  role: string;
  direction: Direction;
  targetPrice: number;
  confidence: number; // 1-5
  keyReasons: string[];
  risks: string[];
  sources: string[];
  rawResponse: LLMResponse;
}

export interface CrossValidationResult {
  // 합의 등급
  consensusGrade: ConsensusGrade;
  consensusConfidence: number; // 0-100

  // 방향 합의
  directionAgreement: {
    allAgree: boolean;
    majorityDirection: Direction;
    votes: Record<Direction, number>;
  };

  // 목표가 합의
  priceAgreement: {
    consensus: number;
    spread: number; // 퍼센트
    range: { low: number; high: number };
  };

  // 교차검증 상세
  sharedReasons: string[]; // 2개 이상 AI가 언급
  uniqueReasons: Array<{ ai: CharacterType; reason: string }>; // 1개 AI만 언급
  conflictPoints: Array<{ topic: string; views: Record<CharacterType, string> }>;

  // 개별 분석
  analyses: IndependentAnalysis[];

  // 요약
  summary: string;
  recommendation: string;
}

// ==================== 독립 분석 실행 ====================

/**
 * 3개 AI 완전 독립 분석 (병렬)
 */
export async function runIndependentAnalyses(
  symbol: string,
  symbolName: string,
  currentPrice: number,
  context?: {
    sector?: string;
    marketData?: any;
    financials?: any;
  }
): Promise<IndependentAnalysis[]> {
  console.log(`[Cross-Validation] Starting independent analyses for ${symbolName}`);

  // 3개 AI 역할 정의
  const roles = {
    gemini: {
      name: 'Data & Trend Analyst',
      focus: '실시간 데이터, 뉴스, 검색 트렌드, 수급 분석',
      prompt: `당신은 데이터 & 트렌드 분석 전문가입니다.

${symbolName}(${symbol})을 다음 관점에서 분석하세요:
- 최근 뉴스와 공시 분석
- 검색 트렌드 및 관심도
- 외국인/기관 수급 변화
- 업황 및 산업 트렌드

현재가: ${currentPrice.toLocaleString()}원

**중요**: 다른 AI의 의견을 참조하지 마세요. 오직 데이터와 트렌드만 보세요.`,
    },
    claude: {
      name: 'Fundamental Analyst',
      focus: '재무제표, 밸류에이션, 실적 분석',
      prompt: `당신은 펀더멘탈 분석 전문가입니다.

${symbolName}(${symbol})을 다음 관점에서 분석하세요:
- 재무제표 분석 (PER, PBR, ROE 등)
- 실적 추정 및 컨센서스 비교
- 밸류에이션 적정성
- 배당 및 자사주 매입

현재가: ${currentPrice.toLocaleString()}원

**중요**: 다른 AI의 의견을 참조하지 마세요. 오직 재무 데이터만 보세요.`,
    },
    gpt: {
      name: 'Market Sentiment & Scenario Analyst',
      focus: '시장 심리, 투자 시나리오, 리스크 분석',
      prompt: `당신은 시장 심리 & 시나리오 분석 전문가입니다.

${symbolName}(${symbol})을 다음 관점에서 분석하세요:
- 투자 심리 및 모멘텀
- 시나리오별 확률 분석 (상승/횡보/하락)
- 거시경제 영향 (금리, 환율 등)
- 핵심 리스크 요인

현재가: ${currentPrice.toLocaleString()}원

**중요**: 다른 AI의 의견을 참조하지 마세요. 오직 시장 심리와 시나리오만 보세요.`,
    },
  };

  // 병렬 실행 (완전 독립!)
  const analysisPromises = Object.entries(roles).map(async ([ai, config]) => {
    const adapter =
      ai === 'claude'
        ? new ClaudeAdapter()
        : ai === 'gemini'
        ? new GeminiAdapter()
        : new GPTAdapter();

    const llmContext: LLMContext = {
      symbol,
      symbolName,
      sector: context?.sector,
      round: 1,
      currentPrice,
      previousMessages: [], // ← 중요: 독립 분석이므로 이전 메시지 없음!
      marketData: context?.marketData,
      financials: context?.financials,
    };

    try {
      const response = await adapter.generateStructured(llmContext);

      // Direction 파싱
      const direction = parseDirection(response.content, response.score);

      // 핵심 근거 추출
      const keyReasons = extractKeyReasons(response.content);

      return {
        ai: ai as CharacterType,
        role: config.name,
        direction,
        targetPrice: response.targetPrice || currentPrice,
        confidence: response.score || 3,
        keyReasons,
        risks: response.risks || [],
        sources: response.sources || [],
        rawResponse: response,
      } as IndependentAnalysis;
    } catch (error) {
      console.error(`[Cross-Validation] ${ai} analysis failed:`, error);
      // Fallback
      return {
        ai: ai as CharacterType,
        role: config.name,
        direction: 'NEUTRAL',
        targetPrice: currentPrice,
        confidence: 2,
        keyReasons: ['분석 실패'],
        risks: ['API 오류'],
        sources: [],
        rawResponse: {
          content: '분석 중 오류 발생',
          score: 2,
          risks: [],
          sources: [],
        },
      } as IndependentAnalysis;
    }
  });

  const analyses = await Promise.all(analysisPromises);

  console.log(`[Cross-Validation] Completed ${analyses.length} independent analyses`);

  return analyses;
}

// ==================== 교차검증 로직 ====================

/**
 * 독립 분석 결과를 교차검증
 */
export function crossValidate(analyses: IndependentAnalysis[]): CrossValidationResult {
  console.log('[Cross-Validation] Starting cross-validation');

  // 1. 방향 합의 체크
  const directionVotes: Record<Direction, number> = { UP: 0, DOWN: 0, NEUTRAL: 0 };
  analyses.forEach((a) => {
    directionVotes[a.direction]++;
  });

  const majorityDirection = (Object.keys(directionVotes) as Direction[]).reduce((a, b) =>
    directionVotes[a] > directionVotes[b] ? a : b
  );

  const allAgree = analyses.every((a) => a.direction === majorityDirection);

  // 2. 목표가 합의 체크
  const prices = analyses.map((a) => a.targetPrice);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpread = ((maxPrice - minPrice) / avgPrice) * 100;

  // 3. 합의 등급 산출
  let consensusGrade: ConsensusGrade;
  let consensusConfidence: number;

  if (allAgree && priceSpread < 10) {
    // 방향 일치 + 목표가 10% 이내
    consensusGrade = 'STRONG';
    consensusConfidence = 95;
  } else if (allAgree && priceSpread < 20) {
    // 방향 일치 + 목표가 20% 이내
    consensusGrade = 'STRONG';
    consensusConfidence = 85;
  } else if (directionVotes[majorityDirection] >= 2) {
    // 2개 이상 동의
    consensusGrade = 'MODERATE';
    consensusConfidence = 70;
  } else {
    // 의견 분열
    consensusGrade = 'CONFLICT';
    consensusConfidence = 40;
  }

  // 4. 교차 근거 매칭
  const allReasons = analyses.flatMap((a) => a.keyReasons);
  const reasonCounts = new Map<string, number>();

  allReasons.forEach((reason) => {
    const normalized = reason.toLowerCase().trim();
    reasonCounts.set(normalized, (reasonCounts.get(normalized) || 0) + 1);
  });

  // 2개 이상 AI가 언급한 근거
  const sharedReasons = Array.from(reasonCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([reason, _]) => reason);

  // 1개 AI만 언급한 근거
  const uniqueReasons = analyses.flatMap((a) =>
    a.keyReasons
      .filter((r) => !sharedReasons.includes(r.toLowerCase().trim()))
      .map((r) => ({ ai: a.ai, reason: r }))
  );

  // 5. 충돌 포인트 찾기
  const conflictPoints = findConflicts(analyses);

  // 6. 요약 생성
  const summary = generateSummary(analyses, consensusGrade, allAgree, priceSpread);
  const recommendation = generateRecommendation(consensusGrade, majorityDirection, avgPrice);

  return {
    consensusGrade,
    consensusConfidence,
    directionAgreement: {
      allAgree,
      majorityDirection,
      votes: directionVotes,
    },
    priceAgreement: {
      consensus: Math.round(avgPrice / 100) * 100,
      spread: priceSpread,
      range: { low: minPrice, high: maxPrice },
    },
    sharedReasons,
    uniqueReasons,
    conflictPoints,
    analyses,
    summary,
    recommendation,
  };
}

// ==================== 유틸리티 함수 ====================

function parseDirection(content: string, score: number): Direction {
  const lower = content.toLowerCase();

  // 명확한 키워드 체크
  if (lower.includes('매수') || lower.includes('상승') || lower.includes('긍정')) {
    return 'UP';
  }
  if (lower.includes('매도') || lower.includes('하락') || lower.includes('부정')) {
    return 'DOWN';
  }

  // 점수 기반 판단
  if (score >= 4) return 'UP';
  if (score <= 2) return 'DOWN';
  return 'NEUTRAL';
}

function extractKeyReasons(content: string): string[] {
  // 간단한 키워드 추출 (실제로는 더 정교한 NLP 필요)
  const reasons: string[] = [];

  const keywords = [
    '실적',
    '수급',
    '뉴스',
    '밸류에이션',
    '성장',
    '배당',
    '리스크',
    '모멘텀',
    '기술',
    '경쟁',
  ];

  keywords.forEach((keyword) => {
    if (content.includes(keyword)) {
      // 키워드 주변 문장 추출 (간소화)
      const sentences = content.split(/[.!?]\s/);
      const relevant = sentences.find((s) => s.includes(keyword));
      if (relevant && relevant.length < 100) {
        reasons.push(relevant.trim());
      }
    }
  });

  return reasons.slice(0, 3); // 최대 3개
}

function findConflicts(
  analyses: IndependentAnalysis[]
): Array<{ topic: string; views: Record<CharacterType, string> }> {
  const conflicts: Array<{ topic: string; views: Record<CharacterType, string> }> = [];

  // 주요 토픽별로 의견 체크
  const topics = ['실적', '밸류에이션', '리스크', '수급'];

  topics.forEach((topic) => {
    const views: Partial<Record<CharacterType, string>> = {};

    analyses.forEach((a) => {
      const relevant = a.keyReasons.find((r) => r.includes(topic));
      if (relevant) {
        views[a.ai] = relevant;
      }
    });

    // 3개 AI가 모두 언급했는데 내용이 다르면 충돌
    if (Object.keys(views).length === 3) {
      const values = Object.values(views);
      const allSame = values.every((v) => v === values[0]);
      if (!allSame) {
        conflicts.push({ topic, views: views as Record<CharacterType, string> });
      }
    }
  });

  return conflicts;
}

function generateSummary(
  analyses: IndependentAnalysis[],
  grade: ConsensusGrade,
  allAgree: boolean,
  priceSpread: number
): string {
  if (grade === 'STRONG') {
    return `3개 AI 모두 ${allAgree ? '동일한 방향으로' : ''} 분석했으며, 목표가 차이는 ${priceSpread.toFixed(1)}%로 매우 낮습니다. 높은 신뢰도로 투자 판단이 가능합니다.`;
  } else if (grade === 'MODERATE') {
    return `2개 AI가 유사한 방향으로 분석했으나, 목표가 차이가 ${priceSpread.toFixed(1)}%로 다소 있습니다. 보수적 접근을 권장합니다.`;
  } else {
    return `3개 AI의 의견이 엇갈립니다. 목표가 차이가 ${priceSpread.toFixed(1)}%로 큽니다. 추가 분석이 필요하거나 관망이 유리할 수 있습니다.`;
  }
}

function generateRecommendation(
  grade: ConsensusGrade,
  direction: Direction,
  price: number
): string {
  const gradeText = {
    STRONG: '강한 합의',
    MODERATE: '다수 합의',
    CONFLICT: '의견 분열',
  };

  const directionText = {
    UP: '상승',
    DOWN: '하락',
    NEUTRAL: '중립',
  };

  return `${gradeText[grade]} (${directionText[direction]}) - 목표가 ${Math.round(price).toLocaleString()}원`;
}

// ==================== 편의 함수 ====================

/**
 * 전체 교차검증 실행 (원스톱)
 */
export async function performCrossValidation(
  symbol: string,
  symbolName: string,
  currentPrice: number,
  context?: any
): Promise<CrossValidationResult> {
  const analyses = await runIndependentAnalyses(symbol, symbolName, currentPrice, context);
  return crossValidate(analyses);
}
