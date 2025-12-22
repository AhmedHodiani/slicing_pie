"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import AvatarPicker, { AvatarConfig, DEFAULT_AVATAR_CONFIG } from "./AvatarPicker";

interface UserFormProps {
  user?: RecordModel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserForm({ user, onClose, onSuccess }: UserFormProps) {
  const [name, setName] = useState(user?.name || "");
  const [title, setTitle] = useState(user?.title || "");
  const [avatarType, setAvatarType] = useState<"upload" | "generate">(user?.avatar_options ? "generate" : "upload");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(user?.avatar_options || DEFAULT_AVATAR_CONFIG);
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState(user?.role || "viewer");
  const [salary, setSalary] = useState(user?.market_salary_monthly?.toString() || "");
  const [hourlyRate, setHourlyRate] = useState(user?.hourly_rate?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!user;

  const calculateHourly = (monthlySalary: number) => {
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
    setIsSubmitting(true);
    setError("");

    if (!isEdit && avatarType === "upload" && !avatar) {
      setError("Avatar is required for new users.");
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("name", name);
      formData.append("title", title);
      formData.append("role", role);
      if (salary) formData.append("market_salary_monthly", salary);
      if (hourlyRate) formData.append("hourly_rate", hourlyRate);
      
      if (avatarType === "upload" && avatar) {
        formData.append("avatar", avatar);
        // Clear avatar_options if uploading a file
        formData.append("avatar_options", "");
      } else if (avatarType === "generate") {
        formData.append("avatar_options", JSON.stringify(avatarConfig));
        // We can't easily clear the file field in PB via API without sending null, 
        // but FormData doesn't support null well. 
        // Usually sending empty string or not sending it keeps it.
        // If we want to remove the file, we might need to handle it differently, 
        // but for now let's assume avatar_options takes precedence in UI.
      }

      if (!isEdit) {
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);
        formData.append("emailVisibility", "true");
      } else if (password) {
        // Allow password update if provided during edit
        if (password !== passwordConfirm) {
          throw new Error("Passwords do not match");
        }
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);
      }

      if (isEdit) {
        await pb.collection("users").update(user.id, formData);
      } else {
        await pb.collection("users").create(formData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.isAbort) return;
      console.error(err);
      setError(err.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 shadow-elegant max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">{isEdit ? "Edit User" : "Create User"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Position / Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CEO, Developer"
                className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              />
            </div>

            {!isEdit && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Confirm Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  />
                </div>
              </>
            )}

            {isEdit && (
              <div>
                  <label className="block text-sm font-medium text-foreground">New Password (Optional)</label>
                  <input
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                  />
                  {password && (
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="mt-2 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    />
                  )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              >
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Monthly Salary (JOD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={salary}
                  onChange={handleSalaryChange}
                  className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">Hourly Rate (JOD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Avatar</label>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setAvatarType("generate")}
                  className={`flex-1 py-2 text-sm font-medium rounded border ${
                    avatarType === "generate"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted"
                  }`}
                >
                  Generate Avatar
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarType("upload")}
                  className={`flex-1 py-2 text-sm font-medium rounded border ${
                    avatarType === "upload"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-muted"
                  }`}
                >
                  Upload Image
                </button>
              </div>

              {avatarType === "generate" ? (
                <AvatarPicker value={avatarConfig} onChange={setAvatarConfig} />
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAvatar(e.target.files[0]);
                      }
                    }}
                    className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {!isEdit && <p className="text-xs text-muted-foreground mt-1">Required for new users</p>}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {error && <div className="text-sm text-destructive mb-4">{error}</div>}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-smooth"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
