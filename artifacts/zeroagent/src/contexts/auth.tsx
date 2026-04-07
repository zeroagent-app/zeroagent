import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "owner" | "user";
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true, refetch: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, refetch } = useGetMe({ query: { retry: false } });
  const user = data as User | undefined;
  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
