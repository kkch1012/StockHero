'use client';

import { CHARACTERS, getCharacterColors } from '@/lib/characters';
import type { CharacterType } from '@/lib/llm/types';
import type { Direction } from '@/lib/llm/cross-validation';
import { Lock, TrendingUp, TrendingDown, Minus, ShieldAlert, Target } from 'lucide-react';

interface AIAnalysisCardProps {
  ai: CharacterType;
  direction: Direction;
  targetPrice: number;
  confidence: number;
  keyReasons: string[];
  risks: string[];
  content?: string;
  isLocked?: boolean;
  className?: string;
}

const DIRECTION_CONFIG: Record<Direction, {
  icon: typeof TrendingUp;
  label: string;
  color: string;
  bg: string;
}> = {
  UP: { icon: TrendingUp, label: '상승', color: 'text-red-400', bg: 'bg-red-500/10' },
  DOWN: { icon: TrendingDown, label: '하락', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  NEUTRAL: { icon: Minus, label: '중립', color: 'text-dark-400', bg: 'bg-dark-700' },
};

export function AIAnalysisCard({
  ai,
  direction,
  targetPrice,
  confidence,
  keyReasons,
  risks,
  content,
  isLocked = false,
  className = '',
}: AIAnalysisCardProps) {
  const char = CHARACTERS[ai];
  const colors = getCharacterColors(ai);
  const dirConfig = DIRECTION_CONFIG[direction];
  const DirIcon = dirConfig.icon;

  if (isLocked) {
    return (
      <div className={`relative rounded-xl border border-dark-700 bg-dark-800/50 overflow-hidden ${className}`}>
        {/* Blurred placeholder content */}
        <div className="blur-sm pointer-events-none select-none p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
              <span className="text-white text-sm font-bold">{char.name[0]}</span>
            </div>
            <div>
              <div className="font-bold text-dark-100">{char.nameKo}</div>
              <div className="text-xs text-dark-400">{char.roleKo}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-dark-700 rounded w-3/4" />
            <div className="h-4 bg-dark-700 rounded w-1/2" />
            <div className="h-4 bg-dark-700 rounded w-2/3" />
          </div>
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-4">
            <Lock className="w-8 h-8 text-dark-500 mx-auto mb-2" />
            <p className={`text-sm font-medium ${colors.text}`}>{char.nameKo}</p>
            <p className="text-xs text-dark-500 mt-1">업그레이드하면 확인 가능</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${colors.border} bg-gradient-to-br from-dark-800/80 to-dark-900/80 p-4 sm:p-5 animate-fade-up ${className}`}>
      {/* Header: AI avatar + name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-white text-sm font-bold">{char.name[0]}</span>
          </div>
          <div>
            <div className={`font-bold ${colors.text}`}>{char.nameKo}</div>
            <div className="text-xs text-dark-400">{char.roleKo}</div>
          </div>
        </div>

        {/* Direction badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${dirConfig.bg}`}>
          <DirIcon className={`w-4 h-4 ${dirConfig.color}`} />
          <span className={`text-sm font-medium ${dirConfig.color}`}>{dirConfig.label}</span>
        </div>
      </div>

      {/* Target price + confidence */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-dark-900/60">
        <div className="flex-1">
          <div className="text-xs text-dark-400 mb-0.5 flex items-center gap-1">
            <Target className="w-3 h-3" />
            목표가
          </div>
          <div className="text-lg font-bold text-dark-100">
            {targetPrice.toLocaleString()}원
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-dark-400 mb-0.5">신뢰도</div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-2 h-2 rounded-full ${
                  star <= confidence
                    ? `bg-gradient-to-r ${colors.gradient}`
                    : 'bg-dark-700'
                }`}
              />
            ))}
            <span className={`text-sm font-bold ${colors.text} ml-1`}>{confidence}/5</span>
          </div>
        </div>
      </div>

      {/* Key reasons */}
      {keyReasons.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-dark-400 mb-2">핵심 근거</div>
          <ul className="space-y-1.5">
            {keyReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-dark-200">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${colors.gradient} flex-shrink-0`} />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <div>
          <div className="text-xs font-medium text-dark-400 mb-2 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            리스크
          </div>
          <ul className="space-y-1">
            {risks.map((risk, i) => (
              <li key={i} className="text-xs text-dark-400 flex items-start gap-1.5">
                <span className="text-dark-600 mt-0.5">-</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI analysis content (expandable) */}
      {content && (
        <details className="mt-3 group">
          <summary className="text-xs text-dark-500 cursor-pointer hover:text-dark-300 transition-colors">
            상세 분석 보기
          </summary>
          <div className="mt-2 text-sm text-dark-300 leading-relaxed whitespace-pre-line border-t border-dark-700/50 pt-2">
            {content}
          </div>
        </details>
      )}
    </div>
  );
}
