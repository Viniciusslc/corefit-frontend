"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/services/api";

function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;

  if (typeof exp !== "number") return false; // se não tiver exp, não bloqueia
  const nowSec = Math.floor(Date.now() / 1000);
  return exp <= nowSec;
}

type UseRequireAuthReturn = {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  handleAuthError: (err: unknown) => boolean;
};

export function useRequireAuth(): UseRequireAuthReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const isAuthenticated = useMemo(() => !!token, [token]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("token");
    } catch {}

    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [router, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const t = localStorage.getItem("token");
    if (!t) {
      setToken(null);
      logout();
      return;
    }

    if (isTokenExpired(t)) {
      try {
        localStorage.removeItem("token");
      } catch {}
      setToken(null);
      logout();
      return;
    }

    setToken(t);
  }, [logout]);

  const handleAuthError = useCallback(
    (err: unknown) => {
      // ApiError do nosso apiFetch
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          logout();
          return true;
        }
        return false;
      }

      // fallback: alguns lugares podem jogar { status: number }
      const maybeStatus = (err as any)?.status;
      if (maybeStatus === 401 || maybeStatus === 403) {
        logout();
        return true;
      }

      return false;
    },
    [logout]
  );

  return { token, isAuthenticated, logout, handleAuthError };
}