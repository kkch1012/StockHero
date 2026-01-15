-- =====================================================
-- VIP 전용 기능 테이블
-- =====================================================

-- VIP 전용 종목 테이블
CREATE TABLE IF NOT EXISTS vip_stocks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_start date NOT NULL, -- 해당 주 시작일 (월요일)
    rank integer NOT NULL,
    symbol text NOT NULL,
    name text NOT NULL,
    current_price integer,
    target_price integer,
    stop_loss integer,
    expected_return text,
    reason text,
    risks jsonb DEFAULT '[]'::jsonb,
    holding_period text,
    conviction text, -- HIGH, MEDIUM, LOW
    actual_return numeric, -- 실제 수익률 (나중에 업데이트)
    created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_stocks_week ON vip_stocks(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_vip_stocks_symbol ON vip_stocks(symbol);

-- VIP 실시간 시그널 테이블
CREATE TABLE IF NOT EXISTS vip_signals (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol text NOT NULL,
    name text NOT NULL,
    signal_type text NOT NULL, -- BUY, SELL, HOLD, TAKE_PROFIT, STOP_LOSS
    strength text NOT NULL, -- STRONG, MODERATE, WEAK
    current_price integer,
    change_percent numeric,
    reason text,
    indicators jsonb DEFAULT '{}'::jsonb, -- RSI, MACD, BB 등
    created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_signals_created ON vip_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vip_signals_symbol ON vip_signals(symbol);
CREATE INDEX IF NOT EXISTS idx_vip_signals_type ON vip_signals(signal_type);

-- VIP 커스텀 토론 테이블
CREATE TABLE IF NOT EXISTS vip_debates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id text NOT NULL UNIQUE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol text NOT NULL,
    stock_name text NOT NULL,
    current_price integer,
    question text, -- 사용자 질문 (선택)
    analyses jsonb DEFAULT '{}'::jsonb, -- { claude: "...", gemini: "...", gpt: "..." }
    created_at timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vip_debates_user ON vip_debates(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_debates_session ON vip_debates(session_id);

-- RLS 정책
ALTER TABLE vip_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_debates ENABLE ROW LEVEL SECURITY;

-- VIP 종목: 모든 사용자 읽기 가능 (표시는 제한)
CREATE POLICY "Anyone can view vip_stocks" ON vip_stocks
    FOR SELECT USING (true);

-- VIP 시그널: VIP 사용자만 읽기 가능
CREATE POLICY "VIP users can view signals" ON vip_signals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_subscriptions us
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.user_id = auth.uid()
            AND sp.name = 'vip'
            AND us.status IN ('active', 'trial')
        )
    );

-- VIP 토론: 본인만 읽기 가능
CREATE POLICY "Users can view own debates" ON vip_debates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own debates" ON vip_debates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 서비스 역할은 모든 작업 가능
CREATE POLICY "Service can manage vip_stocks" ON vip_stocks
    FOR ALL USING (true);

CREATE POLICY "Service can manage vip_signals" ON vip_signals
    FOR ALL USING (true);

-- =====================================================
-- VIP 성과 추적 함수
-- =====================================================

-- VIP 종목 성과 업데이트 함수
CREATE OR REPLACE FUNCTION update_vip_stock_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    stock_record RECORD;
    current_price integer;
BEGIN
    -- 아직 actual_return이 null인 과거 VIP 종목들 조회
    FOR stock_record IN 
        SELECT id, symbol, current_price as entry_price
        FROM vip_stocks
        WHERE actual_return IS NULL
        AND week_start < current_date - interval '7 days'
    LOOP
        -- 현재가 조회 (별도 API 호출 필요 - 여기서는 placeholder)
        -- actual_return 업데이트
        -- UPDATE vip_stocks SET actual_return = ((current_price - entry_price) / entry_price * 100)
        -- WHERE id = stock_record.id;
        NULL;
    END LOOP;
END;
$$;

-- 오래된 시그널 정리 (7일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_vip_signals()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count integer;
BEGIN
    WITH deleted AS (
        DELETE FROM vip_signals
        WHERE created_at < now() - interval '7 days'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    RETURN deleted_count;
END;
$$;
