'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

import { getStockName } from '@/lib/stock-names';

const STOCK_SECTORS: Record<string, string> = {
  '005930': '반도체',
  '000660': '반도체',
  '373220': '2차전지',
  '006400': '2차전지',
  '247540': '2차전지',
  '207940': '바이오',
  '068270': '바이오',
  '005380': '자동차',
  '000270': '자동차',
  '035720': 'IT서비스',
  '035420': 'IT서비스',
  '105560': '금융',
  '055550': '금융',
  '086790': '금융',
  '017670': '통신',
  '030200': '통신',
  '051910': '화학',
  '005490': '철강',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return date.toLocaleDateString('ko-KR');
}

function PostItem({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
  const profile = post.user_profiles;
  
  return (
    <div className="p-4 border-b border-dark-800 hover:bg-dark-900/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-medium shrink-0">
          {profile?.display_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-dark-100 text-sm">
              {profile?.display_name || '익명'}
            </span>
            <span className="text-xs text-dark-500">{formatTimeAgo(post.created_at)}</span>
          </div>
          <p className="text-dark-200 text-sm leading-relaxed whitespace-pre-wrap mb-3">
            {post.content}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                post.isLiked ? 'text-rose-400' : 'text-dark-500 hover:text-rose-400'
              }`}
            >
              <svg className="w-4 h-4" fill={post.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.like_count}</span>
            </button>
            <Link
              href={`/community/post/${post.id}`}
              className="flex items-center gap-1.5 text-xs text-dark-500 hover:text-brand-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{post.comment_count}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockRoomPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const stockName = getStockName(symbol);
  const stockSector = STOCK_SECTORS[symbol] || '기타';
  const [stockPrice, setStockPrice] = useState({ price: 0, change: 0 });
  
  // 실시간 가격 조회
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch(`/api/stock/price?symbol=${symbol}`);
        const data = await res.json();
        if (data.success && data.data) {
          setStockPrice({
            price: data.data.price,
            change: data.data.changePercent || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stock price:', error);
      }
    }
    fetchPrice();
  }, [symbol]);
  const { user } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [symbol]);

  async function fetchPosts() {
    try {
      const res = await fetch(`/api/community/posts?stockCode=${symbol}`);
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

  async function handleSubmitPost() {
    if (!newPost.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newPost, 
          stockCode: symbol, 
          stockName: stockName 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts([data.data, ...posts]);
        setNewPost('');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
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

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-28 pb-16">
        <div className="container-app max-w-3xl">
          {/* Back Button */}
          <Link 
            href="/community" 
            className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            커뮤니티로 돌아가기
          </Link>

          {/* Stock Header */}
          <div className="card mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dark-700 to-dark-800 flex items-center justify-center text-2xl font-bold text-dark-300">
                {stockName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-dark-50">{stockName}</h1>
                  <span className="text-sm text-dark-500 font-mono">{symbol}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-dark-400">{stockSector}</span>
                  {stockPrice.price > 0 && (
                    <>
                      <span className="text-dark-600">|</span>
                      <span className="text-sm font-medium text-dark-200">
                        {stockPrice.price.toLocaleString()}원
                      </span>
                      <span className={`text-sm font-medium ${stockPrice.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stockPrice.change >= 0 ? '+' : ''}{stockPrice.change.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/battle/${symbol}`}
                className="btn-primary text-sm"
              >
                AI 토론 보기
              </Link>
            </div>
          </div>

          {/* Post Input */}
          {user ? (
            <div className="card mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-medium shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={`${stockName}에 대한 의견을 공유해보세요...`}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-brand-500 min-h-[100px]"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSubmitPost}
                      disabled={!newPost.trim() || isSubmitting}
                      className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? '게시 중...' : '게시하기'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-6 text-center py-6">
              <p className="text-dark-400 mb-3">로그인하고 토론에 참여하세요</p>
              <Link href="/login" className="btn-primary text-sm">
                로그인하기
              </Link>
            </div>
          )}

          {/* Posts */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-800">
              <h2 className="font-semibold text-dark-100">토론 ({posts.length})</h2>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-12 h-12 text-dark-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-dark-400">아직 토론이 없습니다</p>
                <p className="text-sm text-dark-500 mt-1">첫 번째 의견을 남겨보세요!</p>
              </div>
            ) : (
              <div>
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} onLike={handleLike} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

