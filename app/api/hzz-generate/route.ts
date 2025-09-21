import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await r.text();
    let data: any; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json({ ok: r.ok, status: r.status, n8n: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

