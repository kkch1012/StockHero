import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchMultipleStockPrices } from '@/lib/market-data/kis';
import { verifyCronAuth, logCronExecution } from '@/lib/cron-auth';

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI Clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// ===== 확장된 분석 대상 종목 (40개 이상) =====
const ANALYSIS_STOCKS = [
  // ===== 방산/우주항공 (핫섹터 - 강화) =====
  { symbol: '012450', name: '한화에어로스페이스', sector: '방산', per: 25.0, pbr: 3.0, roe: 18.0, dividend: 0.5, growth: 55.0, theme: ['방산', '우주', '엔진', 'AI'] },
  { symbol: '047810', name: '한국항공우주', sector: '방산', per: 20.0, pbr: 2.8, roe: 15.0, dividend: 0.8, growth: 45.0, theme: ['방산', '항공기', 'KF-21'] },
  { symbol: '079550', name: 'LIG넥스원', sector: '방산', per: 18.0, pbr: 2.5, roe: 16.0, dividend: 0.6, growth: 40.0, theme: ['방산', '미사일', '무기'] },
  { symbol: '000880', name: '한화', sector: '방산', per: 12.0, pbr: 1.2, roe: 12.0, dividend: 2.0, growth: 25.0, theme: ['방산', '지주', '태양광'] },
  { symbol: '298040', name: '효성중공업', sector: '중공업', per: 15.0, pbr: 2.5, roe: 22.0, dividend: 1.0, growth: 50.0, theme: ['전력기기', '변압기', 'AI'] },
  { symbol: '267260', name: '현대일렉트릭', sector: '전력기기', per: 12.0, pbr: 2.0, roe: 20.0, dividend: 0.8, growth: 45.0, theme: ['전력기기', '변압기'] },
  
  // ===== 반도체/AI (핵심 성장) =====
  { symbol: '000660', name: 'SK하이닉스', sector: '반도체', per: 8.5, pbr: 2.0, roe: 25.0, dividend: 0.5, growth: 55.0, theme: ['반도체', 'AI', 'HBM'] },
  { symbol: '005930', name: '삼성전자', sector: '반도체', per: 12.0, pbr: 1.2, roe: 10.0, dividend: 2.0, growth: 15.0, theme: ['반도체', 'AI', '파운드리'] },
  { symbol: '042700', name: '한미반도체', sector: '반도체장비', per: 22.0, pbr: 5.5, roe: 28.0, dividend: 0.3, growth: 70.0, theme: ['반도체장비', 'HBM', 'AI'] },
  { symbol: '058470', name: '리노공업', sector: '반도체장비', per: 20.0, pbr: 5.0, roe: 25.0, dividend: 0.5, growth: 45.0, theme: ['반도체장비', '테스트'] },
  { symbol: '039030', name: '이오테크닉스', sector: '반도체장비', per: 25.0, pbr: 4.0, roe: 20.0, dividend: 0.2, growth: 50.0, theme: ['반도체장비', '레이저', 'HBM'] },
  { symbol: '403870', name: '피에스케이홀딩스', sector: '반도체장비', per: 15.0, pbr: 3.5, roe: 22.0, dividend: 0.3, growth: 55.0, theme: ['반도체장비', 'AI'] },
  { symbol: '091990', name: '셀트리온헬스케어', sector: '반도체장비', per: 18.0, pbr: 4.0, roe: 20.0, dividend: 0.2, growth: 40.0, theme: ['반도체장비'] },
  
  // ===== AI/로봇 (미래 성장동력) =====
  { symbol: '443060', name: '레인보우로보틱스', sector: 'AI/로봇', per: 100.0, pbr: 18.0, roe: 8.0, dividend: 0.0, growth: 120.0, theme: ['로봇', '휴머노이드', 'AI'] },
  { symbol: '454910', name: '두산로보틱스', sector: 'AI/로봇', per: 80.0, pbr: 12.0, roe: 5.0, dividend: 0.0, growth: 90.0, theme: ['로봇', '협동로봇', 'AI'] },
  { symbol: '272110', name: '케이씨텍', sector: 'AI/로봇', per: 20.0, pbr: 3.5, roe: 18.0, dividend: 0.5, growth: 40.0, theme: ['반도체장비', 'AI'] },
  
  // ===== 바이오/헬스케어 (고성장) =====
  { symbol: '207940', name: '삼성바이오로직스', sector: '바이오', per: 50.0, pbr: 5.5, roe: 12.0, dividend: 0.1, growth: 30.0, theme: ['바이오', 'CMO', 'ADC'] },
  { symbol: '068270', name: '셀트리온', sector: '바이오', per: 40.0, pbr: 4.5, roe: 14.0, dividend: 0.2, growth: 25.0, theme: ['바이오', '바이오시밀러'] },
  { symbol: '326030', name: 'SK바이오팜', sector: '바이오', per: 60.0, pbr: 7.0, roe: 15.0, dividend: 0.0, growth: 55.0, theme: ['바이오', '신약', 'CNS'] },
  { symbol: '145020', name: '휴젤', sector: '바이오', per: 30.0, pbr: 5.5, roe: 20.0, dividend: 0.3, growth: 35.0, theme: ['바이오', '보톡스', '미용'] },
  { symbol: '357780', name: '솔브레인', sector: '반도체소재', per: 12.0, pbr: 2.5, roe: 22.0, dividend: 1.5, growth: 25.0, theme: ['반도체소재', '전해질'] },
  
  // ===== 자동차/모빌리티 (가치+성장) =====
  { symbol: '005380', name: '현대차', sector: '자동차', per: 6.5, pbr: 0.8, roe: 14.0, dividend: 3.5, growth: 12.0, theme: ['자동차', '전기차', '수소차'] },
  { symbol: '000270', name: '기아', sector: '자동차', per: 6.0, pbr: 0.7, roe: 15.0, dividend: 4.0, growth: 14.0, theme: ['자동차', '전기차', 'EV9'] },
  { symbol: '012330', name: '현대모비스', sector: '자동차부품', per: 7.5, pbr: 0.6, roe: 10.0, dividend: 3.0, growth: 10.0, theme: ['자동차부품', '자율주행', 'SDV'] },
  { symbol: '204320', name: '만도', sector: '자동차부품', per: 10.0, pbr: 1.2, roe: 12.0, dividend: 1.5, growth: 20.0, theme: ['자동차부품', '자율주행', 'ADAS'] },
  
  // ===== IT/플랫폼 =====
  { symbol: '035420', name: 'NAVER', sector: 'IT서비스', per: 18.0, pbr: 1.4, roe: 12.0, dividend: 0.3, growth: 20.0, theme: ['플랫폼', 'AI', '클라우드'] },
  { symbol: '035720', name: '카카오', sector: 'IT서비스', per: 22.0, pbr: 1.6, roe: 10.0, dividend: 0.2, growth: 18.0, theme: ['플랫폼', 'AI', '콘텐츠'] },
  { symbol: '259960', name: '크래프톤', sector: '게임', per: 12.0, pbr: 2.0, roe: 20.0, dividend: 1.5, growth: 18.0, theme: ['게임', 'PUBG', 'AI'] },
  
  // ===== 2차전지 (선별) =====
  { symbol: '373220', name: 'LG에너지솔루션', sector: '2차전지', per: 35.0, pbr: 3.8, roe: 16.0, dividend: 0.3, growth: 40.0, theme: ['2차전지', '전기차', 'ESS'] },
  { symbol: '006400', name: '삼성SDI', sector: '2차전지', per: 25.0, pbr: 2.2, roe: 15.0, dividend: 0.5, growth: 35.0, theme: ['2차전지', '전기차', '전고체'] },
  { symbol: '003670', name: '포스코홀딩스', sector: '소재', per: 10.0, pbr: 0.8, roe: 10.0, dividend: 3.0, growth: 15.0, theme: ['철강', '2차전지소재', '리튬'] },
  
  // ===== 금융 (배당 - 축소) =====
  { symbol: '105560', name: 'KB금융', sector: '금융', per: 5.8, pbr: 0.55, roe: 11.0, dividend: 5.5, growth: 8.0, theme: ['금융', '배당', '밸류업'] },
  { symbol: '086790', name: '하나금융지주', sector: '금융', per: 5.0, pbr: 0.5, roe: 12.0, dividend: 6.0, growth: 10.0, theme: ['금융', '배당', '밸류업'] },
  
  // ===== 전력/인프라 (데이터센터 수혜) =====
  { symbol: '034730', name: 'SK', sector: '지주', per: 8.0, pbr: 0.6, roe: 10.0, dividend: 4.0, growth: 12.0, theme: ['지주', 'AI', '반도체'] },
  { symbol: '051900', name: 'LG생활건강', sector: '화장품', per: 18.0, pbr: 2.5, roe: 15.0, dividend: 1.5, growth: 12.0, theme: ['화장품', '중국', '리오프닝'] },
  
  // ===== 엔터/콘텐츠 =====
  { symbol: '352820', name: '하이브', sector: '엔터', per: 28.0, pbr: 4.5, roe: 18.0, dividend: 0.2, growth: 35.0, theme: ['엔터', 'K-POP', 'AI'] },
  { symbol: '041510', name: 'SM', sector: '엔터', per: 22.0, pbr: 3.5, roe: 15.0, dividend: 0.5, growth: 28.0, theme: ['엔터', 'K-POP'] },
];

// ===== 요일별 분석 테마 =====
type DayTheme = {
  name: string;
  emoji: string;
  claudePrompt: string;
  geminiPrompt: string;
  gptPrompt: string;
  filterFn: (stock: typeof ANALYSIS_STOCKS[0]) => boolean;
};

const DAY_THEMES: Record<number, DayTheme> = {
  0: { // 일요일 - 종합 (모든 요소 균형)
    name: '종합 밸런스',
    emoji: '⚖️',
    claudePrompt: '펀더멘털, 성장성, 안정성을 균형있게 평가하여',
    geminiPrompt: '성장 잠재력과 현재 밸류에이션의 균형을 고려하여',
    gptPrompt: '리스크와 수익의 균형을 맞춰',
    filterFn: () => true,
  },
  1: { // 월요일 - 성장주
    name: '성장주 포커스',
    emoji: '🚀',
    claudePrompt: '매출 성장률과 이익 성장 잠재력이 높은 성장주 관점에서',
    geminiPrompt: '혁신과 미래 성장 잠재력을 중심으로',
    gptPrompt: '장기적인 성장 스토리가 있는 종목 위주로',
    filterFn: (s) => s.growth >= 15,
  },
  2: { // 화요일 - 배당주
    name: '배당 투자',
    emoji: '💰',
    claudePrompt: '배당 수익률과 배당 안정성이 높은 종목 중심으로',
    geminiPrompt: '배당 성장과 지속가능성을 고려하여',
    gptPrompt: '안정적인 현금흐름과 배당 지급 능력을 기준으로',
    filterFn: (s) => s.dividend >= 2.0,
  },
  3: { // 수요일 - 가치주 (저PER/저PBR)
    name: '가치 투자',
    emoji: '💎',
    claudePrompt: 'PER, PBR이 낮고 내재가치 대비 저평가된 종목 위주로',
    geminiPrompt: '숨겨진 가치가 있고 재평가 가능성이 높은 종목 중심으로',
    gptPrompt: '안전마진이 충분한 저평가 우량주 관점에서',
    filterFn: (s) => s.per <= 15 || s.pbr <= 1.0,
  },
  4: { // 목요일 - 테마주/모멘텀 (방산, AI, 전력기기 강화)
    name: '테마 & 트렌드',
    emoji: '🔥',
    claudePrompt: '방산, AI, 로봇, 전력기기 등 강한 모멘텀이 있는 종목 중',
    geminiPrompt: '정책 수혜와 글로벌 트렌드에 부합하는 테마 종목 위주로',
    gptPrompt: '실적 개선과 주가 상승 모멘텀이 강한 종목 중심으로',
    filterFn: (s) => s.theme?.some(t => ['AI', '로봇', '방산', 'HBM', '전력기기', '변압기', '우주'].includes(t)) ?? false,
  },
  5: { // 금요일 - 대형 우량주
    name: '블루칩',
    emoji: '🏆',
    claudePrompt: '시가총액이 크고 실적이 안정적인 대형 우량주 중에서',
    geminiPrompt: '업종 대표주이면서 글로벌 경쟁력이 있는 종목 위주로',
    gptPrompt: '안정적인 수익성과 성장성을 갖춘 대형주 관점에서',
    filterFn: (s) => ['삼성전자', 'SK하이닉스', '현대차', '기아', 'NAVER', 'LG에너지솔루션', '삼성바이오로직스', '한화에어로스페이스'].includes(s.name),
  },
  6: { // 토요일 - 고성장주
    name: '하이 그로스',
    emoji: '🚀',
    claudePrompt: '성장률이 높고 업사이드 포텐셜이 큰 종목 중',
    geminiPrompt: '미래 성장 잠재력이 가장 높은 종목 위주로',
    gptPrompt: '혁신과 성장이 기대되는 고성장 종목 중심으로',
    filterFn: (s) => s.growth >= 30,
  },
};

// 오늘의 테마 가져오기
function getTodayTheme(date: Date): DayTheme {
  const dayOfWeek = date.getDay();
  return DAY_THEMES[dayOfWeek];
}

// 테마에 맞는 종목 필터링
function filterStocksByTheme(theme: DayTheme): typeof ANALYSIS_STOCKS {
  const filtered = ANALYSIS_STOCKS.filter(theme.filterFn);
  // 최소 15개 종목 보장
  if (filtered.length < 15) {
    return ANALYSIS_STOCKS;
  }
  return filtered;
}

// Claude 분석
async function analyzeWithClaude(stocks: typeof ANALYSIS_STOCKS, realPrices: Map<string, any>, theme: DayTheme): Promise<any[]> {
  const stockList = stocks.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, PER ${s.per}, PBR ${s.pbr}, ROE ${s.roe}%, 배당 ${s.dividend}%, 성장률 ${s.growth}%, 테마: ${s.theme?.join(', ') || s.sector}`;
  }).join('\n');

  const prompt = `당신은 펀더멘털 분석가입니다. 
  
오늘의 테마: ${theme.emoji} ${theme.name}

${theme.claudePrompt} 아래 종목들 중 Top 5를 선정하세요.
  
종목 목록:
${stockList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"종목명","score":4.5,"reason":"분석이유"}]}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content.find(b => b.type === 'text');
    const jsonMatch = (text as any)?.text?.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('Claude error:', error);
  }
  return [];
}

// Gemini 분석
async function analyzeWithGemini(stocks: typeof ANALYSIS_STOCKS, realPrices: Map<string, any>, theme: DayTheme): Promise<any[]> {
  const stockList = stocks.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, 성장률 ${s.growth}%, 섹터: ${s.sector}, 테마: ${s.theme?.join(', ') || '-'}`;
  }).join('\n');

  const prompt = `당신은 성장주 전문 투자자입니다.

오늘의 테마: ${theme.emoji} ${theme.name}

${theme.geminiPrompt} 아래 종목들 중 Top 5를 선정하세요.

종목 목록:
${stockList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"종목명","score":4.8,"reason":"분석이유"}]}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('Gemini error:', error);
  }
  return [];
}

// GPT 분석
async function analyzeWithGPT(stocks: typeof ANALYSIS_STOCKS, realPrices: Map<string, any>, theme: DayTheme): Promise<any[]> {
  const stockList = stocks.map(s => {
    const realPrice = realPrices.get(s.symbol);
    return `${s.name}(${s.symbol}): 현재가 ${realPrice?.price?.toLocaleString() || 'N/A'}원, 배당 ${s.dividend}%, PER ${s.per}, 섹터: ${s.sector}`;
  }).join('\n');

  const prompt = `당신은 안정성을 중시하는 투자 전문가입니다.

오늘의 테마: ${theme.emoji} ${theme.name}

${theme.gptPrompt} 아래 종목들 중 Top 5를 선정하세요.

종목 목록:
${stockList}

JSON 형식으로 응답:
{"top5":[{"rank":1,"symbol":"코드","name":"종목명","score":4.2,"reason":"분석이유"}]}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    });
    const text = response.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).top5;
  } catch (error) {
    console.error('GPT error:', error);
  }
  return [];
}

// 점수 합산 및 Top 5 선정
interface StockScore {
  symbol: string;
  name: string;
  claudeScore: number;
  geminiScore: number;
  gptScore: number;
  reasons: string[];
}

function aggregateTop5(claudeTop5: any[], geminiTop5: any[], gptTop5: any[], realPrices: Map<string, any>, theme: DayTheme): any[] {
  const scoreMap = new Map<string, StockScore>();

  // Claude 점수 집계
  claudeTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.claudeScore = item.score || (5 - idx * 0.5);
    existing.reasons.push(`클로드: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // Gemini 점수 집계
  geminiTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.geminiScore = item.score || (5 - idx * 0.5);
    if (item.name) existing.name = item.name;
    existing.reasons.push(`제미나인: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // GPT 점수 집계
  gptTop5.forEach((item, idx) => {
    const existing: StockScore = scoreMap.get(item.symbol) || { symbol: item.symbol, name: item.name, claudeScore: 0, geminiScore: 0, gptScore: 0, reasons: [] as string[] };
    existing.gptScore = item.score || (5 - idx * 0.5);
    if (item.name) existing.name = item.name;
    existing.reasons.push(`쥐피테일러: ${item.reason}`);
    scoreMap.set(item.symbol, existing);
  });

  // 총점 계산 및 정렬
  const aggregated = Array.from(scoreMap.values())
    .map(item => {
      const realPrice = realPrices.get(item.symbol);
      const stockInfo = ANALYSIS_STOCKS.find(s => s.symbol === item.symbol);
      const totalScore = item.claudeScore + item.geminiScore + item.gptScore;
      const avgScore = totalScore / 3;
      const votedBy = [
        item.claudeScore > 0 ? 'claude' : null,
        item.geminiScore > 0 ? 'gemini' : null,
        item.gptScore > 0 ? 'gpt' : null,
      ].filter(Boolean);

      return {
        symbol: item.symbol,
        name: item.name || stockInfo?.name || item.symbol,
        sector: stockInfo?.sector || '기타',
        totalScore,
        avgScore: Math.round(avgScore * 10) / 10,
        claudeScore: item.claudeScore,
        geminiScore: item.geminiScore,
        gptScore: item.gptScore,
        votedBy,
        isUnanimous: votedBy.length === 3,
        currentPrice: realPrice?.price || 0,
        change: realPrice?.change || 0,
        changePercent: realPrice?.changePercent || 0,
        reasons: item.reasons,
        theme: theme.name,
        themeEmoji: theme.emoji,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return aggregated;
}

export async function GET(request: NextRequest) {
  // CRON 인증 검증 (보안 강화)
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) {
    logCronExecution('daily-verdict', 'manual', false, { error: authResult.error });
    return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });
  }

  // URL 파라미터에서 date 확인 (과거 날짜 생성용)
  const { searchParams } = new URL(request.url);
  const customDate = searchParams.get('date');
  
  let today: string;
  let dateForTheme: Date;
  
  if (customDate && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
    // 커스텀 날짜 사용
    today = customDate;
    dateForTheme = new Date(customDate + 'T00:00:00+09:00');
  } else {
    // 한국 시간 기준 오늘 날짜
    const now = new Date();
    const kstOffset = 9 * 60; // UTC+9
    const kstTime = new Date(now.getTime() + (kstOffset + now.getTimezoneOffset()) * 60 * 1000);
    today = kstTime.toISOString().split('T')[0];
    dateForTheme = kstTime;
  }
  
  // 해당 날짜의 테마 결정
  const todayTheme = getTodayTheme(dateForTheme);
  console.log(`[${today}] Starting daily verdict generation...`);
  console.log(`[${today}] Today's theme: ${todayTheme.emoji} ${todayTheme.name}`);

  // force 파라미터 확인 (기존 데이터 삭제 후 재생성)
  const force = searchParams.get('force') === 'true';

  try {
    // 1. 오늘 이미 생성된 verdict가 있는지 확인
    const { data: existingVerdict } = await supabase
      .from('verdicts')
      .select('*')
      .eq('date', today)
      .single();

    if (existingVerdict && !force) {
      console.log(`[${today}] Verdict already exists for today`);
      return NextResponse.json({ 
        success: true, 
        message: 'Verdict already exists for today',
        verdict: existingVerdict 
      });
    }

    // force가 true면 기존 데이터 삭제
    if (existingVerdict && force) {
      console.log(`[${today}] Force regeneration - deleting existing verdict...`);
      await supabase.from('verdicts').delete().eq('date', today);
      await supabase.from('predictions').delete().eq('date', today);
    }

    // 2. 테마에 맞는 종목 필터링
    const targetStocks = filterStocksByTheme(todayTheme);
    console.log(`[${today}] Analyzing ${targetStocks.length} stocks for theme: ${todayTheme.name}`);

    // 3. 실시간 가격 조회
    const symbols = targetStocks.map(s => s.symbol);
    let realPrices: Map<string, any> = new Map();
    
    try {
      realPrices = await fetchMultipleStockPrices(symbols);
      console.log(`[${today}] Fetched real-time prices for ${realPrices.size} stocks`);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }

    // 4. 각 AI 분석 수행 (병렬) - 테마 정보 전달
    console.log(`[${today}] Running AI analysis with theme: ${todayTheme.name}...`);
    const [claudeTop5, geminiTop5, gptTop5] = await Promise.all([
      analyzeWithClaude(targetStocks, realPrices, todayTheme),
      analyzeWithGemini(targetStocks, realPrices, todayTheme),
      analyzeWithGPT(targetStocks, realPrices, todayTheme),
    ]);

    console.log(`[${today}] Claude: ${claudeTop5.length}, Gemini: ${geminiTop5.length}, GPT: ${gptTop5.length}`);

    // 5. 점수 합산 및 Top 5 선정
    const top5 = aggregateTop5(claudeTop5, geminiTop5, gptTop5, realPrices, todayTheme);

    if (top5.length === 0) {
      throw new Error('Failed to generate Top 5');
    }

    // 6. Verdict 저장 (각 AI별 개별 Top 5 포함)
    const consensusSummary = `${todayTheme.emoji} 오늘의 테마: ${todayTheme.name} | ${top5.filter(t => t.isUnanimous).length}개 종목 만장일치. 1위 ${top5[0]?.name}(${top5[0]?.symbol}) 평균 ${top5[0]?.avgScore}점`;

    // 각 AI의 개별 Top 5 정리
    const claudeTop5WithInfo = claudeTop5.map((item, idx) => ({
      rank: idx + 1,
      symbol: item.symbol,
      name: ANALYSIS_STOCKS.find(s => s.symbol === item.symbol)?.name || item.name,
      score: item.score || (5 - idx * 0.5),
      reason: item.reason || '',
    }));

    const geminiTop5WithInfo = geminiTop5.map((item, idx) => ({
      rank: idx + 1,
      symbol: item.symbol,
      name: ANALYSIS_STOCKS.find(s => s.symbol === item.symbol)?.name || item.name,
      score: item.score || (5 - idx * 0.5),
      reason: item.reason || '',
    }));

    const gptTop5WithInfo = gptTop5.map((item, idx) => ({
      rank: idx + 1,
      symbol: item.symbol,
      name: ANALYSIS_STOCKS.find(s => s.symbol === item.symbol)?.name || item.name,
      score: item.score || (5 - idx * 0.5),
      reason: item.reason || '',
    }));

    // 먼저 기본 컬럼만으로 INSERT 시도
    const insertData: any = {
      date: today,
      top5: top5,
      consensus_summary: consensusSummary,
    };
    
    // 새 컬럼이 있으면 추가 (없어도 에러 안남)
    try {
      insertData.claude_top5 = claudeTop5WithInfo;
      insertData.gemini_top5 = geminiTop5WithInfo;
      insertData.gpt_top5 = gptTop5WithInfo;
    } catch (e) {
      console.log('New columns not available, skipping...');
    }

    const { data: verdict, error } = await supabase
      .from('verdicts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase INSERT error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        insertData: { date: insertData.date, top5Count: insertData.top5?.length },
      }, { status: 500 });
    }
    
    if (!verdict) {
      return NextResponse.json({
        success: false,
        error: 'No verdict returned after insert',
        insertData: { date: insertData.date },
      }, { status: 500 });
    }

    console.log(`[${today}] Verdict saved successfully!`);
    console.log('Top 5:', top5.map(t => `${t.rank}. ${t.name}`).join(', '));

    // 7. Predictions 저장
    for (const stock of top5) {
      await supabase.from('predictions').insert({
        verdict_id: verdict.id,
        symbol_code: stock.symbol,
        symbol_name: stock.name,
        predicted_direction: stock.avgScore >= 4 ? 'up' : stock.avgScore >= 3 ? 'hold' : 'down',
        avg_score: stock.avgScore,
        date: today,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily verdict generated and saved',
      date: today,
      theme: {
        name: todayTheme.name,
        emoji: todayTheme.emoji,
      },
      verdict: {
        id: verdict.id,
        top5: top5.map(t => ({
          rank: t.rank,
          symbol: t.symbol,
          name: t.name,
          avgScore: t.avgScore,
          isUnanimous: t.isUnanimous,
        })),
        consensusSummary,
      },
    });

  } catch (error: any) {
    console.error(`[${today}] Error:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate verdict' },
      { status: 500 }
    );
  }
}
