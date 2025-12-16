import { NextRequest, NextResponse } from 'next/server';

// Mock Korean stocks for generating verdicts
const MOCK_STOCKS = [
  { code: '005930', name: '삼성전자', sector: '반도체' },
  { code: '000660', name: 'SK하이닉스', sector: '반도체' },
  { code: '373220', name: 'LG에너지솔루션', sector: '2차전지' },
  { code: '207940', name: '삼성바이오로직스', sector: '바이오' },
  { code: '005380', name: '현대차', sector: '자동차' },
  { code: '006400', name: '삼성SDI', sector: '2차전지' },
  { code: '035720', name: '카카오', sector: 'IT서비스' },
  { code: '035420', name: 'NAVER', sector: 'IT서비스' },
  { code: '051910', name: 'LG화학', sector: '화학' },
  { code: '000270', name: '기아', sector: '자동차' },
  { code: '105560', name: 'KB금융', sector: '금융' },
  { code: '055550', name: '신한지주', sector: '금융' },
  { code: '096770', name: 'SK이노베이션', sector: '에너지' },
  { code: '034730', name: 'SK', sector: '지주' },
  { code: '003550', name: 'LG', sector: '지주' },
  { code: '066570', name: 'LG전자', sector: '가전' },
  { code: '028260', name: '삼성물산', sector: '건설' },
  { code: '012330', name: '현대모비스', sector: '자동차부품' },
  { code: '068270', name: '셀트리온', sector: '바이오' },
  { code: '003670', name: '포스코홀딩스', sector: '철강' },
];

// Seeded random function for consistent dummy data
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDummyVerdict(dateStr: string) {
  const dateSeed = dateStr.split('-').map(Number).reduce((a, b) => a * 100 + b, 0);
  
  // Shuffle stocks based on date seed
  const shuffled = [...MOCK_STOCKS].sort((a, b) => {
    const seedA = dateSeed + a.code.charCodeAt(0);
    const seedB = dateSeed + b.code.charCodeAt(0);
    return seededRandom(seedA) - seededRandom(seedB);
  });

  const top5 = shuffled.slice(0, 5).map((stock, i) => {
    const baseSeed = dateSeed + i + stock.code.charCodeAt(0);
    
    // Generate individual AI scores with some variation
    const claudeScore = Number((3.0 + seededRandom(baseSeed + 1) * 2.0).toFixed(1));
    const geminiScore = Number((3.0 + seededRandom(baseSeed + 2) * 2.0).toFixed(1));
    const gptScore = Number((3.0 + seededRandom(baseSeed + 3) * 2.0).toFixed(1));
    const avgScore = Number(((claudeScore + geminiScore + gptScore) / 3).toFixed(1));
    
    // Generate target price based on a base price
    const basePrice = 50000 + (parseInt(stock.code) % 1000) * 100;
    const targetPrice = Math.round(basePrice * (1 + 0.1 + seededRandom(baseSeed + 4) * 0.2) / 100) * 100;
    
    // Target date (1-6 months from the date)
    const dateObj = new Date(dateStr);
    const monthsAhead = 1 + Math.floor(seededRandom(baseSeed + 5) * 5);
    dateObj.setMonth(dateObj.getMonth() + monthsAhead);
    const targetDate = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월`;

    return {
      rank: i + 1,
      symbolCode: stock.code,
      symbolName: stock.name,
      sector: stock.sector,
      avgScore,
      claudeScore,
      geminiScore,
      gptScore,
      targetPrice,
      targetDate,
    };
  });

  return {
    date: dateStr,
    top5,
    isGenerated: false, // Historical dummy data
  };
}

// In-memory cache for generated verdicts (in production, use DB)
const verdictCache: Record<string, {
  date: string;
  top5: Array<{
    rank: number;
    symbolCode: string;
    symbolName: string;
    sector: string;
    avgScore: number;
    claudeScore?: number;
    geminiScore?: number;
    gptScore?: number;
    targetPrice?: number;
    targetDate?: string;
  }>;
  isGenerated: boolean;
}> = {};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Generate verdicts for each day of the month
    const verdicts = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(dateStr);

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }

      // Skip future dates
      if (date > today) {
        continue;
      }

      // Check cache first
      if (verdictCache[dateStr]) {
        verdicts.push(verdictCache[dateStr]);
        continue;
      }

      // For today, don't auto-generate - let user trigger it
      if (dateStr === todayStr) {
        continue;
      }

      // For past dates, generate dummy data
      const verdict = generateDummyVerdict(dateStr);
      verdicts.push(verdict);
    }

    return NextResponse.json({
      success: true,
      data: verdicts,
    });
  } catch (error) {
    console.error('Calendar verdicts error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar verdicts' },
      { status: 500 }
    );
  }
}
