"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiFetch";

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

function getTokenSafe(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function clearTokenSafe() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export function useRequireAuth() {
  const router = useRouter();

  // ✅ valida token ao montar
  useEffect(() => {
    const token = getTokenSafe();
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;

    if (typeof exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (exp <= nowSec) {
        clearTokenSafe();
        router.replace("/login");
        return;
      }
    }
  }, [router]);

  // ✅ helper: trata erro 401/403 e redireciona
  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      // ApiError do seu apiFetch.ts
      const status =
        err instanceof ApiError
          ? err.status
          : typeof err === "object" && err && "status" in err
          ? (err as any).status
          : undefined;

      if (status === 401 || status === 403) {
        clearTokenSafe();
        router.replace("/login");
        return true;
      }

      // fallback: mensagens comuns
      const msg =
        typeof err === "object" && err && "message" in err
          ? String((err as any).message)
          : "";

      if (msg.toLowerCase().includes("token") && msg.toLowerCase().includes("exp")) {
        clearTokenSafe();
        router.replace("/login");
        return true;
      }

      return false;
    },
    [router]
  );

  const logout = useCallback(() => {
    clearTokenSafe();
    router.replace("/login");
  }, [router]);

  const token = getTokenSafe();

  // ✅ AGORA SIM retorna um objeto (não void)
  return { token, logout, handleAuthError };
}