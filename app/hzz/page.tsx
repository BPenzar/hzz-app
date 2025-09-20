// app/hzz/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { UI_SECTIONS, exampleFor } from "./lib/data";
import { SectionForm } from "./components/SectionForm";

type SectionId = string;
type FormState = Record<string, string>;
type SectionData = {
  left: FormState;
  right: FormState;
  rightHints: Record<string, string>;
};

// helpers
function getSection(sectionId: SectionId) {
  const sec = UI_SECTIONS.find((s) => s.id === sectionId);
  if (!sec) throw new Error(`Nepoznata sekcija: ${sectionId}`);
  return sec;
}
function blankFor(sectionId: SectionId): FormState {
  const sec = getSection(sectionId);
  return Object.fromEntries(sec.fields.map((f) => [f.name, ""]));
}
async function refineViaWebhook(
  payload: FormState,
  sectionId: SectionId
): Promise<{ values: FormState; hints: Record<string, string> }> {
  // mock validacija: označi missing gdje je obavezno ili prazno
  const sec = getSection(sectionId);
  const hints: Record<string, string> = {};
  const values: FormState = { ...payload };

  sec.fields.forEach((f) => {
    const v = (payload[f.name] ?? "").trim();
    if (!v) {
      hints[f.name] = "Nedostaje unos za ovo polje.";
      values[f.name] = "";
    }
  });

  return { values, hints };
}

export default function HzzPage() {
  const [active, setActive] = useState<SectionId>(UI_SECTIONS[0]?.id ?? "1");
  const initialAll = useMemo(() => {
    const obj: Record<SectionId, SectionData> = {};
    UI_SECTIONS.forEach((s) => (obj[s.id] = { left: blankFor(s.id), right: blankFor(s.id), rightHints: {} }));
    return obj;
  }, []);
  const [data, setData] = useState<Record<SectionId, SectionData>>(initialAll);
  const [isSending, setIsSending] = useState(false);

  // state helpers
  function setLeft(sectionId: SectionId, patch: Partial<FormState>) {
    setData((prev) => ({ ...prev, [sectionId]: { ...prev[sectionId], left: { ...prev[sectionId].left, ...patch } } }));
  }
  function setRight(sectionId: SectionId, values: FormState, hints?: Record<string, string>) {
    setData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        right: { ...prev[sectionId].right, ...values },
        rightHints: hints ?? prev[sectionId].rightHints,
      },
    }));
  }

  // actions
  function fillExample() {
    const ex = exampleFor(active) || {};
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

  // derived
  const section = getSection(active);
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
            <div className="p-2 overflow-x-auto">
              <div className="flex gap-2 whitespace-nowrap">
                {UI_SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={[
                      "px-3 py-1 rounded-full text-sm border transition",
                      active === s.id ? "bg-black text-white border-black" : "bg-white hover:bg-neutral-100 text-neutral-800",
                    ].join(" ")}
                    title={`${s.id}) ${s.title}`}
                  >
                    {s.id}) {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* body */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            <SectionForm fields={section.fields} values={left} onChange={(k, v) => setLeft(active, { [k]: v })} />
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
              <span className="text-sm text-neutral-600">({active}) {section.title}</span>
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Desna strana je prazna dok ne pošaljete sekciju. Nakon povratka možete je dodatno urediti.
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {rightIsBlank ? (
              <div className="p-4 text-sm text-neutral-500">
                Još nema podataka za ovu sekciju. Ispuni lijevo i klikni <b>“Pošalji sekciju”</b>.
              </div>
            ) : (
              <SectionForm
                fields={section.fields}
                values={right}
                hints={rightHints}
                onChange={(k, v) => setRight(active, { ...right, [k]: v })}
              />
            )}
          </div>

          <div className="sticky bottom-0 z-30 bg-white border-t p-3 flex items-center gap-2 justify-end">
            <button onClick={callWebhook} className="px-3 py-2 rounded border">
              Webhook: n8n
            </button>
            <button onClick={downloadPDF} className="px-3 py-2 rounded border">
              Preuzmi PDF
            </button>
            <button onClick={downloadWord} className="px-3 py-2 rounded border">
              Preuzmi Word
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
