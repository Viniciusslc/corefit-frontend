// src/lib/apiFetch.ts

export class ApiError extends Error {
  status: number;
  url: string;
  data?: any;

  constructor(message: string, status: number, url: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.data = data;
  }
}

export type ApiFetchInit = Omit<RequestInit, "body"> & {
  body?: any;
  timeoutMs?: number;
};

function getApiUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function normalizePath(path: string) {
  if (!path.startsWith("/")) return `/${path}`;
  return path;
}

function isFormData(body: any) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

export async function apiFetch<T = any>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const url = `${getApiUrl()}${normalizePath(path)}`;

  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let bodyToSend = init.body;

  if (bodyToSend != null && !isFormData(bodyToSend) && typeof bodyToSend !== "string") {
    bodyToSend = JSON.stringify(bodyToSend);
  }

  if (bodyToSend != null && typeof bodyToSend === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ✅ Timeout real
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // ✅ não vazar timeoutMs pro fetch
  const { timeoutMs: _timeoutMs, ...fetchInit } = init;

  let res: Response;

  try {
    res = await fetch(url, {
      ...fetchInit,
      headers,
      body: bodyToSend,
      cache: fetchInit.cache ?? "no-store",
      mode: "cors",
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === "AbortError") {
      throw new ApiError(`Timeout (${timeoutMs}ms) ao acessar API`, 408, url);
    }

    throw new ApiError("Falha de rede ao acessar API", 0, url);
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 204) return null as T;

  const text = await res.text();

  let data: any = null;
  if (text && text.trim() !== "") {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(", ") : data?.message) ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      `Erro ${res.status}`;

    throw new ApiError(message, res.status, url, data);
  }

  return data as T;
}
