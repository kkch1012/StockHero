// 캘린더 페이지 로딩 UI
export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="h-8 w-48 bg-dark-800 rounded-lg animate-pulse mx-auto mb-2" />
          <div className="h-4 w-64 bg-dark-800 rounded animate-pulse mx-auto" />
        </div>

        {/* 캘린더 그리드 스켈레톤 */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-8 h-8 bg-dark-800 rounded animate-pulse" />
            <div className="h-6 w-32 bg-dark-800 rounded animate-pulse" />
            <div className="w-8 h-8 bg-dark-800 rounded animate-pulse" />
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div key={day} className="text-center text-dark-500 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-dark-800 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 20}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
