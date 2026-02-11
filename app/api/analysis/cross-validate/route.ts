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
import { SUBSCRIPTION_ENABLED } from '@/lib/subscription/config';
import type { SubscriptionTier } from '@/types/subscription';

export const maxDuration = 30; // Vercel function timeout

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 파라미터
    const body = await request.json();
    const { symbol, symbolName, currentPrice, sector } = body;

    if (!symbol || !symbolName) {
      return NextResponse.json(
        { success: false, error: 'symbol and symbolName are required' },
        { status: 400 }
      );
    }

    let userId = 'anonymous';
    let tier: SubscriptionTier = 'free';

    if (SUBSCRIPTION_ENABLED) {
      // 구독 모드: 인증 + 구독 + 사용량 체크
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      userId = user.id;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      tier = (subscription?.tier as SubscriptionTier) || 'free';

      // 사용량 제한 체크
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
    } else {
      // FREE_MODE: 인증 없이 분석 가능, 로그인된 유저가 있으면 ID 사용
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) userId = user.id;
      } catch {
        // 인증 실패해도 무시 - anonymous로 진행
      }
    }

    console.log(`[Cross-Validate API] User: ${userId}, Tier: ${tier}, Symbol: ${symbol}`);

    // 티어별 분석 실행
    const price = currentPrice || 70000; // fallback
    const result = await performTierBasedAnalysis(tier, symbol, symbolName, price, {
      userId,
      sector,
    });

    // 사용량 증가 (구독 모드에서만)
    if (SUBSCRIPTION_ENABLED && userId !== 'anonymous') {
      const featureKey = tier === 'free' ? 'analysis_free' : 'cross_validation';
      await incrementUsage(userId, featureKey, result.apiCost);
    }

    // 응답
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        remaining: SUBSCRIPTION_ENABLED ? undefined : 9999,
        limit: SUBSCRIPTION_ENABLED ? undefined : 9999,
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
    // FREE_MODE: 무제한 사용량 반환
    if (!SUBSCRIPTION_ENABLED) {
      return NextResponse.json({
        success: true,
        data: {
          tier: 'free',
          featureKey: 'analysis_free',
          allowed: true,
          limit: 9999,
          used: 0,
          remaining: 9999,
        },
      });
    }

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
