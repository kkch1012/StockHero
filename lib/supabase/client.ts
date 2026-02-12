import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// @supabase/ssr의 createBrowserClient는 내부적으로 singleton을 관리하고
// 쿠키를 자동으로 처리합니다.

function createClient(): SupabaseClient {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 기존 API 호환성 유지
export function getSupabaseClient(): SupabaseClient {
  return createClient();
}

export const supabase = typeof window !== 'undefined' ? createClient() : null;

export function createBrowserClient(): SupabaseClient {
  return createClient();
}
