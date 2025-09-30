import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

type JobStatus = "queued" | "processing" | "done" | "error";
type Job = { status: JobStatus; result?: unknown; error?: string };

// shared in-memory store (na Vercelu volatilno)
const store: Map<string, Job> = (globalThis as any).__jobs ?? new Map();
(globalThis as any).__jobs = store;

export async function POST(req: NextRequest) {
  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nUrl) {
    return NextResponse.json({ ok: false, error: "N8N not configured" }, { status: 503 });
  }

  const input = await req.json().catch(() => ({} as Record<string, unknown>));

  const jobId = crypto.randomUUID();
  store.set(jobId, { status: "queued" });

  const origin = process.env.CALLBACK_BASE_URL ?? req.nextUrl.origin;
  const callbackUrl = `${origin}/api/hzz/callback`;

  delete (input as any).jobId;
  delete (input as any).callbackUrl;

  const body = { ...input, jobId, callbackUrl };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    await fetch(n8nUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    store.set(jobId, { status: "processing" });
    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (e: any) {
    store.set(jobId, { status: "error", error: e?.message || String(e) });
    return NextResponse.json({ ok: false, jobId, error: e?.message || String(e) }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
