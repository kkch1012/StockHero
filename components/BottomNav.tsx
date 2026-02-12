'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, MessageSquare, Users, User } from 'lucide-react';

const TABS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/analysis', label: '분석', icon: BarChart3 },
  { href: '/consult', label: '상담', icon: MessageSquare },
  { href: '/community', label: '커뮤니티', icon: Users },
  { href: '/mypage', label: '마이', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="glass border-t border-dark-700/50">
        <div className="flex items-center justify-around px-2 py-1.5 safe-area-bottom">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                  active
                    ? 'text-brand-400'
                    : 'text-dark-500 active:text-dark-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
