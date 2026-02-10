-- =====================================================
-- StockHero 전체 마이그레이션 SQL
-- Supabase SQL Editor에서 한 번에 실행하세요
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 구독 시스템 마이그레이션
-- =====================================================

-- 1-1. 기존 tier CHECK 제약 조건 제거
ALTER TABLE IF EXISTS subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;

-- 1-2. 새로운 tier CHECK 제약 조건 추가 (free/lite/basic/pro)
ALTER TABLE IF EXISTS subscriptions
ADD CONSTRAINT subscriptions_tier_check
CHECK (tier IN ('free', 'lite', 'basic', 'pro'));

-- 1-3. Grandfathering 컬럼 추가 (기존 가격 유지)
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS is_grandfathered BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS subscriptions ADD COLUMN IF NOT EXISTS legacy_price INTEGER;

-- 1-4. 기존 구독자 마이그레이션 (Grandfathering 적용)

-- 기존 basic → basic (가격 유지: ₩9,900)
UPDATE subscriptions
SET is_grandfathered = true,
    legacy_price = 9900
WHERE tier = 'basic'
  AND created_at < '2026-02-09'
  AND is_grandfathered = false;

-- 기존 pro → pro (가격 유지: ₩29,900)
UPDATE subscriptions
SET is_grandfathered = true,
    legacy_price = 29900
WHERE tier = 'pro'
  AND created_at < '2026-02-09'
  AND is_grandfathered = false;

-- 기존 vip → pro (가격 유지: ₩79,900)
UPDATE subscriptions
SET tier = 'pro',
    is_grandfathered = true,
    legacy_price = 79900
WHERE tier = 'vip';

-- =====================================================
-- 2. feature_usage 테이블 수정 (API 비용 추적)
-- =====================================================

-- 2-1. api_cost 컬럼 추가
ALTER TABLE IF EXISTS feature_usage ADD COLUMN IF NOT EXISTS api_cost INTEGER DEFAULT 0;

-- 2-2. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_feature_usage_cost ON feature_usage(user_id, usage_date, api_cost);
CREATE INDEX IF NOT EXISTS idx_subscriptions_grandfathered ON subscriptions(is_grandfathered)
WHERE is_grandfathered = true;

-- =====================================================
-- 3. 분석 이력 테이블 (교차검증 결과 저장)
-- =====================================================

CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,

  -- 분석 대상
  symbol VARCHAR(20) NOT NULL,
  symbol_name VARCHAR(100) NOT NULL,
  sector VARCHAR(50),

  -- 구독 정보
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'lite', 'basic', 'pro')),
  analysis_type VARCHAR(50) NOT NULL, -- 'single', 'comparison', 'cross_validation', 'debate'

  -- 교차검증 결과
  consensus_grade VARCHAR(20), -- 'STRONG', 'MODERATE', 'CONFLICT'
  consensus_confidence INTEGER, -- 0-100
  consensus_price INTEGER,

  -- 사용한 AI
  used_ais TEXT[], -- ['gemini', 'claude', 'gpt']

  -- API 비용
  api_cost INTEGER DEFAULT 0,

  -- 전체 결과 (JSON)
  result JSONB,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_symbol ON analysis_history(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_tier ON analysis_history(tier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_history_grade ON analysis_history(consensus_grade, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis history" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access analysis history" ON analysis_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- 4. 유틸리티 함수들
-- =====================================================

-- 4-1. 등급별 AI 개수 반환
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

-- 4-2. 교차검증 가능 여부
CREATE OR REPLACE FUNCTION has_cross_validation(p_tier VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_tier IN ('basic', 'pro');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4-3. 등급별 예상 API 비용
CREATE OR REPLACE FUNCTION get_expected_api_cost(p_tier VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  CASE p_tier
    WHEN 'free' THEN RETURN 5;   -- Gemini 1개
    WHEN 'lite' THEN RETURN 20;  -- Gemini + Claude
    WHEN 'basic' THEN RETURN 30; -- 3 AI
    WHEN 'pro' THEN RETURN 30;   -- 3 AI
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 5. Pro 사용자 비용 모니터링 트리거
-- =====================================================

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

DROP TRIGGER IF EXISTS trigger_check_pro_cost ON feature_usage;
CREATE TRIGGER trigger_check_pro_cost
  AFTER INSERT OR UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION check_pro_user_cost_limit();

-- =====================================================
-- 6. 구독 통계 뷰
-- =====================================================

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
  END) as avg_revenue,
  MIN(created_at) as oldest_subscription
FROM subscriptions
WHERE status = 'active'
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'free' THEN 1
    WHEN 'lite' THEN 2
    WHEN 'basic' THEN 3
    WHEN 'pro' THEN 4
  END;

-- =====================================================
-- 7. 분석 통계 뷰 (관리자용)
-- =====================================================

CREATE OR REPLACE VIEW analysis_stats AS
SELECT
  DATE(created_at) as date,
  tier,
  analysis_type,
  consensus_grade,
  COUNT(*) as analysis_count,
  SUM(api_cost) as total_api_cost,
  AVG(api_cost) as avg_api_cost,
  AVG(consensus_confidence) as avg_confidence
FROM analysis_history
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), tier, analysis_type, consensus_grade
ORDER BY date DESC, tier;

-- =====================================================
-- 8. 사용량 리포트 함수 (관리자용)
-- =====================================================

CREATE OR REPLACE FUNCTION generate_usage_report(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  tier VARCHAR,
  users BIGINT,
  total_analyses BIGINT,
  total_api_cost BIGINT,
  avg_api_cost_per_user NUMERIC,
  revenue_estimate NUMERIC,
  margin_estimate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.tier,
    COUNT(DISTINCT s.user_id) as users,
    COUNT(ah.id) as total_analyses,
    SUM(ah.api_cost)::BIGINT as total_api_cost,
    ROUND(SUM(ah.api_cost)::NUMERIC / NULLIF(COUNT(DISTINCT s.user_id), 0), 2) as avg_api_cost_per_user,
    CASE s.tier
      WHEN 'lite' THEN COUNT(DISTINCT s.user_id) * 4900
      WHEN 'basic' THEN COUNT(DISTINCT s.user_id) * 14900
      WHEN 'pro' THEN COUNT(DISTINCT s.user_id) * 39900
      ELSE 0
    END::NUMERIC as revenue_estimate,
    CASE s.tier
      WHEN 'lite' THEN (COUNT(DISTINCT s.user_id) * 4900) - SUM(ah.api_cost)
      WHEN 'basic' THEN (COUNT(DISTINCT s.user_id) * 14900) - SUM(ah.api_cost)
      WHEN 'pro' THEN (COUNT(DISTINCT s.user_id) * 39900) - SUM(ah.api_cost)
      ELSE -SUM(ah.api_cost)
    END::NUMERIC as margin_estimate
  FROM subscriptions s
  LEFT JOIN analysis_history ah ON ah.user_id = s.user_id
    AND ah.created_at BETWEEN p_start_date AND p_end_date
  WHERE s.status = 'active'
  GROUP BY s.tier
  ORDER BY
    CASE s.tier
      WHEN 'free' THEN 1
      WHEN 'lite' THEN 2
      WHEN 'basic' THEN 3
      WHEN 'pro' THEN 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. 마이그레이션 로그 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 마이그레이션 완료 기록
INSERT INTO migrations (name, executed_at)
VALUES ('subscription_tier_restructure_v2_full', NOW())
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 10. 확인 쿼리 실행
-- =====================================================

-- 10-1. 구독 현황 확인
SELECT
  tier,
  COUNT(*) as users,
  COUNT(*) FILTER (WHERE is_grandfathered) as grandfathered,
  MIN(created_at) as oldest_user,
  MAX(created_at) as newest_user
FROM subscriptions
GROUP BY tier
ORDER BY
  CASE tier
    WHEN 'free' THEN 1
    WHEN 'lite' THEN 2
    WHEN 'basic' THEN 3
    WHEN 'pro' THEN 4
  END;

-- 10-2. 테이블 존재 확인
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
ORDER BY table_name;

-- 10-3. 함수 존재 확인
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_ai_count',
    'has_cross_validation',
    'get_expected_api_cost',
    'check_pro_user_cost_limit',
    'generate_usage_report'
  )
ORDER BY routine_name;

-- =====================================================
-- 완료!
-- =====================================================

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ StockHero 마이그레이션 완료!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 위 확인 쿼리 결과 검토';
  RAISE NOTICE '2. subscription_stats 뷰 확인: SELECT * FROM subscription_stats;';
  RAISE NOTICE '3. 사용량 리포트 확인: SELECT * FROM generate_usage_report();';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
