'use client';

import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 에러를 잡아서 폴백 UI를 표시
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (프로덕션에서는 외부 서비스로 전송)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 콜백 호출
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-xl font-bold text-dark-100 mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-dark-400 mb-6">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-dark-700 text-dark-200 rounded-lg hover:bg-dark-600 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-dark-500 text-sm cursor-pointer hover:text-dark-400">
                  개발자 정보 보기
                </summary>
                <pre className="mt-2 p-4 bg-dark-800 rounded-lg text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 페이지 레벨 에러 바운더리
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-8">
          <div className="text-center max-w-lg">
            <div className="text-8xl mb-6">🔧</div>
            <h1 className="text-3xl font-bold text-dark-100 mb-4">
              페이지를 불러올 수 없습니다
            </h1>
            <p className="text-dark-400 mb-8">
              일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
              문제가 지속되면 고객센터로 문의해주세요.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
              >
                페이지 새로고침
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-dark-700 text-dark-200 rounded-xl font-semibold hover:bg-dark-600 transition-colors"
              >
                이전 페이지
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * 섹션 레벨 에러 바운더리 (카드/섹션용)
 */
export function SectionErrorBoundary({
  children,
  title = '콘텐츠',
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="card p-6 text-center">
          <div className="text-4xl mb-3">😔</div>
          <p className="text-dark-400">
            {title}을(를) 불러오는 중 문제가 발생했습니다
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 text-sm bg-dark-700 text-dark-300 rounded-lg hover:bg-dark-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
