import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// =====================================================
// Next.js Middleware
// - Supabase 세션 리프레시 (모든 요청)
// - IP 기반 Rate Limiting (API 라우트만)
// =====================================================

// 간단한 인메모리 rate limit (Edge 런타임 호환)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

function cleanupRateLimitMap() {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  });
}

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanupRateLimitMap();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  if (entry.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - entry.count };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API Rate Limiting
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/cron/') || pathname.includes('/webhook')) {
      // Cron, Webhook은 rate limit 제외하되 세션 리프레시도 불필요
      return NextResponse.next();
    }

    const ip = getIP(request);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Rate limit 통과 후 세션 리프레시 포함하여 응답 생성
    const response = await updateSession(request);
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // 비-API 라우트: 세션 리프레시만
  return updateSession(request);
}

/**
 * Supabase 세션 리프레시
 * - 매 요청마다 supabase.auth.getUser()를 호출하여 토큰을 자동 리프레시
 * - 만료된 토큰을 갱신하고 새 쿠키를 설정
 */
async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()를 호출하면 토큰이 만료된 경우 자동으로 리프레시됨
  // 중요: getSession() 대신 getUser()를 사용해야 보안적으로 안전
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // API 라우트
    '/api/:path*',
    // 모든 페이지 (정적 파일, _next 제외)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
