// 마이페이지 로딩 UI
export default function MyPageLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 프로필 헤더 스켈레톤 */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-dark-800 animate-pulse" />
            <div>
              <div className="h-6 w-32 bg-dark-800 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-dark-800 rounded animate-pulse mb-2" />
              <div className="h-5 w-24 bg-dark-800 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* 탭 스켈레톤 */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-dark-800 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* 콘텐츠 스켈레톤 */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                <div className="w-12 h-12 bg-dark-800 rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-dark-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-dark-800 rounded animate-pulse" />
                </div>
                <div className="h-8 w-20 bg-dark-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
