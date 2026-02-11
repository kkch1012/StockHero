'use client';

import { SingleResult } from './SingleResult';
import { ComparisonResult } from './ComparisonResult';
import { CrossValidationResult } from './CrossValidationResult';
import { ConsensusGradeBadge } from './ConsensusGradeBadge';
import { UsageIndicator } from './UsageIndicator';
import { TIER_NAMES } from '@/types/subscription';
import type { SubscriptionTier } from '@/types/subscription';

interface TierAnalysisResult {
  tier: SubscriptionTier;
  analysisType: 'single' | 'comparison' | 'cross_validation' | 'debate';
  result: any;
  usedAIs: string[];
  apiCost: number;
  timestamp: string;
}

interface TierBasedResultProps {
  analysisResult: TierAnalysisResult;
  currentPrice: number;
  symbolName: string;
  remainingQuota?: { used: number; limit: number };
}

export function TierBasedResult({ analysisResult, currentPrice, symbolName, remainingQuota }: TierBasedResultProps) {
  const { tier, analysisType, result } = analysisResult;

  return (
    <div>
      {/* Header: tier badge + usage */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-dark-500">
            {TIER_NAMES[tier as keyof typeof TIER_NAMES]} 플랜
          </span>
          {analysisType === 'cross_validation' && result.consensusGrade && (
            <ConsensusGradeBadge
              grade={result.consensusGrade}
              confidence={result.consensusConfidence}
              size="sm"
            />
          )}
        </div>
        {remainingQuota && (
          <UsageIndicator
            used={remainingQuota.used}
            limit={remainingQuota.limit}
            label="분석"
          />
        )}
      </div>

      {/* Render tier-specific result */}
      {analysisType === 'single' && (
        <SingleResult
          result={result}
          currentPrice={currentPrice}
          symbolName={symbolName}
        />
      )}

      {analysisType === 'comparison' && (
        <ComparisonResult
          result={result}
          currentPrice={currentPrice}
          symbolName={symbolName}
        />
      )}

      {analysisType === 'cross_validation' && (
        <CrossValidationResult
          result={result}
          currentPrice={currentPrice}
          symbolName={symbolName}
        />
      )}
    </div>
  );
}
