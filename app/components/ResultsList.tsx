"use client";

import { FlightResult } from "../lib/flight-api";
import { Plane, ArrowRight, ExternalLink, Check } from "lucide-react";

interface ResultsListProps {
  result: FlightResult;
}

export function ResultsList({ result }: ResultsListProps) {
  const { standard, splitTicket, savings } = result;
  const hasSavings = savings.amount > 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-900">
              We found a cheaper option!
            </h2>
            <p className="text-green-700">
              Save <span className="font-bold text-2xl">£{savings.amount}</span> 
              ({savings.percentage}%)
            </p>
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Standard Option */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">Standard Return</span>
            <span className="text-2xl font-bold text-slate-700">£{standard.totalPrice}</span>
          </div>

          <div className="space-y-3">
            {/* Outbound */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Plane className="w-4 h-4 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{standard.outbound.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">{standard.outbound.destination}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {standard.outbound.airline} • {standard.outbound.departureTime}
                </p>
              </div>
              <span className="text-sm font-medium">£{standard.outbound.price}</span>
            </div>

            {/* Return */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Plane className="w-4 h-4 text-slate-400 rotate-180" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{standard.inbound.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">{standard.inbound.destination}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {standard.inbound.airline} • {standard.inbound.departureTime}
                </p>
              </div>
              <span className="text-sm font-medium">£{standard.inbound.price}</span>
            </div>
          </div>
        </div>

        {/* Split Ticket Option */}
        <div className="bg-white border-2 border-green-500 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-700">Split Ticket</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Best Price</span>
            </div>
            <span className="text-2xl font-bold text-green-600">£{splitTicket.totalPrice}</span>
          </div>

          <div className="space-y-3">
            {/* Outbound */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <Plane className="w-4 h-4 text-green-600" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{splitTicket.outbound.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">{splitTicket.outbound.destination}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {splitTicket.outbound.airline} • {splitTicket.outbound.departureTime}
                </p>
              </div>
              <span className="text-sm font-medium text-green-700">£{splitTicket.outbound.price}</span>
            </div>

            {/* Return */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <Plane className="w-4 h-4 text-green-600 rotate-180" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{splitTicket.inbound.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="font-medium">{splitTicket.inbound.destination}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {splitTicket.inbound.airline} • {splitTicket.inbound.departureTime}
                </p>
              </div>
              <span className="text-sm font-medium text-green-700">£{splitTicket.inbound.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Links */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900 mb-4">How to book these tickets</h3>
        
        <div className="space-y-3">
          <a
            href={`https://www.skyscanner.net/transport/flights/${splitTicket.outbound.origin.toLowerCase()}/${splitTicket.outbound.destination.toLowerCase()}/?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&oym=${splitTicket.outbound.departureTime.slice(0,7)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-sky-500 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-medium text-slate-900">Book outbound on Skyscanner</p>
              <p className="text-sm text-slate-500">{splitTicket.outbound.airline} • £{splitTicket.outbound.price}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400" />
          </a>

          <a
            href={`https://www.skyscanner.net/transport/flights/${splitTicket.inbound.origin.toLowerCase()}/${splitTicket.inbound.destination.toLowerCase()}/?adults=1&adultsv2=1&cabinclass=economy&children=0&childrenv2=&ref=home&rtn=0&preferdirects=false&outboundaltsenabled=false&inboundaltsenabled=false&oym=${splitTicket.inbound.departureTime.slice(0,7)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-sky-500 hover:shadow-sm transition-all"
          >
            <div>
              <p className="font-medium text-slate-900">Book return on Skyscanner</p>
              <p className="text-sm text-slate-500">{splitTicket.inbound.airline} • £{splitTicket.inbound.price}</p>
            </div>
            <ExternalLink className="w-5 h-5 text-slate-400" />
          </a>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> These are separate one-way tickets. If your first flight is delayed 
            and you miss the second, the airline won&apos;t provide assistance. Allow plenty of connection time.
          </p>
        </div>
      </div>
    </div>
  );
}
