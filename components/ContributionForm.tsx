"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { useAuth } from "./AuthProvider";
import { RecordModel } from "pocketbase";

interface ContributionFormProps {
  type: "time" | "money";
  contribution?: RecordModel;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContributionForm({ type, contribution, onClose, onSuccess }: ContributionFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState(contribution?.amount?.toString() || "");
  const [description, setDescription] = useState(contribution?.description || "");
  const [date, setDate] = useState(contribution?.date ? new Date(contribution.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Admin specific state
  const [users, setUsers] = useState<RecordModel[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      // Fetch all users for the dropdown
      pb.collection("users").getFullList()
        .then((records) => {
          setUsers(records);
          // Default to current user if in list, otherwise first user
          if (contribution) {
            setSelectedUserId(contribution.user);
          } else if (records.length > 0) {
            setSelectedUserId(user.id);
          }
        })
        .catch((err) => {
          if (err.isAbort) return;
          console.error(err);
        });
    } else if (user) {
      setSelectedUserId(user.id);
    }
  }, [user, contribution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUserId) return;

    // Get the target user (either current user or selected user)
    const targetUser = users.find(u => u.id === selectedUserId) || user;

    // Validation for Time contribution
    if (type === "time" && (!targetUser.hourly_rate || targetUser.hourly_rate <= 0)) {
      setError("Selected user has no hourly rate set.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const numAmount = parseFloat(amount);
      let fmv = 0;
      let multiplier = 0;

      if (type === "time") {
        fmv = numAmount * (targetUser.hourly_rate || 0);
        multiplier = 2;
      } else {
        fmv = numAmount;
        multiplier = 4;
      }

      const slices = fmv * multiplier;

      const data = {
        user: selectedUserId,
        category: type,
        amount: numAmount,
        fair_market_value: fmv,
        multiplier: multiplier,
        slices: slices,
        description: description,
        date: new Date(date).toISOString(),
      };

      if (contribution) {
        await pb.collection("contributions").update(contribution.id, data);
      } else {
        await pb.collection("contributions").create(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to submit contribution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-elegant">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground capitalize">{contribution ? "Edit" : "Add"} {type}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-foreground">User</label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} {u.id === user.id ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">
              {type === "time" ? "Hours" : "Amount (JOD)"}
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            />
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
              disabled={isSubmitting}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-smooth"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
