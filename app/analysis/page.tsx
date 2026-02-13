'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components';
import { StockSearchModal } from '@/components/StockSearchModal';
import { useCurrentPlan } from '@/lib/subscription/hooks';
import { Search, TrendingUp, Zap, Shield, BarChart3 } from 'lucide-react';
import { CHARACTERS, getCharacterColors } from '@/lib/characters';
import { TIER_NAMES } from '@/types/subscription';

const POPULAR_STOCKS = [
  { symbol: '005930', name: '삼성전자', sector: '반도체' },
  { symbol: '000660', name: 'SK하이닉스', sector: '반도체' },
  { symbol: '373220', name: 'LG에너지솔루션', sector: '배터리' },
  { symbol: '035420', name: 'NAVER', sector: '플랫폼' },
  { symbol: '035720', name: '카카오', sector: '플랫폼' },
  { symbol: '006400', name: '삼성SDI', sector: '배터리' },
  { symbol: '051910', name: 'LG화학', sector: '화학' },
  { symbol: '000270', name: '기아', sector: '자동차' },
  { symbol: '005380', name: '현대차', sector: '자동차' },
  { symbol: '068270', name: '셀트리온', sector: '바이오' },
  { symbol: '207940', name: '삼성바이오로직스', sector: '바이오' },
  { symbol: '005490', name: 'POSCO홀딩스', sector: '철강' },
];

interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
}

export default function AnalysisPage() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { planName } = useCurrentPlan();
  const [prices, setPrices] = useState<Record<string, StockPrice>>({});

  // 인기 종목 실시간 가격 배치 조회
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const symbols = POPULAR_STOCKS.map((s) => s.symbol);
        const res = await fetch('/api/stocks/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            const parsed: Record<string, StockPrice> = {};
            for (const [sym, info] of Object.entries(data.data)) {
              const d = info as any;
              if (d.price > 0) {
                parsed[sym] = {
                  price: d.price,
                  change: d.change || 0,
                  changePercent: d.changePercent || 0,
                };
              }
            }
            setPrices(parsed);
          }
        }
      } catch {
        // 실패 시 가격 없이 표시
      }
    };
    fetchPrices();
  }, []);

  const handleStockSelect = (stock: { symbol: string; name: string; sector: string }) => {
    setIsSearchOpen(false);
    router.push(`/analysis/${stock.symbol}?name=${encodeURIComponent(stock.name)}&sector=${encodeURIComponent(stock.sector)}`);
  };

  return (
    <>
      <Header />
      <main className="container-app pt-20 sm:pt-24 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dark-50 mb-3">
            AI 종목 분석
          </h1>
          <p className="text-dark-400 text-sm sm:text-base max-w-lg mx-auto">
            3개 AI가 독립적으로 분석한 후 교차검증합니다.
            더 이상 혼자 판단하지 마세요.
          </p>

          {/* AI Avatars */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {(['gemini', 'claude', 'gpt'] as const).map((ai) => {
              const char = CHARACTERS[ai];
              const colors = getCharacterColors(ai);
              return (
                <div key={ai} className="flex flex-col items-center gap-1.5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold">{char.name[0]}</span>
                  </div>
                  <span className={`text-2xs ${colors.text}`}>{char.nameKo}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search Button */}
        <div className="max-w-xl mx-auto mb-8 sm:mb-12">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 sm:py-4 rounded-2xl bg-dark-800/80 border border-dark-700 hover:border-brand-500/40 hover:bg-dark-800 transition-all group"
          >
            <Search className="w-5 h-5 text-dark-400 group-hover:text-brand-400 transition-colors" />
            <span className="text-dark-400 group-hover:text-dark-300 text-sm sm:text-base transition-colors">
              종목명 또는 코드로 검색...
            </span>
            <kbd className="hidden sm:inline-flex ml-auto px-2 py-0.5 rounded bg-dark-700 text-dark-500 text-xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12 max-w-3xl mx-auto">
          {[
            { icon: Zap, title: '독립 분석', desc: '3개 AI가 서로 참조 없이 각자 분석', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: BarChart3, title: '교차검증', desc: '방향·목표가·근거를 비교·대조', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: Shield, title: '합의 등급', desc: 'STRONG / MODERATE / CONFLICT', color: 'text-brand-400', bg: 'bg-brand-500/10' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-dark-800/50 border border-dark-700 text-center">
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h3 className="text-sm font-medium text-dark-100 mb-1">{item.title}</h3>
              <p className="text-xs text-dark-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Popular Stocks Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-dark-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              인기 종목
            </h2>
            <span className="text-xs text-dark-500">
              {TIER_NAMES[planName as keyof typeof TIER_NAMES] || 'Free'} 플랜
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {POPULAR_STOCKS.map((stock) => {
              const p = prices[stock.symbol];
              return (
                <button
                  key={stock.symbol}
                  onClick={() => handleStockSelect(stock)}
                  className="p-3 sm:p-4 rounded-xl bg-dark-800/50 border border-dark-700 hover:border-brand-500/30 hover:bg-dark-800/80 transition-all text-left group"
                >
                  <div className="text-sm sm:text-base font-medium text-dark-100 group-hover:text-white transition-colors truncate">
                    {stock.name}
                  </div>
                  {p ? (
                    <div className="mt-1">
                      <span className="text-sm font-medium text-dark-200">
                        {p.price.toLocaleString()}원
                      </span>
                      <span
                        className={`ml-1.5 text-xs font-medium ${
                          p.changePercent > 0
                            ? 'text-red-400'
                            : p.changePercent < 0
                              ? 'text-blue-400'
                              : 'text-dark-400'
                        }`}
                      >
                        {p.changePercent > 0 ? '+' : ''}
                        {p.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-dark-500">{stock.symbol}</span>
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">
                        {stock.sector}
                      </span>
                    </div>
                  )}
                  {p && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-dark-500">{stock.symbol}</span>
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-400">
                        {stock.sector}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Stock Search Modal */}
      <StockSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelect={handleStockSelect}
      />
    </>
  );
}
