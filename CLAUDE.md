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
app/api/user/analysis-history/route.ts  # GET 분석 이력 API

# 프론트엔드 - 공통
components/Header.tsx             # 데스크톱 헤더 (7개 메뉴)
components/BottomNav.tsx          # 모바일 하단 탭바

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
- [x] 프론트엔드 UI 연동 (로그인 페이지 + 쿠키 동기화 + 구독 관리 탭 + PortOne 미설정 대응)
- [x] API 통합 테스트 (2026-02-11 통과)
- [x] 인증 시스템 (@supabase/ssr + 쿠키 세션 + middleware 토큰 리프레시)
- [x] 네비게이션 재구성 (데스크톱 7메뉴 + 모바일 하단탭바 + 페이지 정리)
- [x] 핵심 플로우 (분석 이력 저장 + 마이페이지 이력탭 + 비로그인 유도)
- [ ] 미구현 페이지 (battle, heroes, themes, backtest)
- [ ] 배포 (Vercel + 환경변수 + Google OAuth redirect URI)

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
| `OPENROUTER_API_KEY` | 선택 | OpenRouter 통합 키 (미사용) |
| `CRON_SECRET` | 배포 시 | Vercel Cron 인증 |
| `ADMIN_SECRET` | 배포 시 | 관리자 API 인증 |

> PortOne, KIS는 외부 서비스 가입 후 발급받아야 함. CRON_SECRET, ADMIN_SECRET은 배포 시 임의 생성.

## 개발 규칙
- 한국어 커밋 메시지 사용
- Tailwind CSS 유틸리티 클래스 우선
- API Route에서 Supabase RLS 활용
- AI 호출은 반드시 사용량 체크 후 실행
