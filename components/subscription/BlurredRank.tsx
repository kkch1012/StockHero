'use client';

import { ReactNode, useState } from 'react';
import { useSubscription, useCurrentPlan } from '@/lib/subscription';

interface StockItem {
  rank: number;
  symbol: string;
  name: string;
  score?: number;
  change?: number;
  price?: number;
  isUnanimous?: boolean;
}

interface BlurredRankProps {
  stocks: StockItem[];
  blurRanks?: number[];  // 블러 처리할 순위 (기본: 1, 2위)
  renderStock: (stock: StockItem, isBlurred: boolean) => ReactNode;
  className?: string;
}

// 블러된 더미 데이터 생성
function generateBlurredName(): string {
  const patterns = ['████████', '███████', '██████████', '████████'];
  return patterns[Math.floor(Math.random() * patterns.length)];
}

export function BlurredRank({
  stocks,
  blurRanks = [1, 2],
  renderStock,
  className = '',
}: BlurredRankProps) {
  const { openUpgradeModal } = useSubscription();
  const { planName, isLoading } = useCurrentPlan();
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  // 무료 플랜은 1, 2위 블러
  const shouldBlur = planName === 'free';

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-dark-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {stocks.map((stock) => {
        const isBlurred = shouldBlur && blurRanks.includes(stock.rank);
        
        if (isBlurred) {
          return (
            <div
              key={stock.rank}
              className="relative group"
              onMouseEnter={() => setHoveredRank(stock.rank)}
              onMouseLeave={() => setHoveredRank(null)}
            >
              {/* 블러된 콘텐츠 */}
              <div 
                className="relative overflow-hidden rounded-xl cursor-pointer"
                onClick={() => openUpgradeModal('full_top5')}
              >
                {/* 블러 처리된 실제 콘텐츠 */}
                <div className="blur-[8px] select-none pointer-events-none opacity-60">
                  {renderStock({
                    ...stock,
                    name: generateBlurredName(),
                    symbol: '??????',
                  }, true)}
                </div>

                {/* 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 via-dark-900/60 to-dark-900/80
                                flex items-center justify-center gap-3">
                  {/* 순위 뱃지 */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                    ${stock.rank === 1 
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-900' 
                      : 'bg-gradient-to-br from-slate-300 to-slate-500 text-slate-800'}
                    shadow-lg
                  `}>
                    {stock.rank}
                  </div>

                  {/* 잠금 표시 */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="text-dark-100 font-medium text-sm">
                        {stock.rank === 1 ? '오늘의 1위 종목' : '오늘의 2위 종목'}
                      </p>
                      <p className="text-dark-400 text-xs">
                        {generateBlurredName()}
                      </p>
                    </div>
                  </div>

                  {/* 티저 (FOMO) */}
                  {stock.change && stock.change > 0 && (
                    <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                      <span className="text-emerald-400 text-sm font-medium">
                        +{stock.change.toFixed(1)}% 🚀
                      </span>
                    </div>
                  )}
                </div>

                {/* 호버 툴팁 */}
                {hoveredRank === stock.rank && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                                  px-4 py-2 bg-dark-800 rounded-lg shadow-xl border border-dark-700
                                  whitespace-nowrap animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-400">💎</span>
                      <span className="text-dark-200 text-sm">
                        <span className="text-brand-400 font-semibold">베이직</span>에서 확인하세요
                      </span>
                    </div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 
                                    border-8 border-transparent border-b-dark-800" />
                  </div>
                )}
              </div>

              {/* 반짝이는 효과 */}
              <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                                -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </div>
          );
        }

        return (
          <div key={stock.rank}>
            {renderStock(stock, false)}
          </div>
        );
      })}

      {/* 전체 보기 CTA */}
      {shouldBlur && (
        <button
          onClick={() => openUpgradeModal('full_top5')}
          className="w-full py-4 bg-gradient-to-r from-dark-800/80 to-dark-800/60 
                     border border-dashed border-dark-600 rounded-xl
                     hover:border-brand-500/50 hover:from-dark-800 hover:to-dark-700
                     transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl group-hover:scale-110 transition-transform">🏆</span>
            <div className="text-left">
              <p className="text-dark-200 font-medium">
                전체 Top 5 보기
              </p>
              <p className="text-dark-500 text-xs">
                베이직 플랜부터 • 월 9,900원
              </p>
            </div>
            <span className="text-brand-400 text-xl ml-2">→</span>
          </div>
        </button>
      )}
    </div>
  );
}

// 심플한 버전 - 단일 순위 항목 블러
interface BlurredRankItemProps {
  rank: number;
  children: ReactNode;
  teaser?: string;
  className?: string;
}

export function BlurredRankItem({
  rank,
  children,
  teaser,
  className = '',
}: BlurredRankItemProps) {
  const { openUpgradeModal } = useSubscription();
  const { planName } = useCurrentPlan();
  const [isHovered, setIsHovered] = useState(false);

  const shouldBlur = planName === 'free' && rank <= 2;

  if (!shouldBlur) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative group cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => openUpgradeModal('full_top5')}
    >
      <div className="blur-[8px] select-none pointer-events-none">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center 
                      bg-dark-900/70 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <span className="text-dark-300 text-sm">
            {teaser || `${rank}위 종목 보기`}
          </span>
        </div>
      </div>

      {isHovered && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-50
                        px-3 py-1.5 bg-brand-500 text-white text-xs rounded-lg
                        whitespace-nowrap shadow-lg">
          클릭하여 업그레이드
        </div>
      )}
    </div>
  );
}

export default BlurredRank;
