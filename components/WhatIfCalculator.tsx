"use client";

import { useState, useEffect } from "react";

interface WhatIfCalculatorProps {
  currentTotalSlices: number;
  currentUserSlices: number;
  hourlyRate: number;
}

export default function WhatIfCalculator({ currentTotalSlices, currentUserSlices, hourlyRate }: WhatIfCalculatorProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"time" | "money">("time");
  
  const [projected, setProjected] = useState({
    newTotal: currentTotalSlices,
    newUserTotal: currentUserSlices,
    newEquity: 0,
    diff: 0
  });

  useEffect(() => {
    const val = parseFloat(amount) || 0;
    let slicesToAdd = 0;

    if (type === "time") {
      // Time is 2x multiplier on FMV
      // Input is usually hours, so FMV = hours * hourlyRate
      // Slices = FMV * 2
      const fmv = val * (hourlyRate || 0);
      slicesToAdd = fmv * 2;
    } else {
      // Money is 4x multiplier
      // Input is cash amount
      slicesToAdd = val * 4;
    }

    const newTotal = currentTotalSlices + slicesToAdd;
    const newUserTotal = currentUserSlices + slicesToAdd;
    const newEquity = newTotal > 0 ? (newUserTotal / newTotal) * 100 : 0;
    const currentEquity = currentTotalSlices > 0 ? (currentUserSlices / currentTotalSlices) * 100 : 0;

    setProjected({
      newTotal,
      newUserTotal,
      newEquity,
      diff: newEquity - currentEquity
    });
  }, [amount, type, currentTotalSlices, currentUserSlices, hourlyRate]);

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-card h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        Equity Simulator
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        See how your equity changes if you contribute more time or money today.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Contribution Type</label>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setType("time")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-md border ${
                  type === "time" 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground border-input hover:bg-muted"
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setType("money")}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  type === "money" 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground border-input hover:bg-muted"
                }`}
              >
                Money
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {type === "time" ? "Hours" : "Amount (JOD)"}
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder={type === "time" ? "e.g. 40" : "e.g. 1000"}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Projected Equity</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-foreground">{projected.newEquity.toFixed(2)}%</span>
              {projected.diff !== 0 && (
                <span className={`ml-2 text-xs font-medium ${projected.diff > 0 ? "text-green-600" : "text-red-600"}`}>
                  {projected.diff > 0 ? "+" : ""}{projected.diff.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${projected.newEquity}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Based on your rate of JOD {hourlyRate}/hr
          </p>
        </div>
      </div>
    </div>
  );
}
