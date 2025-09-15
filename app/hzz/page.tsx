"use client";
import { useState } from "react";

type ChecklistItem = { key: string; label: string; required?: boolean };
type ChecklistResponse = { questions?: ChecklistItem[] };

export default function HzzPage() {
  const [data, setData] = useState<ChecklistResponse | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      status: form.get("status"),
      nkd: form.get("nkd"),
      zupanija: form.get("zupanija"),
    };
    const res = await fetch("/api/hzz/checklist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json: ChecklistResponse = await res.json();
    setData(json);
  }

  async function pay() {
    window.location.href = "/hzz/pro?trial=7";
  }

  return (
    <section className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">HZZ Zahtjev – brzi pregled</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="status" placeholder="Status (npr. nezaposlen)" className="w-full border p-2" />
        <input name="nkd" placeholder="NKD (npr. J62.0)" className="w-full border p-2" />
        <input name="zupanija" placeholder="Županija" className="w-full border p-2" />
        <button type="submit" className="border px-4 py-2">Generiraj checklist</button>
      </form>

      {data?.questions && (
        <div className="border p-3 rounded">
          <h2 className="text-xl font-medium mb-2">Checklist</h2>
          <ul className="list-disc ml-5">
            {data.questions.map((q: ChecklistItem) => (
              <li key={q.key}>{q.label}</li>
            ))}
          </ul>
          <button onClick={pay} className="mt-4 border px-4 py-2">Otključaj PRO (trial)</button>
        </div>
      )}
    </section>
  );
}
