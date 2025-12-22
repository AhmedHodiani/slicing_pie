"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { useAuth } from "@/components/AuthProvider";
import { RecordModel } from "pocketbase";
import Avatar from "@/components/avataaars-lib";
import ContributionForm from "@/components/ContributionForm";
import ContributionImport from "@/components/ContributionImport";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Contribution extends RecordModel {
  user: string;
  category: "time" | "money";
  amount: number;
  fair_market_value: number;
  multiplier: number;
  slices: number;
  description: string;
  date: string;
  expand?: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar: string;
      avatar_options?: any;
    };
  };
}

export default function ContributionsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  // Data State
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [users, setUsers] = useState<RecordModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contribution | 'userName'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, contributionsRes] = await Promise.all([
        pb.collection("users").getFullList({ sort: "name" }),
        pb.collection("contributions").getFullList<Contribution>({
          expand: "user",
          sort: "-date",
        }),
      ]);
      setUsers(usersRes);
      setContributions(contributionsRes);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Derived State: Filtered & Sorted Data
  const filteredData = useMemo(() => {
    return contributions.filter((c) => {
      // Search
      const matchesSearch = 
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.expand?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // User
      const matchesUser = selectedUser === "ALL" || c.user === selectedUser;

      // Category
      const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;

      // Date Range
      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = matchesDate && new Date(c.date) >= new Date(dateRange.start);
      }
      if (dateRange.end) {
        matchesDate = matchesDate && new Date(c.date) <= new Date(dateRange.end);
      }

      return matchesSearch && matchesUser && matchesCategory && matchesDate;
    }).sort((a, b) => {
      const aValue = sortConfig.key === 'userName' ? (a.expand?.user?.name || '') : a[sortConfig.key];
      const bValue = sortConfig.key === 'userName' ? (b.expand?.user?.name || '') : b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contributions, searchQuery, selectedUser, selectedCategory, dateRange, sortConfig]);

  // Derived State: Stats
  const stats = useMemo(() => {
    const totalSlices = filteredData.reduce((acc, c) => acc + c.slices, 0);
    const totalFMV = filteredData.reduce((acc, c) => acc + c.fair_market_value, 0);
    const totalHours = filteredData.filter(c => c.category === 'time').reduce((acc, c) => acc + c.amount, 0);
    const totalCash = filteredData.filter(c => c.category === 'money').reduce((acc, c) => acc + c.amount, 0);
    
    return { totalSlices, totalFMV, totalHours, totalCash, count: filteredData.length };
  }, [filteredData]);

  // Derived State: Chart Data
  const chartData = useMemo(() => {
    const userMap = new Map<string, { name: string; slices: number; color: string }>();
    
    // Colors for chart
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    filteredData.forEach(c => {
      const userName = c.expand?.user?.name || c.expand?.user?.email || 'Unknown';
      const current = userMap.get(c.user) || { name: userName, slices: 0, color: colors[userMap.size % colors.length] };
      current.slices += c.slices;
      userMap.set(c.user, current);
    });

    return Array.from(userMap.values()).sort((a, b) => b.slices - a.slices);
  }, [filteredData]);

  const handleSort = (key: keyof Contribution | 'userName') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push("/")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-foreground tracking-tight border-l border-border pl-4">
                Contributions Ledger
              </h1>
            </div>
            <div className="flex items-center gap-3">
               {user.role === "admin" && (
                <>
                  <button 
                    onClick={() => setShowTimeModal(true)}
                    className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm"
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Filters & Controls */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Search</label>
                    <input 
                        type="text" 
                        placeholder="Search description or user..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* User Filter */}
                <div className="min-w-[150px]">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">User</label>
                    <select 
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="ALL">All Users</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                    </select>
                </div>

                {/* Category Filter */}
                <div className="min-w-[150px]">
                    <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Category</label>
                    <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="time">Time</option>
                        <option value="money">Money</option>
                    </select>
                </div>

                {/* Date Range */}
                <div className="flex gap-2">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">From</label>
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">To</label>
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total Slices</div>
                <div className="text-2xl font-bold text-primary mt-1">{stats.totalSlices.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total FMV</div>
                <div className="text-2xl font-bold mt-1">JOD {stats.totalFMV.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total Hours</div>
                <div className="text-2xl font-bold mt-1">{stats.totalHours.toFixed(2)}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Total Cash</div>
                <div className="text-2xl font-bold mt-1">JOD {stats.totalCash.toLocaleString()}</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">Entries</div>
                <div className="text-2xl font-bold mt-1">{stats.count}</div>
            </div>
        </div>

        {/* Bulk Actions */}
        {/* Removed */}

        {/* Chart & Table Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Right Column: Table */}
            <div className="lg:col-span-3 bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted border-b border-border">
                            <tr>
                                <th 
                                    className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort('date')}
                                >
                                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                    className="p-3 font-medium cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort('userName')}
                                >
                                    User {sortConfig.key === 'userName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 font-medium">Description</th>
                                <th 
                                    className="p-3 font-medium text-right cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort('amount')}
                                >
                                    Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="p-3 font-medium text-right">Mult.</th>
                                <th 
                                    className="p-3 font-medium text-right cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSort('slices')}
                                >
                                    Slices {sortConfig.key === 'slices' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading contributions...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground">No contributions found matching your filters.</td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                                            {new Date(row.date).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center bg-muted flex-shrink-0">
                                                    {row.expand?.user?.avatar_options ? (
                                                        <Avatar
                                                            style={{ width: '100%', height: '100%' }}
                                                            avatarStyle="Circle"
                                                            {...row.expand.user.avatar_options}
                                                        />
                                                    ) : row.expand?.user?.avatar ? (
                                                        <img
                                                            src={pb.files.getUrl(row.expand.user, row.expand.user.avatar)}
                                                            alt={row.expand.user.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="text-[10px] font-bold text-muted-foreground">
                                                            {row.expand?.user?.name?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium truncate max-w-[120px]" title={row.expand?.user?.name}>
                                                    {row.expand?.user?.name || 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 max-w-[200px] truncate" title={row.description}>
                                            <div className="flex flex-col">
                                                <span>{row.description}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{row.category}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-mono">
                                            {row.category === 'money' ? `JOD ${row.amount.toLocaleString()}` : `${row.amount.toFixed(2)}h`}
                                        </td>
                                        <td className="p-3 text-right font-mono text-muted-foreground">
                                            x{row.multiplier}
                                        </td>
                                        <td className="p-3 text-right font-mono font-bold text-primary">
                                            {row.slices.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bulk Actions */}
                {/* Removed */}
            </div>
        </div>

      </main>

      {/* Modals */}
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
