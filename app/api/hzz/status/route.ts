import { NextRequest, NextResponse } from "next/server";

type JobStatus = "queued" | "processing" | "done" | "error";
type Job = { status: JobStatus; result?: unknown; error?: string };

const store: Map<string, Job> = (globalThis as any).__jobs ?? new Map();
(globalThis as any).__jobs = store;

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId") || "";
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });

  const job = store.get(jobId);
  if (!job) return NextResponse.json({ ok: false, status: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...job });
}
