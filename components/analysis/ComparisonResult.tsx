'use client';

import Link from 'next/link';
import { AIAnalysisCard } from './AIAnalysisCard';
import { Star, ArrowRightLeft } from 'lucide-react';

interface ComparisonResultProps {
  result: {
    ais: ['gemini', 'claude'];
    analyses: {
      gemini: {
        content: string;
        score: number;
        targetPrice?: number;
        risks: string[];
      };
      claude: {
        content: string;
        score: number;
        targetPrice?: number;
        risks: string[];
      };
    };
    comparison: {
      directionMatch: boolean;
      priceDifference: number;
      priceDifferencePercent: number;
      commonPoints: string[];
      differences: string[];
    };
    summary: string;
  };
  currentPrice: number;
  symbolName: string;
}

export function ComparisonResult({ result, currentPrice, symbolName }: ComparisonResultProps) {
  const { analyses, comparison } = result;
  const geminiDir = analyses.gemini.score >= 4 ? 'UP' as const : analyses.gemini.score <= 2 ? 'DOWN' as const : 'NEUTRAL' as const;
  const claudeDir = analyses.claude.score >= 4 ? 'UP' as const : analyses.claude.score <= 2 ? 'DOWN' as const : 'NEUTRAL' as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Comparison summary */}
      <div className="p-4 sm:p-5 rounded-xl bg-dark-800/50 border border-dark-700 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ArrowRightLeft className="w-4 h-4 text-dark-400" />
          <span className="text-sm font-medium text-dark-200">2 AI 비교 결과</span>
        </div>
        <p className="text-dark-400 text-sm">{result.summary}</p>

        {/* Direction match indicator */}
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            comparison.directionMatch
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            {comparison.directionMatch ? '방향 일치' : '방향 불일치'}
          </span>
          <span className="text-xs text-dark-400">
            목표가 차이: {comparison.priceDifferencePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 2 AI cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AIAnalysisCard
          ai="gemini"
          direction={geminiDir}
          targetPrice={analyses.gemini.targetPrice || currentPrice}
          confidence={analyses.gemini.score}
          keyReasons={extractReasons(analyses.gemini.content)}
          risks={analyses.gemini.risks}
          content={analyses.gemini.content}
        />
        <AIAnalysisCard
          ai="claude"
          direction={claudeDir}
          targetPrice={analyses.claude.targetPrice || currentPrice}
          confidence={analyses.claude.score}
          keyReasons={extractReasons(analyses.claude.content)}
          risks={analyses.claude.risks}
          content={analyses.claude.content}
        />
      </div>

      {/* Locked GPT card */}
      <AIAnalysisCard
        ai="gpt"
        direction="NEUTRAL"
        targetPrice={0}
        confidence={0}
        keyReasons={[]}
        risks={[]}
        isLocked
      />

      {/* Locked consensus grade */}
      <div className="relative rounded-xl border border-dark-700 overflow-hidden">
        <div className="blur-sm pointer-events-none select-none p-6 text-center">
          <div className="text-4xl mb-2">🟢</div>
          <div className="text-xl font-bold text-emerald-400">STRONG</div>
          <div className="text-dark-400 text-sm">합의 등급 · 신뢰도 95%</div>
        </div>
        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-dark-300 text-sm font-medium">3 AI 교차검증은 Basic부터</p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl p-5 sm:p-6 border border-blue-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark-100">3 AI 교차검증으로 신뢰도 UP</h3>
              <p className="text-sm text-dark-400">
                Basic으로 업그레이드하면 GPT의 매크로 분석 + 합의 등급을 확인할 수 있습니다
              </p>
            </div>
          </div>
          <Link
            href="/subscription?plan=basic"
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 transition-opacity whitespace-nowrap text-sm"
          >
            Basic 시작하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function extractReasons(content: string): string[] {
  const sentences = content.split(/[.!?]\s/).filter((s) => s.length > 10 && s.length < 100);
  return sentences.slice(0, 3);
}
