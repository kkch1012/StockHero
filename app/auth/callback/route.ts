import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = createServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // 쿠키 설정: 클라이언트 AuthContext의 onAuthStateChange도 설정하지만,
    // OAuth 콜백은 서버에서 리다이렉트되므로 여기서도 설정
    if (data?.session) {
      const response = NextResponse.redirect(new URL(redirect, requestUrl.origin));
      response.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      return response;
    }
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
