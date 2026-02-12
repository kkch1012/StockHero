'use client';

import { Header } from '@/components';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCurrentPlan } from '@/lib/subscription/hooks';
import {
  BarChart3Icon,
  TrendingUpIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  StarIcon,
  RefreshCwIcon,
  LockIcon,
} from 'lucide-react';

interface BacktestResult {
  symbol: string;
  name: string;
  firstRecommendDate: string;
  firstRecommendPrice: number;
  currentPrice: number;
  returnPercent: number;
  totalRecommendations: number;
  avgRank: number;
  unanimousCount: number;
}

interface BacktestSummary {
  period: { start: string; end: string };
  totalDays: number;
  totalStocks: number;
  avgReturn: number;
  positiveCount: number;
  negativeCount: number;
  winRate: number;
  bestReturn: { symbol: string; name: string; returnPercent: number } | null;
  worstReturn: { symbol: string; name: string; returnPercent: number } | null;
  strategies: {
    allStocks: { avgReturn: number; stockCount: number };
    unanimousOnly: { avgReturn: number; stockCount: number };
    top1Only: { avgReturn: number; stockCount: number };
  };
}

// 티어별 백테스트 일수
const BACKTEST_DAYS: Record<string, number> = {
  free: 0,
  lite: 0,
  basic: 30,
  pro: 90,
};

export default function BacktestPage() {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { planName, isPremium } = useCurrentPlan();
  const backtestDays = BACKTEST_DAYS[planName] || 0;
  const canAccess = backtestDays > 0;

  useEffect(() => {
    if (canAccess) {
      fetchBacktest();
    } else {
      setLoading(false);
    }
  }, [canAccess]);

  const fetchBacktest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/backtest');
      const data = await res.json();

      if (data.success) {
        setResults(data.results || []);
        setSummary(data.summary || null);
      } else {
        setError(data.error || '백테스트 데이터를 불러오는데 실패했습니다.');
      }
    } catch {
      setError('백테스트 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-dark-950 pt-24 pb-12">
        {/* Background */}
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px]" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />

        <div className="relative container-app">
          {/* Hero Section */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl mb-6">
              <BarChart3Icon className="w-8 h-8 text-amber-400" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="text-dark-100">AI 추천</span>{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">백테스트</span>
            </h1>

            <p className="text-dark-400 text-base max-w-xl mx-auto mb-2">
              AI가 추천한 종목을 추천 당시 가격에 매수했다면 지금 얼마나 벌었을까요?
            </p>

            {/* 티어별 안내 */}
            {canAccess ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-sm">
                <BarChart3Icon className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-medium">
                  {planName === 'pro' ? '90일' : '30일'} 백테스트
                </span>
                {planName === 'basic' && (
                  <span className="text-dark-500">· Pro 업그레이드 시 90일</span>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-dark-800 border border-dark-700 text-sm">
                <LockIcon className="w-4 h-4 text-dark-400" />
                <span className="text-dark-400">Basic 이상 구독 시 이용 가능</span>
              </div>
            )}
          </div>

          {/* 접근 가능: 실제 데이터 표시 */}
          {canAccess ? (
            <>
              {/* Summary Stats */}
              {summary && (
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="bg-dark-900/80 border border-dark-800 rounded-2xl p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                        <p className="text-3xl font-bold text-red-400">{formatPercent(summary.avgReturn)}</p>
                        <p className="text-xs text-dark-500 mt-1">평균 수익률</p>
                      </div>
                      <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                        <p className="text-3xl font-bold text-emerald-400">{summary.winRate}%</p>
                        <p className="text-xs text-dark-500 mt-1">승률</p>
                      </div>
                      <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                        <p className="text-3xl font-bold text-purple-400">{summary.totalStocks}개</p>
                        <p className="text-xs text-dark-500 mt-1">분석 종목</p>
                      </div>
                      <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                        <p className="text-3xl font-bold text-amber-400">{formatPercent(summary.strategies.unanimousOnly.avgReturn)}</p>
                        <p className="text-xs text-dark-500 mt-1">만장일치 평균</p>
                      </div>
                    </div>

                    {/* Strategy Comparison */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-dark-800/30 rounded-lg">
                        <p className="text-lg font-bold text-dark-200">{formatPercent(summary.strategies.allStocks.avgReturn)}</p>
                        <p className="text-xs text-dark-500">전체 종목 ({summary.strategies.allStocks.stockCount}개)</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-lg font-bold text-amber-400">{formatPercent(summary.strategies.unanimousOnly.avgReturn)}</p>
                        <p className="text-xs text-amber-400/70">만장일치 ({summary.strategies.unanimousOnly.stockCount}개)</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-lg font-bold text-purple-400">{formatPercent(summary.strategies.top1Only.avgReturn)}</p>
                        <p className="text-xs text-purple-400/70">Top 1 ({summary.strategies.top1Only.stockCount}개)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              <div className="max-w-5xl mx-auto mb-12">
                <div className="bg-dark-900/80 border border-dark-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-dark-800">
                    <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
                      <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                      높은 수익률 종목
                    </h2>
                    <button
                      onClick={fetchBacktest}
                      disabled={loading}
                      className="p-2 text-dark-400 hover:text-dark-200 hover:bg-dark-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loading ? (
                    <div className="p-12 text-center">
                      <RefreshCwIcon className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-4" />
                      <p className="text-dark-400">백테스트 데이터 로딩 중...</p>
                    </div>
                  ) : error ? (
                    <div className="p-12 text-center">
                      <p className="text-red-400 mb-4">{error}</p>
                      <button
                        onClick={fetchBacktest}
                        className="px-4 py-2 bg-dark-800 text-dark-200 rounded-lg hover:bg-dark-700 transition-colors"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-dark-800/50 text-dark-400 text-sm">
                            <th className="py-3 px-4 text-left font-medium">종목</th>
                            <th className="py-3 px-4 text-center font-medium">추천일</th>
                            <th className="py-3 px-4 text-right font-medium">추천가</th>
                            <th className="py-3 px-4 text-right font-medium">현재가</th>
                            <th className="py-3 px-4 text-right font-medium">수익률</th>
                            <th className="py-3 px-4 text-center font-medium">만장일치</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result, index) => (
                            <tr
                              key={result.symbol}
                              className={`border-t border-dark-800/50 hover:bg-dark-800/30 transition-colors ${
                                index < 3 ? 'bg-emerald-500/5' : ''
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {index < 3 && (
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                      index === 0 ? 'bg-amber-500 text-dark-950' :
                                      index === 1 ? 'bg-gray-400 text-dark-950' :
                                      'bg-amber-700 text-dark-100'
                                    }`}>
                                      {index + 1}
                                    </span>
                                  )}
                                  <div>
                                    <p className="font-medium text-dark-100">{result.name}</p>
                                    <p className="text-xs text-dark-500">{result.symbol}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center text-dark-300 text-sm">
                                {formatDate(result.firstRecommendDate)}
                              </td>
                              <td className="py-3 px-4 text-right text-dark-300 text-sm">
                                {formatPrice(result.firstRecommendPrice)}
                              </td>
                              <td className="py-3 px-4 text-right text-dark-100 font-medium text-sm">
                                {formatPrice(result.currentPrice)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`inline-flex items-center gap-1 font-bold ${
                                  result.returnPercent >= 0 ? 'text-red-400' : 'text-blue-400'
                                }`}>
                                  {result.returnPercent >= 0 ? (
                                    <ArrowUpIcon className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownIcon className="w-3 h-3" />
                                  )}
                                  {formatPercent(result.returnPercent)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {result.unanimousCount > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                                    <StarIcon className="w-3 h-3 fill-current" />
                                    {result.unanimousCount}회
                                  </span>
                                ) : (
                                  <span className="text-dark-500 text-sm">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* 접근 불가: 블러 처리된 미리보기 + 업그레이드 안내 */
            <div className="max-w-5xl mx-auto mb-12">
              {/* 기능 설명 */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-dark-900/80 border border-dark-800 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-dark-100 mb-4">백테스트란?</h2>
                  <p className="text-dark-400 leading-relaxed mb-4">
                    AI가 추천한 종목을 실제로 추천 당시 가격에 매수했다면 지금까지 얼마의 수익을 냈을지 검증하는 기능입니다.
                    만장일치 종목, Top 1 종목 등 다양한 전략의 실제 성과를 확인할 수 있습니다.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-dark-800/50 rounded-xl text-center">
                      <p className="text-2xl mb-1">📊</p>
                      <p className="text-sm font-medium text-dark-200">수익률 분석</p>
                      <p className="text-xs text-dark-500 mt-1">종목별 실제 수익률 추적</p>
                    </div>
                    <div className="p-3 bg-dark-800/50 rounded-xl text-center">
                      <p className="text-2xl mb-1">🏆</p>
                      <p className="text-sm font-medium text-dark-200">전략 비교</p>
                      <p className="text-xs text-dark-500 mt-1">만장일치 vs Top 1 vs 전체</p>
                    </div>
                    <div className="p-3 bg-dark-800/50 rounded-xl text-center">
                      <p className="text-2xl mb-1">📈</p>
                      <p className="text-sm font-medium text-dark-200">승률 통계</p>
                      <p className="text-xs text-dark-500 mt-1">AI 추천의 적중률 검증</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 블러 처리된 미리보기 */}
              <div className="relative">
                <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
                  <div className="max-w-4xl mx-auto mb-8">
                    <div className="bg-dark-900/80 border border-dark-800 rounded-2xl p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                          <p className="text-3xl font-bold text-red-400">+12.5%</p>
                          <p className="text-xs text-dark-500 mt-1">평균 수익률</p>
                        </div>
                        <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                          <p className="text-3xl font-bold text-emerald-400">68%</p>
                          <p className="text-xs text-dark-500 mt-1">승률</p>
                        </div>
                        <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                          <p className="text-3xl font-bold text-purple-400">24개</p>
                          <p className="text-xs text-dark-500 mt-1">분석 종목</p>
                        </div>
                        <div className="text-center p-4 bg-dark-800/50 rounded-xl">
                          <p className="text-3xl font-bold text-amber-400">+18.3%</p>
                          <p className="text-xs text-dark-500 mt-1">만장일치 평균</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-900/80 border border-dark-800 rounded-2xl overflow-hidden max-w-5xl mx-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-dark-800/50 text-dark-400 text-sm">
                          <th className="py-3 px-4 text-left font-medium">종목</th>
                          <th className="py-3 px-4 text-center font-medium">추천일</th>
                          <th className="py-3 px-4 text-right font-medium">추천가</th>
                          <th className="py-3 px-4 text-right font-medium">현재가</th>
                          <th className="py-3 px-4 text-right font-medium">수익률</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1,2,3,4,5].map((i) => (
                          <tr key={i} className="border-t border-dark-800/50">
                            <td className="py-3 px-4 text-dark-300">██████</td>
                            <td className="py-3 px-4 text-center text-dark-400">2026-0█-██</td>
                            <td className="py-3 px-4 text-right text-dark-400">██,███원</td>
                            <td className="py-3 px-4 text-right text-dark-300">██,███원</td>
                            <td className="py-3 px-4 text-right text-emerald-400">+██.█%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 업그레이드 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-dark-900/95 border border-blue-500/30 rounded-2xl p-8 text-center max-w-md mx-4 shadow-2xl">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/20 rounded-xl mb-4">
                      <LockIcon className="w-7 h-7 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-dark-100 mb-2">Basic 이상 구독이 필요합니다</h2>
                    <p className="text-dark-400 text-sm mb-6">
                      AI 추천 종목의 실제 수익률과 전략별 성과를 확인하세요
                    </p>

                    <div className="space-y-2 mb-6 text-left">
                      <div className="flex items-center gap-3 text-dark-300">
                        <CheckIcon className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-sm"><strong className="text-blue-400">Basic</strong> — 30일 백테스트 + 3 AI 교차검증</span>
                      </div>
                      <div className="flex items-center gap-3 text-dark-300">
                        <CheckIcon className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-sm"><strong className="text-purple-400">Pro</strong> — 90일 백테스트 + 커스텀 심층 분석</span>
                      </div>
                    </div>

                    <Link
                      href="/subscription"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                      구독 플랜 보기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs text-dark-600">
              * 백테스트 결과는 과거 데이터 기반이며, 미래 수익을 보장하지 않습니다.<br />
              * 추천가는 해당 종목이 처음 추천된 날의 종가 기준입니다.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
