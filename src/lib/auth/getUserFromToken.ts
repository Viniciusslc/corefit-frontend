// src/lib/auth/getUserFromToken.ts

type TokenPayload = {
  sub: string;
  email?: string;
  name?: string;
  exp?: number;
};

export function getUserFromToken(): TokenPayload | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}

export function getFirstName(fullName?: string) {
  if (!fullName) return "";
  return fullName.trim().split(" ")[0];
}
