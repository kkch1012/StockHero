import { NextRequest, NextResponse } from 'next/server';
import { createDebateSession, getSymbolByCode } from '@/lib/supabase';

// Fallback symbol lookup
const MOCK_SYMBOLS: Record<string, { name: string; sector: string }> = {
  '005930': { name: '삼성전자', sector: '반도체' },
  '000660': { name: 'SK하이닉스', sector: '반도체' },
  '373220': { name: 'LG에너지솔루션', sector: '2차전지' },
  '207940': { name: '삼성바이오로직스', sector: '바이오' },
  '005380': { name: '현대차', sector: '자동차' },
  '006400': { name: '삼성SDI', sector: '2차전지' },
  '035720': { name: '카카오', sector: 'IT서비스' },
  '035420': { name: 'NAVER', sector: 'IT서비스' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Try to get symbol from Supabase first
    let symbolInfo: { name: string; sector: string | null } | null = null;
    
    try {
      const dbSymbol = await getSymbolByCode(symbol);
      if (dbSymbol) {
        symbolInfo = { name: dbSymbol.name, sector: dbSymbol.sector };
      }
    } catch (e) {
      console.log('Supabase lookup failed, using fallback:', e);
    }
    
    // Fallback to mock data
    if (!symbolInfo) {
      symbolInfo = MOCK_SYMBOLS[symbol];
    }

    if (!symbolInfo) {
      return NextResponse.json(
        { success: false, error: 'Unknown symbol' },
        { status: 404 }
      );
    }

    // Try to create session in Supabase
    let sessionId: string;
    try {
      const session = await createDebateSession(symbol, symbolInfo.name);
      sessionId = session.id;
    } catch (e) {
      console.log('Supabase session creation failed, using local ID:', e);
      const today = new Date().toISOString().split('T')[0];
      sessionId = `session-${symbol}-${today}-${Date.now()}`;
    }

    const response = {
      id: sessionId,
      sessionId: sessionId,
      symbol,
      symbolName: symbolInfo.name,
      sector: symbolInfo.sector,
      date: new Date().toISOString().split('T')[0],
      status: 'running',
      round: 0,
      messages: [
        {
          id: `${sessionId}-system-0`,
          role: 'SYSTEM',
          content: `${symbolInfo.name}(${symbol})에 대한 토론을 시작합니다.`,
          sources: [],
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Failed to start debate session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start debate session' },
      { status: 500 }
    );
  }
}
