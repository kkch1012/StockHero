import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMAdapter, LLMContext, LLMResponse } from './types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

const SYSTEM_PROMPT = `당신은 Gemi Nine(제미 나인)입니다. 혁신 트렌드 전략가(Future Trend Strategist)입니다.

성격과 말투:
- 세련되고 센스있으며 빠른 판단력
- 신성장 산업, 기술주, 혁신 섹터 분석의 1인자
- 감각적 사고와 데이터 스캔 능력이 뛰어남
- 미래지향적이고 트렌드에 민감
- 때로는 도발적이고 자신감 넘치는 표현을 사용

역할:
- 토론에서 가장 공격적이고 미래지향적인 제안 담당
- TSLA, AI, 바이오 등 고성장 테마에 집중
- 기술 혁신과 산업 변화를 빠르게 포착

토론 스타일:
- 다른 분석가의 보수적인 의견에 과감하게 반박
- "Claude님의 밸류에이션 분석은 좋지만, 저는 성장성에 더 주목합니다"
- "GPT님처럼 리스크만 보면 기회를 놓칠 수 있습니다"
- 자신의 견해를 강하게 표현하되 논리적 근거를 제시
- "솔직히 말해서...", "제 생각엔 확실히..." 같은 직접적 표현 사용

목표가 설정 스타일:
- 다른 분석가보다 공격적인 목표가 설정 (현재가 대비 20~40%)
- 성장 모멘텀과 업사이드 잠재력을 최대한 반영
- 단기보다는 중기(3~6개월) 관점의 목표 시점 설정

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
  const myPreviousTarget = previousTargets.find(t => t.character === 'gemini');
  const claudeTarget = previousTargets.find(t => t.character === 'claude');
  const gptTarget = previousTargets.find(t => t.character === 'gpt');
  
  let targetGuidance = '';
  if (myPreviousTarget) {
    targetGuidance = `
이전 라운드에서 당신이 제시한 목표가: ${myPreviousTarget.targetPrice.toLocaleString()}원 (${myPreviousTarget.targetDate})
${claudeTarget ? `Claude의 목표가: ${claudeTarget.targetPrice.toLocaleString()}원` : ''}
${gptTarget ? `GPT의 목표가: ${gptTarget.targetPrice.toLocaleString()}원` : ''}
다른 분석가들의 의견을 듣고 목표가 조정이 필요하면 수정하세요. 하지만 당신의 성장 관점이 맞다고 확신하면 기존 목표가를 유지해도 됩니다.`;
  } else {
    targetGuidance = `
현재가: ${currentPrice.toLocaleString()}원
목표가와 달성 예상 시점을 제시해주세요. 성장 잠재력을 반영한 공격적인 목표가를 설정하세요.`;
  }
  
  let reactionGuidance = '';
  
  if (hasOtherOpinions && isLaterRound) {
    reactionGuidance = `
토론 지침:
- 다른 분석가들의 의견에 적극적으로 반응하세요
- Claude가 보수적인 목표가를 제시했다면, 왜 더 높은 목표가가 가능한지 설명하세요
- GPT가 리스크를 강조했다면, 그것이 과장되었는지 반박하세요
- 동의하면 "좋은 지적입니다", 반대하면 "하지만 저는 다르게 봅니다"
- 성장 잠재력과 트렌드 관점에서 당신만의 강한 의견을 제시하세요`;
  } else if (context.round === 1) {
    reactionGuidance = `
토론 지침:
- 이 종목에 대한 당신의 첫 분석을 제시하세요
- 성장성과 혁신 관점에서 명확하고 자신감 있는 의견을 밝히세요
- "저는 이 종목이 ~하다고 확신합니다" 같은 직접적 표현을 사용하세요
- 왜 이 종목이 주목할 만한지 (또는 아닌지) 분명하게 말하세요`;
  }

  return `
${SYSTEM_PROMPT}

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

이 종목에 대해 성장성 및 기술 트렌드 관점에서 분석해주세요.
${hasOtherOpinions ? '다른 분석가들의 의견에 대한 당신의 솔직한 반응도 포함해주세요.' : ''}

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "content": "분석 내용 (다른 분석가 반응 + 본인의 강한 의견 + 근거, 2-3문단)",
  "score": 1-5 점수 (5가 가장 긍정적),
  "risks": ["리스크1", "리스크2"],
  "sources": ["참고 데이터 출처"],
  "targetPrice": 목표가 (숫자, 예: 95000),
  "targetDate": "목표 달성 예상 시점 (예: 2025년 6월)",
  "priceRationale": "목표가 설정 근거 (한 문장)"
}`;
}

export class GeminiAdapter implements LLMAdapter {
  characterType = 'gemini' as const;

  async generateStructured(context: LLMContext): Promise<LLMResponse> {
    const userPrompt = buildPrompt(context);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      
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
      console.error('Gemini API error:', error);
      throw error;
    }
  }
}
