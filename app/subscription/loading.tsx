// 구독 페이지 로딩 UI
export default function SubscriptionLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="h-10 w-48 bg-dark-800 rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-5 w-72 bg-dark-800 rounded animate-pulse mx-auto" />
        </div>

        {/* 요금제 토글 */}
        <div className="flex justify-center mb-8">
          <div className="h-10 w-64 bg-dark-800 rounded-full animate-pulse" />
        </div>

        {/* 플랜 카드 그리드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`bg-dark-900 border rounded-2xl p-6 ${
                i === 2 ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-dark-800'
              }`}
            >
              {/* 플랜 이름 */}
              <div className="h-8 w-24 bg-dark-800 rounded animate-pulse mb-2" />

              {/* 가격 */}
              <div className="h-12 w-32 bg-dark-800 rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-dark-800 rounded animate-pulse mb-6" />

              {/* 기능 목록 */}
              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-dark-800 rounded animate-pulse" />
                    <div className="h-4 flex-1 bg-dark-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              {/* 버튼 */}
              <div className="h-12 w-full bg-dark-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>

        {/* FAQ 스켈레톤 */}
        <div className="mt-16">
          <div className="h-8 w-32 bg-dark-800 rounded animate-pulse mx-auto mb-8" />
          <div className="space-y-4 max-w-2xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                <div className="h-5 w-3/4 bg-dark-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
