-- E-WASP Database Schema
-- PostgreSQL 16

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- CORE TABLES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sales_data (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date        DATE NOT NULL,
    region      VARCHAR(50) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    channel     VARCHAR(50),
    revenue     NUMERIC(15,2),
    units_sold  INTEGER,
    orders      INTEGER,
    avg_order_value NUMERIC(10,2),
    anomaly_flag    SMALLINT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON sales_data (date DESC);
CREATE INDEX ON sales_data (region, category);

CREATE TABLE IF NOT EXISTS vendor_data (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                DATE NOT NULL,
    vendor_id           VARCHAR(50) NOT NULL,
    on_time_delivery    SMALLINT,
    defect_rate_pct     NUMERIC(6,2),
    lead_time_days      INTEGER,
    payment_delay_days  INTEGER,
    reliability_score   NUMERIC(5,1),
    order_volume        INTEGER,
    compliance_score    NUMERIC(5,1),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON vendor_data (vendor_id, date DESC);

CREATE TABLE IF NOT EXISTS customer_signals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                    DATE NOT NULL,
    customer_id             VARCHAR(50) NOT NULL,
    region                  VARCHAR(50),
    purchase_frequency      NUMERIC(5,1),
    days_since_last_purchase INTEGER,
    avg_basket_size         NUMERIC(10,2),
    payment_delay_days      INTEGER,
    returns_count           INTEGER,
    churn_probability       NUMERIC(5,3),
    churn_flag              SMALLINT DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXTERNAL SIGNALS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS external_signals (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                    DATE NOT NULL,
    signal_type             VARCHAR(50) NOT NULL, -- 'weather', 'news', 'trends', 'fuel', 'forex'
    source                  VARCHAR(100),
    raw_value               NUMERIC(12,4),
    normalized_value        NUMERIC(6,4),  -- 0-1 scale
    metadata                JSONB,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON external_signals (signal_type, date DESC);

CREATE TABLE IF NOT EXISTS sentiment_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source          VARCHAR(100),  -- 'NewsAPI', 'Twitter', etc.
    topic           VARCHAR(200),
    sentiment_score NUMERIC(5,3),  -- -1 to 1
    subjectivity    NUMERIC(5,3),
    articles_count  INTEGER,
    negative_pct    NUMERIC(5,1),
    headlines       JSONB,
    raw_response    JSONB
);

CREATE TABLE IF NOT EXISTS trends_data (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    keyword         VARCHAR(200),
    region          VARCHAR(50) DEFAULT 'IN',
    score           INTEGER,  -- 0-100
    timeframe       VARCHAR(50),
    trend_direction VARCHAR(20),  -- rising, falling, stable
    change_pct      NUMERIC(7,2)
);

-- ─────────────────────────────────────────────
-- RISK INTELLIGENCE
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_scores (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    computed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    region                  VARCHAR(50),
    category                VARCHAR(100),
    overall_score           NUMERIC(5,1),  -- 0-100
    severity                VARCHAR(20),
    confidence              NUMERIC(5,3),
    anomaly_component       NUMERIC(5,1),
    fusion_component        NUMERIC(5,1),
    forecast_component      NUMERIC(5,1),
    top_factors             JSONB,
    explanation             TEXT,
    predicted_impact_inr    NUMERIC(15,2),
    is_active               BOOLEAN DEFAULT TRUE
);
CREATE INDEX ON risk_scores (region, computed_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_code              VARCHAR(20) UNIQUE,
    title                   VARCHAR(300) NOT NULL,
    severity                VARCHAR(20) NOT NULL,
    business_area           VARCHAR(100),
    explanation             TEXT,
    predicted_impact_inr    NUMERIC(15,2),
    confidence              NUMERIC(5,3),
    recommended_actions     JSONB,
    signal_data             JSONB,
    is_active               BOOLEAN DEFAULT TRUE,
    is_acknowledged         BOOLEAN DEFAULT FALSE,
    acknowledged_by         VARCHAR(100),
    acknowledged_at         TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    expires_at              TIMESTAMPTZ
);
CREATE INDEX ON alerts (severity, is_active, created_at DESC);

-- ─────────────────────────────────────────────
-- ML MODEL REGISTRY
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ml_models (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name      VARCHAR(100) NOT NULL,
    model_type      VARCHAR(50),  -- 'isolation_forest', 'prophet', 'xgboost', etc.
    version         VARCHAR(20),
    trained_at      TIMESTAMPTZ,
    accuracy_metrics JSONB,
    hyperparams     JSONB,
    artifact_path   VARCHAR(500),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial data marker
INSERT INTO ml_models (model_name, model_type, version, accuracy_metrics)
VALUES
    ('anomaly_detector_v1', 'isolation_forest', '1.0.0', '{"contamination": 0.05, "n_estimators": 200}'),
    ('forecaster_v1', 'prophet', '1.0.0', '{"seasonality_mode": "multiplicative", "interval_width": 0.80}'),
    ('signal_fusion_v1', 'xgboost', '1.0.0', '{"n_estimators": 300, "max_depth": 6}')
ON CONFLICT DO NOTHING;
