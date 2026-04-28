"""
P2P EWAS — ML Model Training Pipeline
Trains all models on downloaded/generated datasets and saves to models/ directory.
"""

import os
import sys
import json
import logging
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    classification_report, roc_auc_score, precision_recall_fscore_support,
    accuracy_score, confusion_matrix
)
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
import lightgbm as lgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ewas.trainer")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data" / "training"
MODEL_DIR = BASE_DIR / "backend" / "models"


def ensure_dirs():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)


# ──────────────────────────────────────────
# MODEL 1: Phishing URL Classifier (LightGBM)
# ──────────────────────────────────────────
def train_phishing_model():
    """Train LightGBM classifier on URL feature dataset."""
    logger.info("=" * 50)
    logger.info("Training M3: Phishing URL Classifier")
    logger.info("=" * 50)
    
    data_path = DATA_DIR / "phish_urls" / "uci" / "phishing_dataset.csv"
    if not data_path.exists():
        logger.error(f"Dataset not found: {data_path}")
        return None
    
    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} samples — label distribution:\n{df['label'].value_counts().to_string()}")
    
    feature_cols = [c for c in df.columns if c != "label"]
    X = df[feature_cols].values
    y = df["label"].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # LightGBM with hyperparameter tuning
    model = lgb.LGBMClassifier(
        n_estimators=300,
        max_depth=8,
        learning_rate=0.05,
        num_leaves=63,
        min_child_samples=20,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        class_weight="balanced",
        random_state=42,
        verbose=-1,
    )
    
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
    )
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    
    logger.info(f"\n{'='*40}")
    logger.info(f"Phishing Model Performance:")
    logger.info(f"  Accuracy:  {acc:.4f}")
    logger.info(f"  AUC-ROC:   {auc:.4f}")
    logger.info(f"  Precision: {prec:.4f}")
    logger.info(f"  Recall:    {rec:.4f}")
    logger.info(f"  F1-Score:  {f1:.4f}")
    logger.info(f"{'='*40}\n")
    logger.info(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate', 'Phishing'])}")
    
    # Save
    model_path = MODEL_DIR / "phishing_lgbm.pkl"
    scaler_path = MODEL_DIR / "phishing_scaler.pkl"
    meta_path = MODEL_DIR / "phishing_meta.json"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    meta = {
        "model": "LightGBM",
        "task": "phishing_url_classification",
        "features": feature_cols,
        "n_features": len(feature_cols),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "accuracy": round(acc, 4),
            "auc_roc": round(auc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
        },
        "trained_at": datetime.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    
    logger.info(f"Model saved → {model_path}")
    return meta


# ──────────────────────────────────────────
# MODEL 2: Text Scam Classifier (TF-IDF + LightGBM)
# ──────────────────────────────────────────
def train_text_classifier():
    """Train TF-IDF + LightGBM classifier on SMS/scam text data."""
    logger.info("=" * 50)
    logger.info("Training M2: Scam Text Classifier")
    logger.info("=" * 50)
    
    data_path = DATA_DIR / "text_corpora" / "sms_spam.csv"
    if not data_path.exists():
        logger.error(f"Dataset not found: {data_path}")
        return None
    
    df = pd.read_csv(data_path)
    df["label_int"] = (df["label"] == "spam").astype(int)
    logger.info(f"Loaded {len(df)} samples — label distribution:\n{df['label'].value_counts().to_string()}")
    
    X_train_text, X_test_text, y_train, y_test = train_test_split(
        df["text"], df["label_int"], test_size=0.2, stratify=df["label_int"], random_state=42
    )
    
    # TF-IDF vectorization
    vectorizer = TfidfVectorizer(
        max_features=10000,
        ngram_range=(1, 3),
        min_df=2,
        max_df=0.95,
        sublinear_tf=True,
    )
    
    X_train = vectorizer.fit_transform(X_train_text)
    X_test = vectorizer.transform(X_test_text)
    
    model = lgb.LGBMClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        num_leaves=31,
        class_weight="balanced",
        random_state=42,
        verbose=-1,
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    
    logger.info(f"\n{'='*40}")
    logger.info(f"Text Classifier Performance:")
    logger.info(f"  Accuracy:  {acc:.4f}")
    logger.info(f"  AUC-ROC:   {auc:.4f}")
    logger.info(f"  Precision: {prec:.4f}")
    logger.info(f"  Recall:    {rec:.4f}")
    logger.info(f"  F1-Score:  {f1:.4f}")
    logger.info(f"{'='*40}\n")
    
    # Save
    model_path = MODEL_DIR / "text_classifier_lgbm.pkl"
    vec_path = MODEL_DIR / "text_vectorizer.pkl"
    meta_path = MODEL_DIR / "text_classifier_meta.json"
    
    joblib.dump(model, model_path)
    joblib.dump(vectorizer, vec_path)
    
    meta = {
        "model": "TF-IDF + LightGBM",
        "task": "scam_text_classification",
        "tfidf_features": vectorizer.max_features,
        "train_samples": X_train.shape[0],
        "test_samples": X_test.shape[0],
        "metrics": {
            "accuracy": round(acc, 4),
            "auc_roc": round(auc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
        },
        "trained_at": datetime.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    
    logger.info(f"Model saved → {model_path}")
    return meta


# ──────────────────────────────────────────
# MODEL 3: Transaction Fraud Detector (LightGBM)
# ──────────────────────────────────────────
def train_fraud_detector():
    """Train LightGBM classifier on P2P transaction data."""
    logger.info("=" * 50)
    logger.info("Training: Transaction Fraud Detector")
    logger.info("=" * 50)
    
    data_path = DATA_DIR / "reference" / "p2p_transactions.csv"
    if not data_path.exists():
        logger.error(f"Dataset not found: {data_path}")
        return None
    
    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} transactions — fraud rate: {df['is_fraud'].mean():.3%}")
    
    feature_cols = [c for c in df.columns if c != "is_fraud"]
    X = df[feature_cols].values
    y = df["is_fraud"].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    model = lgb.LGBMClassifier(
        n_estimators=500,
        max_depth=10,
        learning_rate=0.03,
        num_leaves=127,
        min_child_samples=30,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=len(y_train[y_train==0]) / max(len(y_train[y_train==1]), 1),
        random_state=42,
        verbose=-1,
    )
    
    model.fit(
        X_train_scaled, y_train,
        eval_set=[(X_test_scaled, y_test)],
    )
    
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    
    cm = confusion_matrix(y_test, y_pred)
    
    logger.info(f"\n{'='*40}")
    logger.info(f"Fraud Detector Performance:")
    logger.info(f"  Accuracy:  {acc:.4f}")
    logger.info(f"  AUC-ROC:   {auc:.4f}")
    logger.info(f"  Precision: {prec:.4f}")
    logger.info(f"  Recall:    {rec:.4f}")
    logger.info(f"  F1-Score:  {f1:.4f}")
    logger.info(f"  Confusion Matrix:\n{cm}")
    logger.info(f"{'='*40}\n")
    
    model_path = MODEL_DIR / "fraud_detector_lgbm.pkl"
    scaler_path = MODEL_DIR / "fraud_scaler.pkl"
    meta_path = MODEL_DIR / "fraud_detector_meta.json"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    meta = {
        "model": "LightGBM",
        "task": "p2p_fraud_detection",
        "features": feature_cols,
        "n_features": len(feature_cols),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "fraud_rate": round(df["is_fraud"].mean(), 4),
        "metrics": {
            "accuracy": round(acc, 4),
            "auc_roc": round(auc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
        },
        "confusion_matrix": cm.tolist(),
        "trained_at": datetime.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    
    logger.info(f"Model saved → {model_path}")
    return meta


# ──────────────────────────────────────────
# MODEL 4: Anomaly Detector (Isolation Forest)
# ──────────────────────────────────────────
def train_anomaly_detector():
    """Train Isolation Forest on transaction features for unsupervised anomaly detection."""
    logger.info("=" * 50)
    logger.info("Training: Anomaly Detector (Isolation Forest)")
    logger.info("=" * 50)
    
    data_path = DATA_DIR / "reference" / "p2p_transactions.csv"
    if not data_path.exists():
        logger.error(f"Dataset not found: {data_path}")
        return None
    
    df = pd.read_csv(data_path)
    feature_cols = [c for c in df.columns if c != "is_fraud"]
    X = df[feature_cols].values
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = IsolationForest(
        n_estimators=200,
        contamination=0.035,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)
    
    scores = model.score_samples(X_scaled)
    preds = model.predict(X_scaled)
    
    # Evaluate against known fraud labels
    y_true = df["is_fraud"].values
    anomaly_flags = (preds == -1).astype(int)
    
    prec, rec, f1, _ = precision_recall_fscore_support(y_true, anomaly_flags, average="binary", zero_division=0)
    
    logger.info(f"\n{'='*40}")
    logger.info(f"Anomaly Detector (unsupervised) vs known fraud:")
    logger.info(f"  Precision: {prec:.4f}")
    logger.info(f"  Recall:    {rec:.4f}")
    logger.info(f"  F1-Score:  {f1:.4f}")
    logger.info(f"  Flagged:   {anomaly_flags.sum()} / {len(anomaly_flags)}")
    logger.info(f"{'='*40}\n")
    
    model_path = MODEL_DIR / "anomaly_iforest.pkl"
    scaler_path = MODEL_DIR / "anomaly_scaler.pkl"
    meta_path = MODEL_DIR / "anomaly_meta.json"
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    meta = {
        "model": "IsolationForest",
        "task": "anomaly_detection",
        "features": feature_cols,
        "n_features": len(feature_cols),
        "contamination": 0.035,
        "total_samples": len(X),
        "anomalies_flagged": int(anomaly_flags.sum()),
        "metrics_vs_fraud_labels": {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
        },
        "trained_at": datetime.now().isoformat(),
    }
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    
    logger.info(f"Model saved → {model_path}")
    return meta


# ──────────────────────────────────────────
# TRAIN ALL
# ──────────────────────────────────────────
def train_all():
    """Train all ML models."""
    ensure_dirs()
    
    logger.info("🧠 " + "=" * 58)
    logger.info("🧠  P2P EWAS — ML Training Pipeline")
    logger.info("🧠 " + "=" * 58)
    
    results = {}
    
    results["phishing"] = train_phishing_model()
    results["text_classifier"] = train_text_classifier()
    results["fraud_detector"] = train_fraud_detector()
    results["anomaly_detector"] = train_anomaly_detector()
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TRAINING SUMMARY")
    logger.info("=" * 60)
    
    for name, meta in results.items():
        if meta:
            metrics = meta.get("metrics", meta.get("metrics_vs_fraud_labels", {}))
            best_metric = max(metrics.values()) if metrics else 0
            logger.info(f"  ✅ {name}: Best metric = {best_metric:.4f}")
        else:
            logger.info(f"  ❌ {name}: FAILED")
    
    # Save combined report
    report_path = MODEL_DIR / "training_report.json"
    with open(report_path, "w") as f:
        json.dump({
            "training_run": datetime.now().isoformat(),
            "models": {k: v for k, v in results.items() if v is not None},
        }, f, indent=2)
    
    logger.info(f"\n📊 Full report → {report_path}")
    logger.info(f"📁 Models directory → {MODEL_DIR}")
    return results


if __name__ == "__main__":
    train_all()
