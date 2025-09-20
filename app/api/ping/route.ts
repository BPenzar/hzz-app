// app/api/ping/route.ts
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "missing";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "missing";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ? "present" : "missing";
  const n8nWebhook = process.env.N8N_WEBHOOK_URL || "missing";

  return new Response(
    JSON.stringify({
      ok: true,
      env: {
        NEXT_PUBLIC_BASE_URL: baseUrl,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
        SUPABASE_SERVICE_ROLE_KEY: serviceKey,
        N8N_WEBHOOK_URL: n8nWebhook
      }
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
