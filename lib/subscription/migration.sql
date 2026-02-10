-- =====================================================
-- StockHero 구독 시스템 마이그레이션
-- Free / Lite / Basic / Pro 구조로 변경
-- =====================================================

-- 1. 기존 tier CHECK 제약 조건 제거
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- 2. 새로운 tier CHECK 제약 조건 추가
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_tier_check
CHECK (tier IN ('free', 'lite', 'basic', 'pro'));

-- 3. 기존 구독자 마이그레이션
-- 옵션 A: Grandfathering (기존 가격 유지) - 추천
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_grandfathered BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS legacy_price INTEGER;

-- 기존 basic → basic (가격 유지: ₩9,900)
UPDATE subscriptions
SET is_grandfathered = true,
    legacy_price = 9900
WHERE tier = 'basic'
  AND created_at < '2026-02-10';

-- 기존 pro → pro (가격 유지: ₩29,900)
UPDATE subscriptions
SET is_grandfathered = true,
    legacy_price = 29900
WHERE tier = 'pro'
  AND created_at < '2026-02-10';

-- 기존 vip → pro (가격 유지: ₩79,900)
UPDATE subscriptions
SET tier = 'pro',
    is_grandfathered = true,
    legacy_price = 79900
WHERE tier = 'vip';

-- 옵션 B: 강제 업그레이드 (사용 시 주석 해제)
-- UPDATE subscriptions SET tier = 'basic' WHERE tier = 'basic'; -- ₩9,900 → ₩14,900
-- UPDATE subscriptions SET tier = 'pro' WHERE tier = 'pro';     -- ₩29,900 → ₩39,900
-- UPDATE subscriptions SET tier = 'pro' WHERE tier = 'vip';     -- ₩79,900 → ₩39,900 (다운)

-- 4. feature_usage 테이블에 api_cost 컬럼 추가 (API 비용 추적)
ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS api_cost INTEGER DEFAULT 0;

-- 5. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_feature_usage_cost ON feature_usage(user_id, usage_date, api_cost);
CREATE INDEX IF NOT EXISTS idx_subscriptions_grandfathered ON subscriptions(is_grandfathered) WHERE is_grandfathered = true;

-- 6. 함수: 등급별 AI 개수 반환
CREATE OR REPLACE FUNCTION get_ai_count(p_tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN RETURN 1;
    WHEN 'lite' THEN RETURN 2;
    WHEN 'basic' THEN RETURN 3;
    WHEN 'pro' THEN RETURN 3;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. 함수: 교차검증 가능 여부
CREATE OR REPLACE FUNCTION has_cross_validation(p_tier VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_tier IN ('basic', 'pro');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 8. 뷰: 활성 구독자 통계
CREATE OR REPLACE VIEW subscription_stats AS
SELECT
  tier,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE is_grandfathered) as grandfathered_count,
  AVG(CASE
    WHEN is_grandfathered THEN legacy_price
    ELSE CASE tier
      WHEN 'lite' THEN 4900
      WHEN 'basic' THEN 14900
      WHEN 'pro' THEN 39900
      ELSE 0
    END
  END) as avg_revenue
FROM subscriptions
WHERE status = 'active'
GROUP BY tier;

-- 9. 트리거: Pro 사용자 일일 API 비용 경고
CREATE OR REPLACE FUNCTION check_pro_user_cost_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier VARCHAR;
  v_today_cost INTEGER;
BEGIN
  -- 사용자 티어 조회
  SELECT tier INTO v_tier
  FROM subscriptions
  WHERE user_id = NEW.user_id
    AND status = 'active';

  -- Pro 등급만 체크
  IF v_tier = 'pro' THEN
    -- 오늘 총 비용 계산
    SELECT COALESCE(SUM(api_cost), 0) INTO v_today_cost
    FROM feature_usage
    WHERE user_id = NEW.user_id
      AND usage_date = CURRENT_DATE;

    -- 일일 한도: ₩1,713 (월 ₩34,250 / 30일 × 1.5 안전 마진)
    IF v_today_cost > 1713 THEN
      RAISE NOTICE 'Pro user % exceeded daily API cost limit: ₩%', NEW.user_id, v_today_cost;
      -- 필요시 알림 발송 또는 차단 로직 추가
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_pro_cost
  AFTER INSERT OR UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION check_pro_user_cost_limit();

-- 10. 마이그레이션 완료 로그
INSERT INTO public.migrations (name, executed_at)
VALUES ('subscription_tier_restructure_v2', NOW())
ON CONFLICT (name) DO NOTHING;

-- 11. 확인 쿼리
SELECT
  tier,
  COUNT(*) as users,
  COUNT(*) FILTER (WHERE is_grandfathered) as grandfathered,
  MIN(created_at) as oldest_user
FROM subscriptions
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'free' THEN 1
    WHEN 'lite' THEN 2
    WHEN 'basic' THEN 3
    WHEN 'pro' THEN 4
  END;

-- =====================================================
-- 완료!
-- 다음 단계: Supabase SQL Editor에서 실행하세요
-- =====================================================
