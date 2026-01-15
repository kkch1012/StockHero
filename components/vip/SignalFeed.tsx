'use client';

import React, { useState } from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  AlertTriangleIcon,
  TargetIcon,
  RefreshCwIcon,
  FilterIcon,
  ClockIcon,
} from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  name: string;
  signal_type: 'BUY' | 'SELL' | 'HOLD' | 'TAKE_PROFIT' | 'STOP_LOSS';
  strength: 'STRONG' | 'MODERATE' | 'WEAK';
  current_price: number;
  change_percent: number;
  reason: string;
  indicators?: {
    rsi?: number;
    bollingerPosition?: string;
    volumeRatio?: number;
  };
  created_at: string;
}

interface SignalFeedProps {
  signals: Signal[];
  onRefresh: () => void;
}

// 시그널 타입별 스타일
const SIGNAL_STYLES = {
  BUY: {
    icon: TrendingUpIcon,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    label: '매수',
  },
  SELL: {
    icon: TrendingDownIcon,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: '매도',
  },
  HOLD: {
    icon: MinusIcon,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: '관망',
  },
  TAKE_PROFIT: {
    icon: TargetIcon,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: '익절',
  },
  STOP_LOSS: {
    icon: AlertTriangleIcon,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    label: '손절',
  },
};

// 강도별 스타일
const STRENGTH_STYLES = {
  STRONG: { label: '강력', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  MODERATE: { label: '보통', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  WEAK: { label: '약함', color: 'text-dark-400', bg: 'bg-dark-700' },
};

export function SignalFeed({ signals, onRefresh }: SignalFeedProps) {
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  // 필터링된 시그널
  const filteredSignals = signals.filter((s) => {
    if (filter === 'ALL') return true;
    if (filter === 'BUY') return ['BUY', 'TAKE_PROFIT'].includes(s.signal_type);
    if (filter === 'SELL') return ['SELL', 'STOP_LOSS'].includes(s.signal_type);
    return true;
  });

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-dark-100">실시간 매매 시그널</h2>
          <p className="text-xs text-dark-500">AI가 감지한 매수/매도 타이밍</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 필터 */}
          <div className="flex items-center gap-1 bg-dark-800/50 rounded-lg p-1">
            {(['ALL', 'BUY', 'SELL'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  filter === f
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {f === 'ALL' ? '전체' : f === 'BUY' ? '매수' : '매도'}
              </button>
            ))}
          </div>
          <button
            onClick={onRefresh}
            className="p-2 text-dark-400 hover:text-dark-200 bg-dark-800/50 rounded-lg"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 시그널 목록 */}
      {filteredSignals.length === 0 ? (
        <div className="bg-dark-800/50 rounded-xl p-8 text-center">
          <FilterIcon className="w-10 h-10 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">
            {filter === 'ALL' ? '아직 생성된 시그널이 없습니다.' : `${filter === 'BUY' ? '매수' : '매도'} 시그널이 없습니다.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const style = SIGNAL_STYLES[signal.signal_type];
            const strengthStyle = STRENGTH_STYLES[signal.strength];
            const Icon = style.icon;

            return (
              <div
                key={signal.id}
                onClick={() => setSelectedSignal(selectedSignal?.id === signal.id ? null : signal)}
                className={`bg-dark-800/50 rounded-xl p-4 border ${style.border} cursor-pointer hover:bg-dark-800 transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* 아이콘 */}
                  <div className={`p-3 rounded-xl ${style.bg}`}>
                    <Icon className={`w-6 h-6 ${style.color}`} />
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.bg} ${style.color}`}>
                        {style.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${strengthStyle.bg} ${strengthStyle.color}`}>
                        {strengthStyle.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-dark-100">{signal.name}</h3>
                      <span className="text-sm text-dark-500">({signal.symbol})</span>
                    </div>

                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-lg font-bold text-dark-100">
                        {signal.current_price?.toLocaleString()}원
                      </span>
                      <span className={`text-sm font-medium ${signal.change_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {signal.change_percent >= 0 ? '+' : ''}{signal.change_percent?.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 시간 */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-dark-500">
                      <ClockIcon className="w-3 h-3" />
                      {formatTime(signal.created_at)}
                    </div>
                  </div>
                </div>

                {/* 상세 정보 (펼침) */}
                {selectedSignal?.id === signal.id && (
                  <div className="mt-4 pt-4 border-t border-dark-700 space-y-3">
                    <div>
                      <p className="text-sm text-dark-500 mb-1">시그널 근거</p>
                      <p className="text-dark-200">{signal.reason}</p>
                    </div>

                    {signal.indicators && (
                      <div className="grid grid-cols-3 gap-4">
                        {signal.indicators.rsi !== undefined && (
                          <div>
                            <p className="text-xs text-dark-500">RSI</p>
                            <p className={`text-lg font-bold ${
                              signal.indicators.rsi <= 30 ? 'text-green-400' :
                              signal.indicators.rsi >= 70 ? 'text-red-400' : 'text-dark-200'
                            }`}>
                              {signal.indicators.rsi}
                            </p>
                          </div>
                        )}
                        {signal.indicators.bollingerPosition && (
                          <div>
                            <p className="text-xs text-dark-500">볼린저밴드</p>
                            <p className="text-lg font-bold text-dark-200">
                              {signal.indicators.bollingerPosition}
                            </p>
                          </div>
                        )}
                        {signal.indicators.volumeRatio !== undefined && (
                          <div>
                            <p className="text-xs text-dark-500">거래량 비율</p>
                            <p className={`text-lg font-bold ${
                              signal.indicators.volumeRatio > 1.5 ? 'text-amber-400' : 'text-dark-200'
                            }`}>
                              {signal.indicators.volumeRatio}x
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SignalFeed;
