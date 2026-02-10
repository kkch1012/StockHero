# 🎯 StockHero 교차검증 시스템 마이그레이션

## 📊 현재 상황

### ❌ 문제점
1. **스키마 불일치**:
   - 기존 DB: `user_subscriptions`, `subscription_plans` 테이블 (OLD 스키마)
   - 신규 코드: `subscriptions`, `feature_usage` 테이블 (NEW 스키마)

2. **에러 발생**:
   ```
   ERROR: relation "subscriptions" does not exist
   ```

3. **티어 구조 변경**:
   - 기존: free, basic, pro, vip
   - 신규: free, lite, basic, pro (AI 개수 기반 차별화)

### ✅ 해결 방법

**단 1개 파일만 실행**하면 모든 문제가 해결됩니다:

```
supabase/migrations/999_clean_migration.sql
```

---

## 🚀 실행 가이드

### STEP 1: Supabase Dashboard 접속
1. https://supabase.com/dashboard 로그인
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New Query** 버튼 클릭

### STEP 2: SQL 파일 복사
```bash
# 터미널에서 파일 내용 확인
cat supabase/migrations/999_clean_migration.sql
```

전체 내용을 복사해서 SQL Editor에 붙여넣기

### STEP 3: 실행
- **Run** 버튼 클릭 (또는 Cmd/Ctrl + Enter)
- 약 2-3초 소요

### STEP 4: 결과 확인
마지막에 이런 메시지가 보이면 성공:
```
✅ StockHero 클린 마이그레이션 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다음 단계:
1. 위 확인 쿼리 결과 검토
2. 티어별 AI 개수 확인
3. 구독 통계 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 무엇이 변경되나요?

### 1. 테이블 구조
| 기존 (OLD) | 신규 (NEW) | 설명 |
|-----------|-----------|------|
| `user_subscriptions` | `subscriptions` | 단순화된 구조 |
| `subscription_plans` | *(제거)* | 티어를 직접 저장 |
| `subscription_usage` | `feature_usage` | API 비용 추적 추가 |
| `subscription_transactions` | `payments` | 단순화 |
| *(없음)* | `analysis_history` | **신규**: 교차검증 결과 저장 |

### 2. 티어 시스템
```typescript
// 기존
'free' | 'basic' | 'pro' | 'vip'

// 신규 (AI 개수 기반)
'free'  → 1개 AI (Gemini)
'lite'  → 2개 AI (Gemini + Claude)      ← NEW!
'basic' → 3개 AI (교차검증)
'pro'   → 3개 AI (교차검증 + 무제한)
```

### 3. 새로운 기능
- ✅ **진짜 교차검증**: 3개 AI 병렬 독립 분석
- ✅ **합의 등급**: STRONG / MODERATE / CONFLICT
- ✅ **API 비용 추적**: Pro 유저 일일 한도 (₩1,713)
- ✅ **Grandfathering**: 기존 유저 가격 보호
- ✅ **분석 이력**: 교차검증 결과 영구 저장

---

## 📦 생성되는 리소스

### 테이블 (5개)
1. `subscriptions` - 구독 정보
2. `payments` - 결제 이력
3. `feature_usage` - 기능 사용량 (API 비용 포함)
4. `analysis_history` - 교차검증 결과
5. `migrations` - 마이그레이션 추적

### 인덱스 (13개)
- 성능 최적화를 위한 인덱스
- RLS 정책에 맞춘 인덱스

### 함수 (7개)
1. `get_ai_count(tier)` - 티어별 AI 개수
2. `has_cross_validation(tier)` - 교차검증 가능 여부
3. `get_expected_api_cost(tier)` - 예상 API 비용
4. `increment_feature_usage()` - 사용량 증가
5. `check_pro_user_cost_limit()` - Pro 비용 한도 체크
6. `update_updated_at_column()` - 자동 타임스탬프 갱신
7. `generate_usage_report()` - 사용량 리포트 (관리자용)

### 뷰 (2개)
1. `subscription_stats` - 구독 통계
2. `analysis_stats` - 분석 통계

### 트리거 (4개)
- Pro 유저 비용 한도 체크
- Updated_at 자동 갱신 (3개 테이블)

---

## ✅ 확인 테스트

### 1. 테이블 확인
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payments', 'feature_usage', 'analysis_history')
ORDER BY table_name;
```

**예상 결과:** 4개 테이블 모두 표시

### 2. AI 개수 함수 테스트
```sql
SELECT
  'free' as tier, get_ai_count('free') as ai_count
UNION ALL
SELECT 'lite', get_ai_count('lite')
UNION ALL
SELECT 'basic', get_ai_count('basic')
UNION ALL
SELECT 'pro', get_ai_count('pro');
```

**예상 결과:**
```
free  | 1
lite  | 2
basic | 3
pro   | 3
```

### 3. 교차검증 가능 여부
```sql
SELECT
  'free' as tier, has_cross_validation('free') as can_cv
UNION ALL
SELECT 'lite', has_cross_validation('lite')
UNION ALL
SELECT 'basic', has_cross_validation('basic')
UNION ALL
SELECT 'pro', has_cross_validation('pro');
```

**예상 결과:**
```
free  | false
lite  | false
basic | true  ← 교차검증 시작
pro   | true
```

---

## 🎯 다음 단계

마이그레이션 완료 후:

### 1. 프론트엔드 통합 시작
```typescript
// 교차검증 API 호출
const response = await fetch('/api/analysis/cross-validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symbol: '005930',
    symbolName: '삼성전자',
    currentPrice: 75000
  })
});

const data = await response.json();
// data.tier: 'basic'
// data.analysisType: 'cross_validation'
// data.result.consensusGrade: 'STRONG' | 'MODERATE' | 'CONFLICT'
```

### 2. UI 컴포넌트 개발
- [ ] 합의 등급 배지 (🟢🟡🔴)
- [ ] 티어별 분석 결과 레이아웃
- [ ] 업그레이드 프롬프트
- [ ] 사용량 표시

### 3. 테스트
```bash
# 로컬 개발 서버 실행
npm run dev

# 교차검증 API 테스트
curl -X POST http://localhost:3000/api/analysis/cross-validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symbol":"005930","symbolName":"삼성전자","currentPrice":75000}'
```

---

## 📚 관련 문서

1. **EXECUTE_NOW.md** - 실행 방법 상세 가이드
2. **00_MIGRATION_STRATEGY.md** - 마이그레이션 전략 설명
3. **docs/CROSS_VALIDATION_IMPLEMENTATION.md** - 교차검증 시스템 설명
4. **docs/TIER_DIFFERENCES.md** - 티어별 차이점 상세

---

## 🚨 주의사항

### ⚠️ 데이터 손실
`999_clean_migration.sql`은 기존 OLD 스키마 테이블을 **삭제**합니다:
- `user_subscriptions`
- `subscription_plans`
- `subscription_usage`
- `subscription_transactions`

**개발/테스트 환경에서만 실행하세요!**

### 프로덕션 환경인 경우
실제 구독자가 있다면 데이터 마이그레이션 스크립트가 필요합니다.
알려주시면 별도로 작성해드리겠습니다.

---

## 🎉 완료!

마이그레이션 실행 후 이 문서를 참고하여:
1. ✅ 확인 테스트 실행
2. ✅ 프론트엔드 통합 시작
3. ✅ API 테스트

문제가 발생하면 에러 메시지 전체를 복사해서 알려주세요!
