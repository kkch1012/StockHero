// =====================================================
// Next.js Instrumentation (서버 시작 시 실행)
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// =====================================================

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkEnvOnStartup } = await import('./lib/env-validation');
    checkEnvOnStartup();
  }
}
