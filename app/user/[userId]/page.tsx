'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DisclaimerBar, Header } from '@/components';
import { FeedList, FollowButton } from '@/components/Community';
import { useAuth } from '@/lib/contexts/AuthContext';

interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  website: string | null;
  twitterHandle: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isVerified: boolean;
  createdAt: string;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'portfolio' | 'watchlist'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    website: '',
    twitterHandle: '',
  });

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/community/profile/${userId}`);
      const data = await res.json();
      
      if (data.success) {
        setProfile(data.data);
        setEditForm({
          username: data.data.username || '',
          displayName: data.data.displayName || '',
          bio: data.data.bio || '',
          website: data.data.website || '',
          twitterHandle: data.data.twitterHandle || '',
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.isOwnProfile) return;

    try {
      const res = await fetch(`/api/community/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? {
          ...prev,
          username: editForm.username,
          displayName: editForm.displayName,
          bio: editForm.bio,
          website: editForm.website,
          twitterHandle: editForm.twitterHandle,
        } : null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save profile error:', error);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setProfile(prev => prev ? {
      ...prev,
      isFollowing,
      followerCount: prev.followerCount + (isFollowing ? 1 : -1),
    } : null);
  };

  if (isLoading) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-32 pb-20">
          <div className="container-app">
            <div className="animate-pulse">
              <div className="h-48 bg-dark-800 rounded-2xl mb-6" />
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-full bg-dark-700 -mt-16 ring-4 ring-dark-950" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-48 bg-dark-700 rounded" />
                  <div className="h-4 w-32 bg-dark-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <DisclaimerBar />
        <Header />
        <main className="min-h-screen bg-dark-950 pt-32 pb-20">
          <div className="container-app text-center py-20">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-dark-300 mb-2">사용자를 찾을 수 없습니다</h1>
            <p className="text-dark-500 mb-6">존재하지 않거나 삭제된 계정입니다.</p>
            <Link href="/" className="btn-primary">홈으로 돌아가기</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DisclaimerBar />
      <Header />
      <main className="min-h-screen bg-dark-950 pt-20 pb-20">
        <div className="container-app">
          {/* Cover Image */}
          <div 
            className="h-48 md:h-64 rounded-b-2xl bg-gradient-to-r from-brand-600/30 via-violet-600/30 to-brand-600/30"
            style={profile.coverImageUrl ? { 
              backgroundImage: `url(${profile.coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          />

          {/* Profile Header */}
          <div className="px-4 md:px-0">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 md:-mt-20">
              {/* Avatar */}
              <div className="shrink-0">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    width={128}
                    height={128}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-dark-950 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-dark-950 bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profile.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>
                      {profile.isVerified && (
                        <svg className="w-6 h-6 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-dark-400">@{profile.username}</p>
                  </div>
                  <div className="flex gap-2">
                    {profile.isOwnProfile ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 rounded-lg bg-dark-800 text-dark-300 text-sm font-medium hover:bg-dark-700 transition-colors"
                      >
                        프로필 편집
                      </button>
                    ) : (
                      <FollowButton 
                        userId={profile.userId} 
                        initialIsFollowing={profile.isFollowing}
                        onFollowChange={handleFollowChange}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-dark-300 mt-4 max-w-2xl">{profile.bio}</p>
            )}

            {/* Links */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-brand-400 hover:text-brand-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {profile.twitterHandle && (
                <a 
                  href={`https://twitter.com/${profile.twitterHandle}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-dark-400 hover:text-brand-400"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @{profile.twitterHandle}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile.postCount}</div>
                <div className="text-sm text-dark-500">게시물</div>
              </div>
              <div className="text-center cursor-pointer hover:text-brand-400">
                <div className="text-xl font-bold text-white">{profile.followerCount}</div>
                <div className="text-sm text-dark-500">팔로워</div>
              </div>
              <div className="text-center cursor-pointer hover:text-brand-400">
                <div className="text-xl font-bold text-white">{profile.followingCount}</div>
                <div className="text-sm text-dark-500">팔로잉</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-8 border-b border-dark-800">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-dark-500 hover:text-dark-300'
              }`}
            >
              게시물
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'portfolio'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-dark-500 hover:text-dark-300'
              }`}
            >
              포트폴리오
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'watchlist'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-dark-500 hover:text-dark-300'
              }`}
            >
              관심종목
            </button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeTab === 'posts' && (
              <FeedList feedType="user" userId={profile.userId} />
            )}
            
            {activeTab === 'portfolio' && (
              <div className="card p-6 text-center text-dark-500">
                <div className="text-4xl mb-4">💼</div>
                <p>아직 공유된 포트폴리오가 없습니다.</p>
              </div>
            )}
            
            {activeTab === 'watchlist' && (
              <div className="card p-6 text-center text-dark-500">
                <div className="text-4xl mb-4">⭐</div>
                <p>아직 공유된 관심종목이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="w-full max-w-lg bg-dark-900 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">프로필 편집</h2>
                <button onClick={() => setIsEditing(false)} className="text-dark-500 hover:text-dark-300">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">사용자명</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full bg-dark-800 rounded-lg px-4 py-2.5 text-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">이름</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full bg-dark-800 rounded-lg px-4 py-2.5 text-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">소개</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="w-full bg-dark-800 rounded-lg px-4 py-2.5 text-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">웹사이트</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://"
                    className="w-full bg-dark-800 rounded-lg px-4 py-2.5 text-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Twitter</label>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-500">@</span>
                    <input
                      type="text"
                      value={editForm.twitterHandle}
                      onChange={(e) => setEditForm({ ...editForm, twitterHandle: e.target.value })}
                      className="flex-1 bg-dark-800 rounded-lg px-4 py-2.5 text-dark-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-lg bg-dark-800 text-dark-300 hover:bg-dark-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <DisclaimerBar variant="bottom" compact />
    </>
  );
}

