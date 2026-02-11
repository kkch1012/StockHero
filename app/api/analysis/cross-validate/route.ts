/**
 * 🔍 교차검증 API 엔드포인트
 *
 * POST /api/analysis/cross-validate
 *
 * 구독 등급에 따라 다른 분석 제공:
 * - Free: 1개 AI (Gemini)
 * - Lite: 2개 AI 비교 (Gemini + Claude)
 * - Basic/Pro: 3개 AI 교차검증
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { performTierBasedAnalysis } from '@/lib/llm/tier-based-analysis';
import { checkUsageLimit, incrementUsage } from '@/lib/subscription/usage-limiter';
import type { SubscriptionTier } from '@/types/subscription';

export const maxDuration = 30; // Vercel function timeout

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 요청 파라미터
    const body = await request.json();
    const { symbol, symbolName, currentPrice, sector } = body;

    if (!symbol || !symbolName) {
      return NextResponse.json(
        { success: false, error: 'symbol and symbolName are required' },
        { status: 400 }
      );
    }

    // 3. 구독 티어 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const tier = (subscription?.tier as SubscriptionTier) || 'free';

    console.log(`[Cross-Validate API] User ${user.id}, Tier: ${tier}, Symbol: ${symbol}`);

    // 4. 사용량 제한 체크
    const featureKey = tier === 'free' ? 'analysis_free' : 'cross_validation';
    const usageCheck = await checkUsageLimit(user.id, tier, featureKey);

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usage limit exceeded',
          message: usageCheck.message,
          remaining: usageCheck.remaining,
          resetTime: usageCheck.resetTime,
        },
        { status: 429 }
      );
    }

    // 5. 티어별 분석 실행
    const price = currentPrice || 70000; // fallback
    const result = await performTierBasedAnalysis(tier, symbol, symbolName, price, {
      userId: user.id,
      sector,
    });

    // 6. 사용량 증가
    await incrementUsage(user.id, featureKey, result.apiCost);

    // 7. 응답
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        remaining: usageCheck.remaining - 1,
        limit: usageCheck.limit,
      },
    });
  } catch (error) {
    console.error('[Cross-Validate API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: 사용량 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 구독 티어 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const tier = (subscription?.tier as SubscriptionTier) || 'free';

    // 사용량 조회
    const featureKey = tier === 'free' ? 'analysis_free' : 'cross_validation';
    const usageCheck = await checkUsageLimit(user.id, tier, featureKey);

    return NextResponse.json({
      success: true,
      data: {
        tier,
        featureKey,
        ...usageCheck,
      },
    });
  } catch (error) {
    console.error('[Cross-Validate API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
