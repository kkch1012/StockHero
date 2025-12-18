import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Server-side Supabase client with service role (for admin operations)
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase server environment variables not configured');
    return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key');
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Admin client for database operations - lazy initialization
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Supabase admin environment variables not configured');
      return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    _supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}

// Legacy export for backwards compatibility
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

// Async client for API routes - handles user authentication via cookies
export async function createClient() {
  const cookieStore = await cookies();
  
  // Get access token from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  // Create client with service key but set user session
  const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    },
  });

  // If we have tokens, try to set the session
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return supabase;
}

// Alternative: createClient using anon key for user-scoped RLS
export async function createAnonClient() {
  const cookieStore = await cookies();
  
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return supabase;
}
