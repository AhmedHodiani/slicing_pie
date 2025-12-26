"use client";

import { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbase";
import { useRouter, usePathname } from "next/navigation";
import { AuthModel } from "pocketbase";

interface AuthContextType {
  user: AuthModel | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active session
    setUser(pb.authStore.model);
    setIsLoading(false);

    // Listen to auth state changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update last_active timestamp periodically
  useEffect(() => {
    if (!user?.id) return;

    const updateLastActive = async () => {
      try {
        await pb.collection("users").update(user.id, {
          last_active: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Failed to update last_active:", err);
      }
    };

    // Update immediately on mount
    updateLastActive();

    // Update every 60 seconds
    const interval = setInterval(updateLastActive, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const login = async (email: string, pass: string) => {
    await pb.collection("users").authWithPassword(email, pass);
    router.push("/");
  };

  const logout = () => {
    pb.authStore.clear();
    router.push("/login");
  };

  // Protect routes
  useEffect(() => {
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
