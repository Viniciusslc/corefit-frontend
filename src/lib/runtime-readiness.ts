type ReadinessCheck = {
  ok: boolean;
  note: string;
};

function hasValue(value: string | undefined) {
  return String(value ?? "").trim().length > 0;
}

export function getFrontendRuntimeStatus() {
  const environment = process.env.NODE_ENV || "development";

  const checks = {
    apiConfigured: {
      ok: hasValue(process.env.NEXT_PUBLIC_API_URL) || environment !== "production",
      note:
        environment === "production"
          ? "NEXT_PUBLIC_API_URL precisa apontar para o backend publicado."
          : "Em ambiente local o frontend aceita fallback do backend local.",
    },
    googleConfigured: {
      ok: hasValue(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
      note: "Necessario para login Google real.",
    },
  } satisfies Record<string, ReadinessCheck>;

  const coreReady = checks.apiConfigured.ok;
  const fullProductionReady = coreReady && checks.googleConfigured.ok;

  return {
    service: "corefit-frontend",
    environment,
    timestamp: new Date().toISOString(),
    status: coreReady ? "ready" : "not-ready",
    coreReady,
    fullProductionReady,
    checks,
  };
}

