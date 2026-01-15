'use client';

import { ReactNode } from 'react';
import { useSubscription, useCurrentPlan, PLAN_DISPLAY_NAMES, isPlanHigherThan } from '@/lib/subscription';

interface LockedContentProps {
  children: ReactNode;
  requiredPlan: 'basic' | 'pro' | 'vip';
  blurIntensity?: 'light' | 'medium' | 'heavy';
  teaser?: string;
  teaserEmoji?: string;
  showLockIcon?: boolean;
  className?: string;
}

const BLUR_LEVELS = {
  light: 'blur-[4px]',
  medium: 'blur-[8px]',
  heavy: 'blur-[12px]',
};

export function LockedContent({
  children,
  requiredPlan,
  blurIntensity = 'medium',
  teaser,
  teaserEmoji = '🔒',
  showLockIcon = true,
  className = '',
}: LockedContentProps) {
  const { openUpgradeModal } = useSubscription();
  const { planName, isLoading } = useCurrentPlan();

  // 접근 권한 체크
  const hasAccess = isPlanHigherThan(planName, 'free') && 
    (planName === requiredPlan || isPlanHigherThan(planName, requiredPlan) || planName === requiredPlan);
  
  // 실제로는 현재 플랜이 required 플랜 이상인지 체크
  const canAccess = (() => {
    const planOrder = ['free', 'basic', 'pro', 'vip'];
    const currentIndex = planOrder.indexOf(planName);
    const requiredIndex = planOrder.indexOf(requiredPlan);
    return currentIndex >= requiredIndex;
  })();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-dark-800/50 rounded-xl ${className}`}>
        {children}
      </div>
    );
  }

  if (canAccess) {
    return <>{children}</>;
  }

  const requiredPlanName = PLAN_DISPLAY_NAMES[requiredPlan];

  return (
    <div className={`relative group ${className}`}>
      {/* 블러된 콘텐츠 */}
      <div className={`${BLUR_LEVELS[blurIntensity]} select-none pointer-events-none`}>
        {children}
      </div>

      {/* 오버레이 */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/60 to-transparent 
                   flex flex-col items-center justify-center cursor-pointer
                   transition-all duration-300 group-hover:from-dark-900/95"
        onClick={() => openUpgradeModal()}
      >
        {/* 잠금 아이콘 */}
        {showLockIcon && (
          <div className="w-16 h-16 rounded-full bg-dark-800/80 backdrop-blur-sm 
                          flex items-center justify-center mb-4
                          border border-dark-700/50 shadow-xl
                          group-hover:scale-110 group-hover:border-brand-500/50 transition-all duration-300">
            <span className="text-3xl">{teaserEmoji}</span>
          </div>
        )}

        {/* 티저 메시지 (FOMO 유발) */}
        {teaser && (
          <div className="mb-3 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                          rounded-full border border-amber-500/30 backdrop-blur-sm
                          animate-pulse">
            <span className="text-amber-300 text-sm font-medium">
              ✨ {teaser}
            </span>
          </div>
        )}

        {/* 업그레이드 안내 */}
        <p className="text-dark-300 text-sm mb-4 text-center px-4">
          <span className="text-brand-400 font-semibold">{requiredPlanName}</span> 플랜에서
          <br />확인할 수 있습니다
        </p>

        {/* CTA 버튼 */}
        <button
          className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-purple-500 
                     text-white font-semibold rounded-full
                     hover:from-brand-400 hover:to-purple-400
                     transform group-hover:scale-105 transition-all duration-300
                     shadow-lg shadow-brand-500/25"
        >
          🚀 업그레이드하기
        </button>

        {/* 가격 안내 */}
        <p className="mt-3 text-dark-500 text-xs">
          {requiredPlan === 'basic' && '월 9,900원부터'}
          {requiredPlan === 'pro' && '월 29,900원부터'}
          {requiredPlan === 'vip' && '월 79,900원부터'}
        </p>
      </div>

      {/* 반짝이는 테두리 효과 */}
      <div className="absolute inset-0 rounded-xl pointer-events-none
                      bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0
                      opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      animate-shimmer" />
    </div>
  );
}

export default LockedContent;
