import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // SAMO server-side
);

export async function GET() {
  const { data, error } = await supabase
    .from('pings')
    .select('*')
    .order('id', { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const { note = 'hello' } = await req.json().catch(() => ({}));
  const { error } = await supabase.from('pings').insert({ note });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

