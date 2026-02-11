'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { user, loading, signInWithGoogle, signInWithEmail, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // 이미 로그인 상태면 redirect
  useEffect(() => {
    if (!loading && user) {
      router.push(redirect);
    }
  }, [user, loading, router, redirect]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (password.length < 6) {
          setError('비밀번호는 6자 이상이어야 합니다.');
          return;
        }
        const result = await signUp(email, password);
        if (result.error) {
          setError(result.error);
        } else {
          setSignUpSuccess(true);
        }
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : result.error
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch {
      setError('Google 로그인에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) return null;

  return (
    <main className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              StockHero
            </h1>
          </Link>
          <p className="text-dark-400 mt-2">AI 교차검증 주식 분석 서비스</p>
        </div>

        {/* Card */}
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-dark-100 text-center mb-6">
            {isSignUp ? '회원가입' : '로그인'}
          </h2>

          {/* 회원가입 성공 메시지 */}
          {signUpSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-emerald-400 font-medium mb-1">가입 완료!</p>
              <p className="text-dark-400 text-sm">
                인증 이메일을 확인해주세요. 이메일의 링크를 클릭하면 로그인할 수 있습니다.
              </p>
              <button
                onClick={() => { setIsSignUp(false); setSignUpSuccess(false); }}
                className="mt-3 text-brand-400 text-sm hover:text-brand-300 transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}

          {!signUpSuccess && (
            <>
              {/* Google 로그인 */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-dark-900 font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 {isSignUp ? '가입하기' : '로그인'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-dark-700" />
                <span className="text-dark-500 text-sm">또는</span>
                <div className="flex-1 h-px bg-dark-700" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1.5">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1.5">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? '6자 이상 입력' : '비밀번호 입력'}
                    required
                    minLength={isSignUp ? 6 : undefined}
                    className="w-full px-4 py-3 rounded-xl bg-dark-700 border border-dark-600 text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
                </button>
              </form>

              {/* Toggle sign up / sign in */}
              <div className="text-center mt-6">
                <span className="text-dark-500 text-sm">
                  {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
                </span>
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="ml-2 text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors"
                >
                  {isSignUp ? '로그인' : '회원가입'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-dark-600 text-xs mt-6">
          로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
