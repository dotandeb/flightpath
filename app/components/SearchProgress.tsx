"use client";

import { useState, useEffect } from 'react';
import { Loader2, Plane, CheckCircle, Search, Zap } from 'lucide-react';

interface SearchProgressProps {
  isSearching: boolean;
  currentStep: number;
  totalSteps: number;
  stepName: string;
}

const STEPS = [
  { name: "Checking RSS deal feeds", icon: Search },
  { name: "Scanning SecretFlying", icon: Plane },
  { name: "Scanning Fly4Free", icon: Plane },
  { name: "Scanning HolidayPirates", icon: Plane },
  { name: "Scanning AirfareWatchdog", icon: Plane },
  { name: "Scanning ThriftyTraveler", icon: Plane },
  { name: "Analyzing split-ticket options", icon: Zap },
  { name: "Checking nearby airports", icon: Plane },
  { name: "Comparing flexible dates", icon: Zap },
  { name: "Finalizing best deals", icon: CheckCircle },
];

export function SearchProgress({ isSearching, currentStep, totalSteps, stepName }: SearchProgressProps) {
  const [progress, setProgress] = useState(0);
  const [displayStep, setDisplayStep] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setProgress(0);
      setDisplayStep(0);
      return;
    }

    // Animate progress
    const targetProgress = Math.min((currentStep / totalSteps) * 100, 95);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) return prev;
        return prev + 1;
      });
    }, 50);

    // Update displayed step
    setDisplayStep(currentStep);

    return () => clearInterval(interval);
  }, [isSearching, currentStep, totalSteps]);

  if (!isSearching) return null;

  const currentStepInfo = STEPS[Math.min(displayStep, STEPS.length - 1)];
  const Icon = currentStepInfo?.icon || Search;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center">
              <Icon className="w-5 h-5 text-sky-600 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{stepName || currentStepInfo?.name}</p>
              <p className="text-sm text-slate-500">Step {displayStep + 1} of {totalSteps}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-sky-600">{Math.round(progress)}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-4">
          {STEPS.slice(0, 5).map((step, idx) => {
            const isActive = idx <= displayStep;
            const isCurrent = idx === displayStep;
            
            return (
              <div key={idx} className="flex flex-col items-center">
                <div 
                  className={`w-2 h-2 rounded-full mb-1 transition-colors ${
                    isCurrent ? 'bg-sky-600 scale-150' : 
                    isActive ? 'bg-sky-400' : 'bg-slate-200'
                  }`}
                />
                <span className={`text-[10px] ${isActive ? 'text-sky-600' : 'text-slate-400'}`}>
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-sky-50 rounded-lg">
          <p className="text-xs text-sky-700">
            💡 <strong>Tip:</strong> We're checking multiple deal sources and booking strategies to find you the best price. This usually takes 5-10 seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
