'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DisclaimerBar, Header } from '@/components';

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: 'text' | 'consultation' | 'portfolio';
  shared_stock_code?: string;
  shared_stock_name?: string;
  image_urls: string[];
  like_count: number;
  comment_count: number;
  created_at: string;
  user_profiles?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
  isLiked?: boolean;
}

interface StockRoom {
  code: string;
  name: string;
  postCount: number;
  lastActivity: string;
}

const POPULAR_STOCKS: StockRoom[] = [
  { code: '005930', name: '삼성전자', postCount: 128, lastActivity: '방금 전' },
  { code: '000660', name: 'SK하이닉스', postCount: 89, lastActivity: '5분 전' },
  { code: '373220', name: 'LG에너지솔루션', postCount: 67, lastActivity: '12분 전' },
  { code: '035720', name: '카카오', postCount: 54, lastActivity: '20분 전' },
  { code: '035420', name: 'NAVER', postCount: 43, lastActivity: '30분 전' },
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
  return date.toLocaleDateString('ko-KR');
}

function PostCard({ post, onLike, onComment }: { 
  post: Post; 
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
}) {
  const profile = post.user_profiles;
  
  return (
    <div className="card hover:border-dark-700 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-medium">
          {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-dark-100">
              {profile?.display_name || profile?.username || '익명'}
            </span>
            {post.post_type === 'consultation' && (
              <span className="px-2 py-0.5 text-xs bg-brand-500/20 text-brand-400 rounded-full">
                AI 상담
              </span>
            )}
            {post.post_type === 'portfolio' && (
              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                포트폴리오
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-dark-500">
            <span>{formatTimeAgo(post.created_at)}</span>
            {post.shared_stock_name && (
              <>
                <span>•</span>
                <Link 
                  href={`/community/stock/${post.shared_stock_code}`}
                  className="text-brand-400 hover:text-brand-300"
                >
                  #{post.shared_stock_name}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {post.image_urls.slice(0, 4).map((url, i) => (
            <div key={i} className="aspect-video rounded-xl bg-dark-800 overflow-hidden">
              <img src={url} alt={`게시글 이미지 ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-dark-800">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-2 text-sm transition-colors ${
            post.isLiked ? 'text-rose-400' : 'text-dark-500 hover:text-rose-400'
          }`}
        >
          <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.like_count}</span>
        </button>
        <button
          onClick={() => onComment(post.id)}
          className="flex items-center gap-2 text-sm text-dark-500 hover:text-brand-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>{post.comment_count}</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-dark-500 hover:text-dark-300 transition-colors ml-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span>공유</span>
        </button>
      </div>
    </div>
  );
}

function CreatePostModal({ 
  isOpen, 
  onClose, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit: (content: string, stockCode?: string, stockName?: string) => void;
}) {
  const [content, setContent] = useState('');
  const [selectedStock, setSelectedStock] = useState<{ code: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    await onSubmit(content, selectedStock?.code, selectedStock?.name);
    setContent('');
    setSelectedStock(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-dark-900 rounded-2xl border border-dark-700 overflow-hidden">
        <div className="p-4 border-b border-dark-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-dark-100">새 글 작성</h3>
            <button onClick={onClose} className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="종목에 대한 의견이나 AI 상담 결과를 공유해보세요..."
            className="w-full h-40 bg-dark-800 border border-dark-700 rounded-xl p-4 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-brand-500"
          />

          {/* Stock Tag */}
          <div className="mt-4">
            <label className="text-sm text-dark-400 mb-2 block">종목 태그 (선택)</label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_STOCKS.slice(0, 5).map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => setSelectedStock(
                    selectedStock?.code === stock.code ? null : { code: stock.code, name: stock.name }
                  )}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    selectedStock?.code === stock.code
                      ? 'bg-brand-500 text-white'
                      : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                  }`}
                >
                  #{stock.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-dark-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dark-400 hover:text-dark-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="btn-primary px-6 py-2 disabled:opacity-50"
          >
            {isSubmitting ? '게시 중...' : '게시하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'stocks'>('feed');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch('/api/community/posts');
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePost(content: string, stockCode?: string, stockName?: string) {
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, stockCode, stockName }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.data, ...posts]);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, like_count: data.data.likeCount, isLiked: data.data.isLiked }
            : p
        ));
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }

  function handleComment(postId: string) {
    // Navigate to post detail
    window.location.href = `/community/post/${postId}`;
  }

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-24 sm:pt-28 pb-16">
        <div className="container-app px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-dark-50 mb-1">커뮤니티</h1>
                  <p className="text-sm sm:text-base text-dark-500">투자자들과 함께 종목을 분석하고 의견을 나눠보세요</p>
                </div>
                {user && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    새 글 작성
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-dark-900 rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'feed'
                      ? 'bg-dark-800 text-dark-100'
                      : 'text-dark-500 hover:text-dark-300'
                  }`}
                >
                  전체 피드
                </button>
                <button
                  onClick={() => setActiveTab('stocks')}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === 'stocks'
                      ? 'bg-dark-800 text-dark-100'
                      : 'text-dark-500 hover:text-dark-300'
                  }`}
                >
                  종목별 토론방
                </button>
              </div>

              {activeTab === 'feed' ? (
                /* Feed */
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="card text-center py-16">
                      <svg className="w-16 h-16 text-dark-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="text-lg font-medium text-dark-300 mb-2">아직 게시글이 없습니다</h3>
                      <p className="text-dark-500 mb-6">첫 번째 글을 작성해보세요!</p>
                      {user && (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="btn-primary"
                        >
                          글 작성하기
                        </button>
                      )}
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    ))
                  )}
                </div>
              ) : (
                /* Stock Rooms */
                <div className="space-y-3">
                  {POPULAR_STOCKS.map((stock) => (
                    <Link
                      key={stock.code}
                      href={`/community/stock/${stock.code}`}
                      className="card flex items-center gap-4 hover:border-dark-600 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-lg font-bold text-dark-300">
                        {stock.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-dark-100 group-hover:text-white transition-colors">
                          {stock.name}
                        </h3>
                        <p className="text-sm text-dark-500">{stock.code}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-dark-300">{stock.postCount}개 글</div>
                        <div className="text-xs text-dark-500">{stock.lastActivity}</div>
                      </div>
                      <svg className="w-5 h-5 text-dark-600 group-hover:text-dark-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar - Mobile: horizontal scroll, Desktop: vertical stack */}
            <div className="order-1 lg:order-2 space-y-4 lg:space-y-6">
              {/* Hot Topics - Mobile: horizontal scroll */}
              <div className="card">
                <h3 className="font-semibold text-dark-100 mb-3 lg:mb-4 flex items-center gap-2 text-sm lg:text-base">
                  <span className="text-base lg:text-lg">🔥</span>
                  인기 토론
                </h3>
                {/* Mobile: horizontal scroll */}
                <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  {POPULAR_STOCKS.slice(0, 5).map((stock, i) => (
                    <Link
                      key={stock.code}
                      href={`/community/stock/${stock.code}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/50 hover:bg-dark-800 transition-colors shrink-0"
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-rose-500 text-white' :
                        i === 1 ? 'bg-orange-500 text-white' :
                        i === 2 ? 'bg-amber-500 text-white' :
                        'bg-dark-700 text-dark-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-dark-300 whitespace-nowrap">
                        {stock.name}
                      </span>
                    </Link>
                  ))}
                </div>
                {/* Desktop: vertical list */}
                <div className="hidden lg:block space-y-3">
                  {POPULAR_STOCKS.slice(0, 5).map((stock, i) => (
                    <Link
                      key={stock.code}
                      href={`/community/stock/${stock.code}`}
                      className="flex items-center gap-3 group"
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-rose-500 text-white' :
                        i === 1 ? 'bg-orange-500 text-white' :
                        i === 2 ? 'bg-amber-500 text-white' :
                        'bg-dark-800 text-dark-400'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm text-dark-300 group-hover:text-dark-100 transition-colors flex-1">
                        {stock.name}
                      </span>
                      <span className="text-xs text-dark-500">{stock.postCount}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* AI Consultation Share Prompt - Hidden on mobile */}
              <div className="hidden lg:block card border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-brand-400 mb-1">AI 상담 공유하기</h4>
                    <p className="text-xs text-dark-400 leading-relaxed">
                      AI 전문가에게 받은 상담 내용을 커뮤니티에 공유하고 다른 투자자들의 의견을 들어보세요.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links - Hidden on mobile */}
              <div className="hidden lg:block card">
                <h3 className="font-semibold text-dark-100 mb-4">바로가기</h3>
                <div className="space-y-2">
                  <Link href="/verdict" className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors group">
                    <span className="text-lg">📊</span>
                    <span className="text-sm text-dark-300 group-hover:text-dark-100">오늘의 Top 5</span>
                  </Link>
                  <Link href="/battle/005930" className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors group">
                    <span className="text-lg">⚔️</span>
                    <span className="text-sm text-dark-300 group-hover:text-dark-100">AI 토론 보기</span>
                  </Link>
                  <Link href="/mypage" className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800 transition-colors group">
                    <span className="text-lg">👤</span>
                    <span className="text-sm text-dark-300 group-hover:text-dark-100">마이페이지</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
      />
    </>
  );
}
