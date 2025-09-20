import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const idem = req.headers.get('x-idempotency-key') ?? crypto.randomUUID();

    const { data: app, error: insErr } = await supabase
      .from('applications')
      .insert({ form_json: body, status: 'received' })
      .select()
      .single();
    if (insErr) throw insErr;

    await supabase.from('statuses').insert({
      application_id: app.id,
      state: 'received',
      detail: 'Form received by API',
    });

    fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-idempotency-key': idem,
      },
      body: JSON.stringify({ application_id: app.id }),
    }).catch(() => {});

    return NextResponse.json({ application_id: app.id, status: 'received' }, { status: 202 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
