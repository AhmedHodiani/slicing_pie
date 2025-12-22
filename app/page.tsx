"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import pb from "@/lib/pocketbase";
import ContributionForm from "@/components/ContributionForm";
import ContributionImport from "@/components/ContributionImport";
import EquityPieChart from "@/components/PieChart";
import TeamGrid from "@/components/TeamGrid";
import ActivityFeed from "@/components/ActivityFeed";
import ContributionBreakdownChart from "@/components/ContributionBreakdownChart";
import VelocityChart from "@/components/VelocityChart";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import { useRouter } from "next/navigation";
import { RecordModel } from "pocketbase";

import Avatar from "@/components/avataaars-lib";

interface Contribution extends RecordModel {
  user: string;
  slices: number;
  multiplier: number;
  created: string;
  expand?: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar: string;
      avatar_options?: any;
      collectionId: string;
    };
  };
}

interface UserWithStats extends RecordModel {
  totalSlices: number;
  equity: number;
  title?: string;
  avatar_options?: any;
}

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [usersWithStats, setUsersWithStats] = useState<UserWithStats[]>([]);
  const [stats, setStats] = useState({
    userSlices: 0,
    totalSlices: 0,
    userEquity: 0,
  });
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [breakdownData, setBreakdownData] = useState<{ name: string; Time: number; Money: number }[]>([]);
  const [velocityData, setVelocityData] = useState<{ date: string; totalSlices: number }[]>([]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch all users first
      const users = await pb.collection("users").getFullList({
        sort: "-created",
      });

      // Fetch contributions
      const records = await pb.collection("contributions").getFullList<Contribution>({
        expand: "user",
        sort: "created", // Sort by created ascending for velocity calculation
      });
      setContributions(records.reverse()); // Reverse for display lists (newest first)

      // Calculate stats
      let total = 0;
      let userTotal = 0;
      const userSlicesMap = new Map<string, number>();
      const userBreakdownMap = new Map<string, { Time: number; Money: number; name: string }>();
      const velocityPoints: { date: string; totalSlices: number }[] = [];
      let runningTotal = 0;

      // Initialize maps with all users to ensure everyone appears
      users.forEach(u => {
        userSlicesMap.set(u.id, 0);
        userBreakdownMap.set(u.id, { Time: 0, Money: 0, name: u.name || u.email });
      });

      // Process records (using the ascending sorted list for velocity)
      records.forEach((c) => {
        // Velocity Calculation
        runningTotal += c.slices;
        const date = new Date(c.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        // Simple grouping: if date exists, update it, else push new
        const lastPoint = velocityPoints[velocityPoints.length - 1];
        if (lastPoint && lastPoint.date === date) {
          lastPoint.totalSlices = runningTotal;
        } else {
          velocityPoints.push({ date, totalSlices: runningTotal });
        }

        // General Stats Calculation
        total += c.slices;
        if (c.user === user.id) {
          userTotal += c.slices;
        }

        // Update slices map
        const currentSlices = userSlicesMap.get(c.user) || 0;
        userSlicesMap.set(c.user, currentSlices + c.slices);

        // Update breakdown map
        const breakdown = userBreakdownMap.get(c.user);
        if (breakdown) {
          if (c.multiplier === 4) {
            breakdown.Money += c.slices;
          } else {
            breakdown.Time += c.slices;
          }
        }
      });

      setStats({
        userSlices: userTotal,
        totalSlices: total,
        userEquity: total > 0 ? (userTotal / total) * 100 : 0,
      });

      setVelocityData(velocityPoints);

      // Prepare Chart Data
      const pieData = Array.from(userBreakdownMap.values())
        .filter(u => (u.Time + u.Money) > 0)
        .map(u => ({
          name: u.name,
          value: u.Time + u.Money,
        }));
      setChartData(pieData);

      // Prepare Breakdown Data
      const barData = Array.from(userBreakdownMap.values())
        .filter(u => (u.Time + u.Money) > 0);
      setBreakdownData(barData);

      // Prepare User Grid Data
      const usersStats = users.map(u => ({
        ...u,
        totalSlices: userSlicesMap.get(u.id) || 0,
        equity: total > 0 ? ((userSlicesMap.get(u.id) || 0) / total) * 100 : 0,
      }));
      setUsersWithStats(usersStats);

    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (!user) {
    return null; // AuthProvider handles redirect
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">Slicing Pie</h1>

              <h1 className="text-xl font-bold text-foreground tracking-tight border-l border-border pl-4">
                Smart Gov Project 201
              </h1>

            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 pl-1 pr-3 py-1 rounded-full">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {user.avatar_options ? (
                    <Avatar
                      style={{ width: '100%', height: '100%' }}
                      avatarStyle="Circle"
                      {...user.avatar_options}
                    />
                  ) : user.avatar ? (
                    <img
                      src={pb.files.getUrl(user, user.avatar)}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-xs font-bold text-muted-foreground">
                      {user.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <span className="truncate max-w-[150px]">{user.name || user.email}</span>
              </div>
              {user.role === "admin" && (
                <button
                  onClick={() => router.push("/admin/users")}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Manage Users
                </button>
              )}
              <button
                onClick={() => router.push("/contributions")}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Contributions
              </button>
              <button
                onClick={logout}
                className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <dt className="text-sm font-medium text-muted-foreground">Total Slices Distributed</dt>
            <dd className="mt-2 text-3xl font-bold text-foreground">{stats.totalSlices.toLocaleString()}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <dt className="text-sm font-medium text-muted-foreground">Your Total Slices</dt>
            <dd className="mt-2 text-3xl font-bold text-primary">{stats.userSlices.toLocaleString()}</dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <dt className="text-sm font-medium text-muted-foreground">Your Equity Share</dt>
            <dd className="mt-2 text-3xl font-bold text-foreground">{stats.userEquity.toFixed(2)}%</dd>
          </div>
        </div>

        {/* Analysis Row */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">Pie Velocity (Growth Over Time)</h2>
            <VelocityChart data={velocityData} />
          </div>
          <div className="lg:col-span-1">
            <WhatIfCalculator 
              currentTotalSlices={stats.totalSlices}
              currentUserSlices={stats.userSlices}
              hourlyRate={user.hourly_rate || 0}
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">Current Equity Split</h2>
            <EquityPieChart data={chartData} />
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">Contribution Type Breakdown</h2>
            <ContributionBreakdownChart data={breakdownData} />
          </div>
        </div>

        {/* Team Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">The Team</h2>
            {user.role === "admin" && (
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowTimeModal(true)}
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth shadow-elegant"
                >
                  + Add Time
                </button>
                <button 
                  onClick={() => setShowMoneyModal(true)}
                  className="rounded bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-smooth shadow-sm"
                >
                  + Add Money
                </button>
                <button 
                  onClick={() => setShowImportModal(true)}
                  className="rounded bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-smooth shadow-sm"
                >
                  Import CSV
                </button>
              </div>
            )}
          </div>
          <TeamGrid users={usersWithStats} />
        </div>

        {/* Recent Activity */}
        <ActivityFeed 
          contributions={contributions} 
          headerAction={
            <button 
              onClick={() => router.push("/contributions")}
              className="text-sm text-primary hover:underline"
            >
              View Full Ledger →
            </button>
          }
        />

      </main>

      {showTimeModal && (
        <ContributionForm
          type="time"
          onClose={() => setShowTimeModal(false)}
          onSuccess={fetchData}
        />
      )}

      {showMoneyModal && (
        <ContributionForm
          type="money"
          onClose={() => setShowMoneyModal(false)}
          onSuccess={fetchData}
        />
      )}

      {showImportModal && (
        <ContributionImport
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

