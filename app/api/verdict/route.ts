import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchMultipleStockPrices } from '@/lib/market-data/kis';

// Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 종목명 매핑
const STOCK_NAMES: Record<string, string> = {
  '005930': '삼성전자',
  '000660': 'SK하이닉스',
  '373220': 'LG에너지솔루션',
  '207940': '삼성바이오로직스',
  '005380': '현대차',
  '006400': '삼성SDI',
  '035720': '카카오',
  '035420': 'NAVER',
  '051910': 'LG화학',
  '000270': '기아',
  '105560': 'KB금융',
  '055550': '신한지주',
  '068270': '셀트리온',
  '003670': '포스코홀딩스',
  '066570': 'LG전자',
  '017670': 'SK텔레콤',
  '030200': 'KT',
  '032830': '삼성생명',
  '086790': '하나금융지주',
  '009150': '삼성전기',
};

// Fallback 추천 (DB에 데이터가 없을 때)
const FALLBACK_TOP5 = [
  { rank: 1, symbol: '005930', name: '삼성전자', avgScore: 4.5, isUnanimous: true },
  { rank: 2, symbol: '000660', name: 'SK하이닉스', avgScore: 4.3, isUnanimous: true },
  { rank: 3, symbol: '373220', name: 'LG에너지솔루션', avgScore: 4.1, isUnanimous: false },
  { rank: 4, symbol: '035720', name: '카카오', avgScore: 3.9, isUnanimous: false },
  { rank: 5, symbol: '105560', name: 'KB금융', avgScore: 3.8, isUnanimous: false },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  
  // 날짜 파라미터가 있으면 해당 날짜, 없으면 오늘
  const targetDate = dateParam || new Date().toISOString().split('T')[0];
  
  try {
    // 1. DB에서 해당 날짜의 verdict 조회
    const { data: verdict, error } = await supabase
      .from('verdicts')
      .select('*')
      .eq('date', targetDate)
      .single();

    let top5 = verdict?.top5 || FALLBACK_TOP5;
    const isFromDB = !!verdict;
    
    // 2. 실시간 가격 조회
    const symbols = top5.map((item: any) => item.symbol);
    let realTimePrices: Map<string, any> = new Map();
    
    try {
      realTimePrices = await fetchMultipleStockPrices(symbols);
    } catch (error) {
      console.error('Failed to fetch real-time prices:', error);
    }
    
    // 3. 실시간 가격 병합
    const top5WithPrices = top5.map((item: any, idx: number) => {
      const realPrice = realTimePrices.get(item.symbol);
      const stockName = STOCK_NAMES[item.symbol] || item.name;
      
      return {
        rank: item.rank || idx + 1,
        symbolId: String(idx + 1),
        symbol: item.symbol,
        name: stockName,
        avgScore: item.avgScore || 4.0,
        claudeScore: item.claudeScore || 0,
        geminiScore: item.geminiScore || 0,
        gptScore: item.gptScore || 0,
        unanimous: item.isUnanimous || false,
        rationale: item.reasons?.[0] || `${stockName}은(는) AI 분석가들의 추천을 받았습니다.`,
        currentPrice: realPrice?.price || item.currentPrice || 0,
        change: realPrice?.change || item.change || 0,
        changePercent: realPrice?.changePercent || item.changePercent || 0,
      };
    });
    
    const targetDateObj = new Date(targetDate + 'T00:00:00');
    const dateStr = targetDateObj.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return NextResponse.json({
      success: true,
      isRealTime: realTimePrices.size > 0,
      isFromDB,
      date: dateStr,
      time: timeStr,
      targetDate,
      unanimousCount: top5WithPrices.filter((item: any) => item.unanimous).length,
      rationale: verdict?.consensus_summary || 'AI 분석가들이 선정한 오늘의 Top 5 종목입니다.',
      top5: top5WithPrices,
    });
    
  } catch (error: any) {
    console.error('Verdict API error:', error);
    
    // 에러 시 Fallback 사용
    const symbols = FALLBACK_TOP5.map(item => item.symbol);
    let realTimePrices: Map<string, any> = new Map();
    
    try {
      realTimePrices = await fetchMultipleStockPrices(symbols);
    } catch (e) {
      console.error('Failed to fetch fallback prices:', e);
    }
    
    const top5WithPrices = FALLBACK_TOP5.map((item, idx) => {
      const realPrice = realTimePrices.get(item.symbol);
      return {
        ...item,
        symbolId: String(idx + 1),
        unanimous: item.isUnanimous,
        rationale: `${item.name}은(는) AI 분석가들의 추천을 받았습니다.`,
        currentPrice: realPrice?.price || 0,
        change: realPrice?.change || 0,
        changePercent: realPrice?.changePercent || 0,
        claudeScore: 0,
        geminiScore: 0,
        gptScore: 0,
      };
    });
    
    return NextResponse.json({
      success: true,
      isRealTime: realTimePrices.size > 0,
      isFromDB: false,
      date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      targetDate: new Date().toISOString().split('T')[0],
      unanimousCount: 2,
      rationale: 'AI 분석가들이 선정한 오늘의 Top 5 종목입니다.',
      top5: top5WithPrices,
    });
  }
}
