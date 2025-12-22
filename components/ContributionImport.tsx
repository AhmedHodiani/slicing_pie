"use client";

import { useState } from "react";
import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import Avatar from "./avataaars-lib";

interface ContributionImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  originalIndex: number;
  date: string;
  userRaw: string;
  user?: RecordModel;
  description: string;
  hours: number;
  rate: number;
  fmv: number;
  slices: number;
  avatar_options: any;
  isValid: boolean;
  errors: string[];
}

export default function ContributionImport({ onClose, onSuccess }: ContributionImportProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const [filterUser, setFilterUser] = useState<string>("ALL");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const parseCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsProcessing(true);
    setError("");

    try {
      const text = await file.text();
      const lines = text.split("\n");
      if (lines.length < 2) {
        setError("File is empty or invalid");
        setIsProcessing(false);
        return;
      }

      // Parse headers
      const headerLine = lines[0];
      const headers: string[] = [];
      let inQuote = false;
      let current = "";
      for (let char of headerLine) {
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          headers.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      headers.push(current.trim().replace(/^"|"$/g, ""));

      const users = await pb.collection("users").getFullList();
      const rows: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse row
        const row: string[] = [];
        inQuote = false;
        current = "";
        for (let char of line) {
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            row.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        row.push(current);

        const getValue = (headerName: string) => {
            const index = headers.indexOf(headerName);
            if (index === -1) return "";
            return row[index]?.trim().replace(/^"|"$/g, "") || "";
        };

        const description = getValue("Description");
        const task = getValue("Task");
        const project = getValue("Project");
        const userName = getValue("User");
        const start = getValue("Start");
        const durationDecimal = getValue("Duration (decimal)");

        if (!userName) continue; // Skip empty rows

        const errors: string[] = [];
        
        // Find user
        const targetUser = users.find(u => 
            u.name === userName || 
            u.email === userName || 
            (u.name && u.name.toLowerCase() === userName.toLowerCase())
        );

        if (!targetUser) {
            errors.push(`User '${userName}' not found`);
        } else if (!targetUser.hourly_rate) {
            errors.push(`User has no hourly rate`);
        }

        const amount = parseFloat(durationDecimal);
        if (isNaN(amount) || amount <= 0) {
             errors.push(`Invalid duration: ${durationDecimal}`);
        }

        const roundedAmount = Math.round(amount * 100) / 100;

        const rate = targetUser?.hourly_rate || 0;
        const fmv = roundedAmount * rate;
        const multiplier = 2;
        const slices = Math.round(fmv * multiplier * 100) / 100;
		const avatar_options = targetUser?.avatar_options || null;
        
        const fullDescription = [description, task, project].filter(Boolean).join(" - ");
        const date = start ? new Date(start).toISOString() : new Date().toISOString();

        rows.push({
            originalIndex: i,
            date,
            userRaw: userName,
            user: targetUser,
            description: fullDescription,
            hours: roundedAmount,
            rate,
            fmv,
            slices,
			avatar_options,
            isValid: errors.length === 0,
            errors
        });
      }

      setParsedRows(rows);
      setStep('review');

    } catch (err: any) {
      console.error(err);
      setError("Failed to parse file: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    setStep('importing');
    setImportProgress({ current: 0, total: validRows.length, success: 0, fail: 0 });

    let success = 0;
    let fail = 0;

    for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        try {
            await pb.collection("contributions").create({
                user: row.user!.id,
                category: "time",
                amount: row.hours,
                fair_market_value: row.fmv,
                multiplier: 2,
                slices: row.slices,
                description: row.description,
                date: row.date,
            });
            success++;
        } catch (err) {
            console.error(err);
            fail++;
        }
        setImportProgress(prev => ({ ...prev, current: i + 1, success, fail }));
    }

    setTimeout(() => {
        onSuccess();
        onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`w-full ${step === 'review' ? 'max-w-7xl' : 'max-w-md'} rounded-lg border border-border bg-card p-6 shadow-elegant transition-all duration-300`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Import Time CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        {step === 'upload' && (
            <form onSubmit={parseCSV} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground">
                Select CSV File
                </label>
                <input
                type="file"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                Expected columns: Description, Task, Project, User, Start, Duration (decimal)
                </p>
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <div className="flex justify-end gap-3 pt-4">
                <button
                type="button"
                onClick={onClose}
                className="rounded px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-smooth"
                >
                Cancel
                </button>
                <button
                type="submit"
                disabled={isProcessing || !file}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
                >
                {isProcessing ? "Parsing..." : "Preview Import"}
                </button>
            </div>
            </form>
        )}

        {step === 'review' && (
            <div className="space-y-4">
                {/* Stats Bar */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="rounded bg-muted p-3">
                        <div className="text-xs text-muted-foreground uppercase font-bold">Total Hours</div>
                        <div className="text-xl font-bold text-foreground">
                            {parsedRows.filter(r => r.isValid).reduce((acc, r) => acc + r.hours, 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="rounded bg-muted p-3">
                        <div className="text-xs text-muted-foreground uppercase font-bold">Total Slices</div>
                        <div className="text-xl font-bold text-primary">
                            {parsedRows.filter(r => r.isValid).reduce((acc, r) => acc + r.slices, 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="rounded bg-muted p-3">
                        <div className="text-xs text-muted-foreground uppercase font-bold">Valid Entries</div>
                        <div className="text-xl font-bold text-green-600">
                            {parsedRows.filter(r => r.isValid).length} <span className="text-sm text-muted-foreground">/ {parsedRows.length}</span>
                        </div>
                    </div>
                    <div className="rounded bg-muted p-3">
                        <div className="text-xs text-muted-foreground uppercase font-bold">Unique Users</div>
                        <div className="text-xl font-bold text-foreground">
                            {new Set(parsedRows.map(r => r.user?.id).filter(Boolean)).size}
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded border border-border">
                    <span className="text-sm font-medium text-muted-foreground">Filter by User:</span>
                    <select 
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="bg-background border border-input rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="ALL">All Users</option>
                        {Array.from(new Set(parsedRows.map(r => r.user?.name || r.userRaw).filter(Boolean))).sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <div className="max-h-[60vh] overflow-y-auto rounded border border-border">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th className="p-2 font-medium text-muted-foreground">Date</th>
                                <th className="p-2 font-medium text-muted-foreground">User</th>
                                <th className="p-2 font-medium text-muted-foreground">Description</th>
                                <th className="p-2 font-medium text-muted-foreground text-right">Hours</th>
                                <th className="p-2 font-medium text-muted-foreground text-right">Rate</th>
                                <th className="p-2 font-medium text-muted-foreground text-right">Slices</th>
                                <th className="p-2 font-medium text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {parsedRows
                                .filter(row => filterUser === "ALL" || (row.user?.name || row.userRaw) === filterUser)
                                .map((row, i) => (
                                <tr key={i} className={row.isValid ? "hover:bg-muted/50" : "bg-red-500/5 hover:bg-red-500/10"}>
                                    <td className="p-2 whitespace-nowrap text-muted-foreground">
                                        {new Date(row.date).toLocaleDateString()}
                                    </td>
                                    <td className="p-2 font-medium">
                                        {row.user ? (
                                            <div className="flex items-center gap-2">
												<div className="flex-shrink-0 mr-4 h-8 w-8 rounded-full overflow-hidden flex items-center justify-center">
													{row.avatar_options ? (
													<Avatar
														style={{ width: '100%', height: '100%' }}
														avatarStyle="Circle"
														{...row.avatar_options}
													/>
													) : row.user?.avatar ? (
													<img
														src={pb.files.getUrl(row.user, row.user.avatar)}
														alt={row.user.name}
														className="h-full w-full object-cover"
													/>
													) : (
													<div className="text-xs font-bold text-muted-foreground">
														{row.user?.name?.charAt(0).toUpperCase() || "?"}
													</div>
													)}
												</div>
                                                {row.user.name}
                                            </div>
                                        ) : (
                                            <span className="text-destructive">{row.userRaw}</span>
                                        )}
                                    </td>
                                    <td className="p-2 max-w-[200px] truncate" title={row.description}>
                                        {row.description}
                                    </td>
                                    <td className="p-2 text-right font-mono">{row.hours.toFixed(2)}</td>
                                    <td className="p-2 text-right font-mono text-muted-foreground">JOD {row.rate}</td>
                                    <td className="p-2 text-right font-mono font-bold text-primary">{row.slices.toFixed(2)}</td>
                                    <td className="p-2">
                                        {row.isValid ? (
                                            <span className="text-green-600 text-xs">Ready</span>
                                        ) : (
                                            <span className="text-destructive text-xs font-medium">
                                                {row.errors[0]}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        onClick={() => setStep('upload')}
                        className="rounded px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-smooth"
                    >
                        Back
                    </button>
                    <button
                        onClick={executeImport}
                        disabled={parsedRows.filter(r => r.isValid).length === 0}
                        className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
                    >
                        Import {parsedRows.filter(r => r.isValid).length} Entries
                    </button>
                </div>
            </div>
        )}

        {step === 'importing' && (
            <div className="py-8 text-center space-y-4">
                <div className="text-lg font-medium">Importing Contributions...</div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    ></div>
                </div>
                <div className="text-sm text-muted-foreground">
                    Processed {importProgress.current} of {importProgress.total}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
