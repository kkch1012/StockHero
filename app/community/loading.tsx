// 커뮤니티 페이지 로딩 UI
export default function CommunityLoading() {
  return (
    <div className="min-h-screen bg-dark-950 pt-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="h-8 w-32 bg-dark-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-48 bg-dark-800 rounded animate-pulse" />
        </div>

        {/* 글쓰기 버튼 스켈레톤 */}
        <div className="h-12 w-full bg-dark-800 rounded-xl animate-pulse mb-6" />

        {/* 게시글 스켈레톤 */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
              {/* 작성자 정보 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-dark-800 animate-pulse" />
                <div>
                  <div className="h-4 w-24 bg-dark-800 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-dark-800 rounded animate-pulse" />
                </div>
              </div>

              {/* 본문 */}
              <div className="space-y-2 mb-4">
                <div className="h-4 w-full bg-dark-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-dark-800 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-dark-800 rounded animate-pulse" />
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-6 pt-3 border-t border-dark-800">
                <div className="h-5 w-16 bg-dark-800 rounded animate-pulse" />
                <div className="h-5 w-16 bg-dark-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
