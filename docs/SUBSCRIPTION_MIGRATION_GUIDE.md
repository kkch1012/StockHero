# 🚀 구독 시스템 마이그레이션 가이드

## 📋 변경 요약

### 구조 변경
```
[기존] free → basic → pro → vip
        ₩0   ₩9,900  ₩29,900  ₩79,900

[신규] free → lite → basic → pro
        ₩0   ₩4,900  ₩14,900  ₩39,900
```

### 핵심 차별화: AI 개수
```
Free:  1개 AI (Gemini만)
Lite:  2개 AI (Gemini + Claude)
Basic: 3개 AI (교차검증) 🎯 캐시카우
Pro:   3개 AI + 무제한 분석
```

---

## 💰 수익성 설계

### 등급별 API 비용 & 마진

| 등급 | 월 가격 | API 비용 | 마진율 | 전략 |
|------|---------|----------|--------|------|
| **Free** | ₩0 | ₩63 | - | 미끼 상품 |
| **Lite** | ₩4,900 | ₩273 | 19% | 퍼널 (Basic 유도) |
| **Basic** | ₩14,900 | ₩7,770 | 24% | 🎯 **캐시카우** |
| **Pro** | ₩39,900 | ₩34,250 | 8.5% | ⚠️ 사용량 캡 필수 |

### 핵심 전략
1. **Basic이 진짜 수익원**: 교차검증 제공하되 채팅 제한 (10회/일)
2. **Pro는 함정**: AI 채팅이 API 비용 폭발 유발 → 50회/일 캡 적용
3. **Lite는 퍼널**: 낮은 가격으로 진입 → Basic 전환 유도

---

## 🛠️ 마이그레이션 단계

### Phase 1: 코드 변경 ✅ 완료
- [x] `types/subscription.ts` - 타입 정의
- [x] `lib/subscription/config.ts` - 플랜 설정
- [x] `lib/subscription/schema.sql` - DB 제약 조건
- [x] `lib/subscription/usage-limiter.ts` - 사용량 제한 (신규)
- [x] `lib/admin/config.ts` - 관리자 설정

### Phase 2: DB 마이그레이션 (수동 실행 필요)

#### 2-1. Supabase SQL Editor에서 실행
```bash
# 파일 열기
open lib/subscription/migration.sql
```

해당 SQL을 Supabase SQL Editor에 복사/붙여넣기 후 실행

#### 2-2. 확인 쿼리
```sql
-- 마이그레이션 결과 확인
SELECT
  tier,
  COUNT(*) as users,
  COUNT(*) FILTER (WHERE is_grandfathered) as grandfathered_users,
  ARRAY_AGG(DISTINCT user_id) FILTER (WHERE is_grandfathered) as grandfathered_ids
FROM subscriptions
GROUP BY tier;
```

### Phase 3: 기존 구독자 처리

#### 옵션 A: Grandfathering (추천) ✅
```sql
-- 기존 가격 유지
-- is_grandfathered = true 플래그 설정
-- legacy_price 컬럼에 기존 가격 저장

-- 예시:
-- 기존 basic (₩9,900) → 새 basic 구조이지만 ₩9,900 유지
-- 기존 pro (₩29,900) → 새 pro 구조이지만 ₩29,900 유지
-- 기존 vip (₩79,900) → pro로 전환하되 ₩79,900 유지
```

**장점**: 유저 이탈 방지, 신뢰 유지
**단점**: 시스템 복잡도 약간 증가

#### 옵션 B: 강제 전환 (비추천)
```sql
-- 모든 유저를 새 가격으로 강제 전환
-- 이탈 위험 높음
```

### Phase 4: 프론트엔드 확인

자동 반영되는 컴포넌트:
- `app/subscription/page.tsx` - 구독 페이지
- `components/UpgradeModal.tsx` - 업그레이드 모달
- `components/UpgradePrompt.tsx` - 업그레이드 안내

확인 사항:
- [ ] 4개 플랜 정상 표시
- [ ] 가격 정확함
- [ ] Lite 플랜 노출
- [ ] VIP 플랜 제거

### Phase 5: API 사용량 모니터링 설정

#### 5-1. Pro 사용자 비용 경고
```typescript
// 이미 구현됨: lib/subscription/usage-limiter.ts
// Pro 유저 일일 ₩1,713 초과 시 자동 경고
```

#### 5-2. 관리자 대시보드
```typescript
// TODO: 구현 필요
// - 등급별 API 비용 실시간 차트
// - 비용 초과 유저 알림
// - 수익성 분석 대시보드
```

---

## 📊 사용량 제한 정책

### AI 채팅 (API 비용 핵심!)

| 등급 | 일일 한도 | 월 예상 비용 |
|------|----------|-------------|
| Free | 0회 | ₩0 |
| Lite | 3회 | ₩180 |
| Basic | 10회 | ₩7,200 |
| Pro | 50회 ⚠️ | ₩30,000 (캡 적용!) |

### 교차검증 분석

| 등급 | 제공 여부 | 일일 예상 사용 |
|------|----------|--------------|
| Free | ❌ | - |
| Lite | ❌ | - |
| Basic | ✅ | 5-10회 |
| Pro | ✅ | 10-20회 |

---

## 🚨 Pro 등급 비용 폭발 방지

### 문제점
```
Pro 무제한 채팅 시:
- 유저가 하루 100회 채팅
- Claude API: ₩60 × 100 = ₩6,000/일
- 월 ₩180,000 API 비용 (₩39,900 구독료로 감당 불가)
```

### 해결책 ✅
```typescript
// lib/subscription/usage-limiter.ts

1. 일일 50회 캡 적용
2. 일일 API 비용 ₩1,713 초과 시 자동 차단
3. 트리거로 실시간 모니터링
```

---

## 📈 12개월 시뮬레이션 결과

### 기본 시나리오
- 리더 월 10명 증가
- 리더당 구독자 30명
- 전환율 15%

### 예상 결과
```
14개월차: BEP (손익분기점)
24개월 누적: +₩80,000,000
```

### 등급별 구성 (안정기)
```
Free:  60% (퍼널)
Lite:  15% (전환 대기)
Basic: 20% (캐시카우) 🎯
Pro:   5%  (프리미엄)
```

---

## ✅ 체크리스트

### 개발자
- [x] 타입 정의 변경
- [x] 플랜 설정 변경
- [x] DB 스키마 변경
- [x] 사용량 제한 로직 구현
- [ ] DB 마이그레이션 실행
- [ ] 프론트엔드 확인
- [ ] 테스트 (4개 등급 결제)

### 기획자
- [ ] 기존 구독자 이메일 발송
- [ ] 마이그레이션 정책 확정
- [ ] 고객 지원 FAQ 작성
- [ ] 마케팅 메시지 업데이트

### 관리자
- [ ] Supabase SQL 실행
- [ ] 기존 구독자 데이터 확인
- [ ] API 비용 모니터링 설정
- [ ] 알림 채널 연동

---

## 🔧 롤백 계획

문제 발생 시:

```sql
-- 1. tier 제약 조건 복원
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_tier_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_tier_check
CHECK (tier IN ('free', 'basic', 'pro', 'vip'));

-- 2. 기존 구독자 복원
UPDATE subscriptions
SET tier = 'vip'
WHERE tier = 'pro' AND legacy_price = 79900;

-- 3. grandfathered 컬럼 제거
ALTER TABLE subscriptions DROP COLUMN IF EXISTS is_grandfathered;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS legacy_price;
```

---

## 📞 문의

문제 발생 시:
1. GitHub Issues 등록
2. Slack #dev-subscription 채널
3. 긴급: godqhr398@gmail.com

---

**마이그레이션 준비 완료!** 🚀
다음 단계: Supabase SQL 실행
