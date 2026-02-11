'use client';

import { useState, useEffect } from 'react';
import { CHARACTERS, getCharacterColors } from '@/lib/characters';
import type { CharacterType } from '@/lib/llm/types';
import { Loader2 } from 'lucide-react';

interface AnalysisLoadingProps {
  aiCount: 1 | 2 | 3;
}

const AI_STEPS: { ai: CharacterType; message: string }[] = [
  { ai: 'gemini', message: '트렌드와 수급 데이터 분석 중...' },
  { ai: 'claude', message: '재무제표와 밸류에이션 분석 중...' },
  { ai: 'gpt', message: '매크로와 리스크 분석 중...' },
];

export function AnalysisLoading({ aiCount }: AnalysisLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = AI_STEPS.slice(0, aiCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24">
      {/* Animated dots */}
      <div className="flex items-center gap-3 mb-8">
        {steps.map((step, i) => {
          const colors = getCharacterColors(step.ai);
          const char = CHARACTERS[step.ai];
          const isActive = i === currentStep;
          const isDone = i < currentStep;

          return (
            <div key={step.ai} className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg transition-all duration-500 ${
                  isActive ? 'scale-110 ring-2 ring-brand-500/50 ring-offset-2 ring-offset-dark-950' : 'opacity-40'
                }`}
              >
                {isActive ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <span className="text-white font-bold text-lg">{char.name[0]}</span>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? colors.text : 'text-dark-600'}`}>
                {char.nameKo}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current step message */}
      <div className="text-center animate-fade-up" key={currentStep}>
        <p className="text-dark-200 font-medium mb-1">
          {CHARACTERS[steps[currentStep].ai].nameKo}가
        </p>
        <p className="text-dark-400 text-sm">
          {steps[currentStep].message}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-dark-800 rounded-full mt-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Subtitle */}
      <p className="text-dark-500 text-xs mt-4">
        {aiCount === 1 && '단일 AI 분석 중...'}
        {aiCount === 2 && '2개 AI 비교 분석 중...'}
        {aiCount === 3 && '3개 AI 독립 분석 후 교차검증 중...'}
      </p>
    </div>
  );
}
