import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth, logCronExecution } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * VIP 실시간 매매 시그널 생성 크론
 * 장중 매시간 실행: 09:00~15:00 KST (00:00~06:00 UTC), 월~금
 *
 * /api/vip/signals의 POST를 내부 호출하여
 * 기술적 지표 기반 매매 시그널을 생성합니다.
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
    // VIP signals API의 POST 호출 (내부)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronSecret = process.env.CRON_SECRET || '';

    const response = await fetch(`${siteUrl}/api/vip/signals`, {
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

    logCronExecution('vip-signals', auth.source as 'vercel' | 'manual', true, {
      duration,
      generatedCount: data.generated || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'VIP signals generated successfully',
      generated: data.generated || 0,
      signals: data.signals || [],
      duration,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logCronExecution('vip-signals', auth.source as 'vercel' | 'manual', false, {
      duration,
      error: errorMessage,
    });

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
