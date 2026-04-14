"""
E-WASP FastAPI Backend
Production-grade enterprise risk intelligence API
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import asyncio
import httpx
import os
import json
import logging
import random
from functools import lru_cache
import time
from services.risk_service import RiskIntelligenceService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ewasp")

# ─────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────

app = FastAPI(
    title="E-WASP API",
    description="Enterprise Early-Warning & Signal Detection Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────

class SignalInput(BaseModel):
    region: Optional[str] = "Mumbai"
    category: Optional[str] = "FMCG-Food"
    time_window_days: int = Field(default=30, ge=7, le=365)
    include_external: bool = True

class AskEWASP(BaseModel):
    question: str
    context: Optional[Dict[str, Any]] = None

class ScenarioInput(BaseModel):
    scenario_name: str
    shocks: Dict[str, float]  # e.g. {"fuel_price_inr": 115, "weather_disruption_index": 0.8}
    region: str = "Mumbai"
    duration_days: int = 30

# ─────────────────────────────────────────────
# MOCK DATA ENGINE (Production would use real DB + ML)
# ─────────────────────────────────────────────

REGIONS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]
CATEGORIES = ["FMCG-Food", "FMCG-Beverage", "FMCG-Personal Care", "FMCG-Home Care", "FMCG-Health"]
VENDORS = [f"Vendor_{chr(65+i)}" for i in range(15)]

def get_current_timestamp():
    return datetime.now().isoformat()

def generate_time_series(days: int = 90, base: float = 1_000_000, trend: float = 0.002,
                          volatility: float = 0.08, anomaly_prob: float = 0.03):
    """Generate realistic time series with anomalies"""
    values = []
    val = base
    for i in range(days):
        month = ((datetime.now() - timedelta(days=days-i)).month)
        seasonal = {1:0.85,2:0.80,3:0.90,4:1.05,5:1.10,6:0.95,
                   7:0.90,8:0.85,9:1.00,10:1.25,11:1.35,12:1.20}[month]
        val = val * (1 + trend + np.random.normal(0, volatility)) * seasonal / \
              ({1:0.85,2:0.80,3:0.90,4:1.05,5:1.10,6:0.95,7:0.90,
                8:0.85,9:1.00,10:1.25,11:1.35,12:1.20}.get(
               ((datetime.now() - timedelta(days=days-i+1)).month), 1.0))
        if random.random() < anomaly_prob:
            val *= random.uniform(0.4, 0.6) if random.random() < 0.6 else random.uniform(1.8, 2.5)
        values.append(max(0, val))
    return values


def compute_risk_score_mock(region: str, signals: Dict) -> Dict:
    """Compute risk score from signals"""
    # Deterministic score per region (seeded for consistency in demo)
    region_base = {
        "Mumbai": 45, "Delhi": 58, "Bangalore": 32, "Chennai": 71,
        "Kolkata": 63, "Hyderabad": 41, "Pune": 38, "Ahmedabad": 55,
    }.get(region, 50)

    noise = random.gauss(0, 5)
    external_impact = (
        signals.get("weather_disruption_index", 0.1) * 15 +
        max(0, -signals.get("news_sentiment_score", 0)) * 12 +
        (signals.get("logistics_cost_index", 1.0) - 1.0) * 20
    )

    score = float(np.clip(region_base + external_impact + noise, 0, 100))

    if score >= 80:
        severity, color = "critical", "#FF3B3B"
    elif score >= 60:
        severity, color = "high", "#FF8C00"
    elif score >= 40:
        severity, color = "medium", "#FFD700"
    else:
        severity, color = "low", "#00CC88"

    return {"score": round(score, 1), "severity": severity, "color": color}


def generate_alerts_mock(n: int = 8) -> List[Dict]:
    """Generate realistic alert cards"""
    alert_templates = [
        {
            "id": "ALT-001",
            "title": "Vendor Reliability Crisis — Vendor_C",
            "severity": "critical",
            "area": "Supply Chain",
            "explanation": "Vendor_C has shown 47% on-time delivery failure rate over last 30 days, with defect rate climbing to 18.3%. Based on trajectory, probability of complete supply disruption within 14 days is 73%.",
            "predicted_impact_inr": 4_200_000,
            "confidence": 0.91,
            "recommended_actions": [
                "Immediately activate Vendor_F as secondary source",
                "Place emergency buffer stock order (15% of monthly volume)",
                "Initiate vendor audit and improvement plan",
            ],
            "signals": {"vendor_reliability": 0.53, "trend": "deteriorating"},
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "ALT-002",
            "title": "Monsoon Logistics Disruption — Western Corridor",
            "severity": "high",
            "area": "Logistics",
            "explanation": "Weather models predict 340mm+ rainfall in Mumbai-Pune corridor over next 7 days. Historical data shows 28% logistics delay during similar events. Pre-Diwali inventory buildup is at risk.",
            "predicted_impact_inr": 2_800_000,
            "confidence": 0.84,
            "recommended_actions": [
                "Pre-position 20% excess inventory at Pune distribution center",
                "Activate rail freight alternatives for long-haul routes",
                "Issue advance delivery schedule to all Modern Trade accounts",
            ],
            "signals": {"weather_disruption": 0.74, "logistics_cost_index": 1.31},
            "timestamp": (datetime.now() - timedelta(hours=5)).isoformat(),
        },
        {
            "id": "ALT-003",
            "title": "Demand Anomaly Detected — FMCG-Beverage, Chennai",
            "severity": "high",
            "area": "Sales",
            "explanation": "Statistical anomaly detected in beverage category for Chennai region. Revenue dropped 38% below 30-day rolling average, while Google Trends shows category interest declining by 22 points. Possible competitive entry or distribution failure.",
            "predicted_impact_inr": 1_650_000,
            "confidence": 0.78,
            "recommended_actions": [
                "Conduct emergency retailer audit in Chennai metro area",
                "Review competitive SKU launches in past 45 days",
                "Accelerate trade marketing spend in affected region",
            ],
            "signals": {"demand_anomaly": 0.82, "trends_change": -22},
            "timestamp": (datetime.now() - timedelta(hours=8)).isoformat(),
        },
        {
            "id": "ALT-004",
            "title": "Fuel Cost Spike — Procurement Exposure",
            "severity": "medium",
            "area": "Procurement",
            "explanation": "Diesel prices have risen 8.7% in 21 days, pushing logistics cost index to 1.28. Current freight contracts expire in 45 days. Locking rates now could save ₹12-18L per month.",
            "predicted_impact_inr": 1_200_000,
            "confidence": 0.88,
            "recommended_actions": [
                "Lock freight rates for next 6 months before contract expiry",
                "Evaluate in-house fleet leasing for top-5 high-volume routes",
            ],
            "signals": {"fuel_price_inr": 103.4, "logistics_cost_index": 1.28},
            "timestamp": (datetime.now() - timedelta(hours=12)).isoformat(),
        },
        {
            "id": "ALT-005",
            "title": "Customer Churn Signal — Tier-1 Accounts",
            "severity": "medium",
            "area": "Customer",
            "explanation": "14 Tier-1 customers in Delhi NCR showing churn indicators: reduced order frequency (down 31%), payment delays >20 days, and decreased basket size. Combined annual revenue risk: ₹38L.",
            "predicted_impact_inr": 3_800_000,
            "confidence": 0.71,
            "recommended_actions": [
                "Deploy Key Account Managers for 1-on-1 business reviews",
                "Offer flexible payment terms for 90 days",
                "Design targeted loyalty program for at-risk accounts",
            ],
            "signals": {"churn_probability": 0.67, "payment_delay_avg": 23},
            "timestamp": (datetime.now() - timedelta(hours=18)).isoformat(),
        },
        {
            "id": "ALT-006",
            "title": "Negative News Sentiment — FMCG Sector",
            "severity": "medium",
            "area": "Market Intelligence",
            "explanation": "News sentiment analysis detected 67 negative articles about FMCG sector in past 72 hours. Topics: rural demand slowdown, input cost inflation, urban consumption fatigue. Peer companies reporting misses.",
            "predicted_impact_inr": 900_000,
            "confidence": 0.65,
            "recommended_actions": [
                "Review Q4 revenue guidance assumptions",
                "Increase rural distribution touchpoints to offset urban softness",
            ],
            "signals": {"news_sentiment": -0.44, "articles_negative": 67},
            "timestamp": (datetime.now() - timedelta(hours=24)).isoformat(),
        },
        {
            "id": "ALT-007",
            "title": "Inventory Imbalance — Festive Season Pre-Build",
            "severity": "low",
            "area": "Inventory",
            "explanation": "Current inventory build for Diwali season is tracking 12% below recommended levels in 3 regions. Historical data shows stockouts during peak week carry 2.3x revenue loss multiplier.",
            "predicted_impact_inr": 600_000,
            "confidence": 0.82,
            "recommended_actions": [
                "Accelerate procurement for Diwali SKUs by 2 weeks",
                "Prioritize Mumbai and Delhi warehouse replenishment",
            ],
            "signals": {"stock_level_pct": 68, "days_to_festive": 34},
            "timestamp": (datetime.now() - timedelta(hours=36)).isoformat(),
        },
        {
            "id": "ALT-008",
            "title": "FX Exposure Alert — Import Raw Materials",
            "severity": "low",
            "area": "Finance",
            "explanation": "USD/INR crossed 84.2, a 3-month high. Import-dependent raw material costs have increased 4.1% in effective terms. Hedging window available before quarterly settlement.",
            "predicted_impact_inr": 450_000,
            "confidence": 0.76,
            "recommended_actions": [
                "Consider 3-month forward contract for USD exposure",
                "Explore domestic substitute suppliers for 2 key materials",
            ],
            "signals": {"usd_inr": 84.2, "import_exposure_pct": 0.18},
            "timestamp": (datetime.now() - timedelta(hours=48)).isoformat(),
        },
    ]
    return alert_templates[:n]


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "system": "E-WASP",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": get_current_timestamp(),
    }


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "ml_engine": "operational",
        "data_pipeline": "operational",
        "external_signals": "operational",
        "timestamp": get_current_timestamp(),
    }


@app.get("/api/dashboard/overview")
async def dashboard_overview():
    """Main dashboard data — overall risk summary from real risk_service"""
    svc = RiskIntelligenceService()
    return svc.get_dashboard_overview()


@app.get("/api/alerts")
async def get_alerts(
    severity: Optional[str] = None,
    limit: int = Query(default=10, ge=1, le=50),
):
    svc = RiskIntelligenceService()
    overview = svc.get_dashboard_overview()
    alerts = overview.get("latest_alerts", [])
    if severity:
        alerts = [a for a in alerts if a.get("severity") == severity]
    return {"alerts": alerts[:limit], "total": len(alerts), "timestamp": get_current_timestamp()}


@app.get("/api/risk/score")
async def get_risk_score(
    region: str = Query(default="Mumbai"),
    category: Optional[str] = None,
):
    if region not in REGIONS:
        raise HTTPException(status_code=400, detail=f"Unknown region: {region}")

    external = await get_external_signals_internal()
    score_data = compute_risk_score_mock(region, external)

    return {
        "region": region,
        "category": category,
        "risk_score": score_data,
        "components": {
            "anomaly_detection": round(score_data["score"] * 0.35 + random.uniform(-5, 5), 1),
            "signal_fusion": round(score_data["score"] * 0.45 + random.uniform(-5, 5), 1),
            "forecast_deviation": round(score_data["score"] * 0.20 + random.uniform(-5, 5), 1),
        },
        "timestamp": get_current_timestamp(),
    }


@app.get("/api/timeseries/{metric}")
async def get_timeseries(
    metric: str,
    region: str = Query(default="Mumbai"),
    days: int = Query(default=90, ge=30, le=365),
):
    """Time series data for charts"""
    base_values = {
        "revenue": 2_500_000,
        "orders": 450,
        "churn_rate": 0.05,
        "vendor_score": 82,
        "risk_score": 45,
    }

    base = base_values.get(metric, 1_000_000)
    values = generate_time_series(days=days, base=base, volatility=0.06 if metric != "churn_rate" else 0.15)

    end_date = datetime.now()
    dates = [(end_date - timedelta(days=days-i)).strftime("%Y-%m-%d") for i in range(days)]

    # Compute 7-day rolling average
    rolling_avg = pd.Series(values).rolling(7, min_periods=1).mean().tolist()
    rolling_std = pd.Series(values).rolling(7, min_periods=1).std().fillna(0).tolist()

    return {
        "metric": metric,
        "region": region,
        "dates": dates,
        "values": [round(v, 2) for v in values],
        "rolling_avg": [round(v, 2) for v in rolling_avg],
        "upper_band": [round(v + 1.96 * s, 2) for v, s in zip(rolling_avg, rolling_std)],
        "lower_band": [round(max(0, v - 1.96 * s), 2) for v, s in zip(rolling_avg, rolling_std)],
        "anomaly_indices": [i for i, v in enumerate(values) if abs(v - rolling_avg[i]) > 2 * (rolling_std[i] + 1)],
        "trend": "rising" if values[-1] > values[0] * 1.05 else ("falling" if values[-1] < values[0] * 0.95 else "stable"),
    }


@app.get("/api/external-signals")
async def get_external_signals():
    data = await get_external_signals_internal()
    return {"signals": data, "timestamp": get_current_timestamp()}


async def get_external_signals_internal() -> Dict:
    """Fetch/mock external signals"""
    random.seed(int(time.time() // 600))  # Changes every 10 min

    return {
        "weather": {
            "location": "Mumbai, IN",
            "temp_celsius": round(random.uniform(26, 38), 1),
            "humidity_pct": round(random.uniform(60, 92), 0),
            "disruption_index": round(random.uniform(0.15, 0.65), 3),
            "condition": random.choice(["Partly Cloudy", "Heavy Rain", "Clear", "Thunderstorms", "Humid"]),
            "logistics_impact": random.choice(["Low", "Medium", "High"]),
        },
        "fuel": {
            "diesel_inr_per_litre": round(random.uniform(88, 107), 2),
            "petrol_inr_per_litre": round(random.uniform(95, 115), 2),
            "change_30d_pct": round(random.uniform(-3.5, 8.7), 1),
            "logistics_cost_index": round(random.uniform(0.95, 1.35), 3),
        },
        "news_sentiment": {
            "score": round(random.uniform(-0.5, 0.4), 3),
            "label": random.choice(["Bearish", "Mildly Negative", "Neutral", "Positive"]),
            "articles_analyzed": random.randint(45, 180),
            "top_topics": ["FMCG rural slowdown", "Input cost inflation", "Festive demand preview"],
            "negative_articles_pct": round(random.uniform(25, 65), 1),
        },
        "google_trends": {
            "score": random.randint(45, 88),
            "trend_direction": random.choice(["rising", "falling", "stable"]),
            "category_interest": {
                "FMCG-Food": random.randint(55, 90),
                "FMCG-Beverage": random.randint(40, 85),
                "FMCG-Personal Care": random.randint(50, 80),
            },
            "search_volume_change_pct": round(random.uniform(-18, 22), 1),
        },
        "forex": {
            "usd_inr": round(random.uniform(82.5, 84.8), 2),
            "eur_inr": round(random.uniform(88, 92), 2),
            "change_7d_pct": round(random.uniform(-1.5, 2.1), 2),
            "import_exposure_risk": "Medium",
        },
        "macro": {
            "cpi_latest": round(random.uniform(4.8, 6.2), 1),
            "iip_growth_pct": round(random.uniform(3.1, 7.8), 1),
            "repo_rate_pct": 6.5,
            "consumer_confidence": random.choice(["Moderate", "Positive", "Weak"]),
        },
    }


@app.get("/api/vendors")
async def get_vendor_analysis():
    vendors = []
    for i, name in enumerate(VENDORS[:10]):
        base_reliability = [0.52, 0.92, 0.48, 0.87, 0.78, 0.95, 0.61, 0.83, 0.91, 0.69][i % 10]
        trend = random.choice(["stable", "deteriorating", "improving"])
        risk = 1 - base_reliability
        vendors.append({
            "vendor_id": name,
            "reliability_score": round(base_reliability * 100, 1),
            "failure_probability": round(risk, 3),
            "on_time_delivery_pct": round(base_reliability * 100 * random.uniform(0.95, 1.05), 1),
            "defect_rate_pct": round((1 - base_reliability) * 20, 1),
            "payment_delay_avg_days": int((1 - base_reliability) * 15),
            "trend": trend,
            "risk_level": "critical" if base_reliability < 0.55 else ("high" if base_reliability < 0.70 else "medium" if base_reliability < 0.85 else "low"),
            "recommendation": "Immediate replacement" if base_reliability < 0.55 else ("Close monitoring" if base_reliability < 0.70 else "Standard monitoring"),
            "order_volume_inr": random.randint(500_000, 5_000_000),
        })

    return {
        "vendors": sorted(vendors, key=lambda x: x["failure_probability"], reverse=True),
        "critical_count": sum(1 for v in vendors if v["risk_level"] == "critical"),
        "timestamp": get_current_timestamp(),
    }


@app.get("/api/regions/heatmap")
async def get_region_heatmap():
    """Region risk heatmap data"""
    heatmap_data = []
    for region in REGIONS:
        score = random.uniform(20, 85)
        heatmap_data.append({
            "region": region,
            "risk_score": round(score, 1),
            "severity": "critical" if score > 75 else ("high" if score > 55 else "medium" if score > 35 else "low"),
            "active_alerts": random.randint(0, 5),
            "revenue_at_risk_inr": random.randint(500_000, 8_000_000),
            "top_risk": random.choice(["Vendor delay", "Demand anomaly", "Logistics disruption", "Customer churn"]),
            "coordinates": {
                "Mumbai": [19.0760, 72.8777],
                "Delhi": [28.7041, 77.1025],
                "Bangalore": [12.9716, 77.5946],
                "Chennai": [13.0827, 80.2707],
                "Kolkata": [22.5726, 88.3639],
                "Hyderabad": [17.3850, 78.4867],
                "Pune": [18.5204, 73.8567],
                "Ahmedabad": [23.0225, 72.5714],
            }.get(region, [20, 78]),
        })

    return {"regions": heatmap_data, "timestamp": get_current_timestamp()}


@app.post("/api/ask-ewasp")
async def ask_ewasp(body: AskEWASP):
    """AI assistant for natural language queries"""
    question = body.question.lower()

    # Simple rule-based responses for demo (production: use LLM)
    responses = {
        "risk": "Current overall risk score is 61/100 (HIGH severity). Primary drivers: Vendor_C reliability crisis (91% confidence), monsoon logistics disruption in western corridor, and mild negative FMCG news sentiment. Recommend immediate vendor contingency activation.",
        "vendor": "2 vendors are in critical risk zone: Vendor_C (reliability: 52%) and Vendor_H (reliability: 48%). Combined procurement exposure: ₹4.8Cr. Suggest activating Vendor_F and Vendor_K as replacements within 72 hours.",
        "forecast": "30-day revenue forecast shows a 4.2% decline from current run-rate, primarily in Chennai and Kolkata regions. FMCG-Beverage category shows highest deviation (-8.1%). Festive season (Oct-Nov) is projected to recover to +18% above baseline.",
        "weather": "Disruption index at 0.52 (HIGH). Mumbai-Pune corridor at highest risk with 340mm+ rainfall forecast. Western region logistics delayed 28% historically under similar conditions. Pre-positioning inventory advised.",
        "churn": "14 Tier-1 customers in Delhi NCR showing high churn probability (avg: 67%). 30-day order frequency down 31%. Combined at-risk ARR: ₹38L. KAM intervention recommended within 48 hours.",
        "fuel": "Diesel at ₹103.4/L (+8.7% in 21 days). Logistics cost index at 1.28. Freight contract renewal in 45 days — recommend locking rates now for 12-month savings of ₹1.4-2.1Cr.",
    }

    for keyword, response in responses.items():
        if keyword in question:
            return {
                "answer": response,
                "confidence": round(random.uniform(0.78, 0.95), 2),
                "sources": ["Internal risk engine", "External signals", "ML forecast model"],
                "timestamp": get_current_timestamp(),
            }

    return {
        "answer": f"Based on current E-WASP intelligence: Overall risk is HIGH (61/100). I detected your question relates to '{body.question}'. For specific analysis, the system is monitoring 24 active signals across 8 regions. Key concern: vendor reliability and pre-festive inventory positioning. Would you like a detailed breakdown of any specific risk area?",
        "confidence": 0.72,
        "sources": ["E-WASP ML Engine"],
        "timestamp": get_current_timestamp(),
    }


@app.post("/api/scenario/simulate")
async def simulate_scenario(body: ScenarioInput):
    """Simulate what-if scenarios"""
    base_score = 45.0
    impact_map = {
        "fuel_price_inr": lambda v: (v - 95) * 0.5,
        "weather_disruption_index": lambda v: v * 25,
        "news_sentiment_score": lambda v: -v * 15,
        "usd_inr": lambda v: (v - 83) * 3,
        "vendor_reliability": lambda v: (1 - v) * 30,
    }

    shock_impact = sum(impact_map.get(k, lambda v: 0)(v) for k, v in body.shocks.items())
    simulated_score = float(np.clip(base_score + shock_impact, 0, 100))
    base_impact_inr = 50_000_000 * body.duration_days / 30

    return {
        "scenario": body.scenario_name,
        "region": body.region,
        "duration_days": body.duration_days,
        "base_risk_score": base_score,
        "simulated_risk_score": round(simulated_score, 1),
        "score_delta": round(simulated_score - base_score, 1),
        "severity": "critical" if simulated_score >= 80 else ("high" if simulated_score >= 60 else "medium" if simulated_score >= 40 else "low"),
        "estimated_revenue_impact_inr": round(base_impact_inr * (simulated_score / 100) * 0.15, 0),
        "key_risks": [f"Elevated {k.replace('_', ' ')} causing significant disruption" for k in body.shocks.keys()],
        "mitigation_options": [
            "Activate contingency supply chain protocols",
            "Increase safety stock by 25% ahead of shock period",
            "Hedge financial exposures at current rates",
        ],
        "timestamp": get_current_timestamp(),
    }


@app.get("/api/report/executive-summary")
async def executive_summary():
    """Generate executive summary report"""
    return {
        "report_date": datetime.now().strftime("%B %d, %Y"),
        "report_type": "Executive Risk Intelligence Summary",
        "overall_assessment": "ELEVATED RISK — Immediate Action Required in 2 Areas",
        "headline_risks": [
            {"rank": 1, "risk": "Vendor Supply Chain Failure (Vendor_C)", "impact_inr": 4_200_000, "timeline": "14 days", "severity": "critical"},
            {"rank": 2, "risk": "Monsoon Logistics Disruption — Western Corridor", "impact_inr": 2_800_000, "timeline": "7 days", "severity": "high"},
            {"rank": 3, "risk": "Chennai Demand Anomaly — FMCG-Beverage", "impact_inr": 1_650_000, "timeline": "30 days", "severity": "high"},
        ],
        "positive_signals": [
            "Festive season demand forecast +18% above baseline (confidence: 87%)",
            "Bangalore and Pune showing below-average risk profiles",
            "Vendor_B, Vendor_F performing at 95%+ reliability",
        ],
        "total_revenue_at_risk_inr": 14_800_000,
        "actions_required": 3,
        "monitoring_items": 5,
        "ml_models_accuracy": "91.3% on validation set",
        "data_freshness": "Last updated: " + get_current_timestamp(),
        "confidence_level": "HIGH (84%)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# ── Register upload router ──────────────────────
try:
    from api.upload import router as upload_router
    app.include_router(upload_router)
    logger.info("Upload router registered")
except ImportError as e:
    logger.warning(f"Upload router not loaded: {e}")
