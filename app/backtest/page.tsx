'use client';

import { Header } from '@/components';
import { useCurrentPlan } from '@/lib/subscription/hooks';
import Link from 'next/link';
import { 
  CrownIcon, 
  BarChart3Icon,
  TrendingUpIcon,
  CheckIcon,
  SparklesIcon,
} from 'lucide-react';

export default function BacktestPage() {
  const { isVip, isLoading } = useCurrentPlan();

  // VIP 회원이면 VIP 페이지로 안내
  if (!isLoading && isVip) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-dark-950 pt-24 pb-12">
          <div className="fixed inset-0 bg-grid opacity-30" />
          <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px]" />
          
          <div className="relative container-app text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500/20 rounded-full mb-6">
              <CrownIcon className="w-10 h-10 text-amber-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-dark-100 mb-4">VIP 백테스트로 이동하세요!</h1>
            <p className="text-dark-400 mb-8 max-w-md mx-auto">
              VIP 회원님은 VIP 대시보드에서 무제한 기간 백테스트를 이용하실 수 있습니다.
            </p>

            <Link
              href="/vip?tab=backtest"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <BarChart3Icon className="w-5 h-5" />
              VIP 백테스트 바로가기
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-dark-950 pt-24 pb-12">
        {/* Background */}
        <div className="fixed inset-0 bg-grid opacity-30" />
        <div className="fixed top-1/4 left-0 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[100px]" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />

        <div className="relative container-app">
          {/* Hero Section */}
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-3xl mb-8">
              <BarChart3Icon className="w-12 h-12 text-amber-400" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-dark-100">AI 추천</span>{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">백테스트</span>
            </h1>
            
            <p className="text-dark-400 text-lg max-w-xl mx-auto mb-8">
              과거 AI 추천대로 투자했다면 어떤 수익이 났을까요?<br />
              <span className="text-amber-400 font-medium">VIP 전용</span> 무제한 기간 백테스트
            </p>

            {/* Preview Stats */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-dark-900/80 border border-dark-800 rounded-2xl p-6">
                <p className="text-sm text-dark-500 mb-4">지난 6개월 백테스트 예시</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-400">+18.5%</p>
                    <p className="text-xs text-dark-500 mt-1">평균 수익률</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-400">67%</p>
                    <p className="text-xs text-dark-500 mt-1">승률</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">142개</p>
                    <p className="text-xs text-dark-500 mt-1">분석 종목</p>
                  </div>
                </div>
              </div>
            </div>

            {/* VIP Features */}
            <div className="max-w-3xl mx-auto mb-12">
              <h2 className="text-xl font-bold text-dark-100 mb-6">VIP 백테스트 기능</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-dark-800/50 rounded-xl p-5 text-left flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUpIcon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-100 mb-1">무제한 기간 분석</h3>
                    <p className="text-sm text-dark-500">원하는 기간만큼 과거 데이터 분석</p>
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-5 text-left flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-100 mb-1">전략별 비교</h3>
                    <p className="text-sm text-dark-500">전체/만장일치/1위만 전략 비교</p>
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-5 text-left flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3Icon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-100 mb-1">종목별 상세 수익률</h3>
                    <p className="text-sm text-dark-500">추천가 → 현재가 수익률 계산</p>
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-5 text-left flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <SparklesIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-100 mb-1">최고/최저 성과</h3>
                    <p className="text-sm text-dark-500">베스트 & 워스트 종목 분석</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-lg rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
            >
              <CrownIcon className="w-6 h-6" />
              VIP 업그레이드하고 백테스트 시작하기
            </Link>
            
            <p className="text-dark-500 text-sm mt-4">
              VIP 회원은 모든 VIP 기능 + 무제한 백테스트 이용 가능
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
