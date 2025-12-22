"use client";

import { useState, useEffect } from "react";
import pb from "@/lib/pocketbase";
import { RecordModel } from "pocketbase";
import UserForm from "@/components/UserForm";
import Link from "next/link";
import Avatar from "@/components/avataaars-lib";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<RecordModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<RecordModel | undefined>(undefined);

  const fetchUsers = async () => {
    try {
      const records = await pb.collection("users").getFullList({
        sort: "-created",
      });
      setUsers(records);
    } catch (err: any) {
      if (err.isAbort) return;
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (user: RecordModel) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await pb.collection("users").delete(id);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleFormSuccess = () => {
    fetchUsers();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading users...</div>;
  }

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
                User Management
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-smooth shadow-sm"
              >
                + Add User
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-elegant">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Monthly Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground flex items-center gap-3">
                    <div className="flex-shrink-0 mr-4 h-10 w-10 rounded-full overflow-hidden flex items-center justify-center">
                      {user?.avatar_options ? (
                        <Avatar
                        style={{ width: '100%', height: '100%' }}
                        avatarStyle="Circle"
                        {...user.avatar_options}
                        />
                      ) : user?.avatar ? (
                        <img
                        src={pb.files.getUrl(user, user.avatar)}
                        alt={user.name}
                        className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-sm font-bold text-muted-foreground">
                          {user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    ${user.market_salary_monthly?.toLocaleString() || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    ${user.hourly_rate?.toFixed(2) || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.created).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="mr-4 text-primary hover:text-primary/80"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isFormOpen && (
        <UserForm
          user={editingUser}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
