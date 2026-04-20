"use client";

import { useEffect, useState } from "react";

import { getAuthSession, hasPremiumAccessFromSession, type AuthSession } from "@/lib/auth-session";

function readSession() {
  return getAuthSession();
}

export function usePremiumAccess() {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  useEffect(() => {
    function refreshSession() {
      setSession(readSession());
    }

    refreshSession();
    window.addEventListener("focus", refreshSession);
    window.addEventListener("storage", refreshSession);

    return () => {
      window.removeEventListener("focus", refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, []);

  const hasPremiumAccess = hasPremiumAccessFromSession(session);

  return {
    session,
    hasPremiumAccess,
    isFreeUser: !hasPremiumAccess,
  };
}
