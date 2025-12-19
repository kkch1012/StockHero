import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchMultipleStockPrices } from '@/lib/market-data/kis';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 종목명 매핑 (실시간 가격 조회용)
const STOCK_NAMES: Record<string, { name: string; sector: string }> = {
  '005930': { name: '삼성전자', sector: '반도체' },
  '000660': { name: 'SK하이닉스', sector: '반도체' },
  '005380': { name: '현대차', sector: '자동차' },
  '035420': { name: 'NAVER', sector: 'IT서비스' },
  '105560': { name: 'KB금융', sector: '금융' },
  '017670': { name: 'SK텔레콤', sector: '통신' },
  '247540': { name: '에코프로비엠', sector: '2차전지' },
  '086520': { name: '에코프로', sector: '2차전지' },
  '352820': { name: '하이브', sector: '엔터' },
  '196170': { name: '알테오젠', sector: '바이오' },
  '443060': { name: '레인보우로보틱스', sector: 'AI/로봇' },
  '042700': { name: '한미반도체', sector: '반도체장비' },
  '012450': { name: '한화에어로스페이스', sector: '방산' },
  '047810': { name: '한국항공우주', sector: '방산' },
  '058470': { name: '리노공업', sector: '반도체장비' },
  '145020': { name: '휴젤', sector: '바이오' },
  '039030': { name: '이오테크닉스', sector: '반도체장비' },
  '055550': { name: '신한지주', sector: '금융' },
  '032830': { name: '삼성생명', sector: '보험' },
  '395400': { name: '맥쿼리인프라', sector: '인프라' },
  '373220': { name: 'LG에너지솔루션', sector: '2차전지' },
  '006400': { name: '삼성SDI', sector: '2차전지' },
  '035720': { name: '카카오', sector: 'IT서비스' },
  '068270': { name: '셀트리온', sector: '바이오' },
};

// Convert DB format to Calendar format with real-time prices
async function convertDBVerdictToCalendarFormat(dbVerdict: any): Promise<any> {
  const top5Items = dbVerdict.top5 || [];
  
  // 실시간 가격 조회
  const symbols = top5Items.map((item: any) => item.symbol);
  let realPrices = new Map<string, any>();
  
  try {
    realPrices = await fetchMultipleStockPrices(symbols);
  } catch (error) {
    console.error('Failed to fetch real-time prices for calendar:', error);
  }
  
  return {
    date: dbVerdict.date,
    top5: top5Items.map((item: any, idx: number) => {
      const stockInfo = STOCK_NAMES[item.symbol];
      const realPrice = realPrices.get(item.symbol);
      
      return {
        rank: item.rank || idx + 1,
        symbolCode: item.symbol,
        symbolName: stockInfo?.name || item.name,
        sector: stockInfo?.sector || item.sector || '기타',
        avgScore: item.avgScore || 4.0,
        claudeScore: item.claudeScore || 0,
        geminiScore: item.geminiScore || 0,
        gptScore: item.gptScore || 0,
        currentPrice: realPrice?.price || item.currentPrice || 0,
        change: realPrice?.change || 0,
        changePercent: realPrice?.changePercent || 0,
        targetPrice: item.targetPrice || 0,
        targetDate: item.targetDate || '',
      };
    }),
    isGenerated: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 한국 시간 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60 * 1000);
    const todayStr = kstTime.toISOString().split('T')[0];

    // DB에서 해당 월의 모든 verdict 조회 (실제 AI 분석 데이터만)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const { data: dbVerdicts, error } = await supabase
      .from('verdicts')
      .select('date, top5, consensus_summary')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: true,
        data: [],
        dbCount: 0,
        message: 'AI 분석 데이터가 없습니다. 오늘의 분석을 생성해주세요.',
      });
    }

    // DB 데이터만 사용 (더미 데이터 없음)
    const verdicts = [];
    
    for (const dbVerdict of (dbVerdicts || [])) {
      // 실시간 가격 포함하여 변환
      const formatted = await convertDBVerdictToCalendarFormat(dbVerdict);
      verdicts.push(formatted);
    }

    return NextResponse.json({
      success: true,
      data: verdicts,
      dbCount: verdicts.length,
      todayHasData: verdicts.some(v => v.date === todayStr),
    });
  } catch (error) {
    console.error('Calendar verdicts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar verdicts' },
      { status: 500 }
    );
  }
}
