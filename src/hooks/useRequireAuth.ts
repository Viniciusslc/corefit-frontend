"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/apiFetch";
import { clearStoredToken, decodeJwtPayload, getStoredToken } from "@/lib/auth-session";

export function useRequireAuth() {
  const router = useRouter();

  // ✅ valida token ao montar
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;

    if (typeof exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (exp <= nowSec) {
        clearStoredToken();
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
        clearStoredToken();
        router.replace("/login");
        return true;
      }

      // fallback: mensagens comuns
      const msg =
        typeof err === "object" && err && "message" in err
          ? String((err as any).message)
          : "";

      if (msg.toLowerCase().includes("token") && msg.toLowerCase().includes("exp")) {
        clearStoredToken();
        router.replace("/login");
        return true;
      }

      return false;
    },
    [router]
  );

  const logout = useCallback(() => {
    clearStoredToken();
    router.replace("/login");
  }, [router]);

  const token = getStoredToken();

  // ✅ AGORA SIM retorna um objeto (não void)
  return { token, logout, handleAuthError };
}
