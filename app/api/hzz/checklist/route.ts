export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { status, nkd, zupanija } = body;

  const questions = [
    { key: "osobni_podaci", label: "Osobni podaci i kontakt" },
    { key: "opis_posla", label: "Opis djelatnosti (NKD, aktivnosti)" },
    { key: "plan_troskova", label: "Plan troškova" },
    { key: "dokazi", label: "Ponude/računi/ugovori" },
    { key: "rokovi", label: "Plan rokova" },
  ];

  return Response.json({ status, nkd, zupanija, questions });
}
