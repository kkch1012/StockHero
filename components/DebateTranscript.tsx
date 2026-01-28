'use client';

import { useState } from 'react';
import { CharacterAvatar } from './CharacterAvatar';

interface DebateMessage {
  character: 'claude' | 'gemini' | 'gpt';
  picks: string[];
  content: string;
}

interface DebateRound {
  round: number;
  messages: DebateMessage[];
}

interface DebateLog {
  date: string;
  rounds: DebateRound[];
}

interface Props {
  debateLog?: DebateLog;
  isLoading?: boolean;
}

const CHARACTER_INFO = {
  claude: {
    name: '클로드 리',
    color: 'border-blue-500',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    role: 'Balanced Analyst',
  },
  gemini: {
    name: '제미 나인',
    color: 'border-purple-500',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    role: 'Growth Strategist',
  },
  gpt: {
    name: 'G.P. 테일러',
    color: 'border-amber-500',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    role: 'Risk Officer',
  },
};

const ROUND_TITLES = {
  1: { title: '1라운드: 각자의 Top 7', emoji: '🎯', description: '각 분석가가 후보 종목 중 관심 종목을 선정합니다' },
  2: { title: '2라운드: 의견 조율', emoji: '⚖️', description: '서로의 선택에 반응하고 의견을 조율합니다' },
  3: { title: '3라운드: 최종 합의', emoji: '🤝', description: '합의를 통해 최종 Top 5를 도출합니다' },
};

export function DebateTranscript({ debateLog, isLoading }: Props) {
  const [expandedRound, setExpandedRound] = useState<number | null>(3); // 기본적으로 마지막 라운드 펼침
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-dark-700 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-dark-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!debateLog || !debateLog.rounds?.length) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <span className="text-4xl mb-4 block">🤔</span>
        <h3 className="text-lg font-bold text-white mb-2">오늘의 추천이 없습니다</h3>
        <p className="text-dark-400 text-sm">
          매일 오전 8시에 AI 3대장이 토론하여 새로운 추천을 생성합니다.
        </p>
        <p className="text-dark-500 text-xs mt-2">
          잠시 후 다시 확인해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-dark-700 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎭</span>
          <h2 className="text-xl font-bold text-white">AI 3대장 토론</h2>
        </div>
        <p className="text-dark-400 text-sm">
          {debateLog.date} • {debateLog.rounds.length}라운드 토론 완료
        </p>
      </div>

      {/* Rounds */}
      <div className="divide-y divide-dark-700">
        {debateLog.rounds.map((round) => {
          const roundInfo = ROUND_TITLES[round.round as keyof typeof ROUND_TITLES] || { 
            title: `${round.round}라운드`, 
            emoji: '💬',
            description: '' 
          };
          const isExpanded = expandedRound === round.round;

          return (
            <div key={round.round} className="transition-colors hover:bg-dark-800/30">
              {/* Round Header */}
              <button
                onClick={() => setExpandedRound(isExpanded ? null : round.round)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{roundInfo.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white">{roundInfo.title}</h3>
                    <p className="text-xs text-dark-400">{roundInfo.description}</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-dark-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Round Messages */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {round.messages.map((msg, msgIdx) => {
                    const char = CHARACTER_INFO[msg.character];
                    const messageKey = `${round.round}-${msg.character}`;
                    const isMessageExpanded = expandedMessage === messageKey;
                    
                    // JSON에서 분석 내용 추출
                    let analysisText = '';
                    try {
                      const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
                      if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        analysisText = parsed.analysis || parsed.reaction || parsed.finalThoughts || '';
                      }
                    } catch {
                      analysisText = msg.content.substring(0, 200);
                    }

                    return (
                      <div
                        key={msgIdx}
                        className={`rounded-xl border-l-4 ${char.color} ${char.bgColor} p-4`}
                      >
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <CharacterAvatar character={msg.character} size="sm" />
                            <div>
                              <p className={`font-bold ${char.textColor}`}>{char.name}</p>
                              <p className="text-xs text-dark-500">{char.role}</p>
                            </div>
                          </div>
                          
                          {/* Picks Preview */}
                          {msg.picks && msg.picks.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-dark-400">선택:</span>
                              <span className={`text-xs font-bold ${char.textColor}`}>
                                {msg.picks.length}종목
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Analysis Text */}
                        {analysisText && (
                          <p className="text-sm text-dark-200 mb-3 line-clamp-2">
                            &ldquo;{analysisText}&rdquo;
                          </p>
                        )}

                        {/* Picks List */}
                        {msg.picks && msg.picks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {msg.picks.slice(0, isMessageExpanded ? undefined : 5).map((pick, pickIdx) => (
                              <span
                                key={pickIdx}
                                className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-300"
                              >
                                {pick}
                              </span>
                            ))}
                            {!isMessageExpanded && msg.picks.length > 5 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMessage(messageKey);
                                }}
                                className={`px-2 py-1 rounded text-xs ${char.textColor} hover:underline`}
                              >
                                +{msg.picks.length - 5}개 더보기
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Round Summary */}
                  {round.round === 3 && (
                    <div className="bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-amber-500/5 rounded-xl p-4 border border-dark-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span>✨</span>
                        <p className="font-bold text-white">합의 완료</p>
                      </div>
                      <p className="text-sm text-dark-300">
                        3명의 분석가가 토론을 마치고 Top 5 종목에 합의했습니다.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-dark-800/50 text-center">
        <p className="text-xs text-dark-500">
          ⚠️ AI 분석은 참고용이며, 투자 결정은 본인의 판단에 따라야 합니다.
        </p>
      </div>
    </div>
  );
}
