'use client';

import { CHARACTERS, getCharacterColors } from '@/lib/characters';
import type { CharacterType } from '@/lib/llm/types';
import type { IndependentAnalysis } from '@/lib/llm/cross-validation';

interface PriceAgreementBarProps {
  analyses: IndependentAnalysis[];
  consensusPrice: number;
  currentPrice: number;
}

export function PriceAgreementBar({ analyses, consensusPrice, currentPrice }: PriceAgreementBarProps) {
  const prices = analyses.map((a) => a.targetPrice);
  const minPrice = Math.min(...prices, currentPrice);
  const maxPrice = Math.max(...prices, currentPrice);
  const range = maxPrice - minPrice;

  if (range === 0) {
    return (
      <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-700">
        <div className="text-sm text-dark-400 text-center">모든 AI가 동일한 목표가를 제시했습니다</div>
        <div className="text-xl font-bold text-center text-dark-100 mt-1">{consensusPrice.toLocaleString()}원</div>
      </div>
    );
  }

  const getPosition = (price: number) => ((price - minPrice) / range) * 100;

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-dark-800/50 border border-dark-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-dark-200">목표가 범위</h4>
        <div className="text-xs text-dark-400">
          스프레드: {((maxPrice - minPrice) / consensusPrice * 100).toFixed(1)}%
        </div>
      </div>

      {/* Price bar */}
      <div className="relative h-8 mb-6">
        {/* Track */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-1.5 bg-dark-700 rounded-full" />
        </div>

        {/* Current price marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${getPosition(currentPrice)}%` }}
        >
          <div className="w-3 h-3 rounded-full bg-dark-400 border-2 border-dark-300" />
        </div>

        {/* AI markers */}
        {analyses.map((analysis) => {
          const colors = getCharacterColors(analysis.ai);
          const char = CHARACTERS[analysis.ai];
          const pos = getPosition(analysis.targetPrice);

          return (
            <div
              key={analysis.ai}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${pos}%` }}
            >
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${colors.gradient} border-2 border-dark-800 shadow-lg cursor-pointer transition-transform hover:scale-125`} />

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-dark-800 border border-dark-600 rounded-lg px-2 py-1 text-xs whitespace-nowrap shadow-xl">
                  <span className={colors.text}>{char.nameKo}</span>
                  <span className="text-dark-300 ml-1">{analysis.targetPrice.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Consensus marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${getPosition(consensusPrice)}%` }}
        >
          <div className="w-2 h-6 bg-brand-500 rounded-sm opacity-60" />
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs text-dark-400">
        <span>{minPrice.toLocaleString()}원</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-dark-400" />
            <span>현재가 {currentPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-1 bg-brand-500 rounded-sm opacity-60" />
            <span>합의가 {consensusPrice.toLocaleString()}</span>
          </div>
        </div>
        <span>{maxPrice.toLocaleString()}원</span>
      </div>

      {/* AI price list */}
      <div className="mt-3 pt-3 border-t border-dark-700/50 flex flex-wrap gap-3">
        {analyses.map((analysis) => {
          const colors = getCharacterColors(analysis.ai);
          const char = CHARACTERS[analysis.ai];
          const diff = ((analysis.targetPrice - currentPrice) / currentPrice * 100);

          return (
            <div key={analysis.ai} className="flex items-center gap-1.5 text-xs">
              <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${colors.gradient}`} />
              <span className={colors.text}>{char.nameKo}</span>
              <span className="text-dark-300 font-medium">{analysis.targetPrice.toLocaleString()}</span>
              <span className={diff >= 0 ? 'text-red-400' : 'text-blue-400'}>
                ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
