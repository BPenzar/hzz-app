// app/api/hzz/generate/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { brief, cvB64, sections, examples } = await req.json();

    const webhook = process.env.N8N_WEBHOOK_URL;
    if (!webhook) {
      return NextResponse.json({ error: "Missing N8N_WEBHOOK_URL" }, { status: 500 });
    }

    const n8nRes = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brief, cvB64, sections, examples }),
    });

    if (!n8nRes.ok) {
      const text = await n8nRes.text();
      return NextResponse.json({ error: "n8n_error", details: text }, { status: 502 });
    }

    // očekujemo { sections: { [id]: { values: {...}, hints?: {...} } } }
    const data = await n8nRes.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", message: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
