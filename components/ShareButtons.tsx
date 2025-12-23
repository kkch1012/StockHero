'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ShareButtonsProps {
  url: string;
  title: string;
  description: string;
  hashtags?: string[];
}

export default function ShareButtons({ url, title, description, hashtags = [] }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setCopied(false);
        setShowToast(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    }
  };

  const handleKakaoShare = () => {
    // Kakao SDK share (카카오톡 공유)
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
    window.open(kakaoUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const hashtagsStr = hashtags.map(h => h.replace(/\s/g, '')).join(',');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}${hashtagsStr ? `&hashtags=${hashtagsStr}` : ''}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  const handleLineShare = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(lineUrl, '_blank', 'width=600,height=400');
  };

  const buttons = [
    {
      name: '링크 복사',
      icon: copied ? '✅' : '🔗',
      onClick: handleCopyLink,
      className: 'bg-dark-700 hover:bg-dark-600',
    },
    {
      name: '카카오톡',
      icon: '💬',
      onClick: handleKakaoShare,
      className: 'bg-[#FEE500] hover:bg-[#FDD835] text-dark-900',
    },
    {
      name: 'X (트위터)',
      icon: '𝕏',
      onClick: handleTwitterShare,
      className: 'bg-dark-800 hover:bg-dark-700',
    },
    {
      name: '페이스북',
      icon: '📘',
      onClick: handleFacebookShare,
      className: 'bg-[#1877F2] hover:bg-[#166FE5]',
    },
    {
      name: '라인',
      icon: '💚',
      onClick: handleLineShare,
      className: 'bg-[#00B900] hover:bg-[#00A000]',
    },
  ];

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="relative">
      {/* Share Buttons Grid */}
      <div className="flex flex-wrap justify-center gap-3">
        {buttons.map((button, idx) => (
          <motion.button
            key={button.name}
            onClick={button.onClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${button.className}`}
          >
            <span className="text-lg">{button.icon}</span>
            <span className="text-sm">{button.name}</span>
          </motion.button>
        ))}

        {/* Native Share Button (Mobile) */}
        {hasNativeShare && (
          <motion.button
            onClick={handleNativeShare}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: buttons.length * 0.05 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors"
          >
            <span className="text-lg">📤</span>
            <span className="text-sm">더보기</span>
          </motion.button>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute left-1/2 -translate-x-1/2 -top-12 px-4 py-2 bg-brand-500 text-white rounded-lg shadow-lg text-sm font-medium whitespace-nowrap"
        >
          ✅ 링크가 복사되었습니다!
        </motion.div>
      )}
    </div>
  );
}

