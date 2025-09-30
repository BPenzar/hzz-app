import { NextRequest, NextResponse } from "next/server";

type JobStatus = "queued" | "processing" | "done" | "error";
type Job = { status: JobStatus; result?: unknown; error?: string };

const store: Map<string, Job> = (globalThis as any).__jobs ?? new Map();
(globalThis as any).__jobs = store;

export async function POST(req: NextRequest) {
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { jobId, ok, result, error } = body ?? {};
  if (!jobId || typeof jobId !== "string") {
    return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
  }

  const existing = store.get(jobId) ?? { status: "queued" as JobStatus };
  if (ok === false || error) {
    store.set(jobId, { status: "error", error: String(error ?? "unknown") });
  } else {
    store.set(jobId, { ...existing, status: "done", result });
  }

  return NextResponse.json({ ok: true });
}
