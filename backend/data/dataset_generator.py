"""
E-WASP Dataset Generator
Generates realistic Indian FMCG enterprise dataset with:
- Regional variations across India
- Vendor issues, seasonal demand, payment delays
- Anomaly injection for ML training
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import json

random.seed(42)
np.random.seed(42)

# ─────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────
REGIONS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]
PRODUCT_CATEGORIES = ["FMCG-Food", "FMCG-Beverage", "FMCG-Personal Care", "FMCG-Home Care", "FMCG-Health"]
VENDORS = [f"Vendor_{chr(65+i)}" for i in range(15)]  # Vendor_A to Vendor_O
CHANNELS = ["Modern Trade", "General Trade", "E-Commerce", "Institutional", "Export"]

SEASONAL_PEAKS = {
    1: 0.85, 2: 0.80, 3: 0.90,  # Q1 - Post Diwali dip
    4: 1.05, 5: 1.10, 6: 0.95,  # Q2 - Summer surge
    7: 0.90, 8: 0.85, 9: 1.00,  # Q3 - Monsoon
    10: 1.25, 11: 1.35, 12: 1.20,  # Q4 - Festive season (Diwali, Navratri)
}

REGION_BASE_DEMAND = {
    "Mumbai": 1.30, "Delhi": 1.25, "Bangalore": 1.15,
    "Chennai": 1.10, "Kolkata": 1.05, "Hyderabad": 1.08,
    "Pune": 1.00, "Ahmedabad": 0.95,
}

VENDOR_RELIABILITY = {v: round(random.uniform(0.65, 0.99), 2) for v in VENDORS}
# Inject some bad vendors
VENDOR_RELIABILITY["Vendor_C"] = 0.52
VENDOR_RELIABILITY["Vendor_H"] = 0.48
VENDOR_RELIABILITY["Vendor_M"] = 0.61


def generate_sales_data(days: int = 365) -> pd.DataFrame:
    """Generate daily sales data with realistic patterns"""
    records = []
    base_date = datetime(2024, 1, 1)

    for day_offset in range(days):
        date = base_date + timedelta(days=day_offset)
        month = date.month
        seasonal_factor = SEASONAL_PEAKS[month]
        # Day of week effect
        dow_factor = 1.15 if date.weekday() >= 4 else (0.85 if date.weekday() == 0 else 1.0)

        for region in REGIONS:
            for category in PRODUCT_CATEGORIES:
                region_factor = REGION_BASE_DEMAND[region]
                base_revenue = random.uniform(180000, 420000)

                # Apply factors
                revenue = base_revenue * seasonal_factor * region_factor * dow_factor
                revenue += np.random.normal(0, revenue * 0.08)  # noise
                
                # Cost and margins
                cogs_pct = random.uniform(0.55, 0.75) # Base cost calculation
                cost = revenue * cogs_pct
                if month in [1, 2]: # Cost growth early in the year
                    cost *= 1.05
                margin = revenue - cost
                
                # Margin trend (randomized with slight growth over time)
                margin_trend = max(0.05, min(0.40, (margin / revenue) + np.random.normal(0, 0.02)))

                # Inject anomalies (supply shocks, demand crashes)
                anomaly_flag = 0
                if random.random() < 0.015:  # 1.5% anomaly rate
                    revenue *= random.uniform(0.3, 0.55)  # demand crash
                    anomaly_flag = 1
                elif random.random() < 0.01:
                    revenue *= random.uniform(1.8, 2.5)   # demand spike
                    anomaly_flag = 1

                units_sold = int(revenue / random.uniform(45, 180))
                orders = int(units_sold / random.randint(10, 50))

                records.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "region": region,
                    "category": category,
                    "channel": random.choice(CHANNELS),
                    "revenue": round(revenue, 2),
                    "units_sold": units_sold,
                    "orders": orders,
                    "avg_order_value": round(revenue / max(orders, 1), 2),
                    "cost": round(cost, 2),
                    "margin": round(margin, 2),
                    "margin_pct": round(margin_trend, 3),
                    "anomaly_flag": anomaly_flag,
                })

    return pd.DataFrame(records)


def generate_vendor_data(days: int = 365) -> pd.DataFrame:
    """Generate vendor performance data"""
    records = []
    base_date = datetime(2024, 1, 1)

    for day_offset in range(0, days, 7):  # Weekly vendor checks
        date = base_date + timedelta(days=day_offset)
        for vendor in VENDORS:
            reliability = VENDOR_RELIABILITY[vendor]
            # Reliability degrades over time for bad vendors
            if vendor in ["Vendor_C", "Vendor_H"]:
                degradation = day_offset / days * 0.15
                reliability = max(0.35, reliability - degradation)

            on_time = random.random() < reliability
            defect_rate = max(0, np.random.normal(1 - reliability, 0.05))
            lead_time_days = int(np.random.normal(7 / reliability, 2))
            payment_delay = max(0, int(np.random.normal(0, 5) * (1 - reliability) * 2))

            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "vendor_id": vendor,
                "on_time_delivery": int(on_time),
                "defect_rate_pct": round(defect_rate * 100, 2),
                "lead_time_days": lead_time_days,
                "payment_delay_days": payment_delay,
                "reliability_score": round(reliability * 100, 1),
                "order_volume": random.randint(1000, 50000),
                "compliance_score": round(random.uniform(reliability - 0.1, reliability + 0.05) * 100, 1),
            })

    return pd.DataFrame(records)


def generate_customer_data(days: int = 365) -> pd.DataFrame:
    """Generate customer churn signals"""
    records = []
    base_date = datetime(2024, 1, 1)
    customer_ids = [f"CUST_{1000+i}" for i in range(500)]

    # Assign base churn probabilities
    churn_probs = {c: random.uniform(0.01, 0.08) for c in customer_ids}
    # High-risk customers
    for c in random.sample(customer_ids, 50):
        churn_probs[c] = random.uniform(0.15, 0.35)

    for day_offset in range(0, days, 30):  # Monthly customer records
        date = base_date + timedelta(days=day_offset)
        for customer_id in random.sample(customer_ids, 200):  # Sample 200 per month
            churn_prob = churn_probs[customer_id]
            purchase_freq = max(0, np.random.normal(8 * (1 - churn_prob), 2))
            days_since_last = max(0, int(np.random.normal(30 * churn_prob * 5, 10)))

            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "customer_id": customer_id,
                "region": random.choice(REGIONS),
                "purchase_frequency": round(purchase_freq, 1),
                "days_since_last_purchase": days_since_last,
                "avg_basket_size": round(random.uniform(500, 5000) * (1 - churn_prob * 0.5), 2),
                "payment_delay_days": max(0, int(np.random.normal(churn_prob * 30, 5))),
                "returns_count": int(np.random.poisson(churn_prob * 3)),
                "churn_probability": round(churn_prob, 3),
                "churn_flag": int(random.random() < churn_prob * 0.3),
            })

    return pd.DataFrame(records)


def generate_procurement_data(days: int = 365) -> pd.DataFrame:
    """Generate procurement & inventory data"""
    records = []
    base_date = datetime(2024, 1, 1)

    for day_offset in range(0, days, 3):
        date = base_date + timedelta(days=day_offset)
        month = date.month
        seasonal = SEASONAL_PEAKS[month]

        for category in PRODUCT_CATEGORIES:
            for region in random.sample(REGIONS, 4):
                stock_level = random.uniform(20, 95)
                reorder_point = random.uniform(25, 40)
                stockout_risk = max(0, (reorder_point - stock_level) / reorder_point) if stock_level < reorder_point else 0

                records.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "category": category,
                    "region": region,
                    "vendor_id": random.choice(VENDORS),
                    "stock_level_pct": round(stock_level, 1),
                    "reorder_point_pct": round(reorder_point, 1),
                    "stockout_risk": round(stockout_risk, 3),
                    "procurement_cost_index": round(random.uniform(0.85, 1.25) * (1 + 0.05 * (month - 1) / 11), 3),
                    "demand_forecast_units": int(random.uniform(5000, 50000) * seasonal),
                    "supply_gap_units": max(0, int(np.random.normal(0, 2000))),
                    "inventory_turnover_ratio": round(random.uniform(2.5, 8.5), 2),
                    "stock_shortage_incidents": int(np.random.poisson(stockout_risk * 5)),
                })

    return pd.DataFrame(records)


def generate_infra_data(days: int = 365) -> pd.DataFrame:
    """Generate infrastructure metrics (server/factory utilization)"""
    records = []
    base_date = datetime(2024, 1, 1)
    facilities = ["DC-Mumbai", "DC-Delhi", "DC-Bangalore", "Cloud-AWS-AP-South"]

    for day_offset in range(days):
        date = base_date + timedelta(days=day_offset)
        
        for facility in facilities:
            utilization = random.uniform(45.0, 92.0)
            if "Cloud" in facility:
                utilization = random.uniform(60.0, 85.0)
                
            # Random downtime injection
            downtime_minutes = 0
            if random.random() < 0.02: # 2% chance of issue
                downtime_minutes = random.randint(15, 240)
                utilization = 0.0 # Complete drop during downtime window if significant
                
            records.append({
                "date": date.strftime("%Y-%m-%d"),
                "facility": facility,
                "utilization_pct": round(utilization, 1),
                "downtime_minutes": downtime_minutes,
                "maintenance_flag": int(random.random() < 0.05), # 5% maintenance days
            })

    return pd.DataFrame(records)

def generate_external_signals_mock(days: int = 365) -> pd.DataFrame:
    """Generate mock external signals data"""
    records = []
    base_date = datetime(2024, 1, 1)

    for day_offset in range(days):
        date = base_date + timedelta(days=day_offset)
        month = date.month

        # Fuel price trend (INR per litre)
        fuel_base = 95.0 + day_offset * 0.008 + np.random.normal(0, 0.5)
        # Monsoon weather impact
        weather_disruption = 0.7 if month in [7, 8] else 0.1
        weather_disruption += np.random.uniform(-0.1, 0.1)

        # News sentiment (-1 negative, +1 positive)
        news_sentiment = np.clip(np.random.normal(0.1, 0.3), -1, 1)
        if month in [3, 4]:  # Q4 results / Budget season
            news_sentiment = np.clip(news_sentiment + 0.2, -1, 1)

        # USD/INR
        usd_inr = 83.0 + np.random.normal(0, 0.8) + day_offset * 0.002

        # CPI proxy
        cpi = 5.5 + day_offset * 0.003 + np.random.normal(0, 0.2)

        # Google Trends proxy (0-100)
        trends_score = int(60 * SEASONAL_PEAKS[month] + np.random.normal(0, 8))
        trends_score = max(10, min(100, trends_score))

        records.append({
            "date": date.strftime("%Y-%m-%d"),
            "fuel_price_inr": round(fuel_base, 2),
            "weather_disruption_index": round(max(0, min(1, weather_disruption)), 3),
            "news_sentiment_score": round(news_sentiment, 3),
            "usd_inr": round(usd_inr, 2),
            "cpi_proxy": round(cpi, 2),
            "trends_score": trends_score,
            "logistics_cost_index": round(1.0 + weather_disruption * 0.3 + (fuel_base - 95) * 0.01, 3),
        })

    return pd.DataFrame(records)


def generate_all_datasets():
    """Generate and save all datasets"""
    print("🔄 Generating E-WASP Enterprise Datasets...")

    sales = generate_sales_data(365)
    vendors = generate_vendor_data(365)
    customers = generate_customer_data(365)
    procurement = generate_procurement_data(365)
    external = generate_external_signals_mock(365)
    infra = generate_infra_data(365)

    # Save to CSV
    import os
    os.makedirs("data/raw", exist_ok=True)
    sales.to_csv("data/raw/sales_data.csv", index=False)
    vendors.to_csv("data/raw/vendor_data.csv", index=False)
    customers.to_csv("data/raw/customer_data.csv", index=False)
    procurement.to_csv("data/raw/procurement_data.csv", index=False)
    external.to_csv("data/raw/external_signals.csv", index=False)
    infra.to_csv("data/raw/infra_data.csv", index=False)

    print(f"✅ Sales: {len(sales):,} rows")
    print(f"✅ Vendors: {len(vendors):,} rows")
    print(f"✅ Customers: {len(customers):,} rows")
    print(f"✅ Procurement: {len(procurement):,} rows")
    print(f"✅ External Signals: {len(external):,} rows")
    print(f"✅ Infra: {len(infra):,} rows")
    print("📁 Saved to data/raw/")

    return {
        "sales": sales, "vendors": vendors,
        "customers": customers, "procurement": procurement,
        "external": external, "infra": infra
    }


if __name__ == "__main__":
    datasets = generate_all_datasets()
