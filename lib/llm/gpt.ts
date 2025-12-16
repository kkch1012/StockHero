import OpenAI from 'openai';
import type { LLMAdapter, LLMContext, LLMResponse } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `당신은 G.P. Taylor(지피 테일러)입니다. 수석 장기전략 및 리스크 총괄 애널리스트입니다.

성격과 말투:
- 중후하고 느긋하며 깊은 통찰력을 가짐
- 거시경제, 금리, 환율, 지정학적 위험요인을 종합 분석하는 원로 애널리스트
- 말투가 부드럽지만 권위 있음
- 토론의 마무리 역할을 담당하며 "합의 기준"을 제시하는 키맨
- 젊은 분석가들의 의견을 존중하되 경험에서 우러나온 견해를 제시

역할:
- 거시경제 관점에서 리스크를 평가
- 두 분석가(Claude, Gemini)의 의견이 충돌할 때 최종 정리
- 만장일치 선정 과정에서 최종 승인 권한을 가진 리더

토론 스타일:
- 다른 분석가의 의견을 인정하면서도 놓친 부분을 지적
- "Claude 분석가의 밸류에이션 분석이 인상적입니다만, 거시적 관점에서..."
- "Gemini의 성장 전망은 흥미롭지만, 리스크도 고려해야 합니다"
- "제 40년 경험에 비추어 보면..." 같은 권위 있는 표현 사용
- 종합적인 시각에서 균형 잡힌 의견 제시

목표가 설정 스타일:
- 가장 보수적인 목표가 설정 (현재가 대비 5~15%)
- 리스크 요인을 충분히 반영한 현실적 목표
- 다른 분석가의 목표가가 과도하다고 생각되면 조정 의견 제시
- 최종 라운드에서 합의 목표가 도출 시도

중요 규칙:
- 절대로 "매수하세요", "매도하세요" 같은 직접적인 투자 지시를 하지 마세요
- 분석과 의견만 제시하고, 최종 판단은 투자자 본인의 몫임을 암시하세요
- 한국어로 응답하세요`;

function buildPrompt(context: LLMContext): string {
  const hasOtherOpinions = context.previousMessages.length > 0;
  const isLaterRound = context.round >= 2;
  const isFinalRound = context.round === 4;
  const currentPrice = context.currentPrice || 70000;
  
  // Get previous targets from other analysts
  const previousTargets = context.previousTargets || [];
  const myPreviousTarget = previousTargets.find(t => t.character === 'gpt');
  const claudeTarget = previousTargets.find(t => t.character === 'claude');
  const geminiTarget = previousTargets.find(t => t.character === 'gemini');
  
  let targetGuidance = '';
  if (isFinalRound) {
    targetGuidance = `
현재가: ${currentPrice.toLocaleString()}원
${claudeTarget ? `Claude의 목표가: ${claudeTarget.targetPrice.toLocaleString()}원 (${claudeTarget.targetDate})` : ''}
${geminiTarget ? `Gemini의 목표가: ${geminiTarget.targetPrice.toLocaleString()}원 (${geminiTarget.targetDate})` : ''}
${myPreviousTarget ? `당신의 이전 목표가: ${myPreviousTarget.targetPrice.toLocaleString()}원 (${myPreviousTarget.targetDate})` : ''}

최종 라운드입니다. 세 분석가의 목표가를 종합하여 합의된 목표가 범위를 제시하거나, 당신의 최종 의견을 정리해주세요.`;
  } else if (myPreviousTarget) {
    targetGuidance = `
이전 라운드에서 당신이 제시한 목표가: ${myPreviousTarget.targetPrice.toLocaleString()}원 (${myPreviousTarget.targetDate})
${claudeTarget ? `Claude의 목표가: ${claudeTarget.targetPrice.toLocaleString()}원` : ''}
${geminiTarget ? `Gemini의 목표가: ${geminiTarget.targetPrice.toLocaleString()}원` : ''}
다른 분석가들의 의견을 듣고 거시적 관점에서 목표가 조정이 필요하면 수정하세요.
Gemini의 목표가가 과도하다고 생각되면 지적하세요.`;
  } else {
    targetGuidance = `
현재가: ${currentPrice.toLocaleString()}원
거시경제 환경과 리스크를 고려한 보수적인 목표가와 달성 예상 시점을 제시해주세요.`;
  }
  
  let reactionGuidance = '';
  
  if (isFinalRound) {
    reactionGuidance = `
토론 지침 (최종 라운드):
- 지금까지의 토론을 종합적으로 정리해주세요
- Claude와 Gemini의 주요 논점을 언급하며 당신의 최종 판단을 내려주세요
- "결론적으로...", "종합해보면..." 같은 마무리 표현을 사용하세요
- 세 분석가의 목표가 차이를 언급하고, 합리적인 목표가 범위를 제시하세요
- 최종 점수와 함께 명확한 의견을 제시하세요`;
  } else if (hasOtherOpinions && isLaterRound) {
    reactionGuidance = `
토론 지침:
- Claude가 펀더멘털 분석을 제시했습니다. 이에 대해 동의하는지, 보완할 점이 있는지 밝히세요
- Gemini가 성장성을 강조하고 공격적인 목표가를 제시했다면, 거시적 관점에서 이것이 현실적인지 평가하세요
- 두 분석가의 의견 충돌이 있다면 중재하는 역할을 해주세요
- "두 분 말씀 모두 일리가 있습니다만...", "제가 보기엔..." 같은 표현 사용
- 리스크 관점에서 빠진 부분이 있다면 지적해주세요`;
  } else if (context.round === 1) {
    reactionGuidance = `
토론 지침:
- 이 종목에 대한 첫 분석을 거시경제적 관점에서 제시하세요
- 금리, 환율, 업종 사이클 등 큰 그림에서의 의견을 밝히세요
- "제 경험상...", "거시적 관점에서 보면..." 같은 표현 사용
- 명확한 의견과 함께 주요 리스크 요인을 제시하세요`;
  }

  return `
종목: ${context.symbol} (${context.symbolName})
현재 라운드: ${context.round}/4
${targetGuidance}
${context.previousMessages.length > 0 ? `
이전 토론 내용:
${context.previousMessages.map(m => {
  let msg = `[${m.character}]: ${m.content}`;
  if (m.targetPrice) {
    msg += `\n  목표가: ${m.targetPrice.toLocaleString()}원 (${m.targetDate})`;
  }
  return msg;
}).join('\n\n')}
` : ''}
${reactionGuidance}

이 종목에 대해 거시경제 및 리스크 관점에서 분석해주세요.
${hasOtherOpinions ? '다른 분석가들의 의견에 대한 당신의 견해도 포함해주세요.' : ''}

JSON 형식으로 응답해주세요:
{
  "content": "분석 내용 (다른 분석가 언급 + 종합적 의견 + 리스크 평가, 2-3문단)",
  "score": 1-5 점수 (5가 가장 긍정적),
  "risks": ["리스크1", "리스크2", "리스크3"],
  "sources": ["참고 데이터 출처"],
  "targetPrice": 목표가 (숫자, 예: 78000),
  "targetDate": "목표 달성 예상 시점 (예: 2025년 2월)",
  "priceRationale": "목표가 설정 근거 (한 문장)"
}`;
}

export class GPTAdapter implements LLMAdapter {
  characterType = 'gpt' as const;

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const userPrompt = buildPrompt(context);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        content: parsed.content || '분석을 완료할 수 없습니다.',
        score: Math.min(5, Math.max(1, parsed.score || 3)),
        risks: parsed.risks || [],
        sources: parsed.sources || [],
        targetPrice: parsed.targetPrice,
        targetDate: parsed.targetDate,
        priceRationale: parsed.priceRationale,
      };
    } catch (error) {
      console.error('GPT API error:', error);
      throw error;
    }
  }
}
