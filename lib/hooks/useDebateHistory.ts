'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface DebateHistoryItem {
  id: string;
  sessionId: string | null;
  symbolCode: string;
  symbolName: string;
  watchedRounds: number;
  totalRounds: number;
  completed: boolean;
  lastWatchedAt: string;
  createdAt: string;
}

export function useDebateHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<DebateHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/debate-history');
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching debate history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const recordDebateView = useCallback(async (
    symbolCode: string,
    symbolName: string,
    sessionId?: string,
    watchedRounds?: number,
    totalRounds?: number
  ) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user/debate-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          symbolCode,
          symbolName,
          watchedRounds: watchedRounds || 1,
          totalRounds: totalRounds || 4,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh history
        await fetchHistory();
      }
      
      return result.success;
    } catch (error) {
      console.error('Error recording debate view:', error);
      return false;
    }
  }, [user, fetchHistory]);

  return {
    history,
    loading,
    recordDebateView,
    refetch: fetchHistory,
  };
}
