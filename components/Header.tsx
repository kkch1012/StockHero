'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';
import { useCurrentPlan, useSubscription } from '@/lib/subscription/hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdmin } from '@/lib/admin/config';
import { CrownIcon, SparklesIcon, ZapIcon, Menu, X, ShieldCheckIcon } from 'lucide-react';

const NAV_LINKS: { href: string; label: string; icon: string }[] = [
  { href: '/', label: 'Top 5', icon: '🏆' },
  { href: '/analysis', label: '분석', icon: '🔍' },
  { href: '/calendar', label: '달력', icon: '📅' },
  { href: '/backtest', label: '백테스트', icon: '📈' },
  { href: '/consult', label: 'AI 상담', icon: '💬' },
];

// 플랜별 배지 스타일
const PLAN_BADGE_STYLES = {
  free: { label: '무료', bg: 'bg-dark-700', text: 'text-dark-300', border: '' },
  lite: { label: 'LITE', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border border-cyan-500/30' },
  basic: { label: 'BASIC', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border border-blue-500/30' },
  pro: { label: 'PRO', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border border-purple-500/30' },
  vip: { label: 'VIP', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border border-amber-500/30 ring-1 ring-amber-500/20' },
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  
  // 관리자 여부 확인
  const userIsAdmin = isAdmin(user?.email);
  
  // 구독 정보
  const { planName, isPremium, isVip, isLoading: planLoading } = useCurrentPlan();
  const planBadge = PLAN_BADGE_STYLES[planName as keyof typeof PLAN_BADGE_STYLES] || PLAN_BADGE_STYLES.free;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container-app py-3">
        <nav className="glass rounded-2xl px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-white font-bold text-sm sm:text-base">S</span>
              </div>
              <span className="font-bold text-dark-50 group-hover:text-white transition-colors text-base sm:text-lg hidden sm:block whitespace-nowrap">
                StockHero
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-white bg-brand-500/20 border border-brand-500/30'
                      : 'text-dark-300 hover:text-white hover:bg-dark-800/60'
                  }`}
                >
                  <span className="text-base">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              
              {/* VIP 메뉴 (VIP 회원만) */}
              {isVip && (
                <Link
                  href="/vip"
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/vip')
                      ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                      : 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <CrownIcon className="w-4 h-4" />
                  <span>VIP</span>
                </Link>
              )}
              
              {/* 관리자 메뉴 */}
              {userIsAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive('/admin')
                      ? 'text-red-400 bg-red-500/20 border border-red-500/30'
                      : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>관리자</span>
                </Link>
              )}
              
              <div className="ml-2 xl:ml-4 pl-2 xl:pl-4 border-l border-dark-700 flex items-center gap-2 xl:gap-3">
                {/* 플랜 배지 */}
                {!planLoading && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${planBadge.bg} ${planBadge.text} ${planBadge.border} flex items-center gap-1 whitespace-nowrap`}>
                    {isVip && <CrownIcon className="w-3 h-3" />}
                    {planName === 'pro' && <SparklesIcon className="w-3 h-3" />}
                    {planBadge.label}
                  </div>
                )}
                
                <UserMenu />
              </div>
            </div>

            {/* Mobile/Tablet Menu Button & User Menu */}
            <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
              <UserMenu />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-dark-300 hover:text-white hover:bg-dark-800/60 rounded-xl transition-all"
                aria-label="메뉴 열기"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-3 pt-3 border-t border-dark-700/50">
              <div className="grid grid-cols-2 gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                      isActive(link.href)
                        ? 'text-white bg-brand-500/20 border border-brand-500/30'
                        : 'text-dark-300 hover:text-white hover:bg-dark-800/60 border border-dark-800/50'
                    }`}
                  >
                    <span className="text-base">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
                
                {/* VIP 메뉴 (VIP 회원만) */}
                {isVip && (
                  <Link
                    href="/vip"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 col-span-2 whitespace-nowrap ${
                      isActive('/vip')
                        ? 'text-amber-400 bg-amber-500/20 border border-amber-500/30'
                        : 'text-amber-400/70 hover:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    <CrownIcon className="w-4 h-4" />
                    <span>VIP 대시보드</span>
                  </Link>
                )}
                
                {/* 관리자 메뉴 (관리자만) */}
                {userIsAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center gap-2 col-span-2 whitespace-nowrap ${
                      isActive('/admin')
                        ? 'text-red-400 bg-red-500/20 border border-red-500/30'
                        : 'text-red-400/70 hover:text-red-400 border border-red-500/20'
                    }`}
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>관리자</span>
                  </Link>
                )}
              </div>
              
              {/* 모바일 플랜 배지 */}
              {!planLoading && (
                <div className="mt-3 flex justify-center">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${planBadge.bg} ${planBadge.text} ${planBadge.border} flex items-center gap-1 whitespace-nowrap`}>
                    {isVip && <CrownIcon className="w-3 h-3" />}
                    {planName === 'pro' && <SparklesIcon className="w-3 h-3" />}
                    <span>{planBadge.label}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
