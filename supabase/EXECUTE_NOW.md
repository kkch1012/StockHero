# 🚀 지금 바로 실행하세요!

## 단 1개 파일만 실행하면 됩니다

### ✅ 실행할 파일
```
supabase/migrations/999_clean_migration.sql
```

### 📋 실행 방법

#### 1️⃣ Supabase Dashboard에서 실행 (추천)

1. **Supabase Dashboard** 접속
   - https://supabase.com/dashboard

2. 좌측 메뉴에서 **SQL Editor** 클릭

3. **New Query** 버튼 클릭

4. 파일 내용 복사 붙여넣기:
   ```bash
   # 터미널에서 파일 내용 확인
   cat supabase/migrations/999_clean_migration.sql
   ```

5. **Run** 버튼 클릭 (또는 Cmd/Ctrl + Enter)

6. 결과 확인:
   ```
   ✅ 5개 테이블 생성 확인
   ✅ 7개 함수 생성 확인
   ✅ "StockHero 클린 마이그레이션 완료!" 메시지
   ```

---

#### 2️⃣ Supabase CLI로 실행 (선택사항)

```bash
# 1. Supabase CLI 설치 (없으면)
npm install -g supabase

# 2. 프로젝트 연결
supabase link --project-ref YOUR_PROJECT_REF

# 3. 마이그레이션 실행
supabase db push
```

---

## 🔍 실행 후 확인

### 1. 테이블 생성 확인
```sql
SELECT table_name,
       (SELECT COUNT(*)
        FROM information_schema.columns
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'subscriptions',
    'payments',
    'feature_usage',
    'analysis_history',
    'migrations'
  )
ORDER BY table_name;
```

**예상 결과:**
```
analysis_history  | 15 컬럼
feature_usage     | 7 컬럼
migrations        | 3 컬럼
payments          | 13 컬럼
subscriptions     | 16 컬럼
```

### 2. AI 개수 함수 테스트
```sql
SELECT
  tier,
  get_ai_count(tier) as ai_count,
  has_cross_validation(tier) as has_cv
FROM (VALUES
  ('free'::VARCHAR),
  ('lite'::VARCHAR),
  ('basic'::VARCHAR),
  ('pro'::VARCHAR)
) AS t(tier);
```

**예상 결과:**
```
free  | 1 | false
lite  | 2 | false
basic | 3 | true
pro   | 3 | true
```

### 3. 구독 통계 뷰 확인
```sql
SELECT * FROM subscription_stats;
```

**예상 결과:** (구독자가 없으면 빈 결과)
```
(No rows)
```

---

## ✅ 완료 후 다음 단계

마이그레이션이 성공하면:

1. **프론트엔드 통합** 시작 가능
   - 교차검증 API 호출
   - 티어별 UI 분기
   - 합의 등급 배지 표시

2. **테스트 데이터 삽입** (선택사항)
   ```sql
   -- 테스트 유저 구독 추가
   INSERT INTO subscriptions (user_id, tier, status)
   VALUES (auth.uid(), 'basic', 'active');
   ```

3. **API 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/analysis/cross-validate \
     -H "Content-Type: application/json" \
     -d '{"symbol":"005930","symbolName":"삼성전자","currentPrice":75000}'
   ```

---

## 🚨 에러 발생 시

### "permission denied for schema public"
→ Supabase Dashboard에서 실행하면 자동 해결

### "relation already exists"
→ 정상입니다. `IF NOT EXISTS`가 있어서 무시됨

### "role does not exist"
→ `auth.uid()` 사용 시 로그인 필요

---

## 📞 도움이 필요하면

에러 메시지 전체를 복사해서 알려주세요!
