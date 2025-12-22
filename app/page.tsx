"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useTheme } from "@/components/ThemeProvider";
import pb from "@/lib/pocketbase";
import ContributionForm from "@/components/ContributionForm";
import ContributionImport from "@/components/ContributionImport";
import EquityPieChart from "@/components/PieChart";
import ActivityFeed from "@/components/ActivityFeed";
import ContributionBreakdownChart from "@/components/ContributionBreakdownChart";
import VelocityChart from "@/components/VelocityChart";
import WhatIfCalculator from "@/components/WhatIfCalculator";
import GithubContributionGraph from "@/components/GithubContributionGraph";
import { useRouter } from "next/navigation";
import { RecordModel } from "pocketbase";

import Avatar from "@/components/avataaars-lib";

interface Contribution extends RecordModel {
  user: string;
  slices: number;
  multiplier: number;
  created: string;
  date?: string;
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
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data State
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [users, setUsers] = useState<RecordModel[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");

  const fetchData = async () => {
    if (!user) return;

    try {
      const [usersRes, contributionsRes] = await Promise.all([
        pb.collection("users").getFullList({ sort: "-created" }),
        pb.collection("contributions").getFullList<Contribution>({
          expand: "user",
          sort: "created",
        })
      ]);

      setUsers(usersRes);
      setContributions(contributionsRes.reverse()); // Store newest first
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Derived State
  const filteredContributions = useMemo(() => {
    if (selectedUserId === "ALL") return contributions;
    return contributions.filter(c => c.user === selectedUserId);
  }, [contributions, selectedUserId]);

  const globalTotalSlices = useMemo(() => {
    return contributions.reduce((acc, c) => acc + c.slices, 0);
  }, [contributions]);

  const stats = useMemo(() => {
    const totalSlices = filteredContributions.reduce((acc, c) => acc + c.slices, 0);
    
    // If ALL, userSlices is irrelevant or maybe total?
    // If User, userSlices is totalSlices.
    // Let's define what we show.
    
    // If ALL:
    // - Total Slices Distributed (Global)
    // - My Total Slices (Logged In User)
    // - My Equity Share (Logged In User)
    
    // If User Selected:
    // - User's Total Slices
    // - User's Equity Share
    // - User's Hourly Rate (if applicable)

    if (selectedUserId === "ALL") {
        // Global View
        const mySlices = contributions.filter(c => c.user === user?.id).reduce((acc, c) => acc + c.slices, 0);
        return {
            label1: "Total Slices Distributed",
            value1: globalTotalSlices.toLocaleString(),
            label2: "Your Total Slices",
            value2: mySlices.toLocaleString(),
            label3: "Your Equity Share",
            value3: globalTotalSlices > 0 ? ((mySlices / globalTotalSlices) * 100).toFixed(2) + "%" : "0%"
        };
    } else {
        // User View
        const selectedUser = users.find(u => u.id === selectedUserId);
        const userSlices = filteredContributions.reduce((acc, c) => acc + c.slices, 0);
        return {
            label1: "Total Slices",
            value1: userSlices.toLocaleString(),
            label2: "Equity Share",
            value2: globalTotalSlices > 0 ? ((userSlices / globalTotalSlices) * 100).toFixed(2) + "%" : "0%",
            label3: "Hourly Rate",
            value3: selectedUser?.hourly_rate ? `JOD ${selectedUser.hourly_rate}` : "-"
        };
    }
  }, [filteredContributions, contributions, selectedUserId, user, users, globalTotalSlices]);

  const velocityData = useMemo(() => {
    // Calculate velocity based on filtered contributions
    // Sort by date ascending for chart
    const sorted = [...filteredContributions].sort((a, b) => {
        const dateA = new Date(a.date || a.created).getTime();
        const dateB = new Date(b.date || b.created).getTime();
        return dateA - dateB;
    });
    
    const points: { date: string; totalSlices: number }[] = [];
    let runningTotal = 0;

    sorted.forEach(c => {
        runningTotal += c.slices;
        // Use date field if available, fallback to created
        const dateObj = new Date(c.date || c.created);
        const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        
        const lastPoint = points[points.length - 1];
        if (lastPoint && lastPoint.date === date) {
            lastPoint.totalSlices = runningTotal;
        } else {
            points.push({ date, totalSlices: runningTotal });
        }
    });
    return points;
  }, [filteredContributions]);

  const chartData = useMemo(() => {
    // If ALL: Show Equity Split (User vs User)
    // If User: Show Time vs Money Breakdown
    
    if (selectedUserId === "ALL") {
        const userMap = new Map<string, number>();
        contributions.forEach(c => {
            const current = userMap.get(c.user) || 0;
            userMap.set(c.user, current + c.slices);
        });
        
        return Array.from(userMap.entries()).map(([uid, slices]) => {
            const u = users.find(user => user.id === uid);
            return {
                name: u?.name || u?.email || "Unknown",
                value: slices
            };
        }).filter(d => d.value > 0);
    } else {
        const timeSlices = filteredContributions.filter(c => c.multiplier === 2).reduce((acc, c) => acc + c.slices, 0);
        const moneySlices = filteredContributions.filter(c => c.multiplier === 4).reduce((acc, c) => acc + c.slices, 0);
        return [
            { name: "Time", value: timeSlices },
            { name: "Money", value: moneySlices }
        ].filter(d => d.value > 0);
    }
  }, [contributions, filteredContributions, selectedUserId, users]);

  const breakdownData = useMemo(() => {
    // If ALL: Show Stacked Bar of Users (Time vs Money)
    // If User: Maybe show breakdown by month? Or just hide this chart?
    // Let's keep it simple: If User, show same data as Pie but in Bar? 
    // Or maybe show breakdown by contribution type if we had more types.
    // Let's stick to User Breakdown for ALL, and maybe hide for Single User or show something else.
    
    if (selectedUserId === "ALL") {
        const userMap = new Map<string, { Time: number; Money: number; name: string }>();
        users.forEach(u => {
            userMap.set(u.id, { Time: 0, Money: 0, name: u.name || u.email });
        });

        contributions.forEach(c => {
            const entry = userMap.get(c.user);
            if (entry) {
                if (c.multiplier === 4) entry.Money += c.slices;
                else entry.Time += c.slices;
            }
        });

        return Array.from(userMap.values()).filter(u => (u.Time + u.Money) > 0);
    } else {
        // For single user, maybe show breakdown by month?
        // For now, let's just show the single user's bar
        const timeSlices = filteredContributions.filter(c => c.multiplier === 2).reduce((acc, c) => acc + c.slices, 0);
        const moneySlices = filteredContributions.filter(c => c.multiplier === 4).reduce((acc, c) => acc + c.slices, 0);
        const u = users.find(user => user.id === selectedUserId);
        return [{
            name: u?.name || "User",
            Time: timeSlices,
            Money: moneySlices
        }];
    }
  }, [contributions, filteredContributions, selectedUserId, users]);

  const contributionGraphData = useMemo(() => {
    const dataToProcess = selectedUserId === "ALL" ? contributions : filteredContributions;
    
    const dailyMap = new Map<string, number>();
    let maxSlices = 0;
    
    dataToProcess.forEach(c => {
        // Use the explicit contribution date if available, otherwise fallback to created date
        // Use local date string (YYYY-MM-DD) to avoid timezone shifts
        const dateStr = c.date || c.created;
        const date = new Date(dateStr).toLocaleDateString('en-CA');
        const current = dailyMap.get(date) || 0;
        const newVal = current + c.slices;
        dailyMap.set(date, newVal);
        if (newVal > maxSlices) maxSlices = newVal;
    });

    const result: { [year: string]: { date: string; done: number; value: number }[] } = {};

    dailyMap.forEach((slices, date) => {
        const year = date.split('-')[0];
        if (!result[year]) {
            result[year] = [];
        }
        
        // Normalize to 0-10 scale
        // If slices > 0, ensure at least 1
        let normalized = 0;
        if (maxSlices > 0 && slices > 0) {
            normalized = Math.ceil((slices / maxSlices) * 8);
        }

        result[year].push({ date, done: normalized, value: slices });
    });

    // Sort data by date ascending for each year
    Object.keys(result).forEach(year => {
        result[year].sort((a, b) => a.date.localeCompare(b.date));
    });

    return result;
  }, [contributions, filteredContributions, selectedUserId]);

  if (!user) {
    return null; // AuthProvider handles redirect
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Team */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="px-6 py-[17.5px] border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground tracking-tight">Smart Gov Project 201</h1>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Team Members</div>
            
            <button
                onClick={() => setSelectedUserId("ALL")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    selectedUserId === "ALL" 
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                        : "hover:bg-muted text-foreground"
                }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedUserId === "ALL" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                    <span className="font-bold text-sm">ALL</span>
                </div>
                <div className="text-left">
                    <div className="font-medium text-sm">All Team</div>
                    <div className="text-xs opacity-70">{users.length} Members</div>
                </div>
            </button>

            {users.map(u => {
                // Calculate user's total slices for display
                const userSlices = contributions.filter(c => c.user === u.id).reduce((acc, c) => acc + c.slices, 0);
                const equity = globalTotalSlices > 0 ? (userSlices / globalTotalSlices) * 100 : 0;
                
                return (
                    <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            selectedUserId === u.id 
                                ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                                : "hover:bg-muted text-foreground"
                        }`}
                    >
                        <div className="w-12 h-14 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {u.avatar_options ? (
                                <Avatar
                                    // style={{ width: '100%', height: '100%' }}
                                    avatarStyle="Circle"
                                    {...u.avatar_options}
                                />
                            ) : u.avatar ? (
                                <img
                                    src={pb.files.getUrl(u, u.avatar)}
                                    alt={u.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="text-xs font-bold text-muted-foreground">
                                    {u.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div className="text-left min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{u.name || u.email}</div>
                            {u.title && <div className="text-xs text-muted-foreground truncate">{u.title}</div>}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-xs font-bold text-primary">{equity.toFixed(1)}%</div>
                            <div className="text-[10px] text-muted-foreground">{userSlices.toLocaleString()}</div>
                        </div>
                    </button>
                );
            })}
        </div>

        {user.role === "admin" && (<div className="p-4 border-t border-border bg-muted/30">
            <button
                onClick={() => router.push("/admin/users")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors mb-2"
            >
                Manage Users
            </button>
        </div>)}
      </aside>

      {/* Right Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-8 flex-shrink-0 gap-4">
            <div className="flex items-center gap-4 overflow-hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="lg:hidden text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h2 className="text-lg font-semibold text-foreground truncate">
                    {selectedUserId === "ALL" ? "Team Dashboard" : (users.find(u => u.id === selectedUserId)?.name || "User Dashboard")}
                </h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                {user.role === "admin" && (
                    <div className="flex gap-2">
                        <button 
                        onClick={() => setShowTimeModal(true)}
                        className="rounded bg-primary px-2 sm:px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm whitespace-nowrap"
                        >
                        + <span className="hidden sm:inline">Time</span>
                        </button>
                        <button 
                        onClick={() => setShowMoneyModal(true)}
                        className="rounded bg-secondary px-2 sm:px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-smooth shadow-sm whitespace-nowrap"
                        >
                        + <span className="hidden sm:inline">Money</span>
                        </button>
                        <button 
                        onClick={() => setShowImportModal(true)}
                        className="rounded bg-muted px-2 sm:px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-smooth shadow-sm whitespace-nowrap"
                        >
                        <span className="hidden sm:inline">Import</span><span className="sm:hidden">Imp</span>
                        </button>
                    </div>
                )}

                {user.role === "admin" && <div className="h-6 w-px bg-border mx-1 sm:mx-2"></div>}

                <button
                    onClick={() => router.push("/contributions")}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:block"
                >
                    Ledger
                </button>
                <button
                    onClick={() => router.push("/drive")}
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors hidden sm:block"
                >
                    Drive
                </button>
                <button
                    onClick={() => router.push("/contributions")}
                    className="text-foreground hover:text-primary transition-colors sm:hidden"
                    title="Ledger"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                </button>
                <button
                    onClick={() => router.push("/drive")}
                    className="text-foreground hover:text-primary transition-colors sm:hidden"
                    title="Drive"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                </button>

                <div className="relative">
                    <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 pl-1 pr-3 py-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
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
                    <svg className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    </button>

                    {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 py-1 z-50 border border-border">
                        <div className="px-4 py-2 border-b border-border mb-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Theme</p>
                            <div className="flex gap-1 bg-muted/50 p-1 rounded-md">
                                <button 
                                    onClick={() => setTheme("light")}
                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Light
                                </button>
                                <button 
                                    onClick={() => setTheme("dark")}
                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Dark
                                </button>
                                <button 
                                    onClick={() => setTheme("system")}
                                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-all ${theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Auto
                                </button>
                            </div>
                        </div>
                        <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                        >
                        Sign out
                        </button>
                    </div>
                    )}
                </div>
            </div>
        </header>

        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
            {/* User Info Card & Graph */}
            {selectedUserId !== "ALL" ? (() => {
                const selectedUser = users.find(u => u.id === selectedUserId);
                if (!selectedUser) return null;
                return (
                    <div className="rounded-lg border border-border bg-card p-6 shadow-card flex flex-col xl:flex-row items-center gap-8">
                        <div className="flex flex-col sm:flex-row items-center gap-4 flex-shrink-0 xl:max-w-md">
                            <div className="w-30 h-32 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {selectedUser.avatar_options ? (
                                    <Avatar
                                        style={{ width: '100%', height: '100%' }}
                                        avatarStyle="Circle"
                                        {...selectedUser.avatar_options}
                                    />
                                ) : selectedUser.avatar ? (
                                    <img
                                        src={pb.files.getUrl(selectedUser, selectedUser.avatar)}
                                        alt={selectedUser.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-2xl font-bold text-muted-foreground">
                                        {selectedUser.name?.charAt(0).toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="text-center sm:text-left">
                                <h2 className="text-2xl font-bold text-foreground">{selectedUser.name}</h2>
                                {selectedUser.title && <p className="text-base text-muted-foreground">{selectedUser.title}</p>}
                                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Role:</span> <span className="font-medium capitalize text-foreground">{selectedUser.role}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Rate:</span> <span className="font-medium text-foreground">JOD {selectedUser.hourly_rate?.toFixed(2) || "-"}</span>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{selectedUser.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full min-w-0 border-t xl:border-t-0 xl:border-l border-border pt-6 xl:pt-0 xl:pl-8">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contribution Activity</h2>
                            </div>
                            {Object.keys(contributionGraphData).length > 0 ? (
                                <GithubContributionGraph 
                                    key={selectedUserId} 
                                    id={`graph-${selectedUserId}`}
                                    data={contributionGraphData} 
                                />
                            ) : (
                                <div className="w-full h-32 flex items-center justify-center border border-dashed border-border rounded-md bg-muted/20">
                                    <span className="text-muted-foreground font-medium">0 Slices</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })() : (
                <div className="rounded-lg border border-border bg-card pt-7 pb-2 px-10 shadow-card">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Team Contribution Activity</h2>
                    <GithubContributionGraph data={contributionGraphData} />
                </div>
            )}

            {/* Top Stats Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                <dt className="text-sm font-medium text-muted-foreground">{stats.label1}</dt>
                <dd className="mt-2 text-3xl font-bold text-foreground">{stats.value1}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                <dt className="text-sm font-medium text-muted-foreground">{stats.label2}</dt>
                <dd className="mt-2 text-3xl font-bold text-primary">{stats.value2}</dd>
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                <dt className="text-sm font-medium text-muted-foreground">{stats.label3}</dt>
                <dd className="mt-2 text-3xl font-bold text-foreground">{stats.value3}</dd>
            </div>
            </div>

            {/* Analysis Row */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                    {selectedUserId === "ALL" ? "Pie Velocity" : "Contribution Growth"}
                </h2>
                <VelocityChart data={velocityData} />
            </div>
            <div className="lg:col-span-1">
                <WhatIfCalculator 
                currentTotalSlices={globalTotalSlices}
                currentUserSlices={selectedUserId === "ALL" ? (contributions.filter(c => c.user === user.id).reduce((acc, c) => acc + c.slices, 0)) : (filteredContributions.reduce((acc, c) => acc + c.slices, 0))}
                hourlyRate={selectedUserId === "ALL" ? (user.hourly_rate || 0) : (users.find(u => u.id === selectedUserId)?.hourly_rate || 0)}
                />
            </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                    {selectedUserId === "ALL" ? "Current Equity Split" : "Contribution Mix"}
                </h2>
                <EquityPieChart data={chartData} />
            </div>
            <div className="rounded-lg border border-border bg-card p-6 shadow-card">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                    {selectedUserId === "ALL" ? "Contribution Type Breakdown" : "User Breakdown"}
                </h2>
                <ContributionBreakdownChart data={breakdownData} />
            </div>
            </div>

            {/* Recent Activity */}
            <ActivityFeed 
            contributions={filteredContributions} 
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
      </div>

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

