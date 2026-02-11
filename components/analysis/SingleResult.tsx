'use client';

import Link from 'next/link';
import { AIAnalysisCard } from './AIAnalysisCard';
import { Sparkles } from 'lucide-react';

interface SingleResultProps {
  result: {
    ai: 'gemini';
    analysis: {
      content: string;
      score: number;
      targetPrice?: number;
      risks: string[];
      sources: string[];
    };
    summary: string;
  };
  currentPrice: number;
  symbolName: string;
}

export function SingleResult({ result, currentPrice, symbolName }: SingleResultProps) {
  const direction = result.analysis.score >= 4 ? 'UP' as const : result.analysis.score <= 2 ? 'DOWN' as const : 'NEUTRAL' as const;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="text-center">
        <p className="text-dark-400 text-sm">{result.summary}</p>
      </div>

      {/* Gemini card (visible) */}
      <AIAnalysisCard
        ai="gemini"
        direction={direction}
        targetPrice={result.analysis.targetPrice || currentPrice}
        confidence={result.analysis.score}
        keyReasons={extractReasons(result.analysis.content)}
        risks={result.analysis.risks}
        content={result.analysis.content}
      />

      {/* Locked cards: Claude + GPT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AIAnalysisCard
          ai="claude"
          direction="NEUTRAL"
          targetPrice={0}
          confidence={0}
          keyReasons={[]}
          risks={[]}
          isLocked
        />
        <AIAnalysisCard
          ai="gpt"
          direction="NEUTRAL"
          targetPrice={0}
          confidence={0}
          keyReasons={[]}
          risks={[]}
          isLocked
        />
      </div>

      {/* Locked consensus grade */}
      <div className="relative rounded-xl border border-dark-700 overflow-hidden">
        <div className="blur-sm pointer-events-none select-none p-6 text-center">
          <div className="text-4xl mb-2">🟢</div>
          <div className="text-xl font-bold text-emerald-400">STRONG</div>
          <div className="text-dark-400 text-sm">신뢰도 95%</div>
        </div>
        <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-dark-300 text-sm font-medium">합의 등급은 Lite부터</p>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl p-5 sm:p-6 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-dark-100">더 정확한 분석을 원하시나요?</h3>
              <p className="text-sm text-dark-400">
                Lite로 업그레이드하면 Claude의 펀더멘탈 분석을 추가로 확인할 수 있습니다
              </p>
            </div>
          </div>
          <Link
            href="/subscription?plan=lite"
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90 transition-opacity whitespace-nowrap text-sm"
          >
            Lite 시작하기 →
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
