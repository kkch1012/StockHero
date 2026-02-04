// =====================================================
// 환경변수 검증 유틸리티
// 서버 시작 시 필수 환경변수 확인
// =====================================================

type EnvVarConfig = {
  name: string;
  required: boolean;
  description: string;
};

/**
 * 필수 환경변수 목록
 */
const REQUIRED_ENV_VARS: EnvVarConfig[] = [
  // Supabase
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, description: 'Supabase 프로젝트 URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, description: 'Supabase 익명 키' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, description: 'Supabase 서비스 역할 키' },
];

/**
 * 선택적 환경변수 (기능별)
 */
const OPTIONAL_ENV_VARS: EnvVarConfig[] = [
  // AI/LLM
  { name: 'OPENROUTER_API_KEY', required: false, description: 'OpenRouter API 키 (AI 토론용)' },
  { name: 'OPENAI_API_KEY', required: false, description: 'OpenAI API 키' },
  { name: 'ANTHROPIC_API_KEY', required: false, description: 'Anthropic API 키' },
  { name: 'GOOGLE_AI_API_KEY', required: false, description: 'Google AI API 키' },

  // 결제
  { name: 'PORTONE_API_SECRET', required: false, description: 'PortOne API 시크릿' },
  { name: 'PORTONE_STORE_ID', required: false, description: 'PortOne 상점 ID' },
  { name: 'PORTONE_WEBHOOK_SECRET', required: false, description: 'PortOne 웹훅 시크릿' },

  // CRON
  { name: 'CRON_SECRET', required: false, description: 'CRON 작업 인증 시크릿' },

  // 주식 데이터
  { name: 'KIS_APP_KEY', required: false, description: '한국투자증권 앱 키' },
  { name: 'KIS_APP_SECRET', required: false, description: '한국투자증권 앱 시크릿' },

  // 관리자
  { name: 'ADMIN_SECRET', required: false, description: '관리자 API 시크릿' },
];

/**
 * 환경변수 검증 결과
 */
interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * 환경변수 검증 실행
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 필수 환경변수 검증
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      missing.push(`${envVar.name} - ${envVar.description}`);
    }
  }

  // 선택적 환경변수 경고
  for (const envVar of OPTIONAL_ENV_VARS) {
    if (!process.env[envVar.name]) {
      warnings.push(`${envVar.name} - ${envVar.description}`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * 서버 시작 시 환경변수 검증 및 로깅
 * instrumentation.ts 또는 middleware에서 호출
 */
export function checkEnvOnStartup(): void {
  // 프로덕션에서만 엄격하게 검증
  const isProd = process.env.NODE_ENV === 'production';

  const result = validateEnv();

  if (!result.valid) {
    console.error('========================================');
    console.error('환경변수 검증 실패!');
    console.error('========================================');
    console.error('누락된 필수 환경변수:');
    result.missing.forEach(m => console.error(`  - ${m}`));
    console.error('========================================');

    if (isProd) {
      throw new Error(`필수 환경변수 누락: ${result.missing.map(m => m.split(' - ')[0]).join(', ')}`);
    }
  }

  // 경고 출력 (개발 환경에서만)
  if (!isProd && result.warnings.length > 0) {
    console.warn('========================================');
    console.warn('선택적 환경변수 미설정 (일부 기능 제한):');
    console.warn('========================================');
    result.warnings.slice(0, 5).forEach(w => console.warn(`  - ${w}`));
    if (result.warnings.length > 5) {
      console.warn(`  ... 외 ${result.warnings.length - 5}개`);
    }
    console.warn('========================================');
  }
}

/**
 * 특정 기능의 환경변수 확인
 */
export function isFeatureEnabled(feature: 'payment' | 'ai' | 'cron' | 'kis'): boolean {
  switch (feature) {
    case 'payment':
      return !!(process.env.PORTONE_API_SECRET && process.env.PORTONE_STORE_ID);
    case 'ai':
      return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
    case 'cron':
      return !!process.env.CRON_SECRET;
    case 'kis':
      return !!(process.env.KIS_APP_KEY && process.env.KIS_APP_SECRET);
    default:
      return false;
  }
}
