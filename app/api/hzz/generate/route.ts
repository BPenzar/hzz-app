// app/api/hzz/generate/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function err(status: number, code: string, message: string, details?: any) {
  return NextResponse.json({ error: code, message, ...(details ? { details } : {}) }, { status });
}

export async function POST(req: Request) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return err(400, 'bad_request', 'Invalid JSON payload');
  }

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return err(500, 'server_error', 'N8N_WEBHOOK_URL missing');

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await r.text();
    if (!text) return err(502, 'server_error', 'n8n returned empty body', { status: r.status });

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return err(502, 'server_error', 'n8n returned non-JSON', { status: r.status, raw: text.slice(0, 500) });
    }

    if (data?.error && r.ok) return err(502, 'llm_error', 'Upstream error from n8n', data);
    if (!r.ok) return NextResponse.json(data ?? {}, { status: r.status });

    return NextResponse.json(data ?? {});
  } catch (e: any) {
    return err(500, 'server_error', e?.message || String(e));
  }
}
