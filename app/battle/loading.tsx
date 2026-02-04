// 배틀 페이지 로딩 UI (스켈레톤)
export default function BattleLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-dark-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-32 bg-dark-800 rounded animate-pulse" />
        </div>

        {/* AI 카드 스켈레톤 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-dark-800 animate-pulse" />
                <div>
                  <div className="h-5 w-24 bg-dark-800 rounded animate-pulse mb-2" />
                  <div className="h-3 w-16 bg-dark-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-dark-800 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-dark-800 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-dark-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* 토론 영역 스켈레톤 */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          <div className="h-6 w-32 bg-dark-800 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-dark-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-dark-800 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-dark-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
