"""
P2P EWAS — ML Engine
Production ML engine with trained model loading and inference.
Handles: Phishing detection, Text classification, Anomaly detection, Signal fusion.
"""

import numpy as np
import pandas as pd
import joblib
import json
import logging
import math
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime

logger = logging.getLogger("ewas.ml")

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"


@dataclass
class PhishingResult:
    is_phishing: bool
    confidence: float
    risk_score: float
    features_used: int
    top_signals: List[Dict[str, Any]]


@dataclass 
class TextClassResult:
    is_scam: bool
    confidence: float
    scam_type: str
    urgency_score: float


@dataclass
class AnomalyResult:
    is_anomaly: bool
    anomaly_score: float
    confidence: float
    method: str


@dataclass
class FusionResult:
    overall_risk: float
    severity: str
    components: Dict[str, float]
    dominant_signal: str
    alert_required: bool
    explanation: str


class PhishingDetector:
    """URL phishing detection using trained LightGBM model."""

    RISKY_TLDS = {
        ".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".click",
        ".info", ".support", ".help", ".online", ".site", ".work",
        ".icu", ".buzz", ".fun", ".space", ".monster", ".cam",
    }

    BRAND_KEYWORDS = [
        "paypal", "monzo", "revolut", "wise", "barclays", "hsbc",
        "lloyds", "natwest", "chase", "santander", "starling",
        "venmo", "cashapp", "zelle", "apple", "google", "amazon",
        "microsoft", "netflix", "bank", "secure", "verify", "login",
        "account", "update", "confirm", "suspend", "urgent", "alert",
    ]

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self._load_model()

    def _load_model(self):
        model_path = MODEL_DIR / "phishing_lgbm.pkl"
        scaler_path = MODEL_DIR / "phishing_scaler.pkl"
        meta_path = MODEL_DIR / "phishing_meta.json"

        if model_path.exists() and scaler_path.exists():
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            if meta_path.exists():
                with open(meta_path) as f:
                    meta = json.load(f)
                    self.feature_names = meta.get("features", [])
            logger.info("PhishingDetector: Model loaded successfully")
        else:
            logger.warning("PhishingDetector: No trained model found, using rule-based fallback")

    def extract_features(self, url: str) -> Dict[str, float]:
        """Extract ML features from a URL string."""
        url_lower = url.lower()
        
        # Parse URL components
        from urllib.parse import urlparse
        try:
            parsed = urlparse(url if "://" in url else f"http://{url}")
            domain = parsed.netloc or parsed.path.split("/")[0]
            path = parsed.path
        except Exception:
            domain = url.split("/")[0]
            path = "/".join(url.split("/")[1:])

        # Remove port from domain
        domain_clean = domain.split(":")[0]
        parts = domain_clean.split(".")
        tld = f".{parts[-1]}" if len(parts) > 1 else ""

        features = {
            "url_length": len(url),
            "n_dots": url.count("."),
            "n_hyphens": url.count("-"),
            "n_underscores": url.count("_"),
            "n_slashes": url.count("/"),
            "n_qmarks": url.count("?"),
            "n_amps": url.count("&"),
            "n_equals": url.count("="),
            "n_at": url.count("@"),
            "n_digits": sum(c.isdigit() for c in url),
            "has_ip": int(bool(re.match(r"\d+\.\d+\.\d+\.\d+", domain_clean))),
            "has_https": int(url_lower.startswith("https")),
            "domain_length": len(domain_clean),
            "path_length": len(path),
            "subdomain_count": max(0, len(parts) - 2),
            "digit_ratio": sum(c.isdigit() for c in url) / max(len(url), 1),
            "special_char_ratio": sum(not c.isalnum() and c not in "./" for c in url) / max(len(url), 1),
            "tld_risk": int(tld in self.RISKY_TLDS),
            "has_port": int(":" in domain and not url_lower.startswith("http")),
            "entropy": self._entropy(url),
            "vowel_ratio": sum(c in "aeiou" for c in url_lower) / max(len(url), 1),
            "consonant_ratio": sum(c.isalpha() and c not in "aeiou" for c in url_lower) / max(len(url), 1),
            "is_shortened": int(len(domain_clean) <= 6 and len(path) <= 8),
            "has_brand_in_path": int(any(b in url_lower for b in self.BRAND_KEYWORDS)),
        }
        return features

    def _entropy(self, s: str) -> float:
        from collections import Counter
        if not s:
            return 0.0
        freq = Counter(s)
        total = len(s)
        return -sum((c / total) * math.log2(c / total) for c in freq.values())

    def predict(self, url: str) -> PhishingResult:
        """Predict if a URL is phishing using a hybrid ML+Heuristic approach."""
        features = self.extract_features(url)
        url_lower = url.lower()

        # 1. Start with Heuristic Score
        h_score = 0.0
        h_score += features["tld_risk"] * 0.3
        h_score += features["has_brand_in_path"] * 0.25
        
        # Specific High-Intensity Heuristics
        suspicious_keywords = ["support", "refund", "verify", "secure", "login", "confirm", "recovery", "alert"]
        found_suspicious = sum(1 for k in suspicious_keywords if k in url_lower)
        if found_suspicious >= 2:
            h_score += 0.3
        
        if "-" in url_lower and any(b in url_lower for b in ["paypal", "monzo", "revolut", "wise", "bank"]):
            h_score += 0.35 # Monzo-refund-status style
            
        if re.search(r"\d{3,}", url_lower): # Lot of digits
             h_score += 0.1

        # 2. Get ML Score if available
        ml_proba = 0.0
        if self.model and self.scaler and self.feature_names:
            feature_vec = np.array([[features.get(f, 0) for f in self.feature_names]])
            scaled = self.scaler.transform(feature_vec)
            ml_proba = float(self.model.predict_proba(scaled)[0][1])
            
            # Feature explanation
            importances = self.model.feature_importances_
            top_indices = np.argsort(importances)[-5:][::-1]
            top_signals = [
                {"feature": self.feature_names[i], "importance": round(float(importances[i]), 4),
                 "value": round(features.get(self.feature_names[i], 0), 4)}
                for i in top_indices
            ]
        else:
            ml_proba = h_score
            top_signals = [{"feature": "heuristic_fallback", "importance": 1.0, "value": h_score}]

        # 3. Hybrid Fusion: ML score with Heuristic floor
        # If heuristic is very high (>0.7), force is_phishing=True even if ML is low
        final_proba = max(ml_proba, min(h_score, 0.95))
        is_phishing = final_proba > 0.45

        return PhishingResult(
            is_phishing=is_phishing,
            confidence=round(final_proba if is_phishing else 1 - final_proba, 4),
            risk_score=round(final_proba * 100, 1),
            features_used=len(features),
            top_signals=top_signals,
        )


class TextScamClassifier:
    """Scam text classification using TF-IDF + LightGBM."""

    SCAM_INDICATORS = {
        "urgency": ["urgent", "immediately", "now", "act fast", "limited time", "expires", "asap"],
        "money": ["prize", "won", "winner", "£", "$", "reward", "claim", "refund", "payment"],
        "threat": ["suspended", "blocked", "compromised", "unauthorized", "illegal", "arrest"],
        "action": ["click", "verify", "confirm", "update", "restore", "activate", "call"],
        "impersonation": ["paypal", "amazon", "hmrc", "irs", "bank", "royal mail", "dhl"],
    }

    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._load_model()

    def _load_model(self):
        model_path = MODEL_DIR / "text_classifier_lgbm.pkl"
        vec_path = MODEL_DIR / "text_vectorizer.pkl"

        if model_path.exists() and vec_path.exists():
            self.model = joblib.load(model_path)
            self.vectorizer = joblib.load(vec_path)
            logger.info("TextScamClassifier: Model loaded successfully")
        else:
            logger.warning("TextScamClassifier: No trained model found, using rule-based fallback")

    def classify(self, text: str) -> TextClassResult:
        """Classify text as scam or legitimate using a hybrid ML+Rules approach."""
        text_lower = text.lower()
        
        # 1. Heuristic Score
        h_score = 0.0
        for category, keywords in self.SCAM_INDICATORS.items():
            matches = sum(1 for k in keywords if k in text_lower)
            h_score += matches * 0.15

        # 2. ML Score
        ml_proba = 0.0
        if self.model and self.vectorizer:
            vec = self.vectorizer.transform([text])
            ml_proba = float(self.model.predict_proba(vec)[0][1])
        else:
            ml_proba = h_score

        # 3. Hybrid Fusion (Boost suspicious keywords)
        final_proba = max(ml_proba, min(h_score, 0.98))
        is_scam = final_proba > 0.4

        # Determine scam type
        scam_type = self._detect_type(text_lower)
        urgency = self._urgency_score(text_lower)

        return TextClassResult(
            is_scam=is_scam,
            confidence=round(final_proba if is_scam else 1 - final_proba, 4),
            scam_type=scam_type,
            urgency_score=round(urgency, 4),
        )

    def _detect_type(self, text: str) -> str:
        type_keywords = {
            "phishing": ["verify", "account", "login", "password", "click here", "confirm"],
            "investment": ["invest", "crypto", "bitcoin", "returns", "profit", "trading"],
            "romance": ["love", "relationship", "overseas", "stranded", "wire"],
            "tech_support": ["virus", "infected", "microsoft", "computer", "remote"],
            "impersonation": ["hmrc", "irs", "police", "government", "official"],
            "lottery": ["winner", "lottery", "prize", "draw", "selected"],
            "purchase": ["order", "delivery", "shipping", "tracking", "package"],
        }
        
        best = "unknown"
        best_count = 0
        for stype, keywords in type_keywords.items():
            count = sum(1 for k in keywords if k in text)
            if count > best_count:
                best = stype
                best_count = count
        return best

    def _urgency_score(self, text: str) -> float:
        urgency_words = ["urgent", "immediately", "now", "today", "expires", "last chance",
                         "act fast", "limited", "deadline", "within 24 hours", "asap"]
        return min(1.0, sum(1 for w in urgency_words if w in text) * 0.2)


class TransactionAnomalyDetector:
    """Anomaly detection on transaction patterns."""

    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_model()

    def _load_model(self):
        model_path = MODEL_DIR / "anomaly_iforest.pkl"
        scaler_path = MODEL_DIR / "anomaly_scaler.pkl"

        if model_path.exists() and scaler_path.exists():
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            logger.info("AnomalyDetector: Model loaded successfully")
        else:
            logger.warning("AnomalyDetector: No trained model, using heuristics")

    def detect(self, transaction: Dict[str, float]) -> AnomalyResult:
        """Detect if a transaction is anomalous."""
        if self.model and self.scaler:
            feature_order = [
                "amount", "hour_of_day", "day_of_week", "sender_account_age_days",
                "receiver_account_age_days", "sender_txn_count_30d", "receiver_txn_count_30d",
                "is_new_receiver", "same_device_as_usual", "velocity_1h",
                "velocity_24h", "cross_border",
            ]
            vec = np.array([[transaction.get(f, 0) for f in feature_order]])
            scaled = self.scaler.transform(vec)
            score = float(self.model.score_samples(scaled)[0])
            pred = int(self.model.predict(scaled)[0])
            
            is_anomaly = pred == -1
            # Normalize score: more negative = more anomalous
            normalized = float(np.clip((-score + 0.5) / 1.0, 0, 1))
            
            return AnomalyResult(
                is_anomaly=is_anomaly,
                anomaly_score=round(normalized, 4),
                confidence=round(0.85 if is_anomaly else 1 - normalized, 4),
                method="IsolationForest",
            )
        else:
            # Heuristic fallback
            score = 0.0
            if transaction.get("amount", 0) > 5000:
                score += 0.3
            if transaction.get("is_new_receiver", 0):
                score += 0.2
            if not transaction.get("same_device_as_usual", 1):
                score += 0.15
            if transaction.get("velocity_1h", 0) > 3:
                score += 0.2
            if transaction.get("hour_of_day", 12) in [0, 1, 2, 3, 4]:
                score += 0.1

            return AnomalyResult(
                is_anomaly=score > 0.5,
                anomaly_score=round(min(1.0, score), 4),
                confidence=round(0.6, 4),
                method="Heuristic",
            )


class SignalFusionEngine:
    """Combines all module scores into unified risk assessment."""

    WEIGHTS = {
        "phishing_score": 0.25,
        "text_scam_score": 0.20,
        "anomaly_score": 0.20,
        "transaction_risk": 0.15,
        "brand_impersonation": 0.10,
        "regulatory_exposure": 0.10,
    }

    def fuse(self, signals: Dict[str, float]) -> FusionResult:
        """Fuse multiple signal scores into unified risk."""
        total = 0.0
        components = {}

        for signal, weight in self.WEIGHTS.items():
            value = signals.get(signal, 0.0)
            weighted = value * weight
            total += weighted
            components[signal] = round(weighted * 100, 1)

        overall = float(np.clip(total * 100, 0, 100))

        if overall >= 80:
            severity = "critical"
        elif overall >= 60:
            severity = "high"
        elif overall >= 40:
            severity = "medium"
        else:
            severity = "low"

        dominant = max(components, key=components.get) if components else "unknown"

        explanations = {
            "critical": f"CRITICAL risk level ({overall:.0f}/100). Dominant signal: {dominant.replace('_', ' ').title()}. Immediate action required.",
            "high": f"HIGH risk level ({overall:.0f}/100). Elevated {dominant.replace('_', ' ')} signal. Investigation recommended.",
            "medium": f"MODERATE risk ({overall:.0f}/100). {dominant.replace('_', ' ').title()} shows elevated activity. Monitor closely.",
            "low": f"LOW risk ({overall:.0f}/100). All signals within normal parameters. Continue standard monitoring.",
        }

        return FusionResult(
            overall_risk=round(overall, 1),
            severity=severity,
            components=components,
            dominant_signal=dominant,
            alert_required=overall >= 55,
            explanation=explanations[severity],
        )


class EWASMLEngine:
    """Master ML engine orchestrating all components."""

    def __init__(self):
        self.phishing = PhishingDetector()
        self.text_classifier = TextScamClassifier()
        self.anomaly_detector = TransactionAnomalyDetector()
        self.fusion = SignalFusionEngine()
        
        # Load model metadata
        self.model_status = self._check_models()
        logger.info(f"EWAS ML Engine initialized — {sum(self.model_status.values())}/{len(self.model_status)} models loaded")

    def _check_models(self) -> Dict[str, bool]:
        return {
            "phishing_lgbm": (MODEL_DIR / "phishing_lgbm.pkl").exists(),
            "text_classifier": (MODEL_DIR / "text_classifier_lgbm.pkl").exists(),
            "fraud_detector": (MODEL_DIR / "fraud_detector_lgbm.pkl").exists(),
            "anomaly_iforest": (MODEL_DIR / "anomaly_iforest.pkl").exists(),
        }

    def get_status(self) -> Dict:
        return {
            "models_loaded": self.model_status,
            "total_models": len(self.model_status),
            "operational": sum(self.model_status.values()),
            "model_dir": str(MODEL_DIR),
        }

    def full_analysis(
        self,
        url: Optional[str] = None,
        text: Optional[str] = None,
        transaction: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """Run full analysis across all available signals."""
        results = {}
        signals = {}

        if url:
            phish = self.phishing.predict(url)
            results["phishing"] = {
                "is_phishing": phish.is_phishing,
                "confidence": phish.confidence,
                "risk_score": phish.risk_score,
                "top_signals": phish.top_signals,
            }
            signals["phishing_score"] = phish.risk_score / 100

        if text:
            text_result = self.text_classifier.classify(text)
            results["text_analysis"] = {
                "is_scam": text_result.is_scam,
                "confidence": text_result.confidence,
                "scam_type": text_result.scam_type,
                "urgency_score": text_result.urgency_score,
            }
            signals["text_scam_score"] = text_result.confidence if text_result.is_scam else 0

        if transaction:
            anomaly = self.anomaly_detector.detect(transaction)
            results["anomaly"] = {
                "is_anomaly": anomaly.is_anomaly,
                "score": anomaly.anomaly_score,
                "confidence": anomaly.confidence,
                "method": anomaly.method,
            }
            signals["anomaly_score"] = anomaly.anomaly_score

        # Fusion
        if signals:
            fusion = self.fusion.fuse(signals)
            results["fusion"] = {
                "overall_risk": fusion.overall_risk,
                "severity": fusion.severity,
                "components": fusion.components,
                "dominant_signal": fusion.dominant_signal,
                "alert_required": fusion.alert_required,
                "explanation": fusion.explanation,
            }

        results["timestamp"] = datetime.now().isoformat()
        return results
