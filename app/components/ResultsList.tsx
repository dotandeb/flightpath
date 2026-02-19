"use client";

import { FlightResult } from "../lib/flight-api";
import { Plane, ArrowRight, ExternalLink, Check, AlertTriangle } from "lucide-react";

interface ResultsListProps {
  result: FlightResult;
}

export function ResultsList({ result }: ResultsListProps) {
  // Handle missing data gracefully
  if (!result) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        No results available.
      </div>
    );
  }

  const { standard, alternatives = [], bestOption } = result;
  
  // Fallback if bestOption is missing
  const effectiveBestOption = bestOption || standard;
  
  if (!standard) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        No flight data available. Please try again.
      </div>
    );
  }

  const hasSavings = effectiveBestOption.totalPrice < standard.totalPrice;
  const savingsAmount = standard.totalPrice - effectiveBestOption.totalPrice;
  const savingsPercentage = standard.totalPrice > 0 
    ? Math.round((savingsAmount / standard.totalPrice) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Best Deal Banner */}
      {hasSavings && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Best deal found!</h2>
              <p className="text-green-100">
                Save <span className="font-bold text-3xl">£{savingsAmount}</span> 
                ({savingsPercentage}%)
              </p>
            </div>
          </div>          <p className="text-sm text-green-100 mt-2">
            Strategy: <span className="font-semibold">{effectiveBestOption.strategy}</span>
          </p>
        </div>
      )}

      {/* Best Option Card */}
      <div className={`bg-white border-2 ${hasSavings ? 'border-green-500' : 'border-slate-300'} rounded-xl p-6 shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${hasSavings ? 'text-green-700' : 'text-slate-700'}`}>
              {effectiveBestOption.strategy}
            </span>
            {hasSavings && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Best Price
              </span>
            )}
          </div>
          <span className={`text-3xl font-bold ${hasSavings ? 'text-green-600' : 'text-slate-700'}`}>
            £{effectiveBestOption.totalPrice}
          </span>
        </div>

        <div className="space-y-3">
          <FlightLegCard leg={effectiveBestOption.outbound} type="outbound" />
          <FlightLegCard leg={effectiveBestOption.inbound} type="inbound" />
        </div>

        {effectiveBestOption.risks && effectiveBestOption.risks.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Things to consider:</p>
                <ul className="mt-1 space-y-1">
                  {effectiveBestOption.risks.map((risk, i) => (
                    <li key={i}>• {risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <a
          href={effectiveBestOption.bookingLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Book this deal
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* All Alternatives */}
      {alternatives.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Other ways to save</h3>
          
          {alternatives.map((option, index) => (
            <div 
              key={index} 
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">{option.strategy}</span>
                  {option.savingsVsStandard > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Save £{option.savingsVsStandard}
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold text-slate-900">£{option.totalPrice}</span>
              </div>

              <div className="text-sm text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  {option.outbound?.airline} {option.outbound?.flightNumber}
                  <ArrowRight className="w-3 h-3" />
                  {option.inbound?.airline} {option.inbound?.flightNumber}
                </div>
                
                {option.risks && option.risks.length > 0 && (
                  <div className="flex items-start gap-1 text-amber-700">
                    <AlertTriangle className="w-3 h-3 mt-0.5" />
                    <span className="text-xs">{option.risks[0]}</span>
                  </div>
                )}
              </div>

              <a
                href={option.bookingLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
              >
                Book this option
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Standard Option (for comparison) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 opacity-75">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500">Standard Return (for comparison)</span>
          <span className="text-xl font-bold text-slate-600">£{standard.totalPrice}</span>
        </div>
        <div className="text-sm text-slate-500">
          {standard.outbound?.airline} / {standard.inbound?.airline}
        </div>
      </div>
    </div>
  );
}

function FlightLegCard({ leg, type }: { leg: any; type: "outbound" | "inbound" }) {
  if (!leg) return null;
  
  const departure = leg.departureTime ? new Date(leg.departureTime) : null;
  const arrival = leg.arrivalTime ? new Date(leg.arrivalTime) : null;
  
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
      <Plane className={`w-5 h-5 text-green-600 ${type === "inbound" ? "rotate-180" : ""}`} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{leg.origin}</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-900">{leg.destination}</span>
        </div>        <div className="text-sm text-slate-600 mt-1">
          <span className="font-medium">{leg.airline} {leg.flightNumber}</span>
          {departure && (
            <>
              <span className="mx-2">•</span>
              {departure.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              <span className="mx-2">•</span>
              {departure.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              {arrival && (
                <>{" - "}{arrival.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</>
              )}
            </>
          )}
        </div>
      </div>      <span className="font-semibold text-green-700">£{leg.price}</span>
    </div>
  );
}
