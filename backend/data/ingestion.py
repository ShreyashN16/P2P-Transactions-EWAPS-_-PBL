"""
E-WASP Data Ingestion Pipeline
Handles: CSV/Excel upload, cleaning, transformation, feature engineering
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import logging
import json

logger = logging.getLogger(__name__)


class DataIngestionPipeline:
    """
    Accepts uploaded files (CSV/Excel) or reads from database.
    Cleans, transforms, and engineers features for ML pipeline.
    """

    SUPPORTED_FORMATS = [".csv", ".xlsx", ".xls", ".tsv"]

    def __init__(self):
        self.raw_df: Optional[pd.DataFrame] = None
        self.clean_df: Optional[pd.DataFrame] = None
        self.feature_df: Optional[pd.DataFrame] = None
        self.schema: Dict = {}

    def ingest_file(self, file_path: str) -> pd.DataFrame:
        """Load file into DataFrame"""
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext not in self.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format: {ext}. Supported: {self.SUPPORTED_FORMATS}")

        logger.info(f"Ingesting file: {path.name}")

        if ext == ".csv":
            # Try multiple encodings
            for enc in ["utf-8", "latin-1", "cp1252"]:
                try:
                    self.raw_df = pd.read_csv(file_path, encoding=enc)
                    break
                except UnicodeDecodeError:
                    continue
        elif ext == ".tsv":
            self.raw_df = pd.read_csv(file_path, sep="\t")
        elif ext in [".xlsx", ".xls"]:
            self.raw_df = pd.read_excel(file_path, engine="openpyxl" if ext == ".xlsx" else "xlrd")

        logger.info(f"Loaded {len(self.raw_df)} rows × {len(self.raw_df.columns)} columns")
        return self.raw_df

    def ingest_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Accept already-loaded DataFrame"""
        self.raw_df = df.copy()
        return self.raw_df

    def auto_detect_schema(self) -> Dict:
        """Auto-detect column types and suggest roles"""
        df = self.raw_df
        schema = {}

        for col in df.columns:
            sample = df[col].dropna().head(50)
            col_info = {"name": col, "dtype": str(df[col].dtype), "null_pct": round(df[col].isna().mean() * 100, 1), "unique_count": df[col].nunique()}

            # Detect semantic type
            col_lower = col.lower()
            if any(k in col_lower for k in ["date", "time", "day", "month", "year", "period"]):
                col_info["semantic"] = "date"
            elif any(k in col_lower for k in ["revenue", "sales", "amount", "value", "total", "profit", "income"]):
                col_info["semantic"] = "primary_metric"
            elif any(k in col_lower for k in ["region", "city", "state", "location", "zone", "branch"]):
                col_info["semantic"] = "region"
            elif any(k in col_lower for k in ["category", "product", "type", "segment", "class", "sku"]):
                col_info["semantic"] = "category"
            elif any(k in col_lower for k in ["vendor", "supplier", "partner"]):
                col_info["semantic"] = "vendor"
            elif any(k in col_lower for k in ["qty", "quantity", "units", "volume", "count"]):
                col_info["semantic"] = "volume"
            elif any(k in col_lower for k in ["cost", "price", "rate", "fee"]):
                col_info["semantic"] = "cost"
            elif df[col].dtype in [np.float64, np.int64, np.float32, np.int32]:
                col_info["semantic"] = "numeric"
            elif df[col].nunique() < 30:
                col_info["semantic"] = "categorical"
            else:
                col_info["semantic"] = "text"

            # Sample values
            col_info["sample_values"] = sample.astype(str).head(5).tolist()
            schema[col] = col_info

        self.schema = schema
        return schema

    def clean(self, column_mapping: Optional[Dict] = None) -> pd.DataFrame:
        """
        Clean data:
        - Remove duplicates
        - Handle missing values
        - Fix data types
        - Standardize formats
        """
        df = self.raw_df.copy()

        # Remove exact duplicates
        before = len(df)
        df = df.drop_duplicates()
        logger.info(f"Removed {before - len(df)} duplicate rows")

        # Apply column mapping if provided
        if column_mapping:
            rename_map = {old: role for old, role in column_mapping.items() if role != "ignore"}
            df = df.rename(columns=rename_map)

        # Fix numeric columns
        for col in df.columns:
            if df[col].dtype == object:
                # Try to convert to numeric (handles ₹, $, commas)
                cleaned = df[col].astype(str).str.replace(r'[₹$€£,\s]', '', regex=True)
                numeric_attempt = pd.to_numeric(cleaned, errors='coerce')
                if numeric_attempt.notna().mean() > 0.7:
                    df[col] = numeric_attempt

        # Fix date columns
        for col in df.columns:
            if df[col].dtype == object and any(k in col.lower() for k in ["date", "time", "day"]):
                try:
                    df[col] = pd.to_datetime(df[col], infer_datetime_format=True, errors='coerce')
                except Exception:
                    pass

        # Fill numeric NAs with median, categorical with mode
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                df[col] = df[col].fillna(df[col].median())
            elif df[col].dtype == object:
                mode = df[col].mode()
                if len(mode):
                    df[col] = df[col].fillna(mode[0])

        self.clean_df = df
        logger.info(f"Cleaned dataset: {len(df)} rows remaining")
        return df

    def engineer_features(self, date_col: Optional[str] = None, value_col: Optional[str] = None) -> pd.DataFrame:
        """
        Engineer ML-ready features:
        - Rolling statistics
        - Trend slope
        - Volatility index
        - Lag features
        - Anomaly frequency
        """
        df = self.clean_df.copy() if self.clean_df is not None else self.raw_df.copy()

        if value_col and value_col in df.columns:
            vals = df[value_col].values

            # Rolling statistics
            df["rolling_7_mean"] = pd.Series(vals).rolling(7, min_periods=1).mean().values
            df["rolling_30_mean"] = pd.Series(vals).rolling(30, min_periods=1).mean().values
            df["rolling_7_std"] = pd.Series(vals).rolling(7, min_periods=1).std().fillna(0).values
            df["rolling_30_std"] = pd.Series(vals).rolling(30, min_periods=1).std().fillna(0).values

            # Volatility index (coefficient of variation)
            df["volatility_index"] = df["rolling_7_std"] / (df["rolling_7_mean"] + 1e-8)

            # Trend slope (linear regression over 7-point window)
            def slope(x):
                if len(x) < 2: return 0
                try: return float(np.polyfit(range(len(x)), x, 1)[0])
                except: return 0

            df["trend_slope_7"] = pd.Series(vals).rolling(7, min_periods=2).apply(slope, raw=True).fillna(0).values

            # Deviation from rolling mean
            df["deviation_from_avg"] = (df[value_col] - df["rolling_7_mean"]) / (df["rolling_7_mean"] + 1e-8)

            # Lag features
            df["lag_1"] = pd.Series(vals).shift(1).fillna(vals[0]).values
            df["lag_7"] = pd.Series(vals).shift(7).fillna(vals[0]).values
            df["pct_change_1"] = pd.Series(vals).pct_change(1).fillna(0).clip(-1, 5).values
            df["pct_change_7"] = pd.Series(vals).pct_change(7).fillna(0).clip(-1, 5).values

        if date_col and date_col in df.columns:
            try:
                dt = pd.to_datetime(df[date_col])
                df["month"] = dt.dt.month
                df["day_of_week"] = dt.dt.dayofweek
                df["quarter"] = dt.dt.quarter
                df["is_weekend"] = (dt.dt.dayofweek >= 5).astype(int)
                df["is_month_end"] = dt.dt.is_month_end.astype(int)
            except Exception:
                pass

        self.feature_df = df
        logger.info(f"Feature engineering complete: {len(df.columns)} features")
        return df

    def get_summary(self) -> Dict:
        """Get ingestion summary stats"""
        df = self.clean_df or self.raw_df
        if df is None:
            return {}
        return {
            "rows": len(df),
            "columns": len(df.columns),
            "numeric_cols": int(df.select_dtypes(include=[np.number]).shape[1]),
            "date_cols": int(sum(1 for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c]))),
            "null_pct": round(df.isna().mean().mean() * 100, 1),
            "memory_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
            "columns_list": list(df.columns),
        }
