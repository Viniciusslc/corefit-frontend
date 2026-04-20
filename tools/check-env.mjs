import fs from "fs";
import path from "path";

const cwd = process.cwd();
const strictProduction = process.argv.includes("--strict-production");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

function readConfig() {
  const envFromFile = readEnvFile(path.join(cwd, ".env.local"));
  const envFallback = readEnvFile(path.join(cwd, ".env"));

  return {
    ...envFallback,
    ...envFromFile,
    ...process.env,
  };
}

function hasValue(config, key) {
  return String(config[key] ?? "").trim().length > 0;
}

const config = readConfig();

const alwaysRequired = [
  {
    key: "NEXT_PUBLIC_API_URL",
    note: "Base do backend consumido pelo app",
    localDefaultValue: "http://localhost:3000",
  },
];

const productionRecommended = [
  { key: "NEXT_PUBLIC_GOOGLE_CLIENT_ID", note: "Necessario para login Google real" },
];

function printSection(title, rows) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));
  for (const row of rows) {
    console.log(`${row.status.padEnd(7)} ${row.key}${row.note ? ` - ${row.note}` : ""}`);
  }
}

const requiredRows = alwaysRequired.map((row) => {
  const ok = hasValue(config, row.key) || (!strictProduction && String(row.localDefaultValue ?? "").trim().length > 0);
  return {
    ...row,
    status: ok ? "OK" : "ERROR",
  };
});

const recommendedRows = productionRecommended.map((row) => ({
  ...row,
  status: hasValue(config, row.key) ? "OK" : strictProduction ? "ERROR" : "WARN",
}));

printSection("Core", requiredRows);
printSection("Public auth integrations", recommendedRows);

const errors = [...requiredRows, ...recommendedRows].filter((row) => row.status === "ERROR");
const warnings = [...requiredRows, ...recommendedRows].filter((row) => row.status === "WARN");

console.log("\nResumo");
console.log("------");
console.log(`Modo: ${strictProduction ? "strict-production" : "local-readiness"}`);
console.log(`Erros criticos: ${errors.length}`);
console.log(`Avisos: ${warnings.length}`);

if (errors.length > 0) {
  console.error(
    strictProduction
      ? "\nFrontend ainda nao esta pronto para deploy completo de producao."
      : "\nFrontend ainda nao esta pronto para validacao local consistente."
  );
  process.exit(1);
}

console.log(
  strictProduction
    ? "\nFrontend pronto em nivel de ambiente para producao completa."
    : "\nFrontend apto para validacao local. Integracoes externas seguem condicionais pelos avisos."
);
