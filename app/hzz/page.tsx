// app/hzz/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import { UI_SECTIONS, exampleFor } from "./lib/data";
import { SectionForm } from "./components/SectionForm";

type SectionId = string;
type FormState = Record<string, string>;
type SectionData = { left: FormState; right: FormState; rightHints: Record<string, string> };
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
    const title = arr.length > 1 ? (arr[0].title.split(" - ")[0] || arr[0].title) : arr[0].title;
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

// Dark mode: default = ON
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const initial = stored ? stored === "dark" : true; // default: dark
    setIsDark(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);
  const toggle = () => {
    setIsDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  };
  return { isDark, toggle };
}

function ThemeToggle({
  on,
  toggle,
  className = "",
}: { on: boolean; toggle: () => void; className?: string }) {
  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label="Toggle dark mode"
      className={
        "h-7 w-12 rounded-full border px-1 flex items-center " +
        "bg-white/90 dark:bg-neutral-800/90 border-neutral-300 dark:border-neutral-700 " +
        "shadow-sm backdrop-blur-sm " +
        className
      }
    >
      <span
        className={[
          "h-5 w-5 rounded-full bg-neutral-900 dark:bg-white shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}


function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function HzzPage() {
  const { isDark, toggle } = useDarkMode();

  const [active, setActive] = useState<SectionId>(UI_SECTIONS[0]?.id ?? "1");
  const [leftWidth, setLeftWidth] = useState<number>(50);

  const initialAll = useMemo(() => {
    const obj: Record<SectionId, SectionData> = {};
    UI_SECTIONS.forEach((s) => (obj[s.id] = { left: blankFor(s.id), right: blankFor(s.id), rightHints: {} }));
    return obj;
  }, []);
  const [data, setData] = useState<Record<SectionId, SectionData>>(initialAll);

  const [idea, setIdea] = useState<string>("");
  const [cvB64, setCvB64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const groups = useMemo(() => groupSections(UI_SECTIONS as unknown as UiSectionLite[]), []);

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

  // šalje {examples, idea} prema /api/hzz (async job) i polla status
  async function debugWebhook() {
    setIsGenerating(true);
    try {
      // složi payload kao i prije
      const examples = Object.fromEntries(UI_SECTIONS.map((s: any) => [s.id, exampleFor(s.id) || {}]));
      const payload = { examples, idea: (idea?.trim() || null) };

      // 1) startaj job
      const start = await fetch("/api/hzz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const startJson = await start.json();
      if (!start.ok || !startJson?.ok || !startJson?.jobId) {
        console.error("Start job failed", startJson);
        alert("Greška pri pokretanju generiranja.");
        return;
      }

      // 2) pollaj status
      const jobId = startJson.jobId as string;
      for (;;) {
        await new Promise(r => setTimeout(r, 1500));
        const res = await fetch(`/api/hzz/status?jobId=${encodeURIComponent(jobId)}`);
        const js = await res.json();

        if (js?.status === "done") {
          const exMap =
            js?.result?.examples ??
            js?.examples ??
            null;

          if (exMap && typeof exMap === "object") {
            UI_SECTIONS.forEach((s: any) => setRight(s.id, blankFor(s.id), {} as any));
            for (const s of UI_SECTIONS) {
              const ex = exMap[s.id];
              if (ex && typeof ex === "object") setRight(s.id, ex);
            }
            setActive(UI_SECTIONS[0]?.id ?? "1");
          } else {
            console.warn("Nije vraćen očekivani 'examples' objekt:", js);
            alert("Gotovo, ali nema očekivanih podataka.");
          }
          break;
        }

        if (js?.status === "error") {
          console.error("Job error:", js?.error);
          alert("Greška u obradi.");
          break;
        }

        // status 'queued' | 'processing' → nastavi pollati
      }
    } finally {
      setIsGenerating(false);
    }
  }




  function esc(s: string) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function exportAllSectionsPdf() {
    const all = UI_SECTIONS;
    const htmlParts = all
      .map((sec: any) => {
        const values = data[sec.id]?.right || {};
        const isBlank = Object.values(values).every((v) => !v);
        if (isBlank) return "";
        const rows = sec.fields
          .map((f: any) => {
            const label = f.label || f.title || f.name;
            const val = values?.[f.name] ?? "";
            return `<tr><th>${esc(label)}</th><td>${esc(val).replace(/\n/g, "<br/>")}</td></tr>`;
          })
          .join("");
        return `<h2>${esc(sec.id)}) ${esc(sec.title)}</h2><table>${rows}</table><hr/>`;
      })
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>HZZ – svi odgovori</title>
<style>@page{size:A4;margin:14mm}body{font:12px system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111}
h1{font-size:18px;margin:0 0 10px 0}h2{font-size:15px;margin:20px 0 6px 0}.meta{font-size:11px;color:#555;margin:0 0 12px 0}
table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}
th{width:36%;background:#f7f7f7;text-align:left}hr{border:none;border-top:1px solid #ccc;margin:18px 0}
</style></head><body>
<h1>Svi odgovori – HZZ zahtjev</h1>
<div class="meta">Generirano: ${esc(new Date().toLocaleString())}</div>
${htmlParts}
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),250);};</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) return alert("Popup blokiran. Dozvoli otvaranje novog prozora.");
    win.document.write(html);
    win.document.close();
  }

  const section = getSection(active);
  const right = data[active].right;
  const rightHints = data[active].rightHints;
  const rightIsBlank = Object.values(right).every((v) => !v);

  return (
    <div className="h-screen overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">

      <div className="flex h-full p-3 min-h-0">
        {/* ===== Lijevo: idea + CV ===== */}
        <div
          className="flex flex-col bg-white border rounded-md min-h-0 overflow-hidden dark:bg-neutral-900 dark:border-neutral-700"
          style={{ width: `${leftWidth}%`, marginRight: "0.5rem" }}
        >
          <div className="sticky top-0 z-30 bg-white border-b dark:bg-neutral-900 dark:border-neutral-700">
            <div className="p-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Plan i ulazni podaci</h2>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  Opiši obrt i ciljeve. Na temelju toga generirat ćemo kompletan primjer.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generateFromExample}
                  className="px-3 py-1.5 rounded border text-sm
                            border-neutral-300 dark:border-neutral-700
                            bg-white hover:bg-neutral-100
                            dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  title="Učitaj ugrađene primjere u desni panel"
                >
                  Use existing example
                </button>

                {/* toggle desno od gumba */}
                <ThemeToggle on={isDark} toggle={toggle} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3">
            <label className="text-sm font-medium">Kratak opis plana (idea)</label>
            <textarea
              className="block w-full rounded-md border px-3 py-2 text-sm
                         border-neutral-300 bg-white text-neutral-900
                         dark:bg-neutral-800 dark:text-white dark:border-neutral-700
                         placeholder-neutral-500 dark:placeholder-neutral-400
                         min-h-[120px] resize-y"
              placeholder="Vrsta obrta, usluge, ciljni klijenti, tržišta, kanali prodaje, ključni alati/tehnologije, lokacija, plan troškova/prihoda…"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />

            {/* <div>
              <label className="text-sm font-medium">Životopis (PDF/DOCX/TXT)</label>
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="mt-1 block w-full text-sm"
                     onChange={(e) => onCvSelected(e.target.files?.[0] ?? null)} />
              <div className="text-xs text-neutral-500 mt-1">{cvB64 ? "Datoteka učitana." : "Nije učitano."}</div>
            </div> */}

            <button
              onClick={debugWebhook}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-60
                         dark:bg-white dark:text-black"
              disabled={isGenerating || (!idea && !cvB64)}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  Generiranje primjera <Spinner className="text-white dark:text-black" />
                </span>
              ) : (
                "Generiraj primjer"
              )}
            </button>
            <div aria-busy={isGenerating}>
              {isGenerating ? 
                ( 
                <>
                Generiranje primjera može trajati do 3 minute...<br />
                Molimo za strpljenje (slobodno se vratite za 2 minute da bi provjerili rezultate).
                </>
                ) : ("")
              }
            </div>
          </div>
        </div>

        {/* ===== Resizer ===== */}
        <div
          className="w-1 bg-neutral-300 rounded cursor-col-resize select-none dark:bg-neutral-700"
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
          style={{ margin: "0 0.5rem" }}
          title="Povuci za promjenu širine"
        />

        {/* ===== Desno: Stepper + forma ===== */}
        <div
          className="flex flex-col bg-white border rounded-md min-h-0 overflow-hidden flex-1
                     dark:bg-neutral-900 dark:border-neutral-700"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="sticky top-0 z-30 bg-white border-b p-3 dark:bg-neutral-900 dark:border-neutral-700">
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
                            ? "bg-black text-white border-black dark:bg-[var(--color-accent-600)] dark:text-white dark:border-[var(--color-accent-600)]"
                            : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700",
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
                                    ? "bg-black text-white border-black dark:bg-[var(--color-accent-600)] dark:text-white dark:border-[var(--color-accent-600)]"
                                    : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700",
                                ].join(" ")}
                                title={`${child.id}) ${child.title}`}
                              >
                                {isActiveChild ? `${child.id}) ${child.title}` : child.id}
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
              <span className="text-sm text-neutral-600 dark:text-neutral-400">({active}) {section.title}</span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Desna strana je prazna dok ne generiraš primjer ili dok ne pošalješ podatke.
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {rightIsBlank ? (
              <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">
                Još nema podataka za ovu sekciju. Koristi <b>“Generiraj primjer”</b> s lijeve strane.
              </div>
            ) : (
              // Nema light-form: desni inputi slijede dark skin iz global.css
              <SectionForm
                fields={section.fields}
                values={right}
                hints={rightHints}
                onChange={(k, v) => setRight(active, { ...right, [k]: v })}
              />
            )}
          </div>

          <div className="sticky bottom-0 z-30 bg-white border-t p-3 flex items-center gap-2 justify-end dark:bg-neutral-900 dark:border-neutral-700">
            <button
              onClick={exportAllSectionsPdf}
              className="px-3 py-2 rounded bg-red-700 text-white border border-black hover:bg-red-700
                         focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 active:bg-red-800 disabled:opacity-60"
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
