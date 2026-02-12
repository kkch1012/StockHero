// =====================================================
// VIP 커스텀 AI 토론 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscriptionInfo } from '@/lib/subscription/guard';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VIP 전용 심층 분석 프롬프트
const VIP_DEEP_ANALYSIS_PROMPTS = {
  claude: `## 🎯 VIP 심층 분석 모드 (Claude Lee)
VIP 고객을 위한 프리미엄 분석을 제공하세요:

1. **기관/외국인 수급 분석**
   - 최근 20일간 순매수/순매도 추세
   - 대량매매 동향

2. **차트 기술적 분석**
   - 주요 지지선/저항선 레벨
   - 이평선 배열 상태 (5/20/60/120일)
   - 거래량 프로파일

3. **밸류에이션 정밀 분석**
   - PER/PBR/EV/EBITDA 상세 비교
   - DCF 기반 적정가치 추정
   - 동종업계 밸류에이션 갭

4. **리스크 시나리오**
   - Bull Case / Base Case / Bear Case 목표가
   - 각 시나리오 확률 추정`,

  gemini: `## 🎯 VIP 심층 분석 모드 (Gemi Nine)
VIP 고객을 위한 성장주 심층 분석:

1. **TAM/SAM/SOM 분석**
   - 전체 시장 규모와 성장률
   - 점유율 확대 가능성
   - 경쟁사 대비 포지셔닝

2. **기술 혁신 분석**
   - R&D 투자 현황
   - 특허/기술 경쟁력
   - 제품 파이프라인

3. **글로벌 확장 전략**
   - 해외 매출 비중
   - 신규 시장 진출 계획

4. **카탈리스트 타임라인**
   - 향후 3/6/12개월 이벤트
   - 주가 영향 예상`,

  gpt: `## 🎯 VIP 심층 분석 모드 (G.P. Taylor)
VIP 고객을 위한 리스크 관리 분석:

1. **매크로 리스크 분석**
   - 금리/환율/인플레이션 영향
   - 경기사이클 포지션
   - 지정학적 리스크

2. **섹터 사이클 분석**
   - 업황 현재 위치 (확장/정점/수축/저점)
   - 재고/가동률 지표
   - 가격 트렌드

3. **헷지 전략**
   - 포트폴리오 내 역할
   - 상관관계 분석
   - 대안 투자 비교

4. **Exit 전략**
   - 목표가/손절가 구체적 레벨
   - 분할 매도 계획
   - 리밸런싱 타이밍`,
};

/**
 * 네이버 금융에서 종목 정보 조회
 */
async function fetchStockInfo(symbol: string): Promise<{
  name: string;
  price: number;
  changePercent: number;
  marketCap?: string;
  per?: string;
  pbr?: string;
} | null> {
  try {
    const response = await fetch(
      `https://finance.naver.com/item/main.naver?code=${symbol}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const html = await response.text();

    const nameMatch = html.match(/<title>([^:]+)/);
    const priceMatch = html.match(/현재가.*?(\d{1,3}(,\d{3})*)/);
    const changeMatch = html.match(/전일대비.*?([+-]?\d+\.\d+)%/);
    const mcapMatch = html.match(/시가총액.*?(\d{1,3}(,\d{3})*억원)/);
    const perMatch = html.match(/PER.*?(\d+\.\d+)/);
    const pbrMatch = html.match(/PBR.*?(\d+\.\d+)/);

    if (priceMatch) {
      return {
        name: nameMatch ? nameMatch[1].trim() : symbol,
        price: parseInt(priceMatch[1].replace(/,/g, '')),
        changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
        marketCap: mcapMatch ? mcapMatch[1] : undefined,
        per: perMatch ? perMatch[1] : undefined,
        pbr: pbrMatch ? pbrMatch[1] : undefined,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * AI 심층 분석 생성
 */
async function generateDeepAnalysis(
  characterType: 'claude' | 'gemini' | 'gpt',
  stockInfo: any,
  userQuestion?: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return 'API 키가 설정되지 않았습니다.';

  const models: Record<string, string> = {
    claude: 'anthropic/claude-sonnet-4',
    gemini: 'google/gemini-2.0-flash',
    gpt: 'openai/gpt-4o',
  };

  const deepPrompt = VIP_DEEP_ANALYSIS_PROMPTS[characterType];
  
  const systemPrompt = `${deepPrompt}

## 분석 대상 종목
- 종목명: ${stockInfo.name} (${stockInfo.symbol})
- 현재가: ${stockInfo.price?.toLocaleString()}원
- 등락률: ${stockInfo.changePercent > 0 ? '+' : ''}${stockInfo.changePercent?.toFixed(2)}%
${stockInfo.marketCap ? `- 시가총액: ${stockInfo.marketCap}` : ''}
${stockInfo.per ? `- PER: ${stockInfo.per}배` : ''}
${stockInfo.pbr ? `- PBR: ${stockInfo.pbr}배` : ''}

⚠️ VIP 전용 심층 분석입니다. 일반 분석보다 더 구체적이고 상세한 인사이트를 제공하세요.
구체적인 숫자, 레벨, 타이밍을 명시하세요.`;

  const userPrompt = userQuestion 
    ? `다음 질문에 대해 심층 분석해주세요:\n\n${userQuestion}`
    : `${stockInfo.name}에 대한 VIP 심층 분석을 제공해주세요.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: models[characterType],
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000, // VIP는 더 긴 응답
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '분석 생성에 실패했습니다.';
  } catch (error) {
    console.error(`[VIP Debate] ${characterType} error:`, error);
    return '분석 생성 중 오류가 발생했습니다.';
  }
}

/**
 * POST: VIP 커스텀 토론 시작
 */
export async function POST(request: NextRequest) {
  try {
    // VIP 권한 체크
    const subInfo = await getSubscriptionInfo(request);
    
    if (subInfo?.planName !== 'pro') {
      return NextResponse.json({
        success: false,
        error: 'Pro 전용 기능입니다.',
        upgradeUrl: '/pricing',
      }, { status: 403 });
    }

    const body = await request.json();
    const { symbol, question, characters = ['claude', 'gemini', 'gpt'] } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: '종목 코드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 종목 정보 조회
    const stockInfo = await fetchStockInfo(symbol);
    
    if (!stockInfo) {
      return NextResponse.json(
        { success: false, error: '종목 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 생성
    const sessionId = uuidv4();

    // 각 캐릭터의 심층 분석 생성 (병렬)
    const analysisPromises = characters.map(async (char: 'claude' | 'gemini' | 'gpt') => {
      const analysis = await generateDeepAnalysis(char, { ...stockInfo, symbol }, question);
      return { character: char, analysis };
    });

    const analyses = await Promise.all(analysisPromises);

    // DB 저장
    const { error: insertError } = await supabase
      .from('vip_debates')
      .insert({
        session_id: sessionId,
        user_id: subInfo.userId,
        symbol,
        stock_name: stockInfo.name,
        current_price: stockInfo.price,
        question,
        analyses: analyses.reduce((acc, a) => ({ ...acc, [a.character]: a.analysis }), {}),
      });

    if (insertError) {
      console.error('[VIP Debate] DB error:', insertError);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      stock: {
        symbol,
        name: stockInfo.name,
        price: stockInfo.price,
        changePercent: stockInfo.changePercent,
      },
      analyses,
    });

  } catch (error) {
    console.error('[VIP Debate] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET: VIP 토론 히스토리 조회
 */
export async function GET(request: NextRequest) {
  try {
    // VIP 권한 체크
    const subInfo = await getSubscriptionInfo(request);
    
    if (subInfo?.planName !== 'pro') {
      return NextResponse.json({
        success: false,
        error: 'Pro 전용 기능입니다.',
        upgradeUrl: '/pricing',
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (sessionId) {
      // 특정 세션 조회
      const { data: debate, error } = await supabase
        .from('vip_debates')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', subInfo.userId)
        .single();

      if (error || !debate) {
        return NextResponse.json(
          { success: false, error: 'Debate not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, debate });
    }

    // 히스토리 목록 조회
    const { data: debates, error } = await supabase
      .from('vip_debates')
      .select('session_id, symbol, stock_name, current_price, question, created_at')
      .eq('user_id', subInfo.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      debates: debates || [],
    });

  } catch (error) {
    console.error('[VIP Debate] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch debates' },
      { status: 500 }
    );
  }
}
