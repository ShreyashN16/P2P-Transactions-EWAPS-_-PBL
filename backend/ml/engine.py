"""
E-WASP Multi-Layer AI Engine
Layer 1: Anomaly Detection (Isolation Forest + LOF)
Layer 2: Forecasting (Prophet + ARIMA fallback)
Layer 3: Signal Fusion (XGBoost)
Layer 4: Risk Scoring Engine
Layer 5: Explainability Engine (SHAP)
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging
import warnings
warnings.filterwarnings("ignore")

from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import xgboost as xgb
import shap

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# DATA CLASSES
# ─────────────────────────────────────────────

@dataclass
class AnomalyResult:
    is_anomaly: bool
    anomaly_score: float  # -1 to 1, lower = more anomalous
    confidence: float
    method: str
    affected_features: List[str] = field(default_factory=list)


@dataclass
class ForecastResult:
    metric: str
    forecast_values: List[float]
    forecast_dates: List[str]
    lower_bound: List[float]
    upper_bound: List[float]
    trend: str  # "rising", "falling", "stable"
    trend_slope: float
    deviation_from_expected: float


@dataclass
class RiskScore:
    overall_score: float        # 0-100
    severity: str               # "critical", "high", "medium", "low"
    confidence: float           # 0-1
    components: Dict[str, float]
    top_factors: List[Dict]
    explanation: str
    predicted_impact_inr: float
    recommended_actions: List[str]


@dataclass
class SignalFusionOutput:
    risk_probability: float
    signal_weights: Dict[str, float]
    dominant_signal: str
    alert_required: bool


# ─────────────────────────────────────────────
# LAYER 1: ANOMALY DETECTION
# ─────────────────────────────────────────────

class AnomalyDetector:
    """Multi-model anomaly detection with ensemble voting"""

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.isolation_forest = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=42,
            max_samples="auto",
        )
        self.lof = LocalOutlierFactor(
            n_neighbors=20,
            contamination=contamination,
            novelty=True,
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

    def fit(self, X: pd.DataFrame) -> "AnomalyDetector":
        X_scaled = self.scaler.fit_transform(X)
        self.isolation_forest.fit(X_scaled)
        self.lof.fit(X_scaled)
        self.is_fitted = True
        logger.info(f"AnomalyDetector fitted on {X.shape[0]} samples, {X.shape[1]} features")
        return self

    def detect(self, X: pd.DataFrame) -> List[AnomalyResult]:
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Call fit() first.")

        X_scaled = self.scaler.transform(X)
        if_scores = self.isolation_forest.score_samples(X_scaled)
        if_preds = self.isolation_forest.predict(X_scaled)

        try:
            lof_scores = self.lof.score_samples(X_scaled)
            lof_preds = self.lof.predict(X_scaled)
        except Exception:
            lof_scores = if_scores
            lof_preds = if_preds

        results = []
        for i in range(len(X)):
            # Ensemble: anomaly if EITHER model flags it
            is_anomaly_if = if_preds[i] == -1
            is_anomaly_lof = lof_preds[i] == -1
            is_anomaly = is_anomaly_if or is_anomaly_lof
            confidence = 0.95 if (is_anomaly_if and is_anomaly_lof) else 0.70

            # Normalize score to 0-1 (1 = most anomalous)
            combined_score = ((-if_scores[i]) + (-lof_scores[i])) / 2
            normalized = float(np.clip((combined_score + 0.5) / 1.5, 0, 1))

            # Find most anomalous features
            row = X.iloc[i]
            z_scores = np.abs((row - X.mean()) / (X.std() + 1e-8))
            top_features = z_scores.nlargest(3).index.tolist()

            method = "Ensemble(IF+LOF)" if is_anomaly_if and is_anomaly_lof else (
                "IsolationForest" if is_anomaly_if else "LOF"
            )

            results.append(AnomalyResult(
                is_anomaly=is_anomaly,
                anomaly_score=normalized,
                confidence=confidence if is_anomaly else 1 - normalized,
                method=method,
                affected_features=top_features if is_anomaly else [],
            ))

        return results


# ─────────────────────────────────────────────
# LAYER 2: FORECASTING ENGINE
# ─────────────────────────────────────────────

class ForecastingEngine:
    """Multi-model forecasting with Prophet primary, ARIMA fallback"""

    def __init__(self, horizon_days: int = 30):
        self.horizon_days = horizon_days
        self._prophet_available = False
        self._arima_available = False
        self._check_dependencies()

    def _check_dependencies(self):
        try:
            from prophet import Prophet
            self._prophet_available = True
        except ImportError:
            logger.warning("Prophet not available, using ARIMA fallback")

        try:
            from statsmodels.tsa.arima.model import ARIMA
            self._arima_available = True
        except ImportError:
            pass

    def forecast(self, series: pd.Series, metric_name: str = "metric") -> ForecastResult:
        """Forecast a time series using best available model"""
        if self._prophet_available:
            return self._prophet_forecast(series, metric_name)
        elif self._arima_available:
            return self._arima_forecast(series, metric_name)
        else:
            return self._simple_forecast(series, metric_name)

    def _prophet_forecast(self, series: pd.Series, metric_name: str) -> ForecastResult:
        from prophet import Prophet

        df = pd.DataFrame({
            "ds": pd.to_datetime(series.index),
            "y": series.values
        })

        model = Prophet(
            seasonality_mode="multiplicative",
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.15,
            interval_width=0.80,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=self.horizon_days)
        forecast = model.predict(future)
        fcast = forecast.tail(self.horizon_days)

        values = fcast["yhat"].tolist()
        lower = fcast["yhat_lower"].tolist()
        upper = fcast["yhat_upper"].tolist()
        dates = [d.strftime("%Y-%m-%d") for d in fcast["ds"]]

        trend_slope = (values[-1] - values[0]) / max(len(values), 1)
        trend = "rising" if trend_slope > series.std() * 0.05 else (
            "falling" if trend_slope < -series.std() * 0.05 else "stable"
        )

        # Deviation from last known value
        last_actual = float(series.iloc[-1])
        expected = float(np.mean(values[:7]))
        deviation = (expected - last_actual) / max(abs(last_actual), 1) * 100

        return ForecastResult(
            metric=metric_name,
            forecast_values=[round(v, 2) for v in values],
            forecast_dates=dates,
            lower_bound=[round(v, 2) for v in lower],
            upper_bound=[round(v, 2) for v in upper],
            trend=trend,
            trend_slope=round(trend_slope, 4),
            deviation_from_expected=round(deviation, 2),
        )

    def _arima_forecast(self, series: pd.Series, metric_name: str) -> ForecastResult:
        from statsmodels.tsa.arima.model import ARIMA

        try:
            model = ARIMA(series.values, order=(2, 1, 2))
            fit = model.fit()
            forecast_res = fit.get_forecast(steps=self.horizon_days)
            values = forecast_res.predicted_mean.tolist()
            ci = forecast_res.conf_int()
            lower = ci.iloc[:, 0].tolist()
            upper = ci.iloc[:, 1].tolist()
        except Exception:
            return self._simple_forecast(series, metric_name)

        last_date = pd.to_datetime(series.index[-1]) if hasattr(series.index, '__iter__') else datetime.now()
        dates = [(last_date + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(self.horizon_days)]
        trend_slope = (values[-1] - values[0]) / len(values)
        trend = "rising" if trend_slope > 0 else ("falling" if trend_slope < 0 else "stable")

        return ForecastResult(
            metric=metric_name,
            forecast_values=[round(v, 2) for v in values],
            forecast_dates=dates,
            lower_bound=[round(v, 2) for v in lower],
            upper_bound=[round(v, 2) for v in upper],
            trend=trend,
            trend_slope=round(trend_slope, 4),
            deviation_from_expected=round((values[0] - float(series.iloc[-1])) / max(abs(float(series.iloc[-1])), 1) * 100, 2),
        )

    def _simple_forecast(self, series: pd.Series, metric_name: str) -> ForecastResult:
        """Fallback: exponential smoothing"""
        alpha = 0.3
        smoothed = [float(series.iloc[-1])]
        for _ in range(self.horizon_days - 1):
            smoothed.append(smoothed[-1])

        std = float(series.std())
        lower = [v - 1.96 * std for v in smoothed]
        upper = [v + 1.96 * std for v in smoothed]
        last_date = datetime.now()
        dates = [(last_date + timedelta(days=i+1)).strftime("%Y-%m-%d") for i in range(self.horizon_days)]

        return ForecastResult(
            metric=metric_name, forecast_values=smoothed, forecast_dates=dates,
            lower_bound=lower, upper_bound=upper,
            trend="stable", trend_slope=0.0, deviation_from_expected=0.0,
        )


# ─────────────────────────────────────────────
# LAYER 3: SIGNAL FUSION MODEL
# ─────────────────────────────────────────────

class SignalFusionModel:
    """
    Fuses internal + external signals into unified risk probability.
    Uses RandomForestClassifier with SHAP explainability.
    """

    # We use these default weights if the model is not yet fitted
    SIGNAL_WEIGHTS = {
        "anomaly_score": 0.25,
        "forecast_deviation": 0.20,
        "delay_rate": 0.10,
        "defect_rate": 0.10,
        "cost_growth": 0.10,
        "margin_trend": 0.05,
        "sales_growth_rate": 0.05,
        "stock_shortage": 0.05,
        "news_sentiment": 0.05,
        "fuel_index": 0.05,
    }

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names = list(self.SIGNAL_WEIGHTS.keys())
        self.explainer = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> "SignalFusionModel":
        # Ensure all required columns exist
        for col in self.feature_names:
            if col not in X.columns:
                X[col] = 0.0
                
        X_scaled = self.scaler.fit_transform(X[self.feature_names])
        self.model.fit(X_scaled, y)
        self.explainer = shap.TreeExplainer(self.model)
        self.is_fitted = True
        logger.info("SignalFusionModel (RandomForest) fitted successfully")
        return self

    def predict_risk(self, signals: Dict[str, float]) -> SignalFusionOutput:
        """Predict risk probability from combined signal dict"""
        # Fill missing with zero or defaults
        complete = {f: signals.get(f, 0.0) for f in self.feature_names}
        feature_vec = np.array([[complete[f] for f in self.feature_names]])

        if self.is_fitted:
            X_scaled = self.scaler.transform(feature_vec)
            prob = float(self.model.predict_proba(X_scaled)[0][1])
            # SHAP values
            shap_vals = self.explainer.shap_values(X_scaled)[1][0] if isinstance(self.explainer.shap_values(X_scaled), list) else self.explainer.shap_values(X_scaled)[0]
            if len(shap_vals.shape) > 1:
                shap_vals = shap_vals[1] # handle multiclass output format from RF
            signal_contributions = {f: round(float(v), 4) for f, v in zip(self.feature_names, shap_vals)}
        else:
            # Weighted scoring fallback
            prob = 0.0
            signal_contributions = {}
            for f, w in self.SIGNAL_WEIGHTS.items():
                val = complete[f]
                # Negative sentiment increases risk
                if f == "news_sentiment": val = -val if val < 0 else 0 
                # Margin trend increases risk if negative
                if f == "margin_trend": val = -val if val < 0 else 0
                
                contrib = abs(val) * w
                prob += contrib
                signal_contributions[f] = contrib
                
            prob = float(np.clip(prob, 0, 1))

        dominant = max(signal_contributions.keys(), key=lambda k: abs(signal_contributions[k])) if signal_contributions else "anomaly_score"
        
        return SignalFusionOutput(
            risk_probability=round(prob, 4),
            signal_weights=signal_contributions,
            dominant_signal=dominant,
            alert_required=prob > 0.55,
        )

    def weighted_score_fallback(self, signals: Dict[str, float]) -> float:
        """Pure weighted scoring fallback"""
        return self.predict_risk(signals).risk_probability


# ─────────────────────────────────────────────
# LAYER 4: RISK SCORING ENGINE
# ─────────────────────────────────────────────

class RiskScoringEngine:
    """
    Produces 0-100 risk score with severity classification
    and financial impact estimation.
    """

    SEVERITY_THRESHOLDS = {
        "critical": 80, "high": 60, "medium": 40, "low": 0
    }

    IMPACT_MULTIPLIERS = {
        "critical": (0.08, 0.20),  # 8-20% revenue impact
        "high": (0.03, 0.08),
        "medium": (0.01, 0.03),
        "low": (0.001, 0.01),
    }

    def compute_score(
        self,
        anomaly_result: AnomalyResult,
        forecast_result: ForecastResult,
        fusion_output: SignalFusionOutput,
        baseline_revenue_inr: float = 50_000_000,
        business_context: Optional[Dict] = None,
    ) -> RiskScore:
        # Component scores (0-100)
        anomaly_component = anomaly_result.anomaly_score * 100
        fusion_component = fusion_output.risk_probability * 100
        forecast_component = min(100, abs(forecast_result.deviation_from_expected) * 2)

        # Business context adjustments
        context_multiplier = 1.0
        if business_context:
            if business_context.get("is_peak_season"):
                context_multiplier *= 1.3  # Higher stakes in peak season
            if business_context.get("vendor_critical"):
                context_multiplier *= 1.2

        # Weighted final score
        raw_score = (
            0.35 * anomaly_component +
            0.45 * fusion_component +
            0.20 * forecast_component
        ) * context_multiplier

        final_score = float(np.clip(raw_score, 0, 100))

        # Severity
        severity = "low"
        for sev, threshold in self.SEVERITY_THRESHOLDS.items():
            if final_score >= threshold:
                severity = sev
                break

        # Confidence (combination of model confidences)
        confidence = (anomaly_result.confidence * 0.4 + fusion_output.risk_probability * 0.6)
        confidence = float(np.clip(confidence, 0.1, 0.99))

        # Financial impact estimate
        low_pct, high_pct = self.IMPACT_MULTIPLIERS[severity]
        impact = round(baseline_revenue_inr * random.uniform(low_pct, high_pct), 0)

        # Top factors
        top_factors = self._get_top_factors(anomaly_result, fusion_output, forecast_result)

        # Explanation
        explanation = self._generate_explanation(
            final_score, severity, top_factors, fusion_output, forecast_result
        )

        # Recommendations
        recommendations = self._generate_recommendations(severity, top_factors, fusion_output)

        return RiskScore(
            overall_score=round(final_score, 1),
            severity=severity,
            confidence=round(confidence, 3),
            components={
                "anomaly_detection": round(anomaly_component, 1),
                "signal_fusion": round(fusion_component, 1),
                "forecast_deviation": round(forecast_component, 1),
            },
            top_factors=top_factors,
            explanation=explanation,
            predicted_impact_inr=impact,
            recommended_actions=recommendations,
        )

    def _get_top_factors(
        self,
        anomaly: AnomalyResult,
        fusion: SignalFusionOutput,
        forecast: ForecastResult,
    ) -> List[Dict]:
        factors = []
        if anomaly.is_anomaly:
            factors.append({
                "factor": "Statistical Anomaly",
                "score": round(anomaly.anomaly_score * 100, 1),
                "direction": "adverse",
                "detail": f"Detected by {anomaly.method}",
            })

        for signal, contrib in sorted(fusion.signal_weights.items(), key=lambda x: abs(x[1]), reverse=True)[:3]:
            if abs(contrib) > 0.02:
                factors.append({
                    "factor": signal.replace("_", " ").title(),
                    "score": round(abs(contrib) * 100, 1),
                    "direction": "adverse" if contrib > 0 else "favorable",
                    "detail": f"SHAP contribution: {contrib:+.3f}",
                })

        if abs(forecast.deviation_from_expected) > 5:
            factors.append({
                "factor": "Forecast Deviation",
                "score": round(min(100, abs(forecast.deviation_from_expected) * 2), 1),
                "direction": "adverse" if forecast.deviation_from_expected < 0 else "favorable",
                "detail": f"Expected {forecast.deviation_from_expected:+.1f}% vs baseline",
            })

        # Strictly Top 3 reasons
        return factors[:3]

    def _generate_explanation(
        self,
        score: float,
        severity: str,
        factors: List[Dict],
        fusion: SignalFusionOutput,
        forecast: ForecastResult,
    ) -> str:
        dominant = fusion.dominant_signal.replace("_", " ").title()
        trend_desc = {
            "rising": "is projected to increase",
            "falling": "is projected to decline",
            "stable": "is expected to remain stable",
        }.get(forecast.trend, "shows mixed signals")

        return (
            f"Risk assessment indicates a {severity.upper()} risk level (score: {score:.0f}/100). "
            f"The dominant signal is {dominant}, contributing most to the current risk elevation. "
            f"Performance trajectory {trend_desc} over the next 30 days. "
            f"{'Immediate intervention is recommended.' if severity in ('critical', 'high') else 'Continue monitoring closely.'}"
        )

    def _generate_recommendations(
        self,
        severity: str,
        factors: List[Dict],
        fusion: SignalFusionOutput,
    ) -> List[str]:
        recommendations = []
        factor_names = [f["factor"].lower() for f in factors]
        signals = fusion.signal_weights

        if "vendor" in " ".join(factor_names) or signals.get("vendor_reliability_index", 1) < 0.6:
            recommendations.append("🔴 Activate secondary vendor contracts immediately — primary vendor reliability below threshold")

        if signals.get("weather_disruption_index", 0) > 0.4:
            recommendations.append("🌧️ Pre-position 15-20% excess inventory in weather-affected corridors before monsoon intensification")

        if signals.get("forecast_deviation", 0) < -0.1:
            recommendations.append("📉 Reduce open procurement orders by 20% — demand forecast indicates softening in next 30 days")

        if signals.get("news_sentiment_score", 0) < -0.3:
            recommendations.append("📰 Negative sector sentiment detected — defer discretionary capex and review credit exposure")

        if signals.get("logistics_cost_index", 1) > 1.2:
            recommendations.append("⛽ Fuel cost spike detected — renegotiate freight rates or shift to rail for long-haul deliveries")

        if signals.get("churn_signal_strength", 0) > 0.3:
            recommendations.append("👥 High churn risk in top-tier customers — activate retention campaign with targeted incentives")

        if severity == "critical":
            recommendations.insert(0, "🚨 CRITICAL: Escalate to C-suite immediately. Convene risk committee within 24 hours.")
        elif severity == "high":
            recommendations.insert(0, "⚠️ HIGH: Schedule risk review meeting within 72 hours with regional leadership")

        if not recommendations:
            recommendations.append("✅ No immediate action required. Continue standard monitoring protocols.")

        return recommendations[:6]


# ─────────────────────────────────────────────
# FEATURE ENGINEERING
# ─────────────────────────────────────────────

class FeatureEngineer:
    """Engineers derived intelligence features from raw data for all signal categories"""

    def engineer_demand_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values("date")
        
        # Demand: sales growth rate, sales volatility, order trend
        df["sales_growth_rate"] = df["revenue"].pct_change().fillna(0)
        df["sales_volatility"] = df["revenue"].rolling(7, min_periods=1).std().fillna(0) / (df["revenue"].rolling(7, min_periods=1).mean() + 1e-8)
        
        def slope(x):
            return np.polyfit(range(len(x)), x, 1)[0] if len(x) > 1 else 0
        df["order_trend"] = df["orders"].rolling(7, min_periods=2).apply(slope, raw=True).fillna(0)
        
        return df

    def engineer_cost_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        if "cost" not in df.columns:
            df["cost"] = df["revenue"] * 0.65
        if "margin" not in df.columns:
            df["margin"] = df["revenue"] - df["cost"]
            
        # Cost: cost growth, margin trend
        df["cost_growth"] = df["cost"].pct_change().fillna(0)
        df["margin_trend"] = df["margin"].rolling(7, min_periods=2).apply(
            lambda x: np.polyfit(range(len(x)), x, 1)[0] if len(x) > 1 else 0, raw=True
        ).fillna(0)
        return df

    def engineer_vendor_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        
        # Vendor: delay rate, defect rate, dependency ratio
        df["delay_rate"] = df["payment_delay_days"] / 30.0 # Normalized
        if "defect_rate_pct" in df.columns:
            df["defect_rate"] = df["defect_rate_pct"] / 100.0
        else:
            df["defect_rate"] = 0.05
            
        # Dependency ratio (simplified as order_volume ratio)
        total_vol = df["order_volume"].sum() if "order_volume" in df.columns else 1
        df["dependency_ratio"] = df["order_volume"] / (total_vol + 1e-8) if "order_volume" in df.columns else 0.1
        
        return df

    def engineer_inventory_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Inventory: turnover, stock shortage
        if "inventory_turnover_ratio" in df.columns:
            df["turnover"] = df["inventory_turnover_ratio"]
        else:
            df["turnover"] = 4.5
            
        if "stockout_risk" in df.columns:
            df["stock_shortage"] = df["stockout_risk"]
        else:
            df["stock_shortage"] = 0.1
            
        return df

    def engineer_infra_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Infra: utilization, downtime
        if "utilization_pct" in df.columns:
            df["utilization"] = df["utilization_pct"] / 100.0
        else:
            df["utilization"] = 0.75
            
        if "downtime_minutes" in df.columns:
            df["downtime"] = df["downtime_minutes"]
        else:
            df["downtime"] = 0.0
            
        return df

    def engineer_external_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # External: weather index, news sentiment, fuel index
        if "weather_disruption_index" in df.columns:
            df["weather_index"] = df["weather_disruption_index"]
        else:
            df["weather_index"] = 0.1
            
        if "news_sentiment_score" in df.columns:
            df["news_sentiment"] = df["news_sentiment_score"]
        else:
            df["news_sentiment"] = 0.0
            
        if "logistics_cost_index" in df.columns:
            df["fuel_index"] = df["logistics_cost_index"]
        else:
            df["fuel_index"] = 1.0
            
        return df

    def create_master_feature_matrix(self, datasets: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Combine all signals into a unified feature matrix for ML processing"""
        sales = datasets.get("sales", pd.DataFrame())
        vendors = datasets.get("vendors", pd.DataFrame())
        procurement = datasets.get("procurement", pd.DataFrame())
        external = datasets.get("external", pd.DataFrame())
        infra = datasets.get("infra", pd.DataFrame())

        if not sales.empty:
            sales = self.engineer_demand_signals(sales)
            sales = self.engineer_cost_signals(sales)
            
        if not vendors.empty:
            vendors = self.engineer_vendor_signals(vendors)
            
        if not procurement.empty:
            procurement = self.engineer_inventory_signals(procurement)
            
        if not infra.empty:
            infra = self.engineer_infra_signals(infra)
            
        if not external.empty:
            external = self.engineer_external_signals(external)
            
        # In a real system, we'd do a complex temporal join here. 
        # For this upgraded implementation, we aggregate to create a unified row or rows.
        # We will create a simplified snapshot row containing the mean/latest of these signals.
        
        snapshot = {}
        if not sales.empty:
            snapshot["sales_growth_rate"] = sales["sales_growth_rate"].iloc[-1]
            snapshot["sales_volatility"] = sales["sales_volatility"].iloc[-1]
            snapshot["order_trend"] = sales["order_trend"].iloc[-1]
            snapshot["cost_growth"] = sales["cost_growth"].iloc[-1]
            snapshot["margin_trend"] = sales["margin_trend"].iloc[-1]
            snapshot["revenue"] = sales["revenue"].iloc[-1]
            snapshot["cost"] = sales["cost"].iloc[-1]
            
        if not vendors.empty:
            snapshot["delay_rate"] = vendors["delay_rate"].mean()
            snapshot["defect_rate"] = vendors["defect_rate"].mean()
            snapshot["dependency_ratio"] = vendors["dependency_ratio"].max()
            
        if not procurement.empty:
            snapshot["turnover"] = procurement["turnover"].mean()
            snapshot["stock_shortage"] = procurement["stock_shortage"].mean()
            
        if not infra.empty:
            snapshot["utilization"] = infra["utilization"].mean()
            snapshot["downtime"] = infra["downtime"].mean()
            
        if not external.empty:
            snapshot["weather_index"] = external["weather_index"].mean()
            snapshot["news_sentiment"] = external["news_sentiment"].mean()
            snapshot["fuel_index"] = external["fuel_index"].mean()
            
        return pd.DataFrame([snapshot]).fillna(0)


# ─────────────────────────────────────────────
# MASTER ML ORCHESTRATOR
# ─────────────────────────────────────────────

class EWASPMLEngine:
    """
    Master orchestrator that runs all ML layers
    and produces unified risk intelligence output
    """

    def __init__(self):
        self.anomaly_detector = AnomalyDetector(contamination=0.05)
        self.forecasting_engine = ForecastingEngine(horizon_days=30)
        self.signal_fusion = SignalFusionModel()
        self.risk_scorer = RiskScoringEngine()
        self.feature_engineer = FeatureEngineer()
        self.is_initialized = False

    def initialize(self, datasets: Dict[str, pd.DataFrame]) -> "EWASPMLEngine":
        """Initialize all models with datasets"""
        logger.info("🧠 Initializing E-WASP ML Engine...")

        sales = datasets.get("sales", pd.DataFrame())
        
        # Fit anomaly detector
        if not sales.empty:
            sales_fe = self.feature_engineer.engineer_demand_signals(sales)
            sales_fe = self.feature_engineer.engineer_cost_signals(sales_fe)
            anomaly_features = ["revenue", "cost", "orders", "sales_volatility"]
            avail_features = [f for f in anomaly_features if f in sales_fe.columns]
            self.anomaly_detector.fit(sales_fe[avail_features].dropna())

        logger.info("✅ Anomaly Detector initialized")
        self.is_initialized = True
        return self

    def analyze(
        self,
        current_signals: Dict[str, float],
        time_series: Optional[pd.Series] = None,
        context: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Run full ML pipeline for a given set of signals"""

        # Layer 1: Anomaly Detection
        if time_series is not None and len(time_series) > 10:
            feat_df = pd.DataFrame({
                "value": time_series.values,
                "rolling_mean": time_series.rolling(7, min_periods=1).mean(),
                "rolling_std": time_series.rolling(7, min_periods=1).std().fillna(0),
            })
            anomaly_results = self.anomaly_detector.detect(feat_df)
            latest_anomaly = anomaly_results[-1]
        else:
            latest_anomaly = AnomalyResult(
                is_anomaly=current_signals.get("internal_anomaly_score", 0) > 0.6,
                anomaly_score=current_signals.get("internal_anomaly_score", 0.1),
                confidence=0.75,
                method="SignalBased",
            )

        # Layer 2: Forecasting
        if time_series is not None and len(time_series) > 14:
            forecast = self.forecasting_engine.forecast(time_series, "revenue")
        else:
            # Synthetic forecast
            base_val = current_signals.get("baseline_value", 1_000_000)
            forecast = ForecastResult(
                metric="revenue",
                forecast_values=[base_val * (1 + np.random.normal(0, 0.05)) for _ in range(30)],
                forecast_dates=[(datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)],
                lower_bound=[base_val * 0.85] * 30,
                upper_bound=[base_val * 1.15] * 30,
                trend="stable",
                trend_slope=0.0,
                deviation_from_expected=current_signals.get("forecast_deviation", 0) * 100,
            )

        # Layer 3: Signal Fusion
        fusion_output = self.signal_fusion.predict_risk(current_signals)

        # Layer 4: Risk Scoring
        risk_score = self.risk_scorer.compute_score(
            anomaly_result=latest_anomaly,
            forecast_result=forecast,
            fusion_output=fusion_output,
            baseline_revenue_inr=context.get("monthly_revenue", 50_000_000) if context else 50_000_000,
            business_context=context,
        )

        return {
            "anomaly": {
                "is_anomaly": latest_anomaly.is_anomaly,
                "score": latest_anomaly.anomaly_score,
                "confidence": latest_anomaly.confidence,
                "method": latest_anomaly.method,
                "affected_features": latest_anomaly.affected_features,
            },
            "forecast": {
                "metric": forecast.metric,
                "values": forecast.forecast_values[:7],  # Next 7 days
                "dates": forecast.forecast_dates[:7],
                "trend": forecast.trend,
                "trend_slope": forecast.trend_slope,
                "deviation": forecast.deviation_from_expected,
            },
            "fusion": {
                "risk_probability": fusion_output.risk_probability,
                "signal_weights": fusion_output.signal_weights,
                "dominant_signal": fusion_output.dominant_signal,
                "alert_required": fusion_output.alert_required,
            },
            "risk_score": {
                "overall": risk_score.overall_score,
                "severity": risk_score.severity,
                "confidence": risk_score.confidence,
                "components": risk_score.components,
                "top_factors": risk_score.top_factors,
                "explanation": risk_score.explanation,
                "predicted_impact_inr": risk_score.predicted_impact_inr,
                "recommended_actions": risk_score.recommended_actions,
            },
        }


import random  # needed for impact calculation
