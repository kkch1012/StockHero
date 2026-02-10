# ⚡ 빠른 시작 가이드

## 🎯 지금 할 일 (3분 완료)

### 1️⃣ Supabase SQL Editor 열기
https://supabase.com/dashboard → SQL Editor

### 2️⃣ 이 파일 실행
```bash
supabase/migrations/999_clean_migration.sql
```

### 3️⃣ 완료 메시지 확인
```
✅ StockHero 클린 마이그레이션 완료!
```

---

## 📊 생성된 것

### 테이블 5개
- ✅ `subscriptions` (구독)
- ✅ `payments` (결제)
- ✅ `feature_usage` (사용량 + API 비용)
- ✅ `analysis_history` (교차검증 결과)
- ✅ `migrations` (마이그레이션 추적)

### 함수 7개
- ✅ `get_ai_count(tier)` - 티어별 AI 개수
- ✅ `has_cross_validation(tier)` - 교차검증 가능?
- ✅ 기타 5개 유틸리티 함수

---

## 🧪 빠른 테스트

```sql
-- AI 개수 확인
SELECT 'free' as tier, get_ai_count('free') as ai_count
UNION ALL SELECT 'lite', get_ai_count('lite')
UNION ALL SELECT 'basic', get_ai_count('basic')
UNION ALL SELECT 'pro', get_ai_count('pro');
```

**예상 결과:**
```
free  → 1 (Gemini만)
lite  → 2 (Gemini + Claude)
basic → 3 (3 AI 교차검증)
pro   → 3 (3 AI 교차검증)
```

---

## 🚀 다음 단계

1. **API 테스트**
   ```bash
   curl -X POST http://localhost:3000/api/analysis/cross-validate \
     -H "Content-Type: application/json" \
     -d '{"symbol":"005930","symbolName":"삼성전자","currentPrice":75000}'
   ```

2. **프론트엔드 통합**
   - 교차검증 UI 개발
   - 합의 등급 배지 (🟢🟡🔴)
   - 티어별 업그레이드 프롬프트

---

## 📚 자세한 문서

- **README_MIGRATION.md** - 전체 마이그레이션 가이드
- **EXECUTE_NOW.md** - 상세 실행 방법
- **00_MIGRATION_STRATEGY.md** - 마이그레이션 전략

---

## 💡 핵심 변경사항

| 항목 | 기존 | 신규 |
|------|------|------|
| **스키마** | `user_subscriptions` | `subscriptions` |
| **티어** | free/basic/pro/vip | free/lite/basic/pro |
| **AI 개수** | 고정 3개 | 1/2/3개 (티어별) |
| **분석 방식** | 순차 토론 (60초) | 병렬 교차검증 (6초) |
| **합의 등급** | ❌ 없음 | ✅ STRONG/MODERATE/CONFLICT |
| **API 비용 추적** | ❌ 없음 | ✅ feature_usage.api_cost |

---

**준비 완료! 🎉**
이제 교차검증 시스템을 사용할 수 있습니다.
