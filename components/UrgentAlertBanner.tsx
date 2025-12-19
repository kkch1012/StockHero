'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CharacterAvatar } from './CharacterAvatar';
import type { CharacterType } from '@/lib/llm/types';

interface UrgentAlert {
  id: string;
  stockName: string;
  stockSymbol: string;
  character: CharacterType;
  characterName: string;
  alertType: 'surge' | 'drop' | 'breakout';
  message: string;
  confidenceScore: number;
  timeAgo: number; // minutes ago
  isPremium: boolean;
}

// 샘플 알림 데이터 (실제로는 API에서 가져와야 함)
const SAMPLE_ALERTS: UrgentAlert[] = [
  {
    id: '1',
    stockName: 'SK하이닉스',
    stockSymbol: '000660',
    character: 'gemini',
    characterName: '제미나인',
    alertType: 'surge',
    message: 'HBM 수주 급증 신호 포착! 단기 급등 예상',
    confidenceScore: 94,
    timeAgo: 12,
    isPremium: true,
  },
  {
    id: '2',
    stockName: '에코프로비엠',
    stockSymbol: '247540',
    character: 'claude',
    characterName: '클로드리',
    alertType: 'breakout',
    message: '저항선 돌파 임박, 거래량 급증 감지',
    confidenceScore: 87,
    timeAgo: 28,
    isPremium: true,
  },
  {
    id: '3',
    stockName: '삼성전자',
    stockSymbol: '005930',
    character: 'gpt',
    characterName: '쥐피테일러',
    alertType: 'surge',
    message: '외국인 순매수 전환, 반등 시그널',
    confidenceScore: 82,
    timeAgo: 45,
    isPremium: true,
  },
];

function AlertTypeIcon({ type }: { type: UrgentAlert['alertType'] }) {
  if (type === 'surge') {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    );
  }
  if (type === 'breakout') {
    return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 32 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1 font-mono text-sm">
      <span className="bg-dark-800 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span>:</span>
      <span className="bg-dark-800 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span>:</span>
      <span className="bg-dark-800 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</span>
    </div>
  );
}

export function UrgentAlertBanner() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPremium] = useState(false); // 실제로는 auth에서 가져와야 함
  const latestAlert = SAMPLE_ALERTS[0];

  return (
    <div className="relative overflow-hidden">
      {/* Main Alert Banner */}
      <div 
        className="relative bg-gradient-to-r from-red-950/80 via-orange-950/60 to-red-950/80 border-y border-red-500/30 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 animate-pulse" />
        
        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/20 to-transparent -translate-x-full animate-scan" />
        </div>

        <div className="relative container-app py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Alert indicator */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-red-400 font-bold text-sm uppercase tracking-wider">
                🚨 실시간 알림
              </span>
            </div>

            {/* Center: Alert content */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <CharacterAvatar character={latestAlert.character} size="sm" />
              <div className="min-w-0">
                <span className="text-dark-200 font-medium">
                  <span className="text-amber-400">{latestAlert.characterName}</span>
                  {' '}발동! {' '}
                  <span className="text-white font-bold">{latestAlert.stockName}</span>
                  {' '}
                  {isPremium ? (
                    <span className="text-emerald-400">{latestAlert.message}</span>
                  ) : (
                    <span className="text-dark-500">••••••••••••</span>
                  )}
                </span>
              </div>
            </div>

            {/* Right: Premium badge or expand */}
            <div className="flex items-center gap-3">
              {!isPremium && (
                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                  🔒 프리미엄
                </span>
              )}
              <svg 
                className={`w-5 h-5 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Alert List */}
      {isExpanded && (
        <div className="bg-dark-950/95 border-b border-dark-800 backdrop-blur-xl">
          <div className="container-app py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🚨</span>
                  실시간 AI 급등 알림
                </h3>
                <p className="text-sm text-dark-400 mt-1">
                  AI가 감지한 급등/급락 시그널을 실시간으로 확인하세요
                </p>
              </div>
              
              {!isPremium && (
                <div className="text-right">
                  <div className="text-xs text-dark-500 mb-1">무료 유저 공개까지</div>
                  <CountdownTimer />
                </div>
              )}
            </div>

            {/* Alert List */}
            <div className="space-y-3">
              {SAMPLE_ALERTS.map((alert, index) => (
                <div
                  key={alert.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-red-950/50 to-orange-950/30 border-red-500/30' 
                      : 'bg-dark-900/50 border-dark-800 hover:border-dark-700'
                  }`}
                >
                  {/* New badge for latest */}
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      NEW
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <AlertTypeIcon type={alert.alertType} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{alert.stockName}</span>
                        <span className="text-xs text-dark-500">{alert.stockSymbol}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          alert.alertType === 'surge' ? 'bg-emerald-500/20 text-emerald-400' :
                          alert.alertType === 'breakout' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {alert.alertType === 'surge' ? '급등' : alert.alertType === 'breakout' ? '돌파' : '급락'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <CharacterAvatar character={alert.character} size="xs" />
                        <span className="text-dark-400">{alert.characterName}</span>
                        <span className="text-dark-600">•</span>
                        <span className="text-dark-500">{alert.timeAgo}분 전</span>
                      </div>

                      {/* Message - blurred for non-premium */}
                      {isPremium ? (
                        <p className="text-dark-300">{alert.message}</p>
                      ) : (
                        <div className="relative">
                          <p className="text-dark-500 blur-sm select-none">{alert.message}</p>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="px-3 py-1 bg-dark-800/90 rounded-lg text-xs text-dark-400 border border-dark-700">
                              🔒 프리미엄 전용
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confidence Score */}
                    <div className="text-right">
                      <div className="text-xs text-dark-500 mb-1">AI 확신도</div>
                      {isPremium ? (
                        <div className={`text-2xl font-bold ${
                          alert.confidenceScore >= 90 ? 'text-emerald-400' :
                          alert.confidenceScore >= 80 ? 'text-amber-400' :
                          'text-dark-300'
                        }`}>
                          {alert.confidenceScore}%
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-dark-600">??%</div>
                      )}
                    </div>
                  </div>

                  {/* Quick action */}
                  {isPremium && (
                    <div className="mt-3 pt-3 border-t border-dark-800/50 flex items-center justify-between">
                      <Link 
                        href={`/battle/${alert.stockSymbol}`}
                        className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        AI 토론 보기
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Premium CTA */}
            {!isPremium && (
              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-amber-950/50 via-orange-950/50 to-red-950/50 border border-amber-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">
                      ⚡ 프리미엄으로 업그레이드
                    </h4>
                    <p className="text-sm text-dark-400">
                      실시간 알림을 받고, 남들보다 먼저 기회를 잡으세요
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
                      <span>✓ 실시간 급등 알림</span>
                      <span>✓ AI 확신도 공개</span>
                      <span>✓ 24시간 선점 기회</span>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-amber-500/25 whitespace-nowrap">
                    프리미엄 시작하기 →
                  </button>
                </div>
                
                {/* Social proof */}
                <div className="mt-4 pt-4 border-t border-amber-500/10 flex items-center justify-center gap-6 text-xs text-dark-500">
                  <span>📈 프리미엄 유저 평균 수익률 <span className="text-emerald-400 font-bold">+18.3%</span></span>
                  <span>⏱️ 평균 <span className="text-amber-400 font-bold">4.2시간</span> 먼저 알림</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

