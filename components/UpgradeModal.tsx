'use client';

import { X, Check, Zap, Crown, Sparkles, Star } from 'lucide-react';
import { SubscriptionTier, TIER_PRICES } from '@/types/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  highlightFeature?: string;
}

export function UpgradeModal({ isOpen, onClose, currentTier, highlightFeature }: UpgradeModalProps) {
  if (!isOpen) return null;

  const tierOrder: SubscriptionTier[] = ['free', 'basic', 'pro', 'vip'];
  const currentTierIndex = tierOrder.indexOf(currentTier);

  const plans = [
    {
      tier: 'basic' as SubscriptionTier,
      name: 'Basic',
      price: TIER_PRICES.basic.monthly.toLocaleString(),
      yearlyPrice: TIER_PRICES.basic.yearly.toLocaleString(),
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/50',
      bgColor: 'bg-blue-500/5',
      features: [
        { text: 'Top 5 종목 전체 공개', highlight: highlightFeature === 'top5' },
        { text: 'AI별 개별 점수 확인', highlight: highlightFeature === 'scores' },
        { text: '최근 30일 추천 이력', highlight: highlightFeature === 'history' },
        { text: '광고 제거', highlight: false },
      ],
    },
    {
      tier: 'pro' as SubscriptionTier,
      name: 'Pro',
      price: TIER_PRICES.pro.monthly.toLocaleString(),
      yearlyPrice: TIER_PRICES.pro.yearly.toLocaleString(),
      icon: Star,
      color: 'from-brand-500 to-brand-600',
      borderColor: 'border-brand-500/50',
      bgColor: 'bg-brand-500/5',
      popular: true,
      features: [
        { text: 'Basic 모든 기능 포함', highlight: false },
        { text: 'AI 토론 전문 열람', highlight: highlightFeature === 'reasoning' },
        { text: '실시간 매매 시그널', highlight: highlightFeature === 'signal' },
        { text: '백테스트 성과 분석', highlight: highlightFeature === 'backtest' },
        { text: 'AI 포트폴리오 진단', highlight: false },
        { text: '실시간 푸시 알림', highlight: false },
      ],
    },
    {
      tier: 'vip' as SubscriptionTier,
      name: 'VIP',
      price: TIER_PRICES.vip.monthly.toLocaleString(),
      yearlyPrice: TIER_PRICES.vip.yearly.toLocaleString(),
      icon: Crown,
      color: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-500/5',
      features: [
        { text: 'Pro 모든 기능 포함', highlight: false },
        { text: 'VIP 전용 종목 추천', highlight: highlightFeature === 'vip_stocks' },
        { text: '커스텀 AI 심층 분석', highlight: false },
        { text: 'AI 상담/토론 무제한', highlight: false },
        { text: '우선 고객 지원', highlight: false },
      ],
    },
  ];

  const handleUpgrade = (tier: SubscriptionTier) => {
    window.location.href = `/subscription?plan=${tier}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div
        className="relative bg-dark-900 border border-dark-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-dark-800 rounded-lg transition-colors z-10"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-dark-400" />
        </button>

        {/* 헤더 */}
        <div className="p-6 text-center border-b border-dark-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-500/20 to-purple-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-brand-400" />
          </div>
          <h2 id="upgrade-modal-title" className="text-2xl font-bold mb-2">더 많은 인사이트를 원하시나요?</h2>
          <p className="text-dark-400">
            구독을 업그레이드하고 AI가 선정한 모든 종목을 확인하세요
          </p>
        </div>

        {/* 플랜 카드 */}
        <div className="p-6 grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const planIndex = tierOrder.indexOf(plan.tier);
            const isCurrentPlan = currentTier === plan.tier;
            const canUpgrade = planIndex > currentTierIndex;

            return (
              <div
                key={plan.tier}
                className={`relative border rounded-xl p-5 transition-all ${
                  plan.popular
                    ? `${plan.borderColor} ${plan.bgColor}`
                    : 'border-dark-700 bg-dark-800/50'
                } ${canUpgrade ? 'hover:scale-[1.02] hover:shadow-lg' : ''}`}
              >
                {/* 인기 배지 */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold rounded-full">
                    추천
                  </div>
                )}

                {/* 아이콘 */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                {/* 플랜 이름 & 가격 */}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">₩{plan.price}</span>
                  <span className="text-dark-400">/월</span>
                  <p className="text-xs text-dark-500 mt-1">
                    연간 결제시 ₩{plan.yearlyPrice}/년
                  </p>
                </div>

                {/* 기능 목록 */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm ${
                        feature.highlight ? 'text-brand-400 font-medium' : ''
                      }`}
                    >
                      <Check className={`w-4 h-4 flex-shrink-0 ${
                        feature.highlight ? 'text-brand-400' : 'text-emerald-400'
                      }`} />
                      <span>{feature.text}</span>
                      {feature.highlight && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-brand-500/20 text-brand-400 rounded">
                          필요
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                {/* 업그레이드 버튼 */}
                <button
                  onClick={() => canUpgrade && handleUpgrade(plan.tier)}
                  disabled={!canUpgrade}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isCurrentPlan
                      ? 'bg-dark-700 text-dark-400 cursor-not-allowed'
                      : !canUpgrade
                        ? 'bg-dark-700 text-dark-500 cursor-not-allowed'
                        : plan.popular
                          ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:opacity-90'
                          : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                  }`}
                >
                  {isCurrentPlan ? '현재 플랜' : !canUpgrade ? '현재 플랜 이하' : '업그레이드'}
                </button>
              </div>
            );
          })}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-dark-800 text-center">
          <p className="text-xs text-dark-500">
            언제든지 해지 가능 · 환불 보장 · 안전한 결제
          </p>
        </div>
      </div>
    </div>
  );
}
