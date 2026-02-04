// 메인 페이지 로딩 UI
export default function Loading() {
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="text-center">
        {/* 로고 애니메이션 */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 animate-pulse" />
          <div className="absolute inset-2 rounded-xl bg-dark-900 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
