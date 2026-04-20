import { NextResponse } from "next/server";
import { getFrontendRuntimeStatus } from "@/lib/runtime-readiness";

export async function GET() {
  const runtime = getFrontendRuntimeStatus();

  return NextResponse.json(
    {
      ...runtime,
      integrations: {
        apiConfigured: runtime.checks.apiConfigured.ok,
        googleConfigured: runtime.checks.googleConfigured.ok,
      },
    },
    {
      status: runtime.coreReady ? 200 : 503,
    },
  );
}
