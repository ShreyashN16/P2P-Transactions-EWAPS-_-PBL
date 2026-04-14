"""
E-WASP External Signal Integrations
Connects to real APIs: OpenWeatherMap, NewsAPI, pytrends, exchangerate-api
Falls back to mock data when API keys unavailable.
"""

import httpx
import asyncio
import os
import logging
import random
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from textblob import TextBlob  # Simple NLP for sentiment

logger = logging.getLogger(__name__)

# API Keys from environment (set these in .env)
OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY", "")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
FOREX_API_KEY = os.getenv("FOREX_API_KEY", "")

INDIAN_CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]
CITY_COORDS = {
    "Mumbai": (19.0760, 72.8777),
    "Delhi": (28.7041, 77.1025),
    "Bangalore": (12.9716, 77.5946),
    "Chennai": (13.0827, 80.2707),
    "Kolkata": (22.5726, 88.3639),
    "Hyderabad": (17.3850, 78.4867),
    "Pune": (18.5204, 73.8567),
    "Ahmedabad": (23.0225, 72.5714),
}


# ─────────────────────────────────────────────
# WEATHER SIGNAL
# ─────────────────────────────────────────────

async def fetch_weather(city: str = "Mumbai") -> Dict:
    """Fetch weather from OpenWeatherMap API"""
    if OPENWEATHER_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={"q": f"{city},IN", "appid": OPENWEATHER_KEY, "units": "metric"},
                )
                data = resp.json()
                if resp.status_code == 200:
                    weather_id = data["weather"][0]["id"]
                    # Disruption index based on weather condition codes
                    # 2xx: Thunderstorm, 3xx: Drizzle, 5xx: Rain, 6xx: Snow, 7xx: Atmosphere
                    disruption = 0.0
                    if weather_id < 300:      disruption = 0.85  # Thunderstorm
                    elif weather_id < 400:    disruption = 0.35  # Drizzle
                    elif weather_id < 600:    disruption = 0.60  # Rain
                    elif weather_id < 700:    disruption = 0.75  # Snow
                    elif weather_id < 800:    disruption = 0.40  # Atmospheric
                    else:                     disruption = 0.10  # Clear/Clouds

                    return {
                        "city": city,
                        "temp_celsius": round(data["main"]["temp"], 1),
                        "humidity_pct": data["main"]["humidity"],
                        "condition": data["weather"][0]["description"].title(),
                        "wind_speed_kmh": round(data["wind"]["speed"] * 3.6, 1),
                        "disruption_index": round(disruption, 3),
                        "logistics_impact": "High" if disruption > 0.6 else ("Medium" if disruption > 0.3 else "Low"),
                        "source": "OpenWeatherMap",
                        "fetched_at": datetime.now().isoformat(),
                    }
        except Exception as e:
            logger.warning(f"Weather API failed: {e}, using mock")

    # Mock fallback
    month = datetime.now().month
    monsoon = month in [6, 7, 8, 9]
    disruption = random.uniform(0.4, 0.75) if monsoon else random.uniform(0.05, 0.3)
    return {
        "city": city,
        "temp_celsius": round(random.uniform(24, 38) if not monsoon else random.uniform(26, 32), 1),
        "humidity_pct": round(random.uniform(65, 92) if monsoon else random.uniform(40, 70), 0),
        "condition": random.choice(["Heavy Rain", "Thunderstorms", "Partly Cloudy"]) if monsoon else random.choice(["Clear", "Sunny", "Hazy"]),
        "wind_speed_kmh": round(random.uniform(10, 45), 1),
        "disruption_index": round(disruption, 3),
        "logistics_impact": "High" if disruption > 0.6 else ("Medium" if disruption > 0.3 else "Low"),
        "source": "Mock (set OPENWEATHER_API_KEY)",
        "fetched_at": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────
# NEWS SENTIMENT
# ─────────────────────────────────────────────

async def fetch_news_sentiment(
    topics: List[str] = ["FMCG India", "supply chain India", "logistics India", "India economy"]
) -> Dict:
    """Fetch and analyze news sentiment via NewsAPI"""
    articles_data = []

    if NEWS_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                for topic in topics[:2]:  # Limit API calls
                    resp = await client.get(
                        "https://newsapi.org/v2/everything",
                        params={
                            "q": topic,
                            "language": "en",
                            "sortBy": "publishedAt",
                            "pageSize": 20,
                            "apiKey": NEWS_API_KEY,
                        },
                    )
                    if resp.status_code == 200:
                        articles_data.extend(resp.json().get("articles", []))
        except Exception as e:
            logger.warning(f"NewsAPI failed: {e}, using mock")

    if articles_data:
        # Real sentiment analysis
        sentiments = []
        headlines = []
        for article in articles_data[:30]:
            text = (article.get("title", "") + " " + article.get("description", "")).strip()
            if text:
                blob = TextBlob(text)
                sentiments.append(blob.sentiment.polarity)
                headlines.append({
                    "title": article["title"],
                    "sentiment": round(blob.sentiment.polarity, 3),
                    "source": article.get("source", {}).get("name", "Unknown"),
                    "published_at": article.get("publishedAt", ""),
                })

        avg_sentiment = float(np.mean(sentiments)) if sentiments else 0
        negative_count = sum(1 for s in sentiments if s < -0.1)

        return {
            "avg_sentiment": round(avg_sentiment, 3),
            "sentiment_label": _sentiment_label(avg_sentiment),
            "articles_analyzed": len(sentiments),
            "negative_pct": round(negative_count / len(sentiments) * 100, 1) if sentiments else 0,
            "top_headlines": sorted(headlines, key=lambda x: x["sentiment"])[:5],
            "source": "NewsAPI + TextBlob NLP",
            "fetched_at": datetime.now().isoformat(),
        }

    # Mock fallback
    sentiment = random.uniform(-0.45, 0.35)
    return {
        "avg_sentiment": round(sentiment, 3),
        "sentiment_label": _sentiment_label(sentiment),
        "articles_analyzed": random.randint(45, 150),
        "negative_pct": round(max(0, -sentiment * 80 + random.uniform(-10, 10)), 1),
        "top_headlines": [
            {"title": "FMCG companies face rural demand headwinds in Q3", "sentiment": -0.32, "source": "Economic Times"},
            {"title": "Input cost inflation squeezes FMCG margins", "sentiment": -0.41, "source": "Business Standard"},
            {"title": "Festive season projections remain positive for urban FMCG", "sentiment": 0.28, "source": "Mint"},
            {"title": "Supply chain disruptions ease in western India", "sentiment": 0.15, "source": "Hindu BusinessLine"},
        ],
        "source": "Mock (set NEWS_API_KEY)",
        "fetched_at": datetime.now().isoformat(),
    }


def _sentiment_label(score: float) -> str:
    if score < -0.3:    return "Strongly Negative"
    elif score < -0.1:  return "Mildly Negative"
    elif score < 0.1:   return "Neutral"
    elif score < 0.3:   return "Mildly Positive"
    else:               return "Strongly Positive"


# ─────────────────────────────────────────────
# GOOGLE TRENDS (pytrends)
# ─────────────────────────────────────────────

def fetch_google_trends(keywords: List[str] = None) -> Dict:
    """Fetch Google Trends data via pytrends"""
    if keywords is None:
        keywords = ["FMCG", "grocery delivery", "instant noodles", "personal care products"]

    try:
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl="en-IN", tz=330)
        pytrends.build_payload(keywords[:4], cat=0, timeframe="today 3-m", geo="IN")
        interest_df = pytrends.interest_over_time()

        if not interest_df.empty:
            recent = interest_df.tail(4).mean().to_dict()
            prev = interest_df.head(4).mean().to_dict()
            changes = {k: round((recent.get(k, 50) - prev.get(k, 50)) / max(prev.get(k, 50), 1) * 100, 1)
                      for k in keywords if k in recent}

            return {
                "keywords": keywords,
                "current_scores": {k: int(recent.get(k, 50)) for k in keywords if k in recent},
                "trend_changes_pct": changes,
                "overall_demand_trend": "rising" if sum(changes.values()) > 5 else ("falling" if sum(changes.values()) < -5 else "stable"),
                "source": "Google Trends (pytrends)",
                "fetched_at": datetime.now().isoformat(),
            }
    except Exception as e:
        logger.warning(f"pytrends failed: {e}, using mock")

    # Mock fallback
    scores = {k: random.randint(40, 85) for k in keywords}
    changes = {k: round(random.uniform(-22, 18), 1) for k in keywords}
    return {
        "keywords": keywords,
        "current_scores": scores,
        "trend_changes_pct": changes,
        "overall_demand_trend": "stable",
        "source": "Mock (install pytrends)",
        "fetched_at": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────
# FOREX
# ─────────────────────────────────────────────

async def fetch_forex() -> Dict:
    """Fetch live forex rates"""
    if FOREX_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"https://v6.exchangerate-api.com/v6/{FOREX_API_KEY}/latest/USD"
                )
                if resp.status_code == 200:
                    rates = resp.json()["conversion_rates"]
                    inr_rate = rates.get("INR", 83.5)
                    return {
                        "usd_inr": round(inr_rate, 2),
                        "eur_inr": round(rates.get("EUR", 0.92) and inr_rate / rates.get("EUR", 0.92), 2),
                        "gbp_inr": round(rates.get("GBP", 0.79) and inr_rate / rates.get("GBP", 0.79), 2),
                        "import_cost_impact": "High" if inr_rate > 84 else ("Medium" if inr_rate > 83 else "Low"),
                        "source": "ExchangeRate-API",
                        "fetched_at": datetime.now().isoformat(),
                    }
        except Exception as e:
            logger.warning(f"Forex API failed: {e}")

    usd = round(random.uniform(83.0, 84.8), 2)
    return {
        "usd_inr": usd,
        "eur_inr": round(usd * 1.085, 2),
        "gbp_inr": round(usd * 1.27, 2),
        "import_cost_impact": "High" if usd > 84 else ("Medium" if usd > 83.2 else "Low"),
        "source": "Mock (set FOREX_API_KEY)",
        "fetched_at": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────
# FUEL PRICES (India — scraped / static dataset)
# ─────────────────────────────────────────────

def fetch_fuel_prices() -> Dict:
    """India fuel price data (mock with realistic trend)"""
    # Real: scrape petrolpriceindia.com or use government data API
    base_diesel = 89.62  # Base as of Jan 2024
    days_elapsed = (datetime.now() - datetime(2024, 1, 1)).days
    trend_increase = days_elapsed * 0.008  # Gradual increase
    noise = random.uniform(-0.8, 1.2)
    current_diesel = round(base_diesel + trend_increase + noise, 2)
    current_petrol = round(current_diesel * 1.08 + 2.5 + noise, 2)
    change_pct = round((current_diesel - base_diesel) / base_diesel * 100, 1)

    return {
        "diesel_inr_per_litre": current_diesel,
        "petrol_inr_per_litre": current_petrol,
        "change_from_jan2024_pct": change_pct,
        "change_30d_pct": round(random.uniform(-2.5, 4.8), 1),
        "logistics_cost_index": round(1.0 + (current_diesel - base_diesel) / base_diesel * 0.6, 3),
        "regional_variation": {
            "Mumbai": round(current_diesel + random.uniform(-1, 1), 2),
            "Delhi": round(current_diesel + random.uniform(-1.5, 0.5), 2),
            "Bangalore": round(current_diesel + random.uniform(0, 2), 2),
            "Chennai": round(current_diesel + random.uniform(0.5, 2), 2),
        },
        "trend": "rising" if change_pct > 2 else ("falling" if change_pct < -2 else "stable"),
        "source": "Mock (petrolpriceindia.com)",
        "fetched_at": datetime.now().isoformat(),
    }


# ─────────────────────────────────────────────
# AGGREGATE ALL EXTERNAL SIGNALS
# ─────────────────────────────────────────────

async def aggregate_all_signals(city: str = "Mumbai") -> Dict:
    """Aggregate all external signals into unified risk signal dict"""
    weather, news, forex = await asyncio.gather(
        fetch_weather(city),
        fetch_news_sentiment(),
        fetch_forex(),
    )
    fuel = fetch_fuel_prices()
    trends = fetch_google_trends()

    # Compute normalized signal vector for ML
    signal_vector = {
        "weather_disruption_index": weather["disruption_index"],
        "news_sentiment_score": news["avg_sentiment"],
        "fuel_price_normalized": (fuel["diesel_inr_per_litre"] - 89) / 20,  # normalize around base
        "logistics_cost_index": fuel["logistics_cost_index"],
        "usd_inr_normalized": (forex["usd_inr"] - 82) / 5,
        "trends_score_normalized": trends["current_scores"].get("FMCG", 60) / 100,
    }

    return {
        "weather": weather,
        "news_sentiment": news,
        "fuel": fuel,
        "forex": forex,
        "google_trends": trends,
        "signal_vector": signal_vector,
        "composite_external_risk": round(
            weather["disruption_index"] * 0.30 +
            max(0, -news["avg_sentiment"]) * 0.25 +
            (fuel["logistics_cost_index"] - 1.0) * 0.25 +
            max(0, (forex["usd_inr"] - 83.0) / 3) * 0.20,
            3
        ),
    }
