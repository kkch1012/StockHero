'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components';

interface BacktestResult {
  symbol: string;
  name: string;
  firstRecommendDate: string;
  firstRecommendPrice: number;
  currentPrice: number;
  returnPercent: number;
  maxReturnPercent: number;
  targetHitRate: number;
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

export default function BacktestPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [startDate, setStartDate] = useState('2025-09-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchBacktest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backtest?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      
      if (data.success) {
        setSummary(data.summary);
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to fetch backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacktest();
  }, []);

  const formatPrice = (price: number) => price.toLocaleString('ko-KR');
  
  const getReturnColor = (returnPct: number) => {
    if (returnPct > 10) return 'text-red-400';
    if (returnPct > 0) return 'text-red-300';
    if (returnPct < -10) return 'text-blue-400';
    if (returnPct < 0) return 'text-blue-300';
    return 'text-dark-400';
  };

  const getReturnBg = (returnPct: number) => {
    if (returnPct > 20) return 'bg-red-500/20';
    if (returnPct > 10) return 'bg-red-500/10';
    if (returnPct < -20) return 'bg-blue-500/20';
    if (returnPct < -10) return 'bg-blue-500/10';
    return '';
  };

  const getReturnSign = (returnPct: number) => returnPct > 0 ? '+' : '';

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-dark-950 pt-24 pb-12">
        {/* Background */}
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-green-600/10 rounded-full blur-[100px]" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px]" />

        <div className="relative container-app">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              <span className="text-dark-100">AI 추천</span>{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">백테스트</span>
            </h1>
            <p className="text-dark-400">
              과거 AI 추천대로 투자했다면 어떤 수익이 났을까요?
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-dark-400">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-dark-400">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-100"
                  />
                </div>
                <button
                  onClick={fetchBacktest}
                  disabled={loading}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? '분석 중...' : '백테스트 실행'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-dark-400">백테스트 분석 중...</p>
                <p className="text-xs text-dark-600 mt-1">현재가 조회에 시간이 소요됩니다</p>
              </div>
            </div>
          ) : summary ? (
            <>
              {/* Summary Cards */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* 분석 기간 */}
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-brand-400">{summary.totalDays}일</p>
                    <p className="text-xs text-dark-500 mt-1">분석 기간</p>
                  </div>
                  
                  {/* 추천 종목 수 */}
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-purple-400">{summary.totalStocks}개</p>
                    <p className="text-xs text-dark-500 mt-1">추천 종목</p>
                  </div>
                  
                  {/* 평균 수익률 */}
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-bold ${getReturnColor(summary.avgReturn)}`}>
                      {getReturnSign(summary.avgReturn)}{summary.avgReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-1">평균 수익률</p>
                  </div>
                  
                  {/* 승률 */}
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-4 text-center">
                    <p className={`text-3xl font-bold ${summary.winRate >= 50 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {summary.winRate}%
                    </p>
                    <p className="text-xs text-dark-500 mt-1">승률</p>
                  </div>
                </div>
              </div>

              {/* Strategy Comparison */}
              <div className="max-w-4xl mx-auto mb-8">
                <h2 className="text-lg font-bold text-dark-100 mb-4">📊 전략별 수익률 비교</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* 전체 종목 */}
                  <div className="bg-dark-900/80 border border-dark-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">📈</span>
                      <h3 className="font-medium text-dark-200">전체 추천 종목</h3>
                    </div>
                    <p className={`text-3xl font-bold ${getReturnColor(summary.strategies.allStocks.avgReturn)}`}>
                      {getReturnSign(summary.strategies.allStocks.avgReturn)}
                      {summary.strategies.allStocks.avgReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-2">
                      {summary.strategies.allStocks.stockCount}개 종목 평균
                    </p>
                  </div>

                  {/* 만장일치 */}
                  <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🏆</span>
                      <h3 className="font-medium text-amber-200">만장일치 종목만</h3>
                    </div>
                    <p className={`text-3xl font-bold ${getReturnColor(summary.strategies.unanimousOnly.avgReturn)}`}>
                      {getReturnSign(summary.strategies.unanimousOnly.avgReturn)}
                      {summary.strategies.unanimousOnly.avgReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-2">
                      {summary.strategies.unanimousOnly.stockCount}개 종목 평균
                    </p>
                  </div>

                  {/* Top 1만 */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🥇</span>
                      <h3 className="font-medium text-emerald-200">1위 종목만</h3>
                    </div>
                    <p className={`text-3xl font-bold ${getReturnColor(summary.strategies.top1Only.avgReturn)}`}>
                      {getReturnSign(summary.strategies.top1Only.avgReturn)}
                      {summary.strategies.top1Only.avgReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-2">
                      {summary.strategies.top1Only.stockCount}개 종목 평균
                    </p>
                  </div>
                </div>
              </div>

              {/* Best & Worst */}
              {(summary.bestReturn || summary.worstReturn) && (
                <div className="max-w-4xl mx-auto mb-8">
                  <div className="grid md:grid-cols-2 gap-4">
                    {summary.bestReturn && (
                      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-xl p-5">
                        <p className="text-sm text-dark-400 mb-2">🚀 최고 수익률</p>
                        <p className="text-xl font-bold text-dark-100">{summary.bestReturn.name}</p>
                        <p className={`text-3xl font-bold ${getReturnColor(summary.bestReturn.returnPercent)}`}>
                          +{summary.bestReturn.returnPercent.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {summary.worstReturn && (
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-5">
                        <p className="text-sm text-dark-400 mb-2">📉 최저 수익률</p>
                        <p className="text-xl font-bold text-dark-100">{summary.worstReturn.name}</p>
                        <p className={`text-3xl font-bold ${getReturnColor(summary.worstReturn.returnPercent)}`}>
                          {summary.worstReturn.returnPercent.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Table */}
              <div className="max-w-4xl mx-auto">
                <h2 className="text-lg font-bold text-dark-100 mb-4">📋 종목별 수익률</h2>
                <div className="bg-dark-900/80 border border-dark-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-800">
                          <th className="px-4 py-3 text-left text-xs font-medium text-dark-500 uppercase">종목</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-dark-500 uppercase">첫 추천일</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-dark-500 uppercase">추천가</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-dark-500 uppercase">현재가</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-dark-500 uppercase">최고 수익률</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-dark-500 uppercase">추천횟수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-800">
                        {results.map((result, idx) => (
                          <tr key={result.symbol} className={`${getReturnBg(result.maxReturnPercent)} hover:bg-dark-800/50 transition-colors`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-dark-500">{idx + 1}</span>
                                <div>
                                  <p className="font-medium text-dark-100">{result.name}</p>
                                  <p className="text-xs text-dark-500">{result.symbol}</p>
                                </div>
                                {result.unanimousCount > 0 && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">
                                    🏆 {result.unanimousCount}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-dark-400">
                              {result.firstRecommendDate}
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-dark-400">
                              {formatPrice(result.firstRecommendPrice)}원
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-dark-200">
                              {formatPrice(result.currentPrice)}원
                            </td>
                            <td className={`px-4 py-3 text-right text-sm font-bold ${getReturnColor(result.maxReturnPercent)}`}>
                              {getReturnSign(result.maxReturnPercent)}{result.maxReturnPercent.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-dark-400">
                              {result.totalRecommendations}회
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="max-w-4xl mx-auto mt-8">
                <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
                  <p className="text-xs text-dark-500 leading-relaxed">
                    ⚠️ <strong>투자 유의사항:</strong> 이 백테스트 결과는 과거 데이터를 기반으로 한 시뮬레이션이며, 
                    미래 수익을 보장하지 않습니다. 실제 투자 시에는 매매 수수료, 세금, 슬리피지 등이 발생하여 
                    결과가 달라질 수 있습니다. 투자 결정은 본인의 판단과 책임 하에 신중하게 하시기 바랍니다.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">📊</p>
              <p className="text-dark-400">해당 기간에 추천 데이터가 없습니다</p>
              <p className="text-sm text-dark-600 mt-2">다른 기간을 선택해주세요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
