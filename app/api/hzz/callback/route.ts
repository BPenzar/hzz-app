import { NextRequest, NextResponse } from "next/server";

type JobStatus = "queued" | "processing" | "done" | "error";
type Job = { status: JobStatus; result?: unknown; error?: string };

const store: Map<string, Job> = (globalThis as any).__jobs ?? new Map();
(globalThis as any).__jobs = store;

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return NextResponse.json(
      { ok: false, error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const jobId = typeof body?.jobId === "string" ? body.jobId : null;
  const okFlag = typeof body?.ok === "boolean" ? body.ok : true;
  const result = body?.result;
  const incomingError = body?.error != null ? String(body.error) : undefined;

  if (!jobId) {
    return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
  }

  const existing = store.get(jobId) ?? { status: "queued" as JobStatus };

  if (okFlag === false || incomingError) {
    store.set(jobId, { status: "error", error: incomingError ?? "unknown" });
  } else {
    store.set(jobId, { ...existing, status: "done", result });
  }

  // ⭐ NOVO: ako je stigao result, echo baš njega kao array
  if (typeof result !== "undefined") {
    return new NextResponse(
      JSON.stringify([result]),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  // fallback kad nema result-a
  return NextResponse.json({ ok: true, jobId });
}

export async function GET(req: NextRequest) {
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
  const job = store.get(jobId);
  if (!job) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, jobId, ...job });
}
