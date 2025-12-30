'use client';

import { useState, useEffect } from 'react';
import { CharacterAvatar } from './CharacterAvatar';

interface DayRecommendation {
  date: string;
  theme?: { name: string; emoji: string };
  top5: Array<{
    rank: number;
    symbol: string;
    name: string;
    avgScore: number;
    isUnanimous: boolean;
    claudeScore?: number;
    geminiScore?: number;
    gptScore?: number;
  }>;
  consensusSummary?: string;
}

interface CalendarProps {
  initialMonth?: Date;
}

// 요일별 테마 정보
const DAY_THEMES: Record<number, { name: string; emoji: string; color: string }> = {
  0: { name: '종합 밸런스', emoji: '⚖️', color: 'bg-gray-500' },
  1: { name: '성장주 포커스', emoji: '🚀', color: 'bg-green-500' },
  2: { name: '배당 투자', emoji: '💰', color: 'bg-yellow-500' },
  3: { name: '가치 투자', emoji: '💎', color: 'bg-blue-500' },
  4: { name: '테마 & 트렌드', emoji: '🔥', color: 'bg-red-500' },
  5: { name: '블루칩', emoji: '🏆', color: 'bg-purple-500' },
  6: { name: '히든 젬', emoji: '🌟', color: 'bg-pink-500' },
};

export function RecommendationCalendar({ initialMonth = new Date() }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [recommendations, setRecommendations] = useState<Map<string, DayRecommendation>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch recommendations for the current month
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const response = await fetch(`/api/calendar/verdicts?year=${year}&month=${month}`);
        if (response.ok) {
          const data = await response.json();
          const recMap = new Map<string, DayRecommendation>();
          data.verdicts?.forEach((v: DayRecommendation) => {
            recMap.set(v.date, v);
          });
          setRecommendations(recMap);
        }
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentMonth]);

  // Get calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty days for the first week
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const formatDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const selectedRecommendation = selectedDate ? recommendations.get(selectedDate) : null;

  // Get theme for a specific day
  const getThemeForDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return DAY_THEMES[date.getDay()];
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg sm:text-xl font-bold text-white">
          {currentMonth.getFullYear()}년 {monthNames[currentMonth.getMonth()]}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-dark-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Theme Legend */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(DAY_THEMES).map(([day, theme]) => (
          <div key={day} className="flex items-center gap-1 text-dark-400">
            <span>{theme.emoji}</span>
            <span>{dayNames[Number(day)]}</span>
          </div>
        ))}
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((name, idx) => (
          <div
            key={name}
            className={`text-center text-xs font-medium py-2 ${
              idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-dark-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateStr = formatDate(day);
          const hasData = recommendations.has(dateStr);
          const isSelected = selectedDate === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay();
          const theme = getThemeForDate(day);

          return (
            <button
              key={day}
              onClick={() => hasData && setSelectedDate(isSelected ? null : dateStr)}
              disabled={!hasData}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative
                transition-all
                ${hasData 
                  ? 'hover:bg-dark-700 cursor-pointer' 
                  : 'cursor-default opacity-50'
                }
                ${isSelected ? 'ring-2 ring-primary-500 bg-dark-700' : ''}
                ${isToday ? 'bg-primary-500/20' : ''}
                ${dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-dark-200'}
              `}
            >
              <span className={`${isToday ? 'font-bold' : ''}`}>{day}</span>
              {hasData && (
                <span className="text-xs mt-0.5">{theme.emoji}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-dark-400 text-sm">로딩 중...</p>
        </div>
      ) : selectedRecommendation ? (
        <div className="border-t border-dark-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{selectedRecommendation.theme?.emoji || '📊'}</span>
            <div>
              <h4 className="text-lg font-bold text-white">
                {selectedDate?.replace(/-/g, '.')} 추천
              </h4>
              <p className="text-sm text-dark-400">
                {selectedRecommendation.theme?.name || '종합 분석'}
              </p>
            </div>
          </div>

          {/* Top 5 List */}
          <div className="space-y-3">
            {selectedRecommendation.top5.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-dark-800/50 rounded-xl p-4 hover:bg-dark-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                      ${stock.rank === 1 ? 'bg-yellow-500 text-black' :
                        stock.rank === 2 ? 'bg-gray-400 text-black' :
                        stock.rank === 3 ? 'bg-amber-600 text-white' :
                        'bg-dark-700 text-dark-300'}
                    `}>
                      {stock.rank}
                    </span>
                    <div>
                      <p className="font-medium text-white">{stock.name}</p>
                      <p className="text-xs text-dark-400">{stock.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary-400">{stock.avgScore}점</p>
                    {stock.isUnanimous && (
                      <span className="text-xs text-yellow-400">✨ 만장일치</span>
                    )}
                  </div>
                </div>

                {/* AI Scores */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dark-700">
                  <div className="flex items-center gap-1.5">
                    <CharacterAvatar character="claude" size="xs" />
                    <span className={`text-xs ${stock.claudeScore ? 'text-blue-400' : 'text-dark-500'}`}>
                      {stock.claudeScore?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CharacterAvatar character="gemini" size="xs" />
                    <span className={`text-xs ${stock.geminiScore ? 'text-purple-400' : 'text-dark-500'}`}>
                      {stock.geminiScore?.toFixed(1) || '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CharacterAvatar character="gpt" size="xs" />
                    <span className={`text-xs ${stock.gptScore ? 'text-amber-400' : 'text-dark-500'}`}>
                      {stock.gptScore?.toFixed(1) || '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedRecommendation.consensusSummary && (
            <div className="mt-4 p-3 bg-primary-500/10 rounded-lg">
              <p className="text-sm text-primary-300">{selectedRecommendation.consensusSummary}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-dark-400">
          <p className="text-2xl mb-2">📅</p>
          <p>날짜를 선택하면 해당 일의 AI 추천을 볼 수 있습니다</p>
          <p className="text-xs mt-2">매일 오전 8시에 새로운 추천이 생성됩니다</p>
        </div>
      )}
    </div>
  );
}

