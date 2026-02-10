import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronExecution } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * VIP 주간 추천 종목 생성 크론
 * 매주 월요일 08:00 KST (일요일 23:00 UTC)
 *
 * /api/vip/exclusive-stocks의 POST를 내부 호출하여
 * AI 분석 기반 VIP 전용 종목을 생성합니다.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // CRON 인증 체크
  const auth = verifyCronAuth(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // VIP exclusive-stocks API의 POST 호출 (내부)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || '';

    const response = await fetch(`${siteUrl}/api/vip/exclusive-stocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    const duration = Date.now() - startTime;

    logCronExecution('vip-stocks', auth.source as 'vercel' | 'manual', true, {
      duration,
      stockCount: data.stocks?.length || 0,
      weekStart: data.weekStart,
    });

    return NextResponse.json({
      success: true,
      message: 'VIP stocks generated successfully',
      weekStart: data.weekStart,
      stockCount: data.stocks?.length || 0,
      duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logCronExecution('vip-stocks', auth.source as 'vercel' | 'manual', false, {
      duration,
      error: errorMessage,
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
