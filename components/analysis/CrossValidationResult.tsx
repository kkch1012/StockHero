'use client';

import type { CrossValidationResult as CrossValidationResultType } from '@/lib/llm/cross-validation';
import { CHARACTERS, getCharacterColors } from '@/lib/characters';
import { ConsensusGradeHero } from './ConsensusGradeBadge';
import { AIAnalysisCard } from './AIAnalysisCard';
import { PriceAgreementBar } from './PriceAgreementBar';
import { TrendingUp, TrendingDown, Minus, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Direction } from '@/lib/llm/cross-validation';

interface CrossValidationResultProps {
  result: CrossValidationResultType;
  currentPrice: number;
  symbolName: string;
}

const DIR_LABELS: Record<Direction, { icon: typeof TrendingUp; label: string; color: string }> = {
  UP: { icon: TrendingUp, label: '상승', color: 'text-red-400' },
  DOWN: { icon: TrendingDown, label: '하락', color: 'text-blue-400' },
  NEUTRAL: { icon: Minus, label: '중립', color: 'text-dark-400' },
};

export function CrossValidationResult({ result, currentPrice, symbolName }: CrossValidationResultProps) {
  const { consensusGrade, consensusConfidence, directionAgreement, priceAgreement, sharedReasons, uniqueReasons, conflictPoints, analyses } = result;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Consensus Grade Hero */}
      <ConsensusGradeHero grade={consensusGrade} confidence={consensusConfidence} />

      {/* Direction Vote */}
      <div className="p-4 sm:p-5 rounded-xl bg-dark-800/50 border border-dark-700">
        <h3 className="text-sm font-medium text-dark-200 mb-3">방향 투표</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {(Object.keys(directionAgreement.votes) as Direction[]).map((dir) => {
            const count = directionAgreement.votes[dir];
            if (count === 0) return null;
            const config = DIR_LABELS[dir];
            const DirIcon = config.icon;
            const isMajority = dir === directionAgreement.majorityDirection;

            return (
              <div
                key={dir}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  isMajority ? 'border-brand-500/30 bg-brand-500/5' : 'border-dark-700 bg-dark-900/50'
                }`}
              >
                <DirIcon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                <span className="text-dark-400 text-sm">{count}/3</span>
                {isMajority && (
                  <span className="text-2xs px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded font-medium">
                    다수
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Which AI voted what */}
        <div className="mt-3 flex flex-wrap gap-2">
          {analyses.map((a) => {
            const colors = getCharacterColors(a.ai);
            const char = CHARACTERS[a.ai];
            const dirConfig = DIR_LABELS[a.direction];

            return (
              <span key={a.ai} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${colors.bg} border ${colors.border}`}>
                <span className={colors.text}>{char.nameKo}</span>
                <span className={dirConfig.color}>{dirConfig.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Price Agreement Bar */}
      <PriceAgreementBar
        analyses={analyses}
        consensusPrice={priceAgreement.consensus}
        currentPrice={currentPrice}
      />

      {/* 3 AI Cards */}
      <div>
        <h3 className="text-sm font-medium text-dark-200 mb-3">개별 AI 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analyses.map((analysis, i) => (
            <AIAnalysisCard
              key={analysis.ai}
              ai={analysis.ai}
              direction={analysis.direction}
              targetPrice={analysis.targetPrice}
              confidence={analysis.confidence}
              keyReasons={analysis.keyReasons}
              risks={analysis.risks}
              content={analysis.rawResponse.content}
              className={`animate-fade-up`}
            />
          ))}
        </div>
      </div>

      {/* Shared Reasons */}
      {sharedReasons.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-medium text-emerald-400">공통 근거 (2+ AI 일치)</h3>
          </div>
          <ul className="space-y-2">
            {sharedReasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-dark-200">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unique Reasons */}
      {uniqueReasons.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-dark-800/50 border border-dark-700">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-dark-400" />
            <h3 className="text-sm font-medium text-dark-200">고유 관점</h3>
          </div>
          <ul className="space-y-2">
            {uniqueReasons.map((item, i) => {
              const colors = getCharacterColors(item.ai);
              const char = CHARACTERS[item.ai];

              return (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`text-xs font-medium ${colors.text} whitespace-nowrap mt-0.5`}>
                    {char.nameKo}
                  </span>
                  <span className="text-dark-300">{item.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Conflict Points */}
      {conflictPoints.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-medium text-red-400">충돌 포인트</h3>
          </div>
          <div className="space-y-3">
            {conflictPoints.map((conflict, i) => (
              <div key={i} className="p-3 rounded-lg bg-dark-900/60">
                <div className="text-xs font-medium text-dark-300 mb-2">
                  {conflict.topic}
                </div>
                <div className="space-y-1.5">
                  {Object.entries(conflict.views).map(([ai, view]) => {
                    const colors = getCharacterColors(ai as any);
                    const char = CHARACTERS[ai as keyof typeof CHARACTERS];

                    return (
                      <div key={ai} className="flex items-start gap-2 text-xs">
                        <span className={`font-medium ${colors.text} whitespace-nowrap`}>
                          {char.nameKo}:
                        </span>
                        <span className="text-dark-400">{view}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-dark-700">
        <h3 className="text-sm font-medium text-dark-200 mb-2">종합 의견</h3>
        <p className="text-dark-300 text-sm leading-relaxed">{result.summary}</p>
        <p className="text-brand-400 text-sm font-medium mt-2">{result.recommendation}</p>
      </div>
    </div>
  );
}
