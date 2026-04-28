# 🦅 P2P-Transactions-EWAPS
## Enterprise-Grade P2P Payments Early-Warning & Fraud Intelligence System

> **Decision Intelligence Platform** designed to detect, track, and mitigate P2P payment fraud across multiple signal layers: PSR Benchmarks, Scam Typologies, and Brand Impersonation.

```
AI-Driven. 
Multi-Signal. 
Investor-Ready.
Built for the future of P2P Trust.
```

---

## 🏗️ Architecture: The 3-Pillar Engine

E-WAPS (Early Warning & Payment Security) is built on three specialized intelligence pillars:

| Pillar | Focus | Technology Stack |
|--------|-------|------------------|
| **M1: PSR Benchmark** | Regulatory z-score analysis per PSP | Pandas, SciPy, Statistical Modeling |
| **M2: Scam Typology Radar** | NLP-driven detection of narrative shifts | BERTopic, Sentence-Transformers, NLP |
| **M3: Phishing Watchtower** | Real-time brand impersonation monitoring | Levenshtein Distance, Phishing-ML |

---

## 🚀 Vision & Technology

### Layer 1: Anomaly Detection
Using **Isolation Forest** ensembles to detect suspicious transaction patterns in real-time, identifying high-velocity transfers and new-receiver anomalies.

### Layer 2: Narrative Intelligence
A proprietary NLP engine that analyzes complaint data (CFPB, r/Scams) to detect "Typology Drift" — spotting new scam narratives (like "Fake Job + Check Deposit") before they go viral.

### Layer 3: Brand Watchtower
A defensive layer that monitors DNS registrations for homoglyphs and lookalike domains (e.g., `monz0-support.top`), providing early warning for phishing infrastructure staging.

---

## 📊 Project Showcase

### **[M1] PSR Benchmark Module**
- Automated z-score calculation for UK Payment Systems Regulator (PSR) data.
- Comparative risk ranking of PSPs (Monzo, Barclays, Revolut, etc.).
- Trajectory tracking for fraud-sent vs. reimbursement rates.

### **[M2] Scam Typology Radar**
- Live cluster visualization of emerging scam narratives.
- Velocity tracking (e.g., "78% increase in Romace-Scam pivot to Gift Cards").
- Automated "Recommended Actions" for fraud operations teams.

### **[M3] Brand Impersonation Watchtower**
- Proactive domain scanning for 15+ global finance brands.
- Risk-weighted scoring based on TLD, Age, and Metadata.
- Automated phishing kit identification.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.11+), Scikit-Learn, Pandas, Transformers.
- **Frontend**: Next.js 14, Tailwind CSS, Recharts, Lucide Icons.
- **Design**: Bloomberg Terminal-inspired Dark Mode (High Information Density).
- **Infrastructure**: Docker & Docker Compose Support.

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10+
- Node.js 18+
- Docker (Optional for containerized run)

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/ShreyashN16/P2P-Transactions-EWAPS-_-PBL.git
cd ewasp

# Start Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload

# Start Frontend (New terminal)
cd frontend
npm install
npm run dev
```

### 3. Access
- **Dashboard**: `http://localhost:3000`
- **Scanner**: `http://localhost:3000/scanner`
- **API Docs**: `http://localhost:8000/docs`

---

## 📁 Repository Structure

```
ewasp/
├── backend/               # FastAPI Production API
│   ├── ml/                # ML Models & Logic
│   ├── data/              # Dataset Generation Scripts
│   └── external/          # External Signal Integration
├── frontend/              # Next.js 14 PWA
│   ├── app/               # App Router & Routes
│   └── components/        # Shared UI Components
├── data/                  # Synthetic training datasets
├── infra/                 # Docker & DB Configuration
└── README.md              # Project Intelligence
```

---

*Developed for the P2P-Transactions-EWAPS PBL. Designed for scale, explainability, and enterprise-grade fraud intelligence.*
