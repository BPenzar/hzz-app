import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: app, error } = await supabase
    .from('applications')
    .select('id,status,result_text')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: timeline } = await supabase
    .from('statuses')
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ app, timeline });
}

