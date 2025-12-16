'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DisclaimerBar, Header } from '@/components';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  like_count: number;
  created_at: string;
  user_profiles?: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

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
  comments?: Comment[];
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return '방금 전';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return date.toLocaleDateString('ko-KR');
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.postId as string;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/community/posts/${postId}`);
      const data = await res.json();
      if (data.success) {
        setPost(data.data.post);
        setComments(data.data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLike() {
    if (!post) return;
    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setPost({ ...post, like_count: data.data.likeCount, isLiked: data.data.isLiked });
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.data]);
        setNewComment('');
        if (post) {
          setPost({ ...post, comment_count: post.comment_count + 1 });
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-28 pb-16">
          <div className="container-app max-w-3xl">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-28 pb-16">
          <div className="container-app max-w-3xl text-center py-20">
            <h2 className="text-xl font-semibold text-dark-300 mb-4">게시글을 찾을 수 없습니다</h2>
            <Link href="/community" className="btn-primary">
              커뮤니티로 돌아가기
            </Link>
          </div>
        </main>
      </>
    );
  }

  const profile = post.user_profiles;

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

          {/* Post */}
          <div className="card mb-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-medium text-lg">
                {profile?.display_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-dark-100">
                    {profile?.display_name || '익명'}
                  </span>
                  {post.post_type === 'consultation' && (
                    <span className="px-2 py-0.5 text-xs bg-brand-500/20 text-brand-400 rounded-full">
                      AI 상담
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-dark-500">
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
            <p className="text-dark-200 leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-dark-800">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  post.isLiked ? 'text-rose-400' : 'text-dark-500 hover:text-rose-400'
                }`}
              >
                <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{post.like_count}</span>
              </button>
              <span className="flex items-center gap-2 text-dark-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{post.comment_count}</span>
              </span>
            </div>
          </div>

          {/* Comment Input */}
          {user ? (
            <div className="card mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-medium shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 작성해주세요..."
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-brand-500 min-h-[80px]"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                    >
                      {isSubmitting ? '등록 중...' : '댓글 등록'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mb-6 text-center py-6">
              <p className="text-dark-400 mb-3">로그인하고 댓글을 작성하세요</p>
              <Link href="/login" className="btn-primary text-sm">
                로그인하기
              </Link>
            </div>
          )}

          {/* Comments */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-dark-800">
              <h2 className="font-semibold text-dark-100">댓글 ({comments.length})</h2>
            </div>
            
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-dark-500">아직 댓글이 없습니다</p>
                <p className="text-sm text-dark-600 mt-1">첫 번째 댓글을 남겨보세요!</p>
              </div>
            ) : (
              <div>
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border-b border-dark-800 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-dark-300 font-medium text-sm shrink-0">
                        {comment.user_profiles?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-dark-200 text-sm">
                            {comment.user_profiles?.display_name || '익명'}
                          </span>
                          <span className="text-xs text-dark-500">
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-dark-300 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
