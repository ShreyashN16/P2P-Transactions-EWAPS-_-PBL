export type Severity = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  area: string;
  explanation: string | string[];
  predicted_impact_inr?: number;
  impact?: number;
  confidence: number;
  recommended_actions: string[];
  timestamp: string;
}

export interface RegionRisk {
  region: string;
  score: number;
  severity: Severity;
  color: string;
}

export const SEVERITY_CONFIG = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "CRITICAL" },
  high:     { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)", label: "HIGH" },
  medium:   { color: "#eab308", bg: "rgba(234,179,8,0.1)", border: "rgba(234,179,8,0.3)", label: "MEDIUM" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", label: "LOW" },
};

export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALT-001", title: "Vendor Reliability Crisis — Vendor_C",
    severity: "critical", area: "Supply Chain",
    explanation: "Vendor_C has shown 47% on-time delivery failure over 30 days. Defect rate: 18.3%. Probability of complete supply disruption within 14 days: 73%.",
    predicted_impact_inr: 4200000, confidence: 0.91,
    recommended_actions: ["Activate Vendor_F as secondary source immediately", "Place emergency buffer stock order (15% volume)", "Initiate vendor audit & improvement plan"],
    timestamp: new Date(Date.now() - 2*3600000).toISOString(),
  },
  {
    id: "ALT-002", title: "Monsoon Logistics Disruption — Western Corridor",
    severity: "high", area: "Logistics",
    explanation: "Weather models predict 340mm+ rainfall in Mumbai-Pune corridor over 7 days. Historical: 28% logistics delay. Pre-Diwali inventory at risk.",
    predicted_impact_inr: 2800000, confidence: 0.84,
    recommended_actions: ["Pre-position 20% excess inventory at Pune DC", "Activate rail freight alternatives", "Issue advance schedule to Modern Trade"],
    timestamp: new Date(Date.now() - 5*3600000).toISOString(),
  },
  {
    id: "ALT-003", title: "Demand Anomaly — FMCG-Beverage, Chennai",
    severity: "high", area: "Sales",
    explanation: "Revenue dropped 38% below 30-day rolling average. Google Trends: category interest down 22 points. Possible competitive entry or distribution failure.",
    predicted_impact_inr: 1650000, confidence: 0.78,
    recommended_actions: ["Emergency retailer audit in Chennai metro", "Review competitive SKU launches (45 days)", "Accelerate trade marketing spend"],
    timestamp: new Date(Date.now() - 8*3600000).toISOString(),
  },
];

export const MOCK_REGION_RISKS: RegionRisk[] = [
  { region: "Mumbai", score: 45, severity: "medium", color: "#eab308" },
  { region: "Delhi", score: 58, severity: "medium", color: "#f97316" },
  { region: "Bangalore", score: 32, severity: "low", color: "#10b981" },
  { region: "Chennai", score: 71, severity: "high", color: "#f97316" },
  { region: "Kolkata", score: 63, severity: "high", color: "#f97316" },
];
