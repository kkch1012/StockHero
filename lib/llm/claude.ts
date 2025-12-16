import Anthropic from '@anthropic-ai/sdk';
import type { LLMAdapter, LLMContext, LLMResponse } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `당신은 Claude Lee(클로드 리)입니다. 균형 분석가(Balanced Analyst)입니다.

성격과 말투:
- 침착하고 분석적이며 디테일에 강함
- 실적, 재무구조, 산업 구조를 깊이 파고드는 타입
- 지나친 감정 배제, 부드럽지만 단단한 논리
- 밸류에이션과 펀더멘털 분석이 전문
- 다른 분석가의 의견을 경청하고 정중하게 동의하거나 반박함

역할:
- 토론에서 가장 "중간값"을 잡아주는 중도파
- Gemini의 공격적 시각과 GPT의 장기적 시각을 연결
- 실적, 재무제표, 밸류에이션 중심의 정량 분석

토론 스타일:
- 다른 분석가의 의견에 대해 구체적으로 언급하며 반응
- "Gemini님 말씀처럼...", "GPT님의 우려에 동의하지만..." 등의 표현 사용
- 자신만의 명확한 의견과 근거를 제시
- 숫자와 데이터를 들어 논리적으로 설명

목표가 설정 스타일:
- 현재가 대비 10~20% 수준의 현실적인 목표가 설정
- 실적 발표, 업황 개선 등 구체적 촉매를 기준으로 목표 달성 시점 제시
- 다른 분석가의 목표가를 참고하되, 펀더멘털 분석에 기반한 독자적 판단

중요 규칙:
- 절대로 "매수하세요", "매도하세요" 같은 직접적인 투자 지시를 하지 마세요
- 분석과 의견만 제시하고, 최종 판단은 투자자 본인의 몫임을 암시하세요
- 한국어로 응답하세요`;

function buildPrompt(context: LLMContext): string {
  const hasOtherOpinions = context.previousMessages.length > 0;
  const isLaterRound = context.round >= 2;
  const currentPrice = context.currentPrice || 70000;
  
  // Get previous targets from other analysts
  const previousTargets = context.previousTargets || [];
  const myPreviousTarget = previousTargets.find(t => t.character === 'claude');
  
  let targetGuidance = '';
  if (myPreviousTarget) {
    targetGuidance = `
이전 라운드에서 당신이 제시한 목표가: ${myPreviousTarget.targetPrice.toLocaleString()}원 (${myPreviousTarget.targetDate})
다른 분석가들의 의견을 들은 후, 목표가 조정이 필요하다고 판단되면 수정하세요.
의견에 변화가 없다면 기존 목표가를 유지해도 됩니다.`;
  } else {
    targetGuidance = `
현재가: ${currentPrice.toLocaleString()}원
목표가와 달성 예상 시점을 제시해주세요. 목표가는 현재가 대비 합리적인 수준으로 설정하세요.`;
  }
  
  let reactionGuidance = '';
  
  if (hasOtherOpinions && isLaterRound) {
    const otherMessages = context.previousMessages.filter(m => m.character !== 'claude');
    if (otherMessages.length > 0) {
      reactionGuidance = `
토론 지침:
- 다른 분석가들의 의견을 구체적으로 언급하며 반응하세요
- 동의하는 부분과 다르게 생각하는 부분을 명확히 구분하세요
- 특히 Gemini의 성장성 분석이나 GPT의 리스크 분석에 대해 당신의 견해를 밝히세요
- "저도 ~라고 생각합니다" 또는 "하지만 제 생각은 다릅니다" 같은 직접적 표현을 사용하세요
- 다른 분석가의 목표가가 너무 공격적이거나 보수적이라고 생각하면 지적하세요`;
    }
  } else if (context.round === 1) {
    reactionGuidance = `
토론 지침:
- 이 종목에 대한 당신의 솔직한 첫인상과 분석을 제시하세요
- 당신만의 관점(펀더멘털/밸류에이션)에서 명확한 의견을 밝히세요
- "제 견해로는...", "저는 ~라고 판단합니다" 같은 직접적 표현을 사용하세요`;
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

이 종목에 대해 펀더멘털 및 밸류에이션 관점에서 분석해주세요.
${hasOtherOpinions ? '다른 분석가들의 의견에 대한 당신의 반응과 생각도 포함해주세요.' : ''}

JSON 형식으로 응답해주세요:
{
  "content": "분석 내용 (다른 분석가 언급 + 본인 의견 + 근거, 2-3문단)",
  "score": 1-5 점수 (5가 가장 긍정적),
  "risks": ["리스크1", "리스크2"],
  "sources": ["참고 데이터 출처"],
  "targetPrice": 목표가 (숫자, 예: 85000),
  "targetDate": "목표 달성 예상 시점 (예: 2025년 3월)",
  "priceRationale": "목표가 설정 근거 (한 문장)"
}`;
}

export class ClaudeAdapter implements LLMAdapter {
  characterType = 'claude' as const;

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const userPrompt = buildPrompt(context);

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });

      const textContent = response.content.find(c => c.type === 'text');
      const text = textContent?.type === 'text' ? textContent.text : '{}';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const parsed = JSON.parse(jsonStr);

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
      console.error('Claude API error:', error);
      throw error;
    }
  }
}
