export type AuthSession = {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  plan?: string;
  isInternal?: boolean;
  subscriptionStatus?: string;
  billingProvider?: string;
  planSource?: string;
  hasPremiumAccess?: boolean;
  exp?: number;
};

export function decodeJwtPayload(token: string): AuthSession | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(json) as AuthSession;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export function getAuthSession(): AuthSession | null {
  const token = getStoredToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

export function hasPremiumAccessFromSession(session: AuthSession | null | undefined) {
  return Boolean(session?.hasPremiumAccess);
}
