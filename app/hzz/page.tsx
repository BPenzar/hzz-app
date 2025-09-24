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

type UiSectionLite = { id: string; title: string; fields: any[] };
type Group = { id: string; title: string; children: UiSectionLite[] };

// Grupiranje sekcija po top-level broju (1,2,3…)
function groupSections(sections: UiSectionLite[]): Group[] {
  const byTop: Record<string, UiSectionLite[]> = {};
  sections.forEach((s) => {
    const top = s.id.split(".")[0];
    (byTop[top] ||= []).push(s);
  });

  const groups = Object.entries(byTop).map(([topId, arr]) => {
    arr.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const title =
      arr.length > 1 ? (arr[0].title.split(" - ")[0] || arr[0].title) : arr[0].title;
    return { id: topId, title, children: arr };
  });

  groups.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return groups;
}

// helpers
function getSection(sectionId: SectionId) {
  const sec = UI_SECTIONS.find((s) => s.id === sectionId);
  if (!sec) throw new Error(`Nepoznata sekcija: ${sectionId}`);
  return sec;
}
function blankFor(sectionId: SectionId): FormState {
  const sec = getSection(sectionId);
  return Object.fromEntries(sec.fields.map((f: any) => [f.name, ""]));
}



function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}




export default function HzzPage() {
  // Aktivna sekcija
  const [active, setActive] = useState<SectionId>(UI_SECTIONS[0]?.id ?? "1");
  // širina lijevog panela u %, ograničit ćemo 20–80
  const [leftWidth, setLeftWidth] = useState<number>(50);


  // Globalni state za lijevu i desnu stranu po sekciji
  const initialAll = useMemo(() => {
    const obj: Record<SectionId, SectionData> = {};
    UI_SECTIONS.forEach(
      (s) =>
        (obj[s.id] = {
          left: blankFor(s.id),
          right: blankFor(s.id),
          rightHints: {},
        })
    );
    return obj;
  }, []);
  const [data, setData] = useState<Record<SectionId, SectionData>>(initialAll);

  // Idea + CV upload (lijevi panel)
  const [idea, setIdea] = useState<string>("");
  const [cvB64, setCvB64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Grupirani tabovi za stepper na desnom headeru
  const groups = useMemo(
    () => groupSections(UI_SECTIONS as unknown as UiSectionLite[]),
    []
  );

  // state helpers
  function setRight(
    sectionId: SectionId,
    values: FormState,
    hints?: Record<string, string>
  ) {
    setData((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        right: { ...prev[sectionId].right, ...values },
        rightHints: hints ?? prev[sectionId].rightHints,
      },
    }));
  }

  // file utils
  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }
  async function onCvSelected(file?: File | null) {
    if (!file) {
      setCvB64(null);
      return;
    }
    const b64 = await readFileAsBase64(file);
    setCvB64(b64);
  }

  // STUB: za sada puni desnu stranu iz postojećih primjera
  async function generateFromExample() {
    setIsGenerating(true);
    try {
      UI_SECTIONS.forEach((s) => setRight(s.id, blankFor(s.id), {} as any));
      for (const s of UI_SECTIONS) {
        const ex = exampleFor(s.id) || {};
        setRight(s.id, { ...ex });
      }
      setActive(UI_SECTIONS[0]?.id ?? "1");
    } finally {
      setIsGenerating(false);
    }
  }






// MINIMAL: šalje SAMO { examples } na /api/hzz-debug
async function debugWebhook() {
  setIsGenerating(true);
  try {
    const examples = Object.fromEntries(
      UI_SECTIONS.map((s: any) => [s.id, exampleFor(s.id) || {}])
    );

    // pripremi payload: examples + idea (+ opcionalno CV)
    const payload = {
      examples,
      idea: idea?.trim() || null,     // ili "" ako želiš
      // cvB64: cvB64 ?? undefined,   // uključi ako ga želiš slati
    };

    const res = await fetch("/api/hzz-debug", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    const exMap =
      json?.n8n?.body?.examples ??
      json?.n8n?.echo?.examples ??
      json?.examples ?? null;

    if (exMap && typeof exMap === "object") {
      UI_SECTIONS.forEach((s: any) => setRight(s.id, blankFor(s.id), {} as any));
      for (const s of UI_SECTIONS) {
        const ex = exMap[s.id];
        if (ex && typeof ex === "object") setRight(s.id, ex);
      }
      setActive(UI_SECTIONS[0]?.id ?? "1");
    } else {
      console.warn("Webhook odgovor nema 'examples' mapu.");
    }
  } finally {
    setIsGenerating(false);
  }
}








// Escape malicioznih znakova pri izlazu u HTML
function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}



function exportAllSectionsPdf() {
  const all = UI_SECTIONS; // sve sekcije iz uvoza
  const htmlParts = all.map((sec: any) => {
    const values = data[sec.id]?.right || {};
    const isBlank = Object.values(values).every((v) => !v);

    // ako želiš preskočiti prazne sekcije, ostavi ovaj if
    if (isBlank) return "";

    const rows = sec.fields
      .map((f: any) => {
        const label = f.label || f.title || f.name;
        const val = values?.[f.name] ?? "";
        return `<tr>
          <th>${esc(label)}</th>
          <td>${esc(val).replace(/\n/g, "<br/>")}</td>
        </tr>`;
      })
      .join("");

    return `
      <h2>${esc(sec.id)}) ${esc(sec.title)}</h2>
      <table>${rows}</table>
      <hr/>
    `;
  });

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>HZZ – svi odgovori</title>
<style>
  @page { size: A4; margin: 14mm; }
  body { font: 12px system-ui, -apple-system, Segoe UI, Roboto, Arial; color: #111; }
  h1 { font-size: 18px; margin: 0 0 10px 0; }
  h2 { font-size: 15px; margin: 20px 0 6px 0; }
  .meta { font-size: 11px; color: #555; margin: 0 0 12px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; vertical-align: top; }
  th { width: 36%; background: #f7f7f7; text-align: left; }
  hr { border: none; border-top: 1px solid #ccc; margin: 18px 0; }
</style>
</head>
<body>
  <h1>Svi odgovori – HZZ zahtjev</h1>
  <div class="meta">Generirano: ${esc(new Date().toLocaleString())}</div>
  ${htmlParts.join("\n")}
  <script>
    window.onload = () => { window.print(); setTimeout(() => window.close(), 250); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return alert("Popup blokiran. Dozvoli otvaranje novog prozora.");
  win.document.write(html);
  win.document.close();
}










  // derived (desni panel)
  const section = getSection(active);
  const right = data[active].right;
  const rightHints = data[active].rightHints;
  const rightIsBlank = Object.values(right).every((v) => !v);

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 text-neutral-900">
	<div className="flex h-full p-3 min-h-0">
	  {/* ===== Lijevo: idea + CV ===== */}
	  <div
	    className="flex flex-col bg-white border rounded-md min-h-0 overflow-hidden"
	    style={{ width: `${leftWidth}%`, marginRight: "0.5rem" }} // ~gap-2
	  >
	    <div className="sticky top-0 z-30 bg-white border-b">
		<div className="p-3 flex items-center justify-between gap-3">
		    <div>
		      <h2 className="text-base font-semibold">Plan i ulazni podaci</h2>
		      <div className="text-xs text-neutral-600">
			Opiši obrt i ciljeve. Na temelju toga generirat ćemo kompletan primjer.
		      </div>
		    </div>

		    <button
		      onClick={generateFromExample}
		      className="px-3 py-1.5 rounded border text-sm hover:bg-neutral-100"
		      title="Učitaj ugrađene primjere u desni panel"
		    >
		      Use existing example
		    </button>
		  </div>
	    </div>

	    <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
	      <label className="text-sm font-medium">Kratak opis plana (idea)</label>
		<textarea
		  className="block w-full rounded-md border px-3 py-2 text-sm border-neutral-300 bg-white min-h-[120px] resize-y"
		  placeholder="Vrsta obrta, usluge, ciljni klijenti, tržišta, kanali prodaje, ključni alati/tehnologije, lokacija, plan troškova/prihoda…"
		  value={idea}
		  onChange={(e) => setIdea(e.target.value)}
		/>
	      
	      {/*
	      <div>
		<label className="text-sm font-medium">Životopis (PDF/DOCX/TXT)</label>
		<input
		  type="file"
		  accept=".pdf,.doc,.docx,.txt"
		  className="mt-1 block w-full text-sm"
		  onChange={(e) => onCvSelected(e.target.files?.[0] ?? null)}
		/>
		<div className="text-xs text-neutral-500 mt-1">
		  {cvB64 ? "Datoteka učitana." : "Nije učitano."}
		</div>
	      </div> 
	      */}
	     
		<button
		  onClick={debugWebhook}
		  className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
		  disabled={isGenerating || (!idea && !cvB64)}
		  aria-busy={isGenerating}
		>
		  {isGenerating ? (
		    <span className="inline-flex items-center gap-2">
		      Generiranje primjera 
          <Spinner className="text-white" />
		    </span>
		  ) : (
		    "Generiraj novi primjer"
		  )}
		</button>


	     
	    </div>
	  </div>

	  {/* ===== Resizer ===== */}
	  <div
	    className="w-1 bg-neutral-300 rounded cursor-col-resize select-none"
	    onMouseDown={(e) => {
	      e.preventDefault();
	      const startX = e.clientX;
	      const startWidth = leftWidth;

	      function onMove(ev: MouseEvent) {
		const delta = ev.clientX - startX;
		const percentDelta = (delta / window.innerWidth) * 100;
		const next = Math.min(80, Math.max(20, startWidth + percentDelta));
		setLeftWidth(next);
	      }
	      function onUp() {
		document.removeEventListener("mousemove", onMove);
		document.removeEventListener("mouseup", onUp);
	      }
	      document.addEventListener("mousemove", onMove);
	      document.addEventListener("mouseup", onUp);
	    }}
	    style={{ margin: "0 0.5rem" }} // ~gap-2
	    title="Povuci za promjenu širine"
	  />

	  {/* ===== Desno: Stepper + forma ===== */}
	  <div
	    className="flex flex-col bg-white border rounded-md min-h-0 overflow-hidden flex-1"
	    style={{ width: `${100 - leftWidth}%` }}
	  >
	    <div className="sticky top-0 z-30 bg-white border-b p-3">
	      <div className="p-2 -mt-2 -mb-1 overflow-x-auto">
		<div className="flex gap-2 whitespace-nowrap">
		  {groups.map((g) => {
		    const groupOpen = active.split(".")[0] === g.id;
		    return (
		      <div key={g.id} className="inline-block">
		        <button
		          onClick={() => setActive(g.children[0].id)}
		          className={[
		            "px-3 py-1 rounded-full text-sm border transition mr-2",
		            groupOpen
		              ? "bg-black text-white border-black"
		              : "bg-white hover:bg-neutral-100 text-neutral-800",
		          ].join(" ")}
		          title={`${g.id}) ${g.title}`}
		        >
		          {groupOpen ? `${g.id}) ${g.title}` : g.id}
		        </button>

		        {groupOpen && g.children.length > 1 && (
		          <div className="mt-2 ml-4 inline-flex gap-2 align-middle">
		            {g.children.map((child) => {
		              const isActiveChild = active === child.id;
		              return (
		                <button
		                  key={child.id}
		                  onClick={() => setActive(child.id)}
		                  className={[
		                    "px-3 py-1 rounded-full text-sm border transition",
		                    isActiveChild
		                      ? "bg-black text-white border-black"
		                      : "bg-white hover:bg-neutral-100 text-neutral-800",
		                  ].join(" ")}
		                  title={`${child.id}) ${child.title}`}
		                >
		                  {isActiveChild
		                    ? `${child.id}) ${child.title}`
		                    : child.id}
		                </button>
		              );
		            })}
		          </div>
		        )}
		      </div>
		    );
		  })}
		</div>
	      </div>

	      <div className="flex items-baseline gap-3 mt-2">
		<h2 className="text-lg font-semibold">Pitanja</h2>
		<span className="text-sm text-neutral-600">
		  ({active}) {section.title}
		</span>
	      </div>
	      <div className="text-xs text-neutral-500 mt-1">
		Desna strana je prazna dok ne generiraš primjer ili dok ne pošalješ
		podatke.
	      </div>
	    </div>

	    <div className="flex-1 overflow-y-auto min-h-0 p-3">
	      {rightIsBlank ? (
		<div className="p-4 text-sm text-neutral-500">
		  Još nema podataka za ovu sekciju. Koristi <b>“Generiraj primjer”</b> s
		  lijeve strane.
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
	      <button onClick={exportAllSectionsPdf} 
	       className="px-3 py-2 rounded bg-red-700 text-white border border-black hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 active:bg-red-800 disabled:opacity-60"
	       aria-label="Preuzmi PDF"
	      >
		Preuzmi PDF
	      </button>
	    </div>
	  </div>
	</div>
    </div>
  );
}
