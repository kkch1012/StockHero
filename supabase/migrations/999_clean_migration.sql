-- =====================================================
-- 🔄 StockHero 클린 마이그레이션
-- 기존 OLD 스키마 제거 → NEW 스키마 생성
-- =====================================================
-- ⚠️ 경고: 이 스크립트는 기존 구독 데이터를 삭제합니다!
-- 개발/테스트 환경에서만 실행하세요.
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: 기존 OLD 스키마 테이블 제거
-- =====================================================

DROP TABLE IF EXISTS subscription_transactions CASCADE;
DROP TABLE IF EXISTS subscription_usage CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS coupon_redemptions CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- =====================================================
-- STEP 2: 기존 NEW 스키마 테이블 제거 (있다면)
-- =====================================================

DROP TABLE IF EXISTS analysis_history CASCADE;
DROP TABLE IF EXISTS feature_usage CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;

-- =====================================================
-- STEP 3: Extensions 설치
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- STEP 4: NEW 스키마 생성
-- =====================================================

-- 4-1. Subscriptions 테이블 (신규 구조)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,

  -- 구독 정보 (free/lite/basic/pro)
  tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'basic', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),

  -- Grandfathering (기존 유저 가격 보호)
  is_grandfathered BOOLEAN DEFAULT false,
  legacy_price INTEGER,

  -- 결제 주기
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- 기간
  started_at TIMESTAMPTZ DEFAULT NOW(),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  -- 결제 정보 (토스페이먼츠/포트원)
  payment_customer_id VARCHAR(255),
  payment_billing_key VARCHAR(255),
  payment_subscription_id VARCHAR(255),
  portone_customer_id VARCHAR(255),
  portone_billing_key VARCHAR(255),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4-2. Payments 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- 결제 정보
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  plan_id VARCHAR(20) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- 결제사 정보 (토스페이먼츠/포트원)
  portone_payment_id VARCHAR(255),
  portone_tx_id VARCHAR(255),
  payment_method VARCHAR(50),

  -- 쿠폰
  coupon_code VARCHAR(50),
  discount_amount INTEGER DEFAULT 0,

  -- 타임스탬프
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4-3. Feature Usage 테이블 (API 비용 추적 포함)
CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  feature_key VARCHAR(50) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_date DATE DEFAULT CURRENT_DATE,
  api_cost INTEGER DEFAULT 0, -- NEW: API 비용 추적
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유저별, 기능별, 날짜별 유니크 제약 (increment_feature_usage 함수에서 사용)
  CONSTRAINT unique_user_feature_date UNIQUE (user_id, feature_key, usage_date)
);

-- 4-4. Analysis History 테이블 (교차검증 결과 저장)
CREATE TABLE analysis_history (
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

-- 4-5. Migrations 테이블 (마이그레이션 추적)
CREATE TABLE migrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 5: 인덱스 생성
-- =====================================================

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_grandfathered ON subscriptions(is_grandfathered) WHERE is_grandfathered = true;

-- Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Feature Usage
CREATE INDEX idx_feature_usage_user ON feature_usage(user_id, usage_date);
CREATE INDEX idx_feature_usage_date ON feature_usage(usage_date DESC);
CREATE INDEX idx_feature_usage_cost ON feature_usage(user_id, usage_date, api_cost);

-- Analysis History
CREATE INDEX idx_analysis_history_user ON analysis_history(user_id, created_at DESC);
CREATE INDEX idx_analysis_history_symbol ON analysis_history(symbol, created_at DESC);
CREATE INDEX idx_analysis_history_tier ON analysis_history(tier, created_at DESC);
CREATE INDEX idx_analysis_history_grade ON analysis_history(consensus_grade, created_at DESC);

-- =====================================================
-- STEP 6: RLS (Row Level Security) 설정
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Subscriptions: 본인 것만 조회 가능
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Service role은 모든 접근 가능
CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payments: 본인 것만 조회 가능
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Feature Usage: 본인 것만 조회/수정 가능
CREATE POLICY "Users can view own feature usage" ON feature_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access feature_usage" ON feature_usage
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Analysis History: 본인 것만 조회 가능
CREATE POLICY "Users can view own analysis history" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access analysis_history" ON analysis_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- STEP 7: 유틸리티 함수 생성
-- =====================================================

-- 7-1. 등급별 AI 개수
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

-- 7-2. 교차검증 가능 여부
CREATE OR REPLACE FUNCTION has_cross_validation(p_tier VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_tier IN ('basic', 'pro');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7-3. 예상 API 비용
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

-- 7-4. Feature Usage 증가 (RPC)
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id UUID,
  p_feature_key VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  INSERT INTO feature_usage (user_id, feature_key, usage_count, usage_date)
  VALUES (p_user_id, p_feature_key, 1, CURRENT_DATE)
  ON CONFLICT (user_id, feature_key, usage_date)
  DO UPDATE SET
    usage_count = feature_usage.usage_count + 1,
    updated_at = NOW()
  RETURNING usage_count INTO v_new_count;

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7-5. Pro 유저 비용 한도 체크
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

    -- 일일 한도: ₩1,713
    IF v_today_cost > 1713 THEN
      RAISE NOTICE 'Pro user % exceeded daily API cost limit: ₩%', NEW.user_id, v_today_cost;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_pro_cost ON feature_usage;
CREATE TRIGGER trigger_check_pro_cost
  AFTER INSERT OR UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION check_pro_user_cost_limit();

-- 7-6. Updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_feature_usage_updated_at BEFORE UPDATE ON feature_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_analysis_history_updated_at BEFORE UPDATE ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: 통계 뷰 생성
-- =====================================================

-- 8-1. 구독 통계
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

-- 8-2. 분석 통계 (최근 30일)
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

-- 8-3. 사용량 리포트 (관리자용)
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
-- STEP 9: 마이그레이션 기록
-- =====================================================

INSERT INTO migrations (name, executed_at)
VALUES ('999_clean_migration', NOW());

-- =====================================================
-- STEP 10: 확인 쿼리
-- =====================================================

-- 테이블 존재 확인
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
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

-- 함수 존재 확인
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_ai_count',
    'has_cross_validation',
    'get_expected_api_cost',
    'increment_feature_usage',
    'check_pro_user_cost_limit',
    'update_updated_at_column',
    'generate_usage_report'
  )
ORDER BY routine_name;

COMMIT;

-- =====================================================
-- 완료!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ StockHero 클린 마이그레이션 완료!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 위 확인 쿼리 결과 검토';
  RAISE NOTICE '2. 티어별 AI 개수 확인: SELECT tier, get_ai_count(tier) FROM (VALUES (''free''), (''lite''), (''basic''), (''pro'')) AS t(tier);';
  RAISE NOTICE '3. 구독 통계 확인: SELECT * FROM subscription_stats;';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
