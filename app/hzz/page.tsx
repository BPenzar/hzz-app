// app/hzz/page.tsx
"use client";

import React, { useMemo, useState } from "react";

/** ===============================
 *  Sekcije (redoslijed i nazivi)
 *  =============================== */
type SectionId =
  | "1-podnositelj"
  | "2-subjekt"
  | "3-1-poduzetnik"
  | "3-2-predmet"
  | "3-3-ulaganja"
  | "3-4-trziste"
  | "3-5-prihodi"
  | "3-6-troskovi"
  | "3-7-dobit"
  | "4-troskovnik"
  | "5-prilozi";

const SECTIONS: { id: SectionId; short: string; full: string }[] = [
  { id: "1-podnositelj", short: "1) Podaci o podnositelju", full: "1) Podaci o podnositelju zahtjeva" },
  { id: "2-subjekt", short: "2) Opći podaci o subjektu", full: "2) Opći podaci o budućem poslovnom subjektu" },
  { id: "3-1-poduzetnik", short: "3.1) Poduzetnik", full: "3.1) Podaci o budućem poduzetniku i poslovnom subjektu" },
  { id: "3-2-predmet", short: "3.2) Predmet", full: "3.2) Predmet poslovanja" },
  { id: "3-3-ulaganja", short: "3.3) Ulaganja", full: "3.3) Struktura ulaganja" },
  { id: "3-4-trziste", short: "3.4) Tržište i konkurencija", full: "3.4) Procjena tržišta i konkurencije" },
  { id: "3-5-prihodi", short: "3.5) Prihodi", full: "3.5) Procjena prihoda" },
  { id: "3-6-troskovi", short: "3.6) Troškovi", full: "3.6) Procjena troškova poslovanja" },
  { id: "3-7-dobit", short: "3.7) Dobit/dohodak", full: "3.7) Očekivana dobit/dohodak" },
  { id: "4-troskovnik", short: "4) Troškovnik", full: "4) Troškovnik" },
  { id: "5-prilozi", short: "5) Prilozi", full: "5) Prilozi" },
];

/** ===============================
 *  Definicija polja (label -> name)
 *  =============================== */
type Field = { name: string; label: string; long?: boolean; placeholder?: string };

const FIELDS_BY_SECTION: Record<SectionId, Field[]> = {
  "1-podnositelj": [
    { name: "podrucniUred", label: "Područni ured" },
    { name: "ime", label: "Ime", placeholder: "IME [PRIMJER]" },
    { name: "prezime", label: "Prezime", placeholder: "PREZIME [PRIMJER]" },
    { name: "oib", label: "OIB", placeholder: "00000000000" },
    { name: "zanimanje", label: "Zanimanje" },
    { name: "datumRodenja", label: "Datum rođenja" },
    { name: "adresa", label: "Adresa" },
    { name: "grad", label: "Grad/Mjesto" },
    { name: "telefon", label: "Kontakt (telefon)" },
    { name: "email", label: "Kontakt (e-mail)" },
    { name: "osnovnaSkola", label: "Osnovna škola", long: true },
    { name: "srednjaSkola", label: "Srednja škola", long: true },
    { name: "fakultet", label: "Fakultet/Mag./Doktorat", long: true },
    { name: "osposobljavanje", label: "Osposobljavanje i usavršavanje", long: true },
    { name: "edukacije", label: "Edukacije za vođenje poslovanja", long: true },
    { name: "hobiji", label: "Hobiji i interesi", long: true },
    { name: "radionica", label: "Radionica za samozapošljavanje" },
    { name: "prethodnoPoduzetnistvo", label: "Prethodno poduzetničko iskustvo", long: true },
  ],
  "2-subjekt": [
    { name: "vrstaSubjekta", label: "Vrsta poslovnog subjekta", long: true },
    { name: "strukturaVlasnistva", label: "Struktura vlasništva", long: true },
    { name: "sjediste", label: "Sjedište (mjesto/grad)" },
    { name: "nkd", label: "NKD (odabrani kodovi)", long: true },
    { name: "iznosPotpore", label: "Iznos tražene potpore (€)" },
    { name: "neprihvatljive", label: "Neprihvatljive djelatnosti (info)", long: true },
  ],
  "3-1-poduzetnik": [
    { name: "radnoIskustvoRad", label: "Radno iskustvo (ugovor o radu)", long: true },
    { name: "radnoIskustvoOstalo", label: "Radno iskustvo (ugovor o djelu/student/volontiranje)", long: true },
  ],
  "3-2-predmet": [
    { name: "vrstaIDjelatnost", label: "Vrsta subjekta i djelatnost", long: true },
    { name: "idejaKompetencije", label: "Kako ste došli na ideju i zašto ste kompetentni", long: true },
    { name: "opisUslugaLokacija", label: "Opis proizvoda/usluga i lokacija", long: true },
    { name: "obitelj", label: "Bavi li se netko u obitelji srodnom djelatnošću" },
    { name: "zaposljavanjeObrazlozenje", label: "Procjena zapošljavanja – obrazloženje", long: true },
  ],
  "3-3-ulaganja": [
    { name: "ulaganjaHzz", label: "Varijabilni iznos HZZ – oprema/osnovna sredstva", long: true },
    { name: "ulaganjaDrugi", label: "Ulaganja iz drugih izvora (tablica)", long: true },
    { name: "prostor", label: "Prostor (sjedište, područje, coworking, VPS…)", long: true },
    { name: "dozvole", label: "Dozvole/MTU (da/ne + opis)", long: true },
    { name: "postojecaOprema", label: "Postojeća oprema/prijevozna sredstva", long: true },
  ],
  "3-4-trziste": [
    { name: "korisnici", label: "Potencijalni korisnici / orijentacija tržišta", long: true },
    { name: "prepoznatljivost", label: "Procjena prepoznatljivosti / potražnje", long: true },
    { name: "obavjestavanje", label: "Način obavještavanja / kanali", long: true },
    { name: "web", label: "Plan web stranice" },
    { name: "nabava", label: "Tržište nabave (suradnje, dokazi, RH/inozemstvo)", long: true },
    { name: "konkurencija", label: "Konkurencija", long: true },
    { name: "razlikovanje", label: "Po čemu ste drugačiji / aktivnosti", long: true },
  ],
  "3-5-prihodi": [
    { name: "tab21", label: "Tablica 2.1 – Prihodi 1. godina", long: true },
    { name: "tab22", label: "Tablica 2.2 – Prihodi 2. godina", long: true },
  ],
  "3-6-troskovi": [
    { name: "tab31", label: "Tablica 3.1 – Trošak rada 1. godina", long: true },
    { name: "tab32", label: "Tablica 3.2 – Trošak rada 2. godina", long: true },
    { name: "tab41", label: "Tablica 4.1 – Ostali troškovi 1. godina", long: true },
    { name: "tab42", label: "Tablica 4.2 – Ostali troškovi 2. godina", long: true },
  ],
  "3-7-dobit": [{ name: "dobitTab", label: "Račun dobiti/dohotka (1. i 2. godina)", long: true }],
  "4-troskovnik": [{ name: "troskovnik", label: "Troškovnik (fiksni dio + informatička oprema…)", long: true }],
  "5-prilozi": [{ name: "prilozi", label: "Popis priloga (FINA, izjava, ponude, ostalo…)", long: true }],
};

type FormState = Partial<Record<string, string>>;
type SectionData = { left: FormState; right: FormState; rightHints: Record<string, string> };

/** ===============================
 *  Primjer (lijevo – za auto-popunu)
 *  =============================== */
const EXAMPLE_LEFT: Partial<Record<SectionId, FormState>> = {
  "1-podnositelj": {
    podrucniUred: "Područna služba ZAGREB",
    ime: "BRUNO SEBASTIAN",
    prezime: "PENZAR",
    oib: "00357376233",
    zanimanje: "Programer računalnih aplikacija.",
    datumRodenja: "28.10.1993.",
    adresa: "Ulica Đure Crnatka 24",
    grad: "10 000 Zagreb",
    telefon: "+385 97 611 2569",
    email: "penzar.bruno@gmail.com",
  },
};

/** helpers */
function emptySection(sectionId: SectionId): SectionData {
  const names = FIELDS_BY_SECTION[sectionId].map((f) => f.name);
  const blank: FormState = Object.fromEntries(names.map((n) => [n, ""]));
  return { left: { ...blank }, right: { ...blank }, rightHints: {} };
}

/** mock webhook/refine */
async function refineViaWebhook(
  payload: FormState,
  section: SectionId
): Promise<{ values: FormState; hints: Record<string, string> }> {
  const fields = FIELDS_BY_SECTION[section];
  const hints: Record<string, string> = {};
  const values: FormState = { ...payload };

  fields.forEach((f) => {
    const v = (payload[f.name] ?? "").trim();
    if (!v) {
      hints[f.name] = "Nedostaje unos za ovo polje.";
      values[f.name] = "";
    }
  });

  return { values, hints };
}

/** ===============================
 *  UI
 *  =============================== */
export default function HzzPage() {
  const [active, setActive] = useState<SectionId>("1-podnositelj");
  const initialAll = useMemo(() => {
    const obj: Record<SectionId, SectionData> = {} as any;
    SECTIONS.forEach((s) => (obj[s.id] = emptySection(s.id)));
    return obj;
  }, []);
  const [data, setData] = useState<Record<SectionId, SectionData>>(initialAll);
  const [isSending, setIsSending] = useState(false);

  function setLeft(sectionId: SectionId, patch: Partial<FormState>) {
    setData((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], left: { ...prev[sectionId].left, ...patch } } }));
  }
  function setRight(sectionId: SectionId, values: FormState, hints?: Record<string, string>) {
    setData((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], right: { ...prev[sectionId].right, ...values }, rightHints: hints ?? prev[sectionId].rightHints },
    }));
  }

  function fillExample() {
    const ex = EXAMPLE_LEFT[active] || {};
    setLeft(active, ex);
  }

  async function submitSection() {
    setIsSending(true);
    try {
      const payload = data[active].left;
      const { values, hints } = await refineViaWebhook(payload, active);
      setRight(active, values, hints);
    } finally {
      setIsSending(false);
    }
  }

  function downloadPDF() {
    alert("PDF će koristiti DESNA (uređena) polja aktivne sekcije.");
  }
  function downloadWord() {
    alert("Word će koristiti DESNA (uređena) polja aktivne sekcije.");
  }
  function callWebhook() {
    alert("Webhook n8n – ovdje ćemo spojiti stvarni URL.");
  }

  const sectionMeta = SECTIONS.find((s) => s.id === active)!;
  const left = data[active].left;
  const right = data[active].right;
  const rightHints = data[active].rightHints;
  const rightIsBlank = Object.values(right).every((v) => !v);

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 text-neutral-900">
      <div className="grid grid-cols-2 gap-4 h-full p-3 min-h-0">
        {/* ===== Lijevo ===== */}
        <div className="flex flex-col bg-white border rounded-md min-h-0">
          {/* header */}
          <div className="sticky top-0 z-30 bg-white border-b">
            <div className="p-2">
              <div className="flex flex-wrap gap-2">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={[
                      "px-3 py-1 rounded-full text-sm border transition",
                      active === s.id ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 text-neutral-800",
                    ].join(" ")}
                    title={s.full}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* body */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <SectionForm fields={FIELDS_BY_SECTION[active]} values={left} onChange={(k, v) => setLeft(active, { [k]: v })} />
          </div>
          {/* footer */}
          <div className="sticky bottom-0 z-30 bg-white border-t p-3 flex items-center gap-2">
            <button onClick={fillExample} className="px-3 py-2 rounded border text-neutral-900">
              Ispuni primjerom
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={submitSection} disabled={isSending} className="px-4 py-2 rounded bg-black text-white disabled:opacity-60">
                {isSending ? "Slanje…" : "Pošalji sekciju"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== Desno ===== */}
        <div className="flex flex-col bg-white border rounded-md min-h-0">
          <div className="sticky top-0 z-30 bg-white border-b p-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">Pitanja</h2>
              <span className="text-sm text-neutral-600">({sectionMeta.full})</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Desna strana je prazna dok ne pošaljete sekciju. Nakon povratka možete je dodatno urediti.
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {rightIsBlank ? (
              <div className="p-6 text-sm text-neutral-500">
                Još nema podataka za ovu sekciju. Ispuni lijevo i klikni <b>“Pošalji sekciju”</b>.
              </div>
            ) : (
              <SectionForm fields={FIELDS_BY_SECTION[active]} values={right} hints={rightHints} onChange={(k, v) => setRight(active, { [k]: v })} />
            )}
          </div>

          <div className="sticky bottom-0 z-30 bg-white border-t p-3 flex items-center gap-2">
            <button onClick={callWebhook} className="px-3 py-2 rounded border text-neutral-900">
              Webhook: n8n
            </button>
            <div className="ml-auto flex gap-2">
              <button onClick={downloadPDF} className="px-3 py-2 rounded border text-neutral-900">
                Preuzmi PDF
              </button>
              <button onClick={downloadWord} className="px-3 py-2 rounded border text-neutral-900">
                Preuzmi Word
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ===== Reusable form ===== */
function SectionForm({
  fields,
  values,
  onChange,
  hints,
}: {
  fields: Field[];
  values: FormState;
  onChange: (name: string, value: string) => void;
  hints?: Record<string, string>;
}) {
  return (
    <div className="p-3 space-y-4">
      {fields.map((f) => (
        <FieldControl
          key={f.name}
          label={f.label}
          value={values[f.name] ?? ""}
          long={f.long}
          placeholder={hints?.[f.name] ? hints[f.name] : f.placeholder}
          missing={Boolean(hints?.[f.name])}
          onChange={(val) => onChange(f.name, val)}
        />
      ))}
    </div>
  );
}

function FieldControl({
  label,
  value,
  onChange,
  long,
  placeholder,
  missing,
}: {
  label: string;
  value: string;
  long?: boolean;
  placeholder?: string;
  missing?: boolean;
  onChange: (v: string) => void;
}) {
  const base = "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 text-neutral-900 placeholder:text-neutral-400";
  const cls = [base, missing ? "border-red-300 focus:ring-red-200 placeholder:text-red-500" : "focus:ring-neutral-200"].join(" ");

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-neutral-800">{label}</div>
      {long ? (
        <textarea className={`${cls} min-h-[120px]`} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
