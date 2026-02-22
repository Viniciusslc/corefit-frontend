"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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

export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;

    // se tem exp e expirou, sai
    if (typeof exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (exp <= nowSec) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }
    }
  }, [router]);
}
