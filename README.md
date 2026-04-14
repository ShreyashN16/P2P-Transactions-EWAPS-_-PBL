# 🦅 E-WASP
## Enterprise Early-Warning & Signal Detection Platform

> **Multi-signal decision intelligence system** combining internal enterprise data, external macroeconomic signals, behavioral patterns, and market intelligence — to detect risks before humans can see them.

```
Not just anomaly detection.
Not just a dashboard.
A multi-layer AI engine designed like Palantir Foundry meets Bloomberg Terminal.
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          E-WASP SYSTEM                              │
├────────────────────┬────────────────────┬───────────────────────────┤
│   FRONTEND         │   BACKEND (FastAPI) │   DATA LAYER             │
│   Next.js 14       │   /api/*            │   PostgreSQL 16          │
│   Tailwind CSS     │   /ml/              │   Redis Cache            │
│   Recharts         │   /services/        │   ML Model Registry      │
│   Bloomberg UI     │   /external/        │                          │
├────────────────────┴────────────────────┴───────────────────────────┤
│                        ML ENGINE (5 Layers)                         │
│  L1: Isolation Forest + LOF  │  L2: Prophet + ARIMA                │
│  L3: Signal Fusion (XGBoost) │  L4: Risk Scoring Engine            │
│  L5: SHAP Explainability                                            │
├─────────────────────────────────────────────────────────────────────┤
│                    EXTERNAL SIGNALS                                 │
│  OpenWeatherMap  │  NewsAPI + NLP  │  Google Trends  │  Forex API  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended — One Command)

```bash
git clone https://github.com/yourorg/ewasp
cd ewasp

# Copy env template
cp .env.example .env

# Edit API keys (optional — system works without them via mocks)
# OPENWEATHER_API_KEY=your_key
# NEWS_API_KEY=your_key
# FOREX_API_KEY=your_key

# Launch everything
docker compose up -d

# Access
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Generate dataset
python -c "from data.dataset_generator import generate_all_datasets; generate_all_datasets()"

# Start API
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## 🧠 ML System Design

### Layer 1: Anomaly Detection
```python
# Isolation Forest (primary) + Local Outlier Factor (ensemble)
detector = AnomalyDetector(contamination=0.05)
detector.fit(sales_features)
results = detector.detect(current_data)
# Returns: anomaly_score (0-1), confidence, affected_features
```

### Layer 2: Forecasting
```python
# Prophet with multiplicative seasonality (captures Indian festive patterns)
forecaster = ForecastingEngine(horizon_days=30)
forecast = forecaster.forecast(revenue_series, "revenue")
# Returns: values, confidence intervals, trend direction
```

### Layer 3: Signal Fusion
```python
# XGBoost trained on combined internal + external signals
# SHAP values for explainability
fusion = SignalFusionModel()
output = fusion.predict_risk({
    "internal_anomaly_score": 0.72,
    "vendor_reliability_index": 0.53,
    "weather_disruption_index": 0.62,
    "news_sentiment_score": -0.38,
    ...
})
# Returns: risk_probability, signal_weights (SHAP), dominant_signal
```

### Layer 4: Risk Scoring
```python
# Weighted combination: anomaly (35%) + fusion (45%) + forecast (20%)
risk = RiskScoringEngine().compute_score(
    anomaly_result, forecast_result, fusion_output,
    baseline_revenue_inr=50_000_000
)
# Returns: 0-100 score, severity, confidence, impact_inr, recommendations
```

### Layer 5: SHAP Explainability
Every alert includes top 3 contributing features with SHAP values, enabling:
- Feature attribution
- "Why did this alert fire?" explanation
- Natural language explanation generation

---

## 📊 Data Pipeline

```
Raw Data → Feature Engineering → ML Processing → Risk Scoring → Alert Generation
   ↑              ↑                    ↑                ↑               ↓
 CSV/DB    Rolling Averages      Isolation Forest    Weighted       Alert Cards
          Trend Slope           Prophet Forecast    Fusion Model   Recommendations
          Volatility Index      XGBoost Fusion      SHAP Values    Executive Summary
          Vendor Scores
```

### Engineered Features
| Feature | Description | Impact |
|---------|-------------|--------|
| `revenue_7d_avg` | 7-day rolling average | Smooths noise |
| `trend_slope_7d` | Linear regression slope | Direction signal |
| `volatility_index` | Std/Mean ratio | Risk intensity |
| `anomaly_freq_30d` | Count of anomalies (30d) | Pattern detection |
| `demand_elasticity` | Units vs Revenue change | Pricing signal |
| `vendor_failure_prob` | 1 - reliability_score | Supply risk |
| `region_risk_index` | Composite regional score | Geographic risk |

---

## 🌍 External Signal Integration

| Signal | Source | Impact |
|--------|--------|--------|
| Weather | OpenWeatherMap API | Logistics disruption index |
| News Sentiment | NewsAPI + TextBlob NLP | Market confidence |
| Google Trends | pytrends | Demand forecasting |
| Fuel Prices | petrolpriceindia.com (scraped) | Logistics cost |
| USD/INR | exchangerate-api | Import cost exposure |
| CPI/Inflation | Static dataset | Purchasing power |

**API Keys Setup:**
```bash
OPENWEATHER_API_KEY=  # Free: openweathermap.org
NEWS_API_KEY=         # Free: newsapi.org (100 req/day)
FOREX_API_KEY=        # Free: exchangerate-api.com
```
All external signals fall back to realistic mock data when keys unavailable.

---

## 🎯 API Reference

```
GET  /api/dashboard/overview        → Overall risk summary + KPIs
GET  /api/alerts                    → Alert list with filtering
GET  /api/risk/score?region=Mumbai  → Regional risk score
GET  /api/timeseries/{metric}       → Time series data
GET  /api/external-signals          → Real-time external signals
GET  /api/vendors                   → Vendor risk analysis
GET  /api/regions/heatmap           → India region risk map
GET  /api/report/executive-summary  → C-suite summary report
POST /api/ask-ewasp                 → AI assistant query
POST /api/scenario/simulate         → What-if scenario simulation
```

Full interactive docs: `http://localhost:8000/docs`

---

## 🎨 Frontend Features

- **Bloomberg Terminal Dark Theme** — JetBrains Mono + Syne typography
- **Live Risk Gauge** — SVG arc gauge with severity color coding
- **Alert Intelligence Cards** — Expandable with SHAP explanations
- **5-Tab Navigation** — Overview / Alerts / Vendors / Signals / Forecast
- **Signal Fusion Visualization** — SHAP contribution bar chart
- **Ask E-WASP** — AI terminal chat with quick queries
- **Region Risk Bars** — India-wide comparative risk
- **Live Ticker** — Real-time signal streaming simulation
- **Scenario Simulator** — What-if analysis interface

---

## 🚢 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_URL=https://your-backend.render.com
```

### Backend → Render
```yaml
# render.yaml
services:
  - type: web
    name: ewasp-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: ewasp-db
          property: connectionString
```

### Database → Supabase
```bash
# Get connection string from Supabase dashboard
# Run infra/init.sql in Supabase SQL editor
```

---

## 📁 Project Structure

```
ewasp/
├── backend/
│   ├── main.py                    # FastAPI app + all routes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── ml/
│   │   └── engine.py              # 5-layer ML pipeline
│   ├── data/
│   │   └── dataset_generator.py   # Realistic FMCG dataset
│   ├── external/
│   │   └── signals.py             # External API integrations
│   └── services/                  # Business logic layer
├── frontend/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Main dashboard
│   │   └── globals.css            # Bloomberg terminal theme
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
├── infra/
│   ├── init.sql                   # DB schema
│   └── nginx.conf                 # Reverse proxy
├── docker-compose.yml
└── README.md
```

---

## 🔮 Roadmap (Next Steps)

- [ ] **SHAP Waterfall charts** — Per-alert feature visualization
- [ ] **India Geo Heatmap** — Leaflet.js choropleth map
- [ ] **Real-time WebSockets** — Live alert streaming
- [ ] **Mobile App** — React Native version
- [ ] **LLM Integration** — GPT-4/Claude for Ask E-WASP
- [ ] **Email/Slack Alerts** — Push notifications for critical events
- [ ] **Multi-tenant** — Enterprise SaaS with org isolation
- [ ] **Audit Trail** — Full compliance logging

---

## 🏆 What Makes E-WASP Different

| Standard ML Dashboard | E-WASP |
|----------------------|--------|
| Single data source | Multi-source fusion (8+ signals) |
| Anomaly detection only | 5-layer intelligence engine |
| Shows the problem | Explains + recommends action |
| Historical charts | Forward-looking risk probability |
| Generic visualization | Bloomberg Terminal-grade UI |
| Black-box AI | SHAP explainability on every alert |

---

*Built to be pitched to JPMorgan, UBS, American Express.*
*Not a college project — a startup-ready intelligence platform.*
