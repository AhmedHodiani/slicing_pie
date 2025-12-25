"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
      if (changePasswordMode) {
        // User wants to change password after login
        setShowChangePasswordModal(true);
      }
    } catch (err: any) {
      if (err.isAbort) return;
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background relative overflow-hidden">
      <div className="w-full max-w-md z-10 px-4">
        <div className="bg-card border border-border shadow-elegant">
          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">Smart Gov Project 201</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Slicing Pie Equity Calculator
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@company.com"
                      className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordMode(true);
                        setError("Please sign in with your current password, then you can change it.");
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Need to change password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="block w-full border border-input bg-background px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className={`${changePasswordMode ? 'bg-primary/10 border-primary/20' : 'bg-destructive/10 border-destructive/20'} border p-3 flex items-start gap-3`}>
                  <svg className={`w-5 h-5 ${changePasswordMode ? 'text-primary' : 'text-destructive'} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={changePasswordMode ? "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <p className={`text-sm ${changePasswordMode ? 'text-primary' : 'text-destructive'} font-medium`}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="relative flex w-full items-center justify-center bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 uppercase tracking-wide"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-muted/30 px-8 py-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Protected by Smart Gov Project 201 Security
            </p>
          </div>
        </div>
      </div>

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => {
            setShowChangePasswordModal(false);
            setChangePasswordMode(false);
          }}
          onSuccess={() => {
            setShowChangePasswordModal(false);
            setChangePasswordMode(false);
            setError("");
            alert("Password changed successfully!");
          }}
        />
      )}
    </div>
  );
}
