import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET: 종목별 토론방 통계 (게시글 수 + 최근 활동 시간)
 */
export async function GET() {
  const supabase = await createClient();

  try {
    // 종목 태그가 있는 게시글에서 종목별 통계 집계
    const { data, error } = await supabase
      .from('posts')
      .select('shared_stock_code, shared_stock_name, created_at')
      .eq('is_hidden', false)
      .not('shared_stock_code', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stock rooms:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 종목별 집계
    const stockMap = new Map<string, { code: string; name: string; postCount: number; lastActivity: string }>();

    for (const post of data || []) {
      const code = post.shared_stock_code;
      if (!code) continue;

      const existing = stockMap.get(code);
      if (existing) {
        existing.postCount += 1;
      } else {
        stockMap.set(code, {
          code,
          name: post.shared_stock_name || code,
          postCount: 1,
          lastActivity: post.created_at,
        });
      }
    }

    // 게시글 수 기준 정렬
    const rooms = Array.from(stockMap.values())
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 20);

    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Error in GET /api/community/stock-rooms:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
