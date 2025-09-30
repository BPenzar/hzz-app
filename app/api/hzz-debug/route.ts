import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const resp = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return NextResponse.json({ ok: resp.ok, status: resp.status, n8n: data });
}


