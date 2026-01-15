'use client';

import React from 'react';
import {
  CrownIcon,
  TargetIcon,
  AlertTriangleIcon,
  ClockIcon,
  LockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ShieldIcon,
} from 'lucide-react';
import Link from 'next/link';

interface VIPStock {
  rank: number;
  symbol: string;
  name: string;
  currentPrice?: number | null;
  current_price?: number;
  targetPrice?: number | null;
  target_price?: number;
  stopLoss?: number | null;
  stop_loss?: number;
  expectedReturn?: string | null;
  expected_return?: string;
  reason: string;
  risks?: string[];
  holdingPeriod?: string;
  holding_period?: string;
  conviction?: string;
  isLocked?: boolean;
}

interface ExclusiveStockCardProps {
  stock: VIPStock;
  isVIP: boolean;
}

// Conviction 레벨별 스타일
const CONVICTION_STYLES = {
  HIGH: { label: '높은 확신', color: 'text-green-400', bg: 'bg-green-500/20' },
  MEDIUM: { label: '보통', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  LOW: { label: '낮은 확신', color: 'text-orange-400', bg: 'bg-orange-500/20' },
};

export function ExclusiveStockCard({ stock, isVIP }: ExclusiveStockCardProps) {
  // 필드명 통일 (DB 스네이크케이스 vs 프론트 카멜케이스)
  const currentPrice = stock.currentPrice ?? stock.current_price;
  const targetPrice = stock.targetPrice ?? stock.target_price;
  const stopLoss = stock.stopLoss ?? stock.stop_loss;
  const expectedReturn = stock.expectedReturn ?? stock.expected_return;
  const holdingPeriod = stock.holdingPeriod ?? stock.holding_period;

  // 잠긴 상태 (비VIP)
  if (stock.isLocked) {
    return (
      <div className="relative bg-dark-800/50 rounded-xl p-5 border border-dark-700 overflow-hidden">
        {/* 블러 오버레이 */}
        <div className="absolute inset-0 backdrop-blur-md bg-dark-900/50 z-10 flex flex-col items-center justify-center">
          <div className="bg-amber-500/20 p-3 rounded-full mb-3">
            <LockIcon className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-dark-200 font-medium mb-1">VIP 전용 종목</p>
          <p className="text-xs text-dark-500 mb-4">VIP 회원만 확인할 수 있습니다</p>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg"
          >
            VIP 업그레이드
          </Link>
        </div>

        {/* 배경 (블러) */}
        <div className="opacity-30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-amber-400">#{stock.rank}</span>
            <CrownIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div className="h-4 w-32 bg-dark-700 rounded mb-2" />
          <div className="h-6 w-24 bg-dark-700 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-dark-700 rounded" />
            <div className="h-3 w-4/5 bg-dark-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 수익률 계산
  const returnPercent = targetPrice && currentPrice
    ? ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1)
    : expectedReturn?.replace('%', '') || '0';

  // 손절폭 계산
  const lossPercent = stopLoss && currentPrice
    ? ((stopLoss - currentPrice) / currentPrice * 100).toFixed(1)
    : '-5';

  const convictionStyle = CONVICTION_STYLES[stock.conviction as keyof typeof CONVICTION_STYLES] || CONVICTION_STYLES.MEDIUM;

  return (
    <div className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 rounded-xl p-5 border border-amber-500/20 hover:border-amber-500/40 transition-all">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 bg-amber-500/20 rounded-lg text-sm font-bold text-amber-400">
            #{stock.rank}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${convictionStyle.bg} ${convictionStyle.color}`}>
            {convictionStyle.label}
          </span>
        </div>
        <CrownIcon className="w-5 h-5 text-amber-400" />
      </div>

      {/* 종목 정보 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-dark-100">{stock.name}</h3>
        <p className="text-sm text-dark-500">{stock.symbol}</p>
      </div>

      {/* 가격 정보 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-dark-500 mb-1">현재가</p>
          <p className="text-lg font-bold text-dark-100">
            {currentPrice?.toLocaleString() || '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-500 mb-1 flex items-center gap-1">
            <TargetIcon className="w-3 h-3" />
            목표가
          </p>
          <p className="text-lg font-bold text-green-400">
            {targetPrice?.toLocaleString() || '-'}
          </p>
          <p className="text-xs text-green-400">+{returnPercent}%</p>
        </div>
        <div>
          <p className="text-xs text-dark-500 mb-1 flex items-center gap-1">
            <ShieldIcon className="w-3 h-3" />
            손절가
          </p>
          <p className="text-lg font-bold text-red-400">
            {stopLoss?.toLocaleString() || '-'}
          </p>
          <p className="text-xs text-red-400">{lossPercent}%</p>
        </div>
      </div>

      {/* 추천 이유 */}
      <div className="mb-4">
        <p className="text-xs text-dark-500 mb-1">추천 이유</p>
        <p className="text-sm text-dark-300 line-clamp-3">{stock.reason}</p>
      </div>

      {/* 리스크 */}
      {stock.risks && stock.risks.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-dark-500 mb-2 flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3" />
            주요 리스크
          </p>
          <ul className="space-y-1">
            {stock.risks.slice(0, 2).map((risk, i) => (
              <li key={i} className="text-xs text-dark-400 flex items-start gap-1">
                <span className="text-red-400 mt-0.5">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 추천 기간 */}
      {holdingPeriod && (
        <div className="flex items-center gap-2 text-xs text-dark-500 pt-3 border-t border-dark-700">
          <ClockIcon className="w-3 h-3" />
          추천 보유 기간: {holdingPeriod}
        </div>
      )}
    </div>
  );
}

export default ExclusiveStockCard;
