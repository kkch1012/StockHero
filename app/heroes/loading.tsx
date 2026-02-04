// 히어로즈 페이지 로딩 UI
export default function HeroesLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="h-10 w-64 bg-dark-800 rounded-lg animate-pulse mx-auto mb-4" />
          <div className="h-5 w-96 bg-dark-800 rounded animate-pulse mx-auto" />
        </div>

        {/* AI 캐릭터 카드 그리드 */}
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden"
            >
              {/* 이미지 영역 */}
              <div className="h-48 bg-dark-800 animate-pulse" />

              {/* 정보 영역 */}
              <div className="p-6">
                <div className="h-6 w-32 bg-dark-800 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-dark-800 rounded animate-pulse mb-4" />

                {/* 태그 */}
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 w-16 bg-dark-800 rounded-full animate-pulse" />
                  ))}
                </div>

                {/* 통계 */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-800">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="text-center">
                      <div className="h-6 w-12 bg-dark-800 rounded animate-pulse mx-auto mb-1" />
                      <div className="h-3 w-8 bg-dark-800 rounded animate-pulse mx-auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
