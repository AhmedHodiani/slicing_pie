"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import pb from "@/lib/pocketbase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [salary, setSalary] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setSalary(user.market_salary_monthly?.toString() || "");
      setHourlyRate(user.hourly_rate?.toString() || "");
    }
  }, [user]);

  const calculateHourly = (monthlySalary: number) => {
    // Standard: 2000 hours per year / 12 months = 166.67 hours/month
    return (monthlySalary * 12 / 2000).toFixed(2);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSalary(val);
    if (val) {
      setHourlyRate(calculateHourly(parseFloat(val)));
    } else {
      setHourlyRate("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setMessage("");

    try {
      await pb.collection("users").update(user.id, {
        market_salary_monthly: parseFloat(salary),
        hourly_rate: parseFloat(hourlyRate),
      });
      setMessage("Settings saved successfully!");
      // Refresh auth store to update user context
      await pb.collection("users").authRefresh();
    } catch (err) {
      console.error(err);
      setMessage("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">User Settings</h1>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Monthly Market Salary ($)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                What would you be paid for this role in the open market?
              </p>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={salary}
                onChange={handleSalaryChange}
                className="block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Implied Hourly Rate ($)
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Calculated based on 2000 working hours/year.
              </p>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes("Failed") ? "text-destructive" : "text-success"}`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full justify-center rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
