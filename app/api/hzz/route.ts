// app/api/hzz/route.ts
export async function POST(req: Request) {
  // 1) Parsiraj ulazni JSON – ako je neispravan, vrati 400
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "Body nije valjan JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2) Provjeri URL
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return new Response(
      JSON.stringify({ ok: false, error: "N8N_WEBHOOK_URL missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3) Pošalji prema n8n
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: `fetch to n8n failed: ${err?.message || String(err)}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4) Robusno pročitaj odgovor iz n8n
  const ct = res.headers.get("content-type") || "";
  let body: unknown = null;

  try {
    if (ct.includes("application/json")) {
      body = await res.json();
    } else {
      const txt = await res.text();
      try {
        body = JSON.parse(txt); // ako je Text koji sadrži JSON
      } catch {
        body = txt || null;     // fallback: raw tekst
      }
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: `parse n8n response failed: ${err?.message || String(err)}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5) Vrati rezultat; propagiraj status iz n8n
  return new Response(
    JSON.stringify({ ok: res.ok, status: res.status, n8n: body }),
    {
      status: res.ok ? 200 : res.status,
      headers: { "Content-Type": "application/json" },
    }
  );
}
