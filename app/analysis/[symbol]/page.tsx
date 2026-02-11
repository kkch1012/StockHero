'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components';
import { TierBasedResult } from '@/components/analysis/TierBasedResult';
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading';
import { useCurrentPlan } from '@/lib/subscription/hooks';
import { TIER_NAMES } from '@/types/subscription';
import type { SubscriptionTier } from '@/types/subscription';

const SUBSCRIPTION_ENABLED = process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED === 'true';

// 티어별 AI 개수 (서버 모듈 import 없이 클라이언트에서 사용)
const TIER_AI_COUNT: Record<SubscriptionTier, 1 | 2 | 3> = {
  free: 1,
  lite: 2,
  basic: 3,
  pro: 3,
};

interface TierAnalysisResult {
  tier: SubscriptionTier;
  analysisType: 'single' | 'comparison' | 'cross_validation' | 'debate';
  result: any;
  usedAIs: string[];
  apiCost: number;
  timestamp: string;
  remaining?: number;
  limit?: number;
}
import { ArrowLeft, RefreshCw, AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function SymbolAnalysisPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const symbol = params.symbol as string;
  const symbolName = searchParams.get('name') || symbol;
  const sector = searchParams.get('sector') || '';

  const { planName } = useCurrentPlan();
  const tier = (planName as SubscriptionTier) || 'free';
  const aiCount = TIER_AI_COUNT[tier] || 1;

  const [analysisResult, setAnalysisResult] = useState<TierAnalysisResult | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<{ used: number; limit: number } | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  // 현재가 조회
  const fetchCurrentPrice = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch(`/api/stocks/price?symbol=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.price > 0) {
          setCurrentPrice(data.data.price);
          return data.data.price;
        }
      }
    } catch {
      // 실패 시 fallback에 의존
    }
    return 0;
  }, [symbol]);

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNeedsLogin(false);
    setAnalysisResult(null);

    try {
      // 분석 전 현재가 조회
      const price = await fetchCurrentPrice();

      const response = await fetch('/api/analysis/cross-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          symbolName,
          currentPrice: price,
          sector,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setNeedsLogin(true);
          setError('로그인이 필요합니다.');
        } else if (response.status === 429) {
          setError(data.message || '일일 분석 한도를 초과했습니다. 내일 다시 시도해주세요.');
        } else {
          setError(data.message || '분석 중 오류가 발생했습니다.');
        }
        return;
      }

      if (data.success && data.data) {
        setAnalysisResult(data.data);
        if (data.data.remaining !== undefined && data.data.limit !== undefined) {
          setRemainingQuota({
            used: data.data.limit - data.data.remaining,
            limit: data.data.limit,
          });
        }
      } else {
        setError('분석 결과를 가져오지 못했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, symbolName, sector, fetchCurrentPrice]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  return (
    <>
      <Header />
      <main className="container-app pt-20 sm:pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/analysis"
              className="p-2 rounded-lg hover:bg-dark-800 transition-colors text-dark-400 hover:text-dark-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-dark-50">
                {symbolName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-dark-500">{symbol}</span>
                {currentPrice > 0 && (
                  <span className="text-xs font-medium text-dark-200">
                    ₩{currentPrice.toLocaleString()}
                  </span>
                )}
                {sector && (
                  <span className="text-2xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">
                    {sector}
                  </span>
                )}
                <span className="text-2xs px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400">
                  {TIER_NAMES[tier]} · {aiCount} AI
                </span>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          {!isLoading && analysisResult && (
            <button
              onClick={runAnalysis}
              className="p-2 rounded-lg hover:bg-dark-800 transition-colors text-dark-400 hover:text-dark-200"
              title="재분석"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loading state */}
        {isLoading && <AnalysisLoading aiCount={aiCount} />}

        {/* Login required (구독 모드에서 미로그인) */}
        {needsLogin && (
          <div className="p-6 rounded-xl bg-dark-800/50 border border-dark-700 text-center">
            <LogIn className="w-8 h-8 text-brand-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium mb-1">로그인이 필요합니다</p>
            <p className="text-dark-400 text-sm mb-4">
              AI 분석을 이용하려면 먼저 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 text-white font-medium text-sm hover:bg-brand-600 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              로그인하기
            </Link>
          </div>
        )}

        {/* Error state (로그인 필요가 아닌 일반 에러) */}
        {error && !needsLogin && (
          <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-dark-200 font-medium mb-1">분석 실패</p>
            <p className="text-dark-400 text-sm mb-4">{error}</p>
            <button
              onClick={runAnalysis}
              className="px-4 py-2 rounded-lg bg-dark-800 border border-dark-700 text-dark-300 hover:text-dark-100 text-sm transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Result */}
        {!isLoading && !error && analysisResult && (
          <TierBasedResult
            analysisResult={analysisResult}
            currentPrice={currentPrice || analysisResult.result?.analysis?.targetPrice || analysisResult.result?.priceAgreement?.consensus || 0}
            symbolName={symbolName}
            remainingQuota={remainingQuota || undefined}
          />
        )}

        {/* Timestamp */}
        {analysisResult && (
          <div className="mt-6 text-center">
            <p className="text-2xs text-dark-600">
              분석 시간: {new Date(analysisResult.timestamp).toLocaleString('ko-KR')}
              {' · '}API 비용: ₩{analysisResult.apiCost}
            </p>
            <p className="text-2xs text-dark-600 mt-1">
              본 분석은 AI가 생성한 정보이며, 투자 권유가 아닙니다.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
