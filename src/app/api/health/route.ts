import { NextResponse } from "next/server";
import { getFrontendRuntimeStatus } from "@/lib/runtime-readiness";

export async function GET() {
  const runtime = getFrontendRuntimeStatus();

  return NextResponse.json({
    ...runtime,
    status: "ok",
    checks: undefined,
    mode: runtime.environment === "production" ? "production-observable" : "local-observable",
  });
}
