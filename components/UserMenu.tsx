'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrentPlan } from '@/lib/subscription/hooks';

export function UserMenu() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { displayName: planDisplayName } = useCurrentPlan();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-dark-700 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white text-dark-900 font-medium text-xs sm:text-sm hover:bg-gray-100 transition-all duration-200 shadow-lg whitespace-nowrap shrink-0"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="hidden sm:inline">Google</span>
        <span className="sm:hidden">G</span>
        <span className="hidden sm:inline">로그인</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-dark-800 transition-colors"
        aria-label="사용자 메뉴"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.full_name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-medium text-sm">
            {user.email?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl bg-dark-800 border border-dark-700 shadow-xl overflow-hidden z-50"
          role="menu"
          aria-label="사용자 메뉴"
        >
          <div className="p-4 border-b border-dark-700">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-100 truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-dark-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-1">
            <Link
              href="/mypage"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              마이페이지
            </Link>
            <Link
              href="/mypage?tab=watchlist"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              관심 종목
            </Link>
            <Link
              href="/mypage?tab=subscription"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <span className="flex items-center gap-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                구독 관리
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">
                {planDisplayName}
              </span>
            </Link>
            <Link
              href="/mypage?tab=settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              설정
            </Link>
            <div className="border-t border-dark-700 my-1" />
            <button
              onClick={async () => {
                await signOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-dark-300 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

