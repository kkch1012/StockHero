'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DisclaimerBar, Header } from '@/components';

// 테마 타입
interface Theme {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  trend: 'rising' | 'stable' | 'hot';
  stockCount: {
    kr: number;
    us: number;
  };
}

// AI 히어로 타입
interface HeroInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

// 주식 추천 타입
interface StockPick {
  rank: number;
  symbol: string;
  name: string;
  score: number;
  targetReturn: number;
  reason: string;
  catalysts: string[];
  risks: string[];
  currentPrice: number;
  changePercent: number;
  market: 'KR' | 'US';
}

// 분석 결과 타입
interface ThemeAnalysis {
  theme: Theme;
  hero: HeroInfo;
  analysis: {
    themeAnalysis: string;
    outlook: string;
    krPicks: StockPick[];
    usPicks: StockPick[];
  };
  date: string;
  time: string;
}

// AI 히어로 목록
const HEROES = [
  { id: 'claude', name: 'Claude Lee', icon: '🎯', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  { id: 'gemini', name: 'Gemi Nine', icon: '✨', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { id: 'gpt', name: 'G.P. Taylor', icon: '📊', color: 'text-green-400', bgColor: 'bg-green-500/10' },
];

// 트렌드 배지
const TrendBadge = ({ trend }: { trend: string }) => {
  const config = {
    hot: { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔥 HOT' },
    rising: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '📈 상승세' },
    stable: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '➡️ 안정' },
  }[trend] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: trend };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedHero, setSelectedHero] = useState<string>('claude');
  const [analysis, setAnalysis] = useState<ThemeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // 테마 목록 로드
  useEffect(() => {
    fetch('/api/themes')
      .then(res => res.json())
      .then(data => {
        setThemes(data.themes || []);
        setIsLoadingThemes(false);
      })
      .catch(err => {
        console.error('Failed to load themes:', err);
        setIsLoadingThemes(false);
      });
  }, []);

  // 테마 분석 요청
  const analyzeTheme = useCallback(async (themeId: string, heroId: string) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch(`/api/themes/${themeId}/analyze?hero=${heroId}`);
      const data = await response.json();

      if (response.ok) {
        setAnalysis(data);
        // 분석 결과로 스크롤
        setTimeout(() => {
          analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        console.error('Analysis error:', data.error);
      }
    } catch (error) {
      console.error('Failed to analyze theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 테마 선택 시 분석 시작
  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    analyzeTheme(themeId, selectedHero);
  };

  // 히어로 변경 시 재분석
  const handleHeroChange = (heroId: string) => {
    setSelectedHero(heroId);
    if (selectedTheme) {
      analyzeTheme(selectedTheme, heroId);
    }
  };

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-28 pb-16">
        {/* Page Header */}
        <div className="bg-gradient-to-b from-dark-900/50 to-transparent border-b border-dark-800/50">
          <div className="container-app py-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-dark-100 mb-3">
                🔥 핫 테마 AI 분석
              </h1>
              <p className="text-dark-400 max-w-2xl mx-auto">
                요즘 핫한 투자 테마를 선택하면 AI가 국내/해외 유망 종목을 분석해드립니다
              </p>
            </div>
          </div>
        </div>

        <div className="container-app py-8">
          {/* 테마 그리드 */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-dark-100 mb-6 flex items-center gap-2">
              <span>🎯</span>
              <span>테마 선택</span>
            </h2>

            {isLoadingThemes ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-dark-700 mb-4" />
                    <div className="h-4 bg-dark-700 rounded mb-2" />
                    <div className="h-3 bg-dark-700 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`card p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-brand-500 ${
                      selectedTheme === theme.id ? 'border-brand-500 ring-2 ring-brand-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-4xl">{theme.icon}</span>
                      <TrendBadge trend={theme.trend} />
                    </div>
                    <h3 className={`text-lg font-bold ${theme.color} mb-1`}>{theme.name}</h3>
                    <p className="text-xs text-dark-500 mb-3">{theme.nameEn}</p>
                    <p className="text-sm text-dark-400 mb-4 line-clamp-2">{theme.description}</p>
                    <div className="flex items-center gap-3 text-xs text-dark-500">
                      <span className="flex items-center gap-1">
                        🇰🇷 {theme.stockCount.kr}개
                      </span>
                      <span className="flex items-center gap-1">
                        🇺🇸 {theme.stockCount.us}개
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* AI 히어로 선택 */}
          {selectedTheme && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-dark-100 mb-4 flex items-center gap-2">
                <span>🤖</span>
                <span>AI 애널리스트 선택</span>
              </h2>
              <div className="flex flex-wrap gap-3">
                {HEROES.map(hero => (
                  <button
                    key={hero.id}
                    onClick={() => handleHeroChange(hero.id)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedHero === hero.id
                        ? `${hero.bgColor} border-current ${hero.color}`
                        : 'border-dark-700 text-dark-400 hover:border-dark-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-xl">{hero.icon}</span>
                    <span className="font-medium">{hero.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 분석 결과 */}
          <div ref={analysisRef}>
            {isLoading && (
              <div className="card p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent mb-4" />
                <h3 className="text-lg font-bold text-dark-100 mb-2">
                  AI가 분석 중입니다...
                </h3>
                <p className="text-dark-400">
                  {themes.find(t => t.id === selectedTheme)?.name} 테마의 유망 종목을 찾고 있습니다
                </p>
              </div>
            )}

            {analysis && !isLoading && (
              <div className="space-y-8">
                {/* 테마 분석 요약 */}
                <div className={`card p-6 ${analysis.theme.bgColor} border-l-4 border-current ${analysis.theme.color}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{analysis.theme.icon}</span>
                    <div>
                      <h3 className={`text-xl font-bold ${analysis.theme.color}`}>
                        {analysis.theme.name}
                      </h3>
                      <p className="text-sm text-dark-400">{analysis.theme.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-dark-300 mb-2">
                      {analysis.hero.icon} {analysis.hero.name}의 테마 분석
                    </h4>
                    <p className="text-dark-200 leading-relaxed">
                      {analysis.analysis.themeAnalysis}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-dark-500">전망:</span>
                    <span className={`text-sm font-medium ${
                      (analysis.analysis.outlook || '').includes('bullish') ? 'text-green-400' :
                      (analysis.analysis.outlook || '').includes('bearish') ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {analysis.analysis.outlook || '분석 중'}
                    </span>
                  </div>
                </div>

                {/* 한국 주식 추천 */}
                {analysis.analysis.krPicks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
                      <span>🇰🇷</span>
                      <span>한국 주식 Top {analysis.analysis.krPicks.length}</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {analysis.analysis.krPicks.map((stock, index) => (
                        <StockCard
                          key={stock.symbol}
                          stock={stock}
                          index={index}
                          heroColor={analysis.hero.color}
                          expanded={expandedStock === stock.symbol}
                          onToggle={() => setExpandedStock(
                            expandedStock === stock.symbol ? null : stock.symbol
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 미국 주식 추천 */}
                {analysis.analysis.usPicks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-dark-100 mb-4 flex items-center gap-2">
                      <span>🇺🇸</span>
                      <span>미국 주식 Top {analysis.analysis.usPicks.length}</span>
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                      {analysis.analysis.usPicks.map((stock, index) => (
                        <StockCard
                          key={stock.symbol}
                          stock={stock}
                          index={index}
                          heroColor={analysis.hero.color}
                          expanded={expandedStock === stock.symbol}
                          onToggle={() => setExpandedStock(
                            expandedStock === stock.symbol ? null : stock.symbol
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 분석 정보 */}
                <div className="text-center text-sm text-dark-500">
                  <p>
                    분석 시간: {analysis.date} {analysis.time} KST | 
                    분석가: {analysis.hero.icon} {analysis.hero.name}
                  </p>
                  <p className="mt-1 text-xs">
                    ⚠️ 본 분석은 AI가 생성한 엔터테인먼트 콘텐츠이며, 투자 권유가 아닙니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <DisclaimerBar variant="bottom" compact />
    </>
  );
}

// 주식 카드 컴포넌트
function StockCard({
  stock,
  index,
  heroColor,
  expanded,
  onToggle,
}: {
  stock: StockPick;
  index: number;
  heroColor: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const rankEmojis = ['🥇', '🥈', '🥉'];

  const formatPrice = (price: number, market: 'KR' | 'US') => {
    if (market === 'KR') {
      return price.toLocaleString() + '원';
    }
    return '$' + price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div 
      className="card overflow-hidden transition-all duration-300 hover:border-dark-600 cursor-pointer"
      onClick={onToggle}
    >
      <div className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{rankEmojis[index] || `#${index + 1}`}</span>
            <div>
              <h4 className="font-bold text-dark-100">{stock.name}</h4>
              <p className="text-xs text-dark-500">{stock.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${heroColor}`}>
              {stock.score.toFixed(1)}점
            </div>
            <div className={`text-xs ${stock.targetReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              목표 {stock.targetReturn >= 0 ? '+' : ''}{stock.targetReturn}%
            </div>
          </div>
        </div>

        {/* 가격 정보 */}
        <div className="flex items-center justify-between mb-3 p-2 bg-dark-800/50 rounded-lg">
          <div>
            <p className="text-xs text-dark-500">현재가</p>
            <p className="font-semibold text-dark-200">
              {formatPrice(stock.currentPrice, stock.market)}
            </p>
          </div>
          <div className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
          </div>
        </div>

        {/* 간단 요약 */}
        <p className="text-sm text-dark-400 line-clamp-2">{stock.reason}</p>
      </div>

      {/* 상세 정보 (확장시) */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-dark-700">
          <div className="mb-3">
            <h5 className="text-xs font-semibold text-dark-500 mb-2">📈 상승 촉매</h5>
            <div className="flex flex-wrap gap-1">
              {stock.catalysts.map((catalyst, i) => (
                <span key={i} className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded">
                  {catalyst}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-dark-500 mb-2">⚠️ 리스크</h5>
            <div className="flex flex-wrap gap-1">
              {stock.risks.map((risk, i) => (
                <span key={i} className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
