'use client';

import { useMemo } from 'react';
import { useUsageLimit, useSubscription, FEATURE_ICONS, FEATURE_NAMES, PLAN_DISPLAY_NAMES } from '@/lib/subscription';
import type { FeatureType } from '@/types/subscription';

interface UsageLimitWarningProps {
  feature: FeatureType;
  variant?: 'compact' | 'full' | 'minimal';
  showUpgradeButton?: boolean;
  className?: string;
}

export function UsageLimitWarning({
  feature,
  variant = 'compact',
  showUpgradeButton = true,
  className = '',
}: UsageLimitWarningProps) {
  const { limit, isLoading, openUpgrade } = useUsageLimit(feature);
  const { openUpgradeModal } = useSubscription();

  const featureIcon = FEATURE_ICONS[feature] || '📊';
  const featureName = FEATURE_NAMES[feature] || feature;

  // 사용량 퍼센트 계산
  const usagePercent = useMemo(() => {
    if (limit.limit === -1) return 0; // 무제한
    if (limit.limit === 0) return 100; // 사용 불가
    return Math.min(100, (limit.used / limit.limit) * 100);
  }, [limit]);

  // 상태별 색상
  const statusColor = useMemo(() => {
    if (limit.limit === -1) return 'text-emerald-400'; // 무제한
    if (usagePercent >= 100) return 'text-red-400';
    if (usagePercent >= 80) return 'text-amber-400';
    if (usagePercent >= 50) return 'text-yellow-400';
    return 'text-emerald-400';
  }, [usagePercent, limit.limit]);

  const progressColor = useMemo(() => {
    if (limit.limit === -1) return 'bg-emerald-500'; // 무제한
    if (usagePercent >= 100) return 'bg-red-500';
    if (usagePercent >= 80) return 'bg-amber-500';
    if (usagePercent >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  }, [usagePercent, limit.limit]);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-dark-800/50 rounded-lg h-8 ${className}`} />
    );
  }

  // 무제한인 경우
  if (limit.limit === -1) {
    if (variant === 'minimal') return null;
    
    return (
      <div className={`flex items-center gap-2 text-emerald-400 text-sm ${className}`}>
        <span>{featureIcon}</span>
        <span>무제한 이용 가능</span>
        <span className="text-lg">∞</span>
      </div>
    );
  }

  // ====== MINIMAL 변형 ======
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`text-sm ${statusColor}`}>
          {limit.used}/{limit.limit}
        </span>
        {usagePercent >= 80 && (
          <button
            onClick={() => openUpgradeModal(feature)}
            className="text-xs text-brand-400 hover:text-brand-300"
          >
            업그레이드
          </button>
        )}
      </div>
    );
  }

  // ====== COMPACT 변형 ======
  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-dark-800/50 rounded-xl ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{featureIcon}</span>
            <span className="text-dark-300 text-sm">{featureName}</span>
          </div>
          <span className={`text-sm font-medium ${statusColor}`}>
            {limit.used}/{limit.limit}
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${progressColor} transition-all duration-500`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        {/* 경고 메시지 */}
        {usagePercent >= 100 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-red-400 text-xs">
              오늘 사용량을 모두 소진했습니다
            </span>
            {showUpgradeButton && (
              <button
                onClick={() => openUpgradeModal(feature)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                업그레이드 →
              </button>
            )}
          </div>
        )}
        {usagePercent >= 80 && usagePercent < 100 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-amber-400 text-xs">
              {limit.remaining}회 남음
            </span>
            {showUpgradeButton && (
              <button
                onClick={() => openUpgradeModal(feature)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                더 사용하기 →
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ====== FULL 변형 ======
  return (
    <div className={`p-4 bg-dark-800/80 rounded-2xl border border-dark-700 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl
                          ${usagePercent >= 100 ? 'bg-red-500/20' : 'bg-dark-700'}`}>
            {featureIcon}
          </div>
          <div>
            <p className="text-dark-100 font-medium">{featureName}</p>
            <p className="text-dark-500 text-xs">일일 사용량</p>
          </div>
        </div>

        <div className="text-right">
          <p className={`text-2xl font-bold ${statusColor}`}>
            {limit.used}<span className="text-dark-500 text-lg">/{limit.limit}</span>
          </p>
          <p className="text-dark-500 text-xs">
            {limit.remaining > 0 ? `${limit.remaining}회 남음` : '소진됨'}
          </p>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
          style={{ width: `${usagePercent}%` }}
        />
        {/* 마일스톤 마커 */}
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-dark-600" />
        <div className="absolute top-0 left-[80%] w-0.5 h-full bg-dark-600" />
      </div>

      {/* 상태 메시지 */}
      {usagePercent >= 100 ? (
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <p className="text-red-400 font-medium">
              오늘 사용량을 모두 소진했습니다
            </p>
          </div>
          <p className="text-dark-400 text-sm mb-3">
            업그레이드하면 더 많이 이용할 수 있습니다
          </p>
          {showUpgradeButton && (
            <button
              onClick={() => openUpgradeModal(feature)}
              className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-purple-500
                         text-white font-medium rounded-lg
                         hover:from-brand-400 hover:to-purple-400 transition-all"
            >
              🚀 업그레이드하고 계속 사용하기
            </button>
          )}
        </div>
      ) : usagePercent >= 80 ? (
        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              <p className="text-amber-400 text-sm">
                곧 사용량이 소진됩니다
              </p>
            </div>
            {showUpgradeButton && (
              <button
                onClick={() => openUpgradeModal(feature)}
                className="text-sm text-brand-400 hover:text-brand-300 font-medium"
              >
                업그레이드 →
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-500">
            자정에 초기화됩니다
          </span>
          <span className="text-emerald-400">
            여유 있음 ✓
          </span>
        </div>
      )}
    </div>
  );
}

// 여러 기능의 사용량을 한번에 표시
interface MultiUsageLimitProps {
  features: FeatureType[];
  className?: string;
}

export function MultiUsageLimit({ features, className = '' }: MultiUsageLimitProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {features.map((feature) => (
        <UsageLimitWarning
          key={feature}
          feature={feature}
          variant="compact"
          showUpgradeButton={false}
        />
      ))}
    </div>
  );
}

// 플로팅 사용량 인디케이터
interface FloatingUsageIndicatorProps {
  feature: FeatureType;
}

export function FloatingUsageIndicator({ feature }: FloatingUsageIndicatorProps) {
  const { limit } = useUsageLimit(feature);
  const { openUpgradeModal } = useSubscription();

  if (limit.limit === -1) return null; // 무제한

  const usagePercent = (limit.used / limit.limit) * 100;
  const isLow = usagePercent >= 80;
  const isEmpty = usagePercent >= 100;

  return (
    <button
      onClick={() => isEmpty && openUpgradeModal(feature)}
      className={`fixed bottom-20 right-4 z-40 px-3 py-2 rounded-full shadow-lg
                  flex items-center gap-2 transition-all duration-300
                  ${isEmpty 
                    ? 'bg-red-500 text-white animate-pulse cursor-pointer' 
                    : isLow 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-dark-800 text-dark-300 border border-dark-700'
                  }`}
    >
      <span className="text-sm">{FEATURE_ICONS[feature]}</span>
      <span className="text-sm font-medium">
        {limit.used}/{limit.limit}
      </span>
      {isEmpty && <span className="text-xs">→ 업그레이드</span>}
    </button>
  );
}

export default UsageLimitWarning;
