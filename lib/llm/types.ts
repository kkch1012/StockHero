export interface LLMResponse {
  content: string;
  risks: string[];
  sources: string[];
  score: number;
  targetPrice?: number;
  targetDate?: string;
  priceRationale?: string;
  dateRationale?: string;  // 목표 달성 시점 산출 근거
  methodology?: string;    // 사용된 분석 방법론
}

export interface PreviousTarget {
  character: string;
  targetPrice: number;
  targetDate: string;
}

export interface LLMContext {
  symbol: string;
  symbolName: string;
  sector?: string;
  round: number;
  currentPrice?: number;
  previousMessages: Array<{
    character: string;
    content: string;
    targetPrice?: number;
    targetDate?: string;
  }>;
  previousTargets?: PreviousTarget[];
  marketData?: {
    price?: number;
    changePercent?: number;
    volume?: number;
  };
  financials?: {
    per?: number;
    pbr?: number;
    roe?: number;
  };
}

export interface LLMAdapter {
  characterType: CharacterType;
  generateStructured(context: LLMContext): Promise<LLMResponse>;
}

export type CharacterType = 'claude' | 'gemini' | 'gpt';

export interface CharacterPersona {
  name: string;
  title: string;
  style: string;
  focus: string[];
  riskBias: 'conservative' | 'balanced' | 'aggressive';
}

export const CHARACTER_PERSONAS: Record<CharacterType, CharacterPersona> = {
  claude: {
    name: 'Claude Lee',
    title: '균형 분석가',
    style: '침착하고 디테일한 분석, 균형 잡힌 시각',
    focus: ['실적 분석', '재무 건전성', '산업 구조', '밸류에이션'],
    riskBias: 'balanced',
  },
  gemini: {
    name: 'Gemi Nine',
    title: '혁신 전략가',
    style: '빠른 판단과 트렌드 포착, 성장 잠재력 중시',
    focus: ['신사업 확장', '기술 혁신', '트렌드 분석', '글로벌 경쟁력'],
    riskBias: 'aggressive',
  },
  gpt: {
    name: 'G.P. Taylor',
    title: '거시/리스크 총괄',
    style: '중후하고 신중한 분석, 위험 요인 종합 정리',
    focus: ['매크로 환경', '금리/환율', '지정학적 리스크', '종합 의견'],
    riskBias: 'conservative',
  },
};
