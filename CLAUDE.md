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
# 백엔드 - 공통
lib/llm/cross-validation.ts      # 3 AI 병렬 교차검증 엔진
lib/llm/tier-based-analysis.ts   # 티어별 분석 라우팅 (1/2/3 AI)
app/api/analysis/cross-validate/route.ts  # POST 교차검증 API
lib/subscription/config.ts       # 구독 설정 (티어/가격/기능)
lib/subscription/usage-limiter.ts # 사용량 제한
types/subscription.ts            # 구독 타입 정의
app/api/user/analysis-history/route.ts  # GET 분석 이력 API

# 백엔드 - 종목배틀
app/api/debate/start/route.ts    # 토론 시작 (143줄)
app/api/debate/stream/route.ts   # SSE 스트리밍 (199줄)
app/api/debate/next/route.ts     # 다음 라운드 (134줄)
app/api/debate/history/route.ts  # 토론 이력 (136줄)

# 백엔드 - 투자고수
app/api/heroes/[heroId]/top5/route.ts     # 한국 Top 5 추천 (684줄)
app/api/heroes/[heroId]/us-top5/route.ts  # 미국 Top 5 추천 (333줄)

# 백엔드 - 테마분석
app/api/themes/route.ts                    # 테마 목록 (31줄)
app/api/themes/[themeId]/analyze/route.ts  # 테마별 AI 분석 (293줄)

# 백엔드 - 백테스트
app/api/backtest/route.ts        # 분석 이력 기반 수익률 계산 (252줄)

# 백엔드 - Pro 전용 (VIP API)
app/api/vip/exclusive-stocks/route.ts  # Pro 전용 종목
app/api/vip/signals/route.ts          # Pro 실시간 시그널
app/api/vip/custom-debate/route.ts    # Pro 커스텀 분석
app/api/cron/vip-stocks/route.ts      # 주간 종목 생성 cron
app/api/cron/vip-signals/route.ts     # 시그널 생성 cron

# 프론트엔드 - 공통
components/Header.tsx             # 데스크톱 헤더 (7개 메뉴)
components/BottomNav.tsx          # 모바일 하단 탭바

# 프론트엔드 - 분석 페이지
app/analysis/page.tsx             # AI 분석 홈 (종목 검색 + 인기 종목 그리드)
app/analysis/[symbol]/page.tsx    # 종목 상세 (교차검증 결과 표시)

# 프론트엔드 - 종목배틀
app/battle/page.tsx               # 배틀 랜딩 (238줄, 종목 선택 + 한/미 탭)
app/battle/[symbol]/page.tsx      # 토론 UI (1,267줄, SSE 스트리밍, 4라운드, 타이핑 애니메이션)

# 프론트엔드 - 투자고수
app/heroes/page.tsx               # 히어로 목록 (217줄, 3캐릭터 프로필 + 추천 캘린더)
app/heroes/[heroId]/page.tsx      # 히어로 상세 (834줄, Top 5 추천 + AI 의견 채팅 + 구독 잠금)

# 프론트엔드 - 테마분석
app/themes/page.tsx               # 테마 분석 (448줄, 8개 테마 + AI 히어로별 분석)

# 프론트엔드 - 백테스트
app/backtest/page.tsx             # 백테스트 (435줄, 기간별 성과 + 전략 비교 + 승률)

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
- [x] 프론트엔드 UI 연동 (로그인 페이지 + 쿠키 동기화 + 구독 관리 탭 + PortOne 미설정 대응)
- [x] API 통합 테스트 (2026-02-11 통과)
- [x] 인증 시스템 (@supabase/ssr + 쿠키 세션 + middleware 토큰 리프레시)
- [x] 네비게이션 재구성 (데스크톱 7메뉴 + 모바일 하단탭바 + 페이지 정리)
- [x] 핵심 플로우 (분석 이력 저장 + 마이페이지 이력탭 + 비로그인 유도)
- [x] 종목배틀 (배틀 랜딩 + 토론 UI + SSE 스트리밍 4라운드 + debate API 4개)
- [x] 투자고수 (히어로 목록 + 상세 + Top 5 추천 API 한/미)
- [x] 테마분석 (8개 테마 + AI 히어로별 분석 API)
- [x] 백테스트 (기간별 성과 + 전략 비교 + 수익률 계산 API)
- [x] VIP 페이지 정리 (폐지된 VIP 프론트엔드 삭제, Pro용 API 유지)
- [x] 배포 (Vercel + GitHub 레포 연결 완료, 환경변수 + Google OAuth redirect URI는 웹 콘솔 설정)
- [x] AI 상담 버그 수정 (sendMessage 필드명 불일치 + FREE_MODE 우회 + Gemini history 순서)
- [x] 관리자 시스템 (isAdmin 체크 → Pro 무제한, 3계정 등록)
- [x] 마크다운 제거 (AI 응답에서 ##/**/*/ 등 strip, 이모지 유지)
- [x] 마이페이지 통계 연동 (user_activity_stats.total_consultations 업데이트)
- [x] Cron 수동 트리거 (daily-top5-debate 실행, verdicts 데이터 확인)

## 환경 변수 (.env.local) 상태

### 설정 완료
| 변수 | 상태 | 용도 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 설정됨 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 설정됨 | Supabase 익명 키 (클라이언트) |
| `SUPABASE_SERVICE_ROLE_KEY` | 설정됨 | Supabase 서비스 키 (서버) |
| `ANTHROPIC_API_KEY` | 설정됨 | Claude API |
| `GOOGLE_AI_API_KEY` | 설정됨 | Gemini API |
| `OPENAI_API_KEY` | 설정됨 | GPT API |
| `NEXT_PUBLIC_SUBSCRIPTION_ENABLED` | `false` | 구독 기능 비활성 (FREE_MODE) |

### 미설정 (placeholder)
| 변수 | 필요 시점 | 용도 |
|------|-----------|------|
| `NEXT_PUBLIC_PORTONE_STORE_ID` | 결제 오픈 시 | PortOne 결제 (portone.io 가입 필요) |
| `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | 결제 오픈 시 | PortOne 채널 키 |
| `PORTONE_API_SECRET` | 결제 오픈 시 | PortOne 서버 시크릿 |
| `PORTONE_WEBHOOK_SECRET` | 결제 오픈 시 | PortOne 웹훅 검증 |
| `PORTONE_PG_MID` | 결제 오픈 시 | PG사 상점 ID |
| `KIS_APP_KEY` | 실시간 시세 시 | 한국투자증권 KIS API |
| `KIS_APP_SECRET` | 실시간 시세 시 | KIS API 시크릿 |
| `KIS_ACCOUNT_NUMBER` | 실시간 시세 시 | KIS 계좌번호 |
| `CRON_SECRET` | 배포 시 | Vercel Cron 인증 |
| `ADMIN_SECRET` | 배포 시 | 관리자 API 인증 |

> PortOne, KIS는 외부 서비스 가입 후 발급받아야 함. CRON_SECRET, ADMIN_SECRET은 배포 시 임의 생성.

## TODO (2026-02-13)

### ~~1. CRON_SECRET 설정 + Cron 트리거~~ ✅ 완료
- ~~Vercel 대시보드에서 `CRON_SECRET` 환경변수 추가~~ → 설정 완료
- ~~수동 트리거로 `daily-top5-debate` 실행~~ → verdicts 테이블에 오늘 데이터 존재 확인
- 홈페이지 Top 5 표시 확인 필요

### ~~2. AI 상담 버그 수정~~ ✅ 완료 (8개 커밋)
- sendMessage 필드명 불일치 수정
- consultation/chat API FREE_MODE 우회 추가
- 관리자 계정 무제한 접근
- Gemini history 순서 수정
- 마크다운 제거, 에러 피드백, 마이페이지 통계 연동

### 3. Supabase `verdicts` 테이블 확인
- 테이블 존재 여부, 컬럼 구조 (top5, claude_top5, gemini_top5, gpt_top5, debate_log 등)
- `predictions` 테이블도 확인
- 필요 시 마이그레이션 추가

## 잔여 가짜/하드코딩 데이터 목록 (향후 정리 대상)

> 2026-02-13 코드 스캔 결과. 현재는 데모용으로 유지, 실제 데이터 축적 후 교체 예정.

### 높은 우선순위 (사용자에게 잘못된 정보 가능)

| # | 파일 | 문제 | 비고 |
|---|------|------|------|
| 1 | `app/api/b2b/one-line/route.ts:4-46` | `MOCK_COMMENTS` - 7개 종목 가짜 분석 결과 (sentiment/confidence 고정) | B2B API 사용 시 실제 AI 분석으로 교체 필요 |
| 2 | `app/api/backtest/route.ts:20-125` | `HIGH_RETURN_SAMPLES` - 10개 종목 비현실적 수익률 (268%, 193% 등) | DB 분석이력 축적 후 실제 데이터로 교체 |
| 3 | `app/api/analysis/cross-validate/route.ts:90` | `currentPrice \|\| 70000` - 현재가 못 받으면 임의 70000원 사용 | 에러 반환 또는 재시도 로직 필요 |

### 낮은 우선순위 (의도적 하드코딩 / 기능적 문제 없음)

| # | 파일 | 내용 | 비고 |
|---|------|------|------|
| 4 | `app/battle/[symbol]/page.tsx:81-128` | `SYMBOL_MAP` - 43개 종목 메타데이터 (이름/섹터/기본가격) | AI 분석 후보군, 실시간 가격은 별도 조회 |
| 5 | `app/api/cron/daily-top5-debate/route.ts:23-67` | `CANDIDATE_STOCKS` - 67개 후보 종목 | Cron이 여기서 랜덤 선정, 의도적 설계 |
| 6 | `app/api/cron/vip-stocks/route.ts` | 15개 VIP 종목 후보 | Pro 전용 추천 후보군 |
| 7 | `app/api/premium/hidden-gems/route.ts` | 18개 숨겨진 보석 후보 | AI가 실시간 분석하므로 기능 문제 없음 |
| 8 | `app/battle/page.tsx` | 인기 종목 8개(한국) + 6개(미국) | UI 바로가기용, 의도적 |

### 완료 (2026-02-13 수정됨)

| # | 파일 | 수정 내용 |
|---|------|----------|
| ~~1~~ | `app/community/page.tsx` | ~~POPULAR_STOCKS 가짜 통계~~ → API `/api/community/stock-rooms` 실제 DB 조회 |
| ~~2~~ | `components/marketing/ComparisonTable.tsx` | ~~가짜 fallback (85,000원 목표가)~~ → API 실패 시 숨김 |
| ~~3~~ | `components/marketing/MissedOpportunity.tsx` | ~~가짜 fallback (에코프로 +12% 등)~~ → 실제 데이터 없으면 숨김 |
| ~~4~~ | `app/report/[id]/page.tsx` | ~~MOCK_REPORT 전체 목업~~ → `/api/report/[id]` 실제 analysis_history 조회 |

## 개발 규칙
- 한국어 커밋 메시지 사용
- Tailwind CSS 유틸리티 클래스 우선
- API Route에서 Supabase RLS 활용
- AI 호출은 반드시 사용량 체크 후 실행
