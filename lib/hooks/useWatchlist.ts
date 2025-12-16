'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface WatchlistItem {
  id: string;
  symbolCode: string;
  symbolName: string;
  memo: string | null;
  alertEnabled: boolean;
  createdAt: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/watchlist');
      const result = await response.json();
      
      if (result.success) {
        setWatchlist(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const isInWatchlist = useCallback((symbolCode: string) => {
    return watchlist.some(item => item.symbolCode === symbolCode);
  }, [watchlist]);

  const addToWatchlist = useCallback(async (symbolCode: string, symbolName: string, memo?: string) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbolCode,
          symbolName,
          memo,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Refetch to get the proper formatted data
        await fetchWatchlist();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      return false;
    }
  }, [user, fetchWatchlist]);

  const removeFromWatchlist = useCallback(async (symbolCode: string) => {
    if (!user) return false;

    try {
      const response = await fetch(
        `/api/user/watchlist?symbolCode=${symbolCode}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      if (result.success) {
        setWatchlist(prev => prev.filter(item => item.symbolCode !== symbolCode));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      return false;
    }
  }, [user]);

  const toggleWatchlist = useCallback(async (symbolCode: string, symbolName: string) => {
    if (isInWatchlist(symbolCode)) {
      return removeFromWatchlist(symbolCode);
    } else {
      return addToWatchlist(symbolCode, symbolName);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  return {
    watchlist,
    loading,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    refetch: fetchWatchlist,
  };
}
