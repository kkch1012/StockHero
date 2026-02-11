'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/components';
import { TierBasedResult } from '@/components/analysis/TierBasedResult';
import { AnalysisLoading } from '@/components/analysis/AnalysisLoading';
import { UsageIndicator } from '@/components/analysis/UsageIndicator';
import { useCurrentPlan, useSubscription } from '@/lib/subscription/hooks';
import { TIER_NAMES } from '@/types/subscription';
import type { SubscriptionTier } from '@/types/subscription';

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
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analysis/cross-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          symbolName,
          currentPrice: 0, // API will use fallback or fetch
          sector,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
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
  }, [symbol, symbolName, sector]);

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

        {/* Error state */}
        {error && (
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
            currentPrice={analysisResult.result?.analysis?.targetPrice || analysisResult.result?.priceAgreement?.consensus || 0}
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
