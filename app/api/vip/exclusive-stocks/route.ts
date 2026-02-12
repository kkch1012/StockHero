// =====================================================
// VIP 전용 종목 API
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSubscriptionInfo, type PlanName } from '@/lib/subscription/guard';
import { sendVIPStockAlert } from '@/lib/notification-service';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VIP 분석 대상 종목 풀 (일반 Top 5와 다른 종목군)
const VIP_STOCK_POOL = [
  // 고성장 중소형주
  { symbol: '383310', name: '에코프로에이치엔', sector: '2차전지', description: '2차전지 소재 전문' },
  { symbol: '298050', name: '효성첨단소재', sector: '소재', description: '탄소섬유 국내 1위' },
  { symbol: '357780', name: '솔브레인', sector: '반도체소재', description: '반도체 특수가스' },
  { symbol: '336260', name: '두산퓨얼셀', sector: '수소', description: '수소연료전지' },
  { symbol: '095340', name: 'ISC', sector: '반도체장비', description: 'HBM 검사장비' },
  { symbol: '322510', name: '제이엘케이', sector: 'AI/의료', description: 'AI 의료영상' },
  { symbol: '357550', name: '석경에이티', sector: '소재', description: '실리카 에어로겔' },
  { symbol: '039440', name: '에스티아이', sector: '반도체장비', description: '반도체 가스공급' },
  { symbol: '241560', name: '두산밥캣', sector: '기계', description: '글로벌 건설장비' },
  { symbol: '403870', name: '두산에너빌리티', sector: '원전', description: '원전 기자재' },
  // 턴어라운드 후보
  { symbol: '011790', name: 'SKC', sector: '소재', description: '동박 사업 확대' },
  { symbol: '009830', name: '한화솔루션', sector: '신재생', description: '태양광 모듈' },
  { symbol: '028260', name: '삼성물산', sector: '건설', description: '바이오+건설' },
  { symbol: '034730', name: 'SK', sector: '지주', description: 'AI/반도체 지주' },
  { symbol: '003550', name: 'LG', sector: '지주', description: '전자/화학 지주' },
];

// AI 분석 프롬프트
const VIP_ANALYSIS_PROMPT = `당신은 VIP 고객을 위한 프리미엄 주식 분석가입니다.
일반 추천과 달리, VIP 종목은 다음 기준으로 선정합니다:

1. **알파 추구**: 시장 대비 초과수익 가능성
2. **차별화된 정보**: 대중에게 덜 알려진 투자 기회
3. **리스크-리워드**: 높은 수익 가능성과 감내 가능한 리스크
4. **타이밍**: 현재가 진입하기 좋은 시점인 종목

VIP 종목 선정 시:
- 일반 Top 5에 자주 등장하지 않는 종목 우선
- 기관/외국인 수급 변화 감지된 종목
- 실적 턴어라운드 또는 신사업 모멘텀 종목
- 기술적으로 바닥 확인 후 반등 시작 종목`;

/**
 * 네이버 금융에서 현재가 조회
 */
async function fetchCurrentPrice(symbol: string): Promise<{ price: number; changePercent: number } | null> {
  try {
    const response = await fetch(
      `https://finance.naver.com/item/main.naver?code=${symbol}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const html = await response.text();

    const priceMatch = html.match(/현재가.*?(\d{1,3}(,\d{3})*)/);
    const changeMatch = html.match(/전일대비.*?([+-]?\d+\.\d+)%/);

    if (priceMatch) {
      return {
        price: parseInt(priceMatch[1].replace(/,/g, '')),
        changePercent: changeMatch ? parseFloat(changeMatch[1]) : 0,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 이번 주 월요일 날짜 계산
 */
function getThisWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * VIP 종목 AI 분석 생성
 */
async function generateVIPStocks(): Promise<any[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[VIP] OpenRouter API key not found');
    return [];
  }

  // 현재가 조회
  const stocksWithPrices = await Promise.all(
    VIP_STOCK_POOL.map(async (stock) => {
      const priceData = await fetchCurrentPrice(stock.symbol);
      return {
        ...stock,
        currentPrice: priceData?.price || 0,
        changePercent: priceData?.changePercent || 0,
      };
    })
  );

  const stockList = stocksWithPrices
    .filter(s => s.currentPrice > 0)
    .map(s => `- ${s.name}(${s.symbol}): ${s.currentPrice.toLocaleString()}원, ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(1)}%, ${s.description}`)
    .join('\n');

  const prompt = `${VIP_ANALYSIS_PROMPT}

## 분석 대상 종목 (VIP 전용 풀)
${stockList}

## 요청
위 종목 중에서 이번 주 VIP 회원에게 추천할 3개 종목을 선정하세요.
각 종목별로:
1. 추천 이유 (구체적 수치 기반)
2. 목표가 (현재가 대비 %)
3. 손절가 (현재가 대비 %)
4. 주요 리스크 2가지
5. 추천 보유 기간

## 응답 형식 (JSON만)
{
  "vipStocks": [
    {
      "rank": 1,
      "symbol": "종목코드",
      "name": "종목명",
      "currentPrice": 현재가숫자,
      "targetPrice": 목표가숫자,
      "stopLoss": 손절가숫자,
      "expectedReturn": "예상수익률%",
      "reason": "추천 이유 3-4문장",
      "risks": ["리스크1", "리스크2"],
      "holdingPeriod": "2-4주",
      "conviction": "HIGH/MEDIUM/LOW"
    }
  ]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          { role: 'system', content: 'You are a premium stock analyst for VIP clients. Respond only in JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.vipStocks || [];
    }
  } catch (error) {
    console.error('[VIP] AI analysis error:', error);
  }

  return [];
}

/**
 * GET: VIP 전용 종목 조회
 */
export async function GET(request: NextRequest) {
  try {
    // VIP 권한 체크
    const subInfo = await getSubscriptionInfo(request);
    const isVIP = subInfo?.planName === 'pro';

    // 이번 주 VIP 종목 조회
    const weekStart = getThisWeekMonday();
    const { data: vipStocks, error } = await supabase
      .from('vip_stocks')
      .select('*')
      .eq('week_start', weekStart)
      .order('rank', { ascending: true });

    if (error) throw error;

    // VIP가 아닌 경우 블러 처리된 데이터 반환
    if (!isVIP) {
      const blurredStocks = (vipStocks || []).map((stock: any) => ({
        rank: stock.rank,
        name: '🔒 VIP 전용',
        symbol: '******',
        currentPrice: null,
        targetPrice: null,
        expectedReturn: '??%',
        reason: 'VIP 회원만 확인할 수 있습니다.',
        isLocked: true,
      }));

      return NextResponse.json({
        success: true,
        isVIP: false,
        weekStart,
        stocks: blurredStocks,
        message: 'VIP 전용 종목을 확인하려면 VIP 플랜으로 업그레이드하세요.',
        upgradeUrl: '/pricing',
      });
    }

    // 과거 VIP 종목 성과 (최근 4주)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: pastStocks } = await supabase
      .from('vip_stocks')
      .select('*')
      .lt('week_start', weekStart)
      .gte('week_start', fourWeeksAgo.toISOString().split('T')[0])
      .order('week_start', { ascending: false });

    // 성과 계산
    const performanceStats = await calculatePerformance(pastStocks || []);

    return NextResponse.json({
      success: true,
      isVIP: true,
      weekStart,
      stocks: vipStocks || [],
      pastPerformance: performanceStats,
    });

  } catch (error) {
    console.error('[VIP Stocks] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch VIP stocks' },
      { status: 500 }
    );
  }
}

/**
 * POST: VIP 종목 생성 (매주 월요일 Cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Cron 인증
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 관리자 권한으로 수동 생성 허용
      const subInfo = await getSubscriptionInfo(request);
      if (subInfo?.planName !== 'pro') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const weekStart = getThisWeekMonday();

    // 이미 이번 주 종목이 있는지 확인
    const { data: existing } = await supabase
      .from('vip_stocks')
      .select('id')
      .eq('week_start', weekStart)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VIP stocks already exist for this week',
        weekStart,
      });
    }

    // AI 분석으로 VIP 종목 생성
    const vipStocks = await generateVIPStocks();

    if (vipStocks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate VIP stocks',
      }, { status: 500 });
    }

    // DB 저장
    const stocksToInsert = vipStocks.map((stock: any) => ({
      week_start: weekStart,
      rank: stock.rank,
      symbol: stock.symbol,
      name: stock.name,
      current_price: stock.currentPrice,
      target_price: stock.targetPrice,
      stop_loss: stock.stopLoss,
      expected_return: stock.expectedReturn,
      reason: stock.reason,
      risks: stock.risks,
      holding_period: stock.holdingPeriod,
      conviction: stock.conviction,
    }));

    const { error: insertError } = await supabase
      .from('vip_stocks')
      .insert(stocksToInsert);

    if (insertError) throw insertError;

    // VIP 회원에게 알림 발송
    for (const stock of vipStocks) {
      await sendVIPStockAlert({
        name: stock.name,
        symbol: stock.symbol,
        reason: stock.reason,
        targetReturn: parseFloat(stock.expectedReturn) || 15,
      });
    }

    return NextResponse.json({
      success: true,
      weekStart,
      stocks: vipStocks,
    });

  } catch (error) {
    console.error('[VIP Stocks] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create VIP stocks' },
      { status: 500 }
    );
  }
}

/**
 * 과거 VIP 종목 성과 계산
 */
async function calculatePerformance(pastStocks: any[]): Promise<{
  totalStocks: number;
  avgReturn: number;
  winRate: number;
  bestPerformer: any;
  worstPerformer: any;
}> {
  if (pastStocks.length === 0) {
    return { totalStocks: 0, avgReturn: 0, winRate: 0, bestPerformer: null, worstPerformer: null };
  }

  // 현재가 조회하여 실제 수익률 계산
  const stocksWithReturns = await Promise.all(
    pastStocks.map(async (stock: any) => {
      const priceData = await fetchCurrentPrice(stock.symbol);
      const currentPrice = priceData?.price || stock.current_price;
      const returnPercent = ((currentPrice - stock.current_price) / stock.current_price) * 100;
      return { ...stock, actualReturn: returnPercent, actualPrice: currentPrice };
    })
  );

  const returns = stocksWithReturns.map(s => s.actualReturn);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const winners = returns.filter(r => r > 0).length;

  const sorted = [...stocksWithReturns].sort((a, b) => b.actualReturn - a.actualReturn);

  return {
    totalStocks: pastStocks.length,
    avgReturn: Math.round(avgReturn * 100) / 100,
    winRate: Math.round((winners / returns.length) * 100),
    bestPerformer: sorted[0] || null,
    worstPerformer: sorted[sorted.length - 1] || null,
  };
}
