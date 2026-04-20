const baseUrl = (process.env.COREFIT_FRONTEND_URL || "http://localhost:3001").replace(/\/$/, "");
const strict = process.argv.includes("--strict");
const retries = Number(process.env.COREFIT_SMOKE_RETRIES || 10);
const retryDelayMs = Number(process.env.COREFIT_SMOKE_DELAY_MS || 1500);
const requestTimeoutMs = Number(process.env.COREFIT_SMOKE_TIMEOUT_MS || 5000);
const warmupDelayMs = Number(process.env.COREFIT_SMOKE_WARMUP_MS || 0);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function read(pathname, acceptJson = true) {
  let lastError = null;
  let lastResult = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${pathname}`, {
        signal: AbortSignal.timeout(requestTimeoutMs),
        headers: acceptJson ? { Accept: "application/json" } : {},
      });

      const text = await response.text();
      let data = text;

      if (acceptJson) {
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          data = text;
        }
      }

      lastResult = {
        ok: response.ok,
        status: response.status,
        data,
        attempt,
      };

      if (response.ok) {
        return lastResult;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await sleep(retryDelayMs);
    }
  }

  if (lastResult) {
    return lastResult;
  }

  return {
    ok: false,
    status: 0,
    data: lastError instanceof Error ? lastError.message : "fetch failed",
    attempt: retries,
  };
}

function printResult(label, result) {
  const status = result.ok ? "OK" : "FAIL";
  console.log(`${status.padEnd(5)} ${label} -> HTTP ${result.status} (tentativa ${result.attempt}/${retries})`);
}

async function main() {
  console.log(`Corefit frontend smoke check em ${baseUrl}`);
  console.log(`politica: ${retries} tentativa(s), ${retryDelayMs}ms entre tentativas, timeout ${requestTimeoutMs}ms`);

  if (warmupDelayMs > 0) {
    console.log(`aguardando warmup inicial de ${warmupDelayMs}ms...`);
    await sleep(warmupDelayMs);
  }

  const home = await read("/", false);
  const login = await read("/login", false);
  const plans = await read("/planos", false);
  const health = await read("/api/health");
  const ready = await read("/api/ready");

  printResult("GET /", home);
  printResult("GET /login", login);
  printResult("GET /planos", plans);
  printResult("GET /api/health", health);
  printResult("GET /api/ready", ready);

  const coreReady = Boolean(ready.data?.coreReady);
  const fullProductionReady = Boolean(ready.data?.fullProductionReady);

  console.log("\nResumo");
  console.log("------");
  console.log(`coreReady: ${coreReady}`);
  console.log(`fullProductionReady: ${fullProductionReady}`);
  console.log(`modo: ${strict ? "producao completa" : "core"}`);
  if (ready.data?.checks) {
    console.log("checks:");
    for (const [key, value] of Object.entries(ready.data.checks)) {
      console.log(`- ${key}: ${value.ok ? "OK" : "FAIL"} (${value.note})`);
    }
  }

  if (!home.ok || !login.ok || !plans.ok || !health.ok || !ready.ok) {
    console.error("\nSmoke check do frontend falhou.");
    process.exit(1);
  }

  if (strict && !fullProductionReady) {
    console.error("\nFrontend respondeu, mas ainda nao esta pronto para producao completa.");
    process.exit(1);
  }

  if (!strict && !coreReady) {
    console.error("\nFrontend respondeu, mas ainda nao esta pronto nem no core.");
    process.exit(1);
  }

  console.log(
    strict
      ? "\nFrontend aprovado no smoke check de producao."
      : "\nFrontend aprovado no smoke check do core."
  );
}

main().catch((error) => {
  console.error("\nFalha ao executar smoke check do frontend.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
