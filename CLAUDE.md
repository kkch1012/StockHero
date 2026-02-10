# StockHero - AI 주식 분석 서비스

## 프로젝트 개요
- 3개 AI (Gemini, Claude, GPT) 교차검증 기반 주식 분석 서비스
- Next.js + Supabase (PostgreSQL + RLS)
- TypeScript, Tailwind CSS

## 기술 스택
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **DB**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Google Gemini API, Anthropic Claude API, OpenAI GPT API

## 구독 티어 (4단계)
| 티어 | 가격 | AI 개수 | 특징 |
|------|-------|---------|------|
| Free | ₩0 | 1 (Gemini) | 기본 분석 |
| Lite | ₩4,900 | 2 (Gemini+Claude) | 2개 AI 비교 |
| Basic | ₩14,900 | 3 (전체) | 교차검증 시작 |
| Pro | ₩39,900 | 3 (전체) | 무제한 + 일일 비용 한도 ₩1,713 |

## 합의 등급 시스템
- **STRONG**: 3/3 합의, 신뢰도 95%
- **MODERATE**: 2/3 합의, 신뢰도 70%
- **CONFLICT**: 분열, 신뢰도 40%

## 핵심 파일 구조
```
lib/llm/cross-validation.ts      # 3 AI 병렬 교차검증 엔진
lib/llm/tier-based-analysis.ts   # 티어별 분석 라우팅 (1/2/3 AI)
app/api/analysis/cross-validate/route.ts  # POST 교차검증 API
lib/subscription/config.ts       # 구독 설정 (티어/가격/기능)
lib/subscription/usage-limiter.ts # 사용량 제한
types/subscription.ts            # 구독 타입 정의
```

## DB 스키마 (Supabase)
- **테이블**: subscriptions, payments, feature_usage, analysis_history, migrations
- **함수 7개**: get_ai_count, has_cross_validation, get_expected_api_cost, increment_feature_usage, check_pro_user_cost_limit, update_updated_at_column, generate_usage_report
- **인덱스 13개**, RLS 4테이블, 트리거 4개
- **마이그레이션**: `999_clean_migration.sql`

## 현재 진행 상태
- [x] 교차검증 엔진 구현 (병렬 독립 분석, 6초)
- [x] 구독 시스템 4단계 개편
- [x] DB 마이그레이션 완료
- [ ] Supabase 키 + 환경 변수 설정
- [ ] API 통합 테스트
- [ ] 프론트엔드 UI 개발 (분석 결과 표시, 구독 관리)

## 환경 변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

## 개발 규칙
- 한국어 커밋 메시지 사용
- Tailwind CSS 유틸리티 클래스 우선
- API Route에서 Supabase RLS 활용
- AI 호출은 반드시 사용량 체크 후 실행
