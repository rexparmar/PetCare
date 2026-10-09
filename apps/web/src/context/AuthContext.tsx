import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { api, ApiError } from "../services/api";
import type { User } from "../types/api";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/auth/me"),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 401) && count < 1,
  });
  const user =
    query.error instanceof ApiError && query.error.status === 401
      ? null
      : (query.data ?? null);
  const value: AuthContextValue = {
    user,
    isLoading: query.isLoading,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    clear: () => queryClient.setQueryData(["me"], null),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
