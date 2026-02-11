<!--
[CLAUDE 지시사항]
이 파일은 StockHero 프로젝트 전용 문서입니다.
- 위치: /Users/bottle/StockHero/CLAUDE.md (프로젝트 루트)
- 용도: 이 프로젝트의 모든 정보를 여기에 기록
  - 프로젝트 구조, 기술 스택, 핵심 파일
  - 진행 상황, 남은 일정, TODO
  - 코드 수정 내역, 버그 트래킹
  - 노션 작성 초안, 회의 메모 등
- 작업 일지(일별 요약)는 여기가 아니라 상위 폴더 /Users/bottle/CLAUDE.md에 작성
- 이 파일은 Git에 커밋되어 다른 환경에서도 동일한 컨텍스트를 공유함
-->

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
# 백엔드
lib/llm/cross-validation.ts      # 3 AI 병렬 교차검증 엔진
lib/llm/tier-based-analysis.ts   # 티어별 분석 라우팅 (1/2/3 AI)
app/api/analysis/cross-validate/route.ts  # POST 교차검증 API
lib/subscription/config.ts       # 구독 설정 (티어/가격/기능)
lib/subscription/usage-limiter.ts # 사용량 제한
types/subscription.ts            # 구독 타입 정의

# 프론트엔드 - 분석 페이지
app/analysis/page.tsx             # AI 분석 홈 (종목 검색 + 인기 종목 그리드)
app/analysis/[symbol]/page.tsx    # 종목 상세 (교차검증 결과 표시)

# 프론트엔드 - 분석 컴포넌트
components/analysis/TierBasedResult.tsx       # 티어별 분석 결과 분기
components/analysis/CrossValidationResult.tsx # 3 AI 교차검증 결과
components/analysis/ComparisonResult.tsx      # 2 AI 비교 결과
components/analysis/SingleResult.tsx          # 단일 AI 결과
components/analysis/ConsensusGradeBadge.tsx   # 합의 등급 뱃지
components/analysis/PriceAgreementBar.tsx     # 목표가 일치도 바
components/analysis/AIAnalysisCard.tsx        # AI별 분석 카드
components/analysis/AnalysisLoading.tsx       # 분석 로딩 UI
components/analysis/UsageIndicator.tsx        # 사용량 표시기
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
- [x] 분석 페이지 2개 (홈 + 종목 상세)
- [x] 분석 컴포넌트 9개 (티어별/교차검증/비교/단일 결과 등)
- [x] 타입 안전성 개선 (createClient await, Calendar 타입 통일, Header/UpgradeModal)
- [x] 분석 페이지 API 연동 (FREE_MODE 우회 + 실시간 가격 + 로그인 프롬프트)
- [ ] Supabase 키 + 환경 변수 설정
- [ ] API 통합 테스트
- [ ] 프론트엔드 UI 연동 (구독 관리, 결제 페이지)

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
