// app/api/pings/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !service) {
    throw new Error("Supabase env varijable nedostaju (URL ili SERVICE ROLE KEY).");
  }
  return createClient(url, service, { auth: { persistSession: false } });
}

// GET /api/pings  → zadnjih 5 pings
export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("pings")
      .select("*")
      .order("id", { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// POST /api/pings  → { note: string }
export async function POST(req: Request) {
  try {
    const { note = "hello" } = await req.json().catch(() => ({}));
    const supabase = supabaseAdmin();
    const { error } = await supabase.from("pings").insert({ note });

    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
