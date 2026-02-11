'use client';

import type { ConsensusGrade } from '@/lib/llm/cross-validation';

interface ConsensusGradeBadgeProps {
  grade: ConsensusGrade;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

const GRADE_CONFIG: Record<ConsensusGrade, {
  emoji: string;
  label: string;
  labelKo: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  STRONG: {
    emoji: '🟢',
    label: 'STRONG',
    labelKo: '강한 합의',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  MODERATE: {
    emoji: '🟡',
    label: 'MODERATE',
    labelKo: '다수 합의',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  CONFLICT: {
    emoji: '🔴',
    label: 'CONFLICT',
    labelKo: '의견 분열',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
};

export function ConsensusGradeBadge({ grade, confidence, size = 'md' }: ConsensusGradeBadgeProps) {
  const config = GRADE_CONFIG[grade];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} rounded-full border ${config.bg} ${config.border} shadow-lg ${config.glow}`}>
      <span>{config.emoji}</span>
      <span className={`font-bold ${config.color}`}>{config.label}</span>
      <span className="text-dark-400">|</span>
      <span className={`font-medium ${config.color}`}>{confidence}%</span>
    </div>
  );
}

export function ConsensusGradeHero({ grade, confidence }: { grade: ConsensusGrade; confidence: number }) {
  const config = GRADE_CONFIG[grade];

  return (
    <div className={`text-center p-6 sm:p-8 rounded-2xl border ${config.bg} ${config.border} relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-50`} />
      <div className="relative">
        <div className="text-5xl sm:text-6xl mb-3">{config.emoji}</div>
        <h2 className={`text-2xl sm:text-3xl font-bold ${config.color} mb-1`}>
          {config.label}
        </h2>
        <p className="text-dark-400 text-sm sm:text-base mb-3">
          {config.labelKo}
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} border ${config.border}`}>
          <span className="text-dark-400 text-sm">신뢰도</span>
          <span className={`text-lg font-bold ${config.color}`}>{confidence}%</span>
        </div>
      </div>
    </div>
  );
}
