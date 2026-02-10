# 🚀 Supabase 마이그레이션 가이드

## ⚠️ 업데이트: 새로운 마이그레이션 파일 사용

**기존 파일 (사용 안 함):** ~~001_full_migration.sql~~
**새로운 파일:** `999_clean_migration.sql` ← **이것을 사용하세요!**

### 왜 변경되었나요?
- 기존 DB 스키마와 코드 불일치 문제 해결
- OLD 스키마 (`user_subscriptions`) → NEW 스키마 (`subscriptions`) 전환
- 교차검증 시스템 완전 통합

---

## 📋 실행 순서

### 1단계: 백업 (선택사항)
```sql
-- 기존 테이블이 있다면 백업 (선택사항)
CREATE TABLE user_subscriptions_backup AS SELECT * FROM user_subscriptions;
CREATE TABLE subscription_usage_backup AS SELECT * FROM subscription_usage;
```

**주의:** 개발/테스트 환경이면 백업 불필요

### 2단계: 마이그레이션 실행

#### 방법 A: Supabase Dashboard (추천)
1. Supabase Dashboard 접속
2. 좌측 메뉴에서 **SQL Editor** 클릭
3. **New Query** 버튼 클릭
4. 아래 파일 내용 복사/붙여넣기
   ```
   supabase/migrations/999_clean_migration.sql
   ```
5. **Run** 버튼 클릭
6. 결과 확인

#### 방법 B: Supabase CLI
```bash
# 1. Supabase CLI 설치 (없으면)
npm install -g supabase

# 2. 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 3. 마이그레이션 실행
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"
```

### 3단계: 확인

#### 3-1. 테이블 확인
```sql
-- 테이블 목록
SELECT table_name, column_count
FROM (
  SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
  FROM information_schema.tables t
  WHERE table_schema = 'public'
    AND table_name IN (
      'subscriptions',
      'feature_usage',
      'analysis_history',
      'migrations'
    )
) sub
ORDER BY table_name;

-- 예상 결과:
-- subscriptions (14+ 컬럼)
-- feature_usage (9+ 컬럼)
-- analysis_history (15+ 컬럼)
-- migrations (3 컬럼)
```

#### 3-2. 구독 현황 확인
```sql
SELECT * FROM subscription_stats;

-- 예상 결과:
-- tier | user_count | grandfathered_count | avg_revenue
-- free |     X      |          0          |      0
-- lite |     X      |          X          |   4900
-- basic|     X      |          X          |  14900
-- pro  |     X      |          X          |  39900
```

#### 3-3. 함수 확인
```sql
-- AI 개수 테스트
SELECT
  'free' as tier, get_ai_count('free') as ai_count
UNION ALL
SELECT 'lite', get_ai_count('lite')
UNION ALL
SELECT 'basic', get_ai_count('basic')
UNION ALL
SELECT 'pro', get_ai_count('pro');

-- 예상 결과:
-- free  | 1
-- lite  | 2
-- basic | 3
-- pro   | 3

-- 교차검증 가능 여부 테스트
SELECT
  'free' as tier, has_cross_validation('free') as has_cv
UNION ALL
SELECT 'lite', has_cross_validation('lite')
UNION ALL
SELECT 'basic', has_cross_validation('basic')
UNION ALL
SELECT 'pro', has_cross_validation('pro');

-- 예상 결과:
-- free  | false
-- lite  | false
-- basic | true
-- pro   | true
```

#### 3-4. 사용량 리포트 확인 (관리자용)
```sql
SELECT * FROM generate_usage_report();

-- 결과: 티어별 사용자/분석 횟수/API 비용/마진
```

---

## ✅ 체크리스트

### 마이그레이션 전
- [ ] 백업 완료 (`subscriptions_backup`, `feature_usage_backup`)
- [ ] 현재 구독자 수 확인
- [ ] 기존 데이터 검토

### 마이그레이션 실행
- [ ] `001_full_migration.sql` 실행 완료
- [ ] 에러 없이 완료됨
- [ ] SUCCESS 메시지 확인

### 마이그레이션 후
- [ ] 테이블 존재 확인 (`analysis_history` 신규 생성)
- [ ] 컬럼 추가 확인 (`is_grandfathered`, `legacy_price`, `api_cost`)
- [ ] 함수 생성 확인 (5개 함수)
- [ ] 트리거 생성 확인 (`trigger_check_pro_cost`)
- [ ] 뷰 생성 확인 (`subscription_stats`, `analysis_stats`)
- [ ] 기존 구독자 마이그레이션 확인 (grandfathering 적용)
- [ ] 인덱스 생성 확인

---

## 🔍 상세 확인 쿼리

### 1. 기존 구독자 Grandfathering 확인
```sql
SELECT
  tier,
  is_grandfathered,
  legacy_price,
  COUNT(*) as count
FROM subscriptions
GROUP BY tier, is_grandfathered, legacy_price
ORDER BY tier;

-- 예상:
-- basic | true  | 9900  | X명 (기존 유저)
-- basic | false | null  | X명 (신규 유저)
-- pro   | true  | 29900 | X명 (기존 유저)
-- pro   | true  | 79900 | X명 (구 VIP)
```

### 2. feature_usage 테이블 확인
```sql
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'feature_usage'
ORDER BY ordinal_position;

-- api_cost INTEGER 컬럼 확인
```

### 3. analysis_history 테이블 확인
```sql
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'analysis_history'
ORDER BY ordinal_position;

-- 15개 컬럼 확인
```

### 4. 인덱스 확인
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('feature_usage', 'analysis_history', 'subscriptions')
ORDER BY tablename, indexname;

-- 최소 8개 인덱스 확인
```

### 5. RLS 정책 확인
```sql
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('analysis_history', 'feature_usage', 'subscriptions')
ORDER BY tablename, policyname;

-- analysis_history: 2개 정책
```

---

## 🚨 문제 해결

### 에러 1: 테이블이 존재하지 않음
```sql
-- subscriptions 테이블이 없는 경우
-- 먼저 기본 스키마 실행 필요
-- supabase/schema.sql 파일 실행 후 다시 시도
```

### 에러 2: 제약 조건 충돌
```sql
-- 기존 tier 값이 'vip'인 경우
-- 마이그레이션이 자동으로 'pro'로 변환
-- 수동으로 확인:
SELECT tier, COUNT(*) FROM subscriptions GROUP BY tier;

-- 'vip'가 남아있으면 수동 변경:
UPDATE subscriptions SET tier = 'pro' WHERE tier = 'vip';
```

### 에러 3: 함수 중복
```sql
-- 함수가 이미 존재하는 경우
DROP FUNCTION IF EXISTS get_ai_count(VARCHAR);
DROP FUNCTION IF EXISTS has_cross_validation(VARCHAR);
-- 그리고 다시 실행
```

### 에러 4: 권한 부족
```sql
-- SECURITY DEFINER 권한 문제
-- Supabase Dashboard에서 실행하면 자동으로 해결됨
-- 또는 postgres 역할로 실행
```

---

## 📊 마이그레이션 후 테스트

### 1. 신규 분석 저장 테스트
```sql
-- 테스트 데이터 삽입
INSERT INTO analysis_history (
  user_id,
  symbol,
  symbol_name,
  tier,
  analysis_type,
  consensus_grade,
  consensus_confidence,
  consensus_price,
  used_ais,
  api_cost,
  result
) VALUES (
  auth.uid(), -- 또는 테스트 UUID
  '005930',
  '삼성전자',
  'basic',
  'cross_validation',
  'STRONG',
  95,
  87000,
  ARRAY['gemini', 'claude', 'gpt'],
  30,
  '{"test": true}'::jsonb
);

-- 조회 확인
SELECT * FROM analysis_history WHERE symbol = '005930' ORDER BY created_at DESC LIMIT 1;
```

### 2. 사용량 증가 테스트
```sql
-- feature_usage 레코드 생성
INSERT INTO feature_usage (
  user_id,
  feature_key,
  usage_count,
  usage_date,
  api_cost
) VALUES (
  auth.uid(),
  'cross_validation',
  1,
  CURRENT_DATE,
  30
);

-- 조회 확인
SELECT * FROM feature_usage WHERE user_id = auth.uid() AND usage_date = CURRENT_DATE;
```

### 3. Pro 비용 한도 트리거 테스트
```sql
-- Pro 유저로 임시 설정
UPDATE subscriptions SET tier = 'pro' WHERE user_id = auth.uid();

-- 높은 비용으로 feature_usage 삽입 (1,800원)
INSERT INTO feature_usage (user_id, feature_key, usage_count, usage_date, api_cost)
VALUES (auth.uid(), 'test', 1, CURRENT_DATE, 1800);

-- NOTICE 메시지 확인 (한도 초과 경고)
```

---

## 🎉 완료 확인

모든 체크리스트가 완료되면:

```sql
-- 최종 확인
SELECT
  '✅ Subscriptions' as status,
  COUNT(*) as count
FROM subscriptions
UNION ALL
SELECT
  '✅ Feature Usage',
  COUNT(*)
FROM feature_usage
UNION ALL
SELECT
  '✅ Analysis History',
  COUNT(*)
FROM analysis_history
UNION ALL
SELECT
  '✅ Migrations',
  COUNT(*)
FROM migrations;

-- 결과에 모든 테이블이 표시되면 성공!
```

---

## 📞 문제 발생 시

1. **백업 복원**
   ```sql
   DROP TABLE IF EXISTS subscriptions;
   CREATE TABLE subscriptions AS SELECT * FROM subscriptions_backup;
   ```

2. **Discord/GitHub Issues**
   - 에러 메시지 전체 복사
   - 실행한 SQL 첨부
   - Supabase 버전 확인

3. **롤백**
   ```sql
   -- tier 제약 조건 복원
   ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_tier_check;
   ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tier_check
   CHECK (tier IN ('free', 'basic', 'pro', 'vip'));
   ```

---

**마이그레이션 준비 완료!** 🚀
Supabase SQL Editor에서 `001_full_migration.sql`을 실행하세요!
