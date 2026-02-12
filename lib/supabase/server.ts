import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * 쿠키 기반 서버 클라이언트 (anon key + RLS 적용)
 * - API Routes, Server Components에서 사용
 * - 사용자 세션을 쿠키에서 자동으로 읽음
 * - RLS가 적용되므로 사용자 데이터 접근에 안전
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component에서 호출 시 쿠키 설정 불가 - 무시
          // middleware에서 세션 리프레시가 처리됨
        }
      },
    },
  });
}

/**
 * 관리자 클라이언트 (service_role key, RLS 무시)
 * - Cron jobs, admin 작업, DB 헬퍼 함수에서 사용
 * - 사용자 인증과 무관한 서버 전용 작업
 */
export function createAdminClient(): SupabaseClient {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Legacy exports for backwards compatibility
// db.ts 등 기존 코드에서 사용
let _adminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_adminInstance) {
    _adminInstance = createAdminClient();
  }
  return _adminInstance;
}

export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
  auth: {
    getUser: () => getSupabaseAdmin().auth.getUser(),
    admin: {
      getUserById: (id: string) => getSupabaseAdmin().auth.admin.getUserById(id),
      listUsers: () => getSupabaseAdmin().auth.admin.listUsers(),
    },
  },
  rpc: (fn: string, params?: any) => getSupabaseAdmin().rpc(fn, params),
};

// Legacy alias
export const createServerClient = createClient;
export const createAnonClient = createClient;
