import type { LLMAdapter, LLMContext, LLMResponse, CharacterType, CharacterPersona } from './types';
import { CHARACTER_PERSONAS } from './types';

// Seeded random for reproducible results
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function () {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

// Templates for first round (initial opinions)
const INITIAL_TEMPLATES: Record<CharacterType, string[]> = {
  claude: [
    '제 분석으로는 {name}의 펀더멘털이 상당히 견고합니다. 최근 분기 실적을 보면 매출 성장률이 전년 대비 15% 이상 증가했고, 영업이익률도 개선되고 있습니다.\n\n저는 이 종목에 대해 긍정적인 견해를 갖고 있습니다. 다만 현재 PER이 업종 평균 대비 높은 편이므로, 밸류에이션 부담은 인지하고 있어야 합니다. 실적이 뒷받침된다면 현 주가 수준은 정당화될 수 있다고 봅니다.',
    '솔직히 말씀드리면, {name}의 재무구조는 매우 안정적입니다. 부채비율 50% 미만, 현금흐름도 양호합니다. {sector} 업종에서 이 정도 체력을 갖춘 기업은 많지 않습니다.\n\n제 의견은 분명합니다. 단기 변동성보다는 중장기 관점에서 접근할 가치가 있는 종목이라고 생각합니다.',
  ],
  gemini: [
    '저는 {name}에 대해 상당히 낙관적인 시각을 갖고 있습니다. 솔직히 이 종목의 성장 잠재력은 현재 주가에 충분히 반영되지 않았다고 봅니다.\n\n특히 AI와 신기술 분야에서의 투자 확대가 눈에 띕니다. {sector} 업종 내에서 혁신을 주도하고 있으며, 글로벌 경쟁력도 강화되고 있습니다. 저라면 관심을 가질 만한 구간이라고 확신합니다.',
    '제가 보기에 {name}은 확실히 주목할 만합니다. 신사업 모멘텀이 살아있고, 기술 투자도 적극적입니다.\n\n다른 분석가분들보다 제가 좀 더 공격적인 시각을 갖고 있는 건 사실입니다. 하지만 성장주 투자에서는 때로는 과감한 판단이 필요합니다. {name}은 그럴 가치가 있는 기업이라고 생각합니다.',
  ],
  gpt: [
    '제 40년 경험에 비추어 보면, {name}을 평가할 때는 거시경제 환경을 반드시 고려해야 합니다. 현재 금리 수준과 경기 사이클을 감안하면, {sector} 업종 전반에 신중한 접근이 필요합니다.\n\n물론 {name}이 업종 내 우량 기업이라는 점은 인정합니다. 하지만 글로벌 불확실성이 해소되기 전까지는 보수적인 시각을 유지하는 것이 현명해 보입니다.',
    '거시적 관점에서 {name}을 분석해보겠습니다. 최근 환율 변동성과 금리 인상 기조를 고려하면, 단기적으로는 변동성이 클 수 있습니다.\n\n그러나 장기적으로 이 기업의 사업 경쟁력은 검증되었습니다. 제 의견은 "신중한 낙관"입니다. 리스크를 인지하되, 과도한 비관도 경계해야 합니다.',
  ],
};

// Templates for reaction rounds (responding to others)
const REACTION_TEMPLATES: Record<CharacterType, string[]> = {
  claude: [
    'Gemini님의 성장성 분석이 인상적이었습니다. 저도 {name}의 성장 잠재력에는 동의합니다. 다만 제 관점에서는 밸류에이션도 함께 봐야 한다고 생각합니다.\n\nGPT님이 언급하신 거시 리스크도 일리가 있습니다. 하지만 {name}의 재무 건전성을 고려하면, 이런 외부 충격에도 버틸 체력이 있다고 봅니다. 종합하면 저는 여전히 긍정적이며, 기존 목표가를 유지합니다.',
    'GPT님의 리스크 분석에 감사드립니다. 중요한 지적이었습니다. 하지만 제 생각은 조금 다릅니다. {name}의 실적 추이를 보면 외부 환경 악화에도 꾸준한 성장을 보여왔습니다.\n\nGemini님처럼 과하게 낙관하지는 않지만, 지나치게 보수적일 필요도 없다고 봅니다. 균형 잡힌 시각에서, 저는 이 종목에 관심을 가질 만하다고 판단하며, 목표가는 소폭 상향 조정합니다.',
  ],
  gemini: [
    'Claude님의 밸류에이션 분석은 좋았지만, 저는 좀 다르게 생각합니다. 성장주를 평가할 때 현재 PER보다 미래 성장률이 더 중요합니다.\n\nGPT님이 리스크를 강조하셨는데, 솔직히 말해서 리스크만 보면 어떤 투자도 할 수 없습니다. {name}의 혁신 역량과 시장 기회를 고려하면, 저는 오히려 지금이 기회라고 확신하며, 공격적인 목표가를 유지합니다.',
    '두 분의 분석을 잘 들었습니다. Claude님의 펀더멘털 분석에는 동의하지만, 좀 더 공격적인 해석이 필요하다고 봅니다.\n\nGPT님, 거시 환경이 불확실한 건 맞습니다. 하지만 그렇기 때문에 더 좋은 기업을 골라야 합니다. {name}은 불확실성 속에서도 성장할 수 있는 기업입니다. 저는 확실히 긍정적이고, 목표가도 그대로 유지합니다.',
  ],
  gpt: [
    'Claude 분석가와 Gemini 분석가의 의견을 종합해보겠습니다. 펀더멘털과 성장성 모두 긍정적인 포인트가 있다는 것에는 동의합니다.\n\n하지만 제가 강조하고 싶은 건, 아무리 좋은 기업도 거시 환경을 이길 수는 없다는 점입니다. {name}이 좋은 기업인 건 맞지만, 현 시점에서는 리스크 관리가 필요합니다. 목표가는 보수적으로 유지하겠습니다.',
    '두 분의 열정적인 분석 감사합니다. Gemini님의 낙관론과 Claude님의 균형 잡힌 시각 모두 참고할 만합니다.\n\n제 오랜 경험상, 시장은 언제나 우리 예상보다 더 변동성이 큽니다. {name}에 대해서는 긍정적인 요소가 많지만, Gemini님의 목표가는 다소 공격적으로 보입니다. 저는 보수적 관점을 유지하며 목표가를 소폭 하향합니다.',
  ],
};

// Final round summary templates
const FINAL_TEMPLATES: Record<CharacterType, string[]> = {
  claude: [
    '토론을 마무리하며 제 최종 의견을 말씀드리겠습니다. {name}에 대해 세 분석가 모두 기본적인 사업 경쟁력에서는 동의했습니다.\n\nGemini님의 성장 전망과 GPT님의 리스크 지적을 종합하면, 저는 "관심 종목"으로 분류하고 싶습니다. 최종 목표가는 세 분석가의 중간값 수준으로 제시합니다.',
  ],
  gemini: [
    '결론적으로, 저는 {name}에 대해 긍정적인 의견을 유지합니다. Claude님과 GPT님의 우려를 충분히 이해하지만, 성장 기회가 리스크보다 크다고 봅니다.\n\n특히 {sector} 업종의 장기 성장성을 고려하면, {name}은 포트폴리오에서 한 자리를 차지할 만한 종목입니다. 저의 최종 목표가가 가장 높지만, 이는 성장 잠재력을 반영한 것입니다.',
  ],
  gpt: [
    '토론을 정리하겠습니다. {name}에 대해 세 분석가의 의견을 종합하면, 긍정적 요소와 유의점이 균형 있게 논의되었습니다.\n\nClaude님의 펀더멘털 분석, Gemini님의 성장성 분석 모두 타당했습니다. 세 분석가의 목표가 범위는 제 보수적 목표가부터 Gemini님의 공격적 목표가까지입니다. 투자자분들은 본인의 투자 성향에 맞는 목표가를 참고하시기 바랍니다.',
  ],
};

const RISK_TEMPLATES: Record<CharacterType, string[][]> = {
  claude: [
    ['밸류에이션 부담', '실적 성장 둔화 가능성'],
    ['업종 내 경쟁 심화', '원자재 가격 변동'],
    ['환율 변동 리스크', '수요 전망 불확실'],
  ],
  gemini: [
    ['기술 변화 대응 속도', '신사업 불확실성'],
    ['경쟁사 추격', '규제 환경 변화'],
    ['투자 회수 시기 지연', '시장 기대치 관리'],
  ],
  gpt: [
    ['금리 인상 영향', '경기 침체 우려', '지정학적 리스크'],
    ['환율 변동성', '글로벌 공급망 이슈', '인플레이션 압력'],
    ['정책 불확실성', '유동성 축소', '신용 위험 확대'],
  ],
};

const SOURCE_TEMPLATES: Record<CharacterType, string[][]> = {
  claude: [
    ['분기 실적 보고서', '재무제표 분석'],
    ['업종 보고서', '밸류에이션 분석'],
    ['경쟁사 비교 분석', '수익성 지표'],
  ],
  gemini: [
    ['기술 트렌드 리포트', '산업 전망'],
    ['시장 점유율 분석', '성장성 지표'],
    ['신사업 발표자료', 'IR 자료'],
  ],
  gpt: [
    ['매크로 리포트', '금리 전망'],
    ['환율 분석', '글로벌 경제 전망'],
    ['리스크 분석 보고서', '시나리오 분석'],
  ],
};

// Target price multipliers by character
const TARGET_MULTIPLIERS: Record<CharacterType, { min: number; max: number }> = {
  claude: { min: 1.10, max: 1.20 }, // 10-20% upside (balanced)
  gemini: { min: 1.20, max: 1.40 }, // 20-40% upside (aggressive)
  gpt: { min: 1.05, max: 1.15 }, // 5-15% upside (conservative)
};

// Target date ranges by character (months from now)
const TARGET_DATE_RANGES: Record<CharacterType, { min: number; max: number }> = {
  claude: { min: 2, max: 4 }, // 2-4 months
  gemini: { min: 3, max: 6 }, // 3-6 months
  gpt: { min: 1, max: 3 }, // 1-3 months
};

const PRICE_RATIONALES: Record<CharacterType, string[]> = {
  claude: [
    '실적 개선과 밸류에이션 정상화를 반영한 목표가입니다',
    '펀더멘털 분석 기반 적정 가치 산출 결과입니다',
    '업종 평균 PER에 실적 성장률을 적용한 목표가입니다',
  ],
  gemini: [
    '성장 모멘텀과 업사이드 잠재력을 최대한 반영했습니다',
    '신사업 기회와 글로벌 확장을 고려한 공격적 목표가입니다',
    '기술 혁신에 따른 시장 재평가를 반영한 목표가입니다',
  ],
  gpt: [
    '거시경제 리스크를 반영한 보수적 목표가입니다',
    '변동성 확대 가능성을 고려해 안전마진을 적용했습니다',
    '금리 환경과 업황을 종합한 현실적 목표가입니다',
  ],
};

export class MockLLMAdapter implements LLMAdapter {
  characterType: CharacterType;

  constructor(characterType: CharacterType) {
    this.characterType = characterType;
  }

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const symbol = context.symbol || '005930';
    const symbolName = context.symbolName || '종목';
    const sector = context.sector || '기타';
    const round = context.round || 1;
    const currentPrice = context.currentPrice || 70000;
    const hasOtherMessages = context.previousMessages && context.previousMessages.length > 0;
    
    const random = seededRandom(`${symbol}-${round}-${this.characterType}`);
    
    // Select template based on round and context
    let templates: string[];
    if (round >= 4) {
      templates = FINAL_TEMPLATES[this.characterType];
    } else if (round === 1 || !hasOtherMessages) {
      templates = INITIAL_TEMPLATES[this.characterType];
    } else {
      templates = REACTION_TEMPLATES[this.characterType];
    }
    
    const templateIndex = Math.floor(random() * templates.length);
    const template = templates[templateIndex];
    
    const content = template
      .replace(/{name}/g, symbolName)
      .replace(/{sector}/g, sector);

    const riskIndex = Math.floor(random() * RISK_TEMPLATES[this.characterType].length);
    const risks = RISK_TEMPLATES[this.characterType][riskIndex];

    const sourceIndex = Math.floor(random() * SOURCE_TEMPLATES[this.characterType].length);
    const sources = SOURCE_TEMPLATES[this.characterType][sourceIndex];

    // Score varies by character bias
    const persona = CHARACTER_PERSONAS[this.characterType];
    let baseScore = 3.5 + random() * 1.5; // 3.5 to 5.0
    if (persona.riskBias === 'conservative') {
      baseScore -= 0.3;
    } else if (persona.riskBias === 'aggressive') {
      baseScore += 0.2;
    }
    const score = Math.min(5, Math.max(1, Math.round(baseScore * 10) / 10));

    // Calculate target price based on character style
    const targetMultiplier = TARGET_MULTIPLIERS[this.characterType];
    const multiplier = targetMultiplier.min + random() * (targetMultiplier.max - targetMultiplier.min);
    
    // Check if we should adjust based on previous target
    const previousTargets = context.previousTargets || [];
    const myPreviousTarget = previousTargets.find(t => t.character === this.characterType);
    
    let targetPrice: number;
    if (myPreviousTarget && round > 1) {
      // Small adjustment based on discussion (0-5%)
      const adjustment = (random() - 0.5) * 0.05;
      targetPrice = Math.round(myPreviousTarget.targetPrice * (1 + adjustment) / 100) * 100;
    } else {
      targetPrice = Math.round(currentPrice * multiplier / 100) * 100;
    }
    
    // Calculate target date
    const dateRange = TARGET_DATE_RANGES[this.characterType];
    const monthsAhead = Math.floor(dateRange.min + random() * (dateRange.max - dateRange.min));
    const targetDateObj = new Date();
    targetDateObj.setMonth(targetDateObj.getMonth() + monthsAhead);
    const targetDate = `${targetDateObj.getFullYear()}년 ${targetDateObj.getMonth() + 1}월`;
    
    // Price rationale
    const rationaleIndex = Math.floor(random() * PRICE_RATIONALES[this.characterType].length);
    const priceRationale = PRICE_RATIONALES[this.characterType][rationaleIndex];

    // Simulate async behavior
    await new Promise(resolve => setTimeout(resolve, 100 + random() * 200));

    return {
      content,
      risks,
      sources,
      score: Math.round(score),
      targetPrice,
      targetDate,
      priceRationale,
    };
  }
}
