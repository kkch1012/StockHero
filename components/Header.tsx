'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from './UserMenu';
import { useCurrentPlan } from '@/lib/subscription/hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { isAdmin } from '@/lib/admin/config';
import { SparklesIcon, Menu, X, ShieldCheckIcon } from 'lucide-react';

const NAV_LINKS: { href: string; label: string; icon: string; pro?: boolean }[] = [
  { href: '/', label: 'Top 5', icon: '🏆' },
  { href: '/analysis', label: 'AI분석', icon: '🔍' },
  { href: '/calendar', label: '달력', icon: '📅' },
  { href: '/consult', label: 'AI상담', icon: '💬' },
  { href: '/community', label: '커뮤니티', icon: '👥' },
  { href: '/investment-style', label: '투자성향', icon: '🧬' },
  { href: '/portfolio', label: '포트폴리오', icon: '💼', pro: true },
  { href: '/backtest', label: '백테스트', icon: '📈', pro: true },
];

// 플랜별 배지 스타일
const PLAN_BADGE_STYLES = {
  free: { label: '무료', bg: 'bg-dark-700', text: 'text-dark-300', border: '' },
  lite: { label: 'LITE', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border border-cyan-500/30' },
  basic: { label: 'BASIC', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border border-blue-500/30' },
  pro: { label: 'PRO', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border border-purple-500/30' },
};

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // 관리자 여부 확인
  const userIsAdmin = isAdmin(user?.email);

  // 구독 정보
  const { planName, isLoading: planLoading } = useCurrentPlan();
  const planBadge = PLAN_BADGE_STYLES[planName as keyof typeof PLAN_BADGE_STYLES] || PLAN_BADGE_STYLES.free;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <nav className="glass rounded-2xl px-3 sm:px-4 lg:px-5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-dark-50 group-hover:text-white transition-colors hidden sm:block whitespace-nowrap">
                StockHero
              </span>
            </Link>

            {/* Desktop Navigation - 텍스트만, 아이콘 제거로 공간 확보 */}
            <div className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 xl:px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                    isActive(link.href)
                      ? 'text-white bg-brand-500/20'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800/60'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.pro && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
                      PRO
                    </span>
                  )}
                </Link>
              ))}

              {/* 관리자 메뉴 */}
              {userIsAdmin && (
                <Link
                  href="/admin"
                  className={`px-2.5 py-1.5 text-[13px] font-medium rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                    isActive('/admin')
                      ? 'text-red-400 bg-red-500/20'
                      : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>관리자</span>
                </Link>
              )}
            </div>

            {/* Right side - 프로필 항상 표시 */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 플랜 배지 (유료 플랜만, 데스크톱만) */}
              {!planLoading && planName !== 'free' && (
                <div className={`hidden lg:flex px-2 py-1 rounded-full text-xs font-medium ${planBadge.bg} ${planBadge.text} ${planBadge.border} items-center gap-1 whitespace-nowrap`}>
                  {planName === 'pro' && <SparklesIcon className="w-3 h-3" />}
                  {planBadge.label}
                </div>
              )}

              {/* 프로필 (항상 표시) */}
              <UserMenu />

              {/* 모바일 햄버거 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-dark-300 hover:text-white hover:bg-dark-800/60 rounded-xl transition-all"
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
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    {link.pro && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        PRO
                      </span>
                    )}
                  </Link>
                ))}

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

              {/* 모바일 플랜 배지 (유료 플랜만) */}
              {!planLoading && planName !== 'free' && (
                <div className="mt-3 flex justify-center">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${planBadge.bg} ${planBadge.text} ${planBadge.border} flex items-center gap-1 whitespace-nowrap`}>
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
