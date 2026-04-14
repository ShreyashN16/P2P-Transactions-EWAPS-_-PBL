"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, File, CheckCircle2, ChevronRight, Activity, Brain, Network, BarChart2 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const mlSteps = [
  { id: "parsing", label: "Parsing enterprise dataset matrices...", icon: File },
  { id: "isolation", label: "Running Isolation Forest (Anomaly Detection)...", icon: Activity },
  { id: "prophet", label: "Generating Prophet multi-variate forecasts...", icon: BarChart2 },
  { id: "randomforest", label: "Computing Signal Fusion & SHAP explainers...", icon: Network },
  { id: "scoring", label: "Finalizing risk severity parameters...", icon: Brain },
];

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success">("idle");
  const [currentStep, setCurrentStep] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const startAnalysis = () => {
    if (!file) return;
    setStatus("uploading");
    
    // Simulate ML Pipeline steps
    mlSteps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index + 1);
        if (index === mlSteps.length - 1) {
          setTimeout(() => {
            setStatus("success");
            setTimeout(() => {
              router.push("/dashboard"); // Auto-redirect to dashboard when done
            }, 1500);
          }, 800);
        }
      }, (index + 1) * 1200); // Step duration
    });
  };

  return (
    <div className="max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-display text-white tracking-tight">E-WASP Data Ingestion</h1>
        <p className="text-white/50 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
          Upload your core datasets (Sales, Vendor, Procurement) to begin. The AI engine will parse, detect anomalies, forecast trends, and map combinatorial risks.
        </p>
      </div>

      <div 
        className={cn(
          "relative p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all bg-[#0A0A0A]",
          dragActive ? "border-orange-500 bg-orange-500/5 shadow-[0_0_30px_rgba(249,115,22,0.1)] scale-[1.02]" : "border-white/10 hover:border-white/20",
          status === "success" && "border-green-500/50 bg-green-500/5",
          (status === "uploading" || status === "success") && "pointer-events-none"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {status === "idle" && !file && (
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-white/5 to-white/10 flex items-center justify-center mb-6 text-white/40 shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>
            <p className="text-lg font-medium text-white/90">Click to upload or drag and drop</p>
            <p className="text-sm text-white/40 mt-2 text-center max-w-xs leading-relaxed">
              CSV, XLSX, or JSON datasets.<br/>Must include historical timestamps.
            </p>
            
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
            />
          </div>
        )}

        {file && status === "idle" && (
          <div className="flex flex-col items-center py-8 anim-fade-up">
            <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500 ring-4 ring-orange-500/20">
              <File className="w-10 h-10" />
            </div>
            <p className="text-xl font-medium text-white/90">{file.name}</p>
            <p className="text-sm text-white/40 mt-1 font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button 
              onClick={startAnalysis}
              className="mt-8 bg-white text-black px-8 py-3 rounded-lg text-sm font-bold hover:bg-white/90 transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Analyze Dataset <Brain className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col w-full max-w-lg mx-auto py-4">
            <h3 className="text-center text-lg font-bold text-white mb-8">AI/ML Processing Pipeline Active</h3>
            
            <div className="space-y-6">
              {mlSteps.map((step, idx) => {
                const isActive = currentStep === idx;
                const isPast = currentStep > idx;
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className={cn(
                    "flex items-center gap-4 transition-all duration-500",
                    isPast ? "opacity-100" : isActive ? "opacity-100" : "opacity-30"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-500",
                      isPast ? "bg-green-500/20 border-green-500/50 text-green-500" : 
                      isActive ? "bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" : 
                      "bg-white/5 border-white/10 text-white/40"
                    )}>
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className={cn("w-5 h-5", isActive && "animate-pulse")} />}
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium transition-colors", isPast ? "text-green-500" : isActive ? "text-white" : "text-white/40")}>
                        {step.label}
                      </p>
                      {isActive && (
                        <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full w-full animate-progress" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center py-8 anim-fade-up">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 text-green-500 ring-8 ring-green-500/10 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Analysis Complete</p>
            <p className="text-sm text-white/50 mb-8 max-w-sm text-center">
              All ML models executed successfully. 12 parameterized graphs generated.
            </p>
            <div className="flex items-center gap-2 text-orange-500 text-sm font-mono bg-orange-500/10 px-4 py-2 rounded-lg border border-orange-500/20">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Redirecting to Intelligence Dashboard...
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress {
          animation: progress 1.5s infinite linear;
        }
        .anim-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
