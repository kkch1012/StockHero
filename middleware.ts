import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =====================================================
// Next.js Middleware
// - IP 기반 Rate Limiting
// - 보안 헤더 추가
// =====================================================

// 간단한 인메모리 rate limit (Edge 런타임 호환)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Rate limit 설정
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1분
  maxRequests: 100,    // 분당 100회
};

// 오래된 엔트리 정리
function cleanupRateLimitMap() {
  const now = Date.now();
  rateLimitMap.forEach((value, key) => {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  });
}

// IP 추출
function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

// Rate limit 체크
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 라우트에만 rate limit 적용
  if (pathname.startsWith('/api/')) {
    // CRON 요청은 rate limit 제외
    if (pathname.startsWith('/api/cron/')) {
      return NextResponse.next();
    }

    // Webhook은 rate limit 제외
    if (pathname.includes('/webhook')) {
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

    // 성공 응답에 rate limit 헤더 추가
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    return response;
  }

  return NextResponse.next();
}

// 미들웨어 적용 경로
export const config = {
  matcher: [
    // API 라우트
    '/api/:path*',
    // 정적 파일, _next 제외
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
