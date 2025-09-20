// omogućuje import JSON datoteka kao modula
import structureJson from "../data/generated/hzz-structure.json";
import questionsJson from "../data/generated/hzz-questions.json";
import examplesJson from "../data/generated/hzz-examples.json";

import type { UiSection, JsonSection, UiField, AllValues, SectionValues } from "./types";

function toUiSections(structure: { sections: JsonSection[] }, questions: Record<string, Record<string,string>>): UiSection[] {
  return structure.sections.map((sec) => {
    const q = questions[sec.id] ?? {};
    const fields: UiField[] = sec.fields.map((f) => ({
      name: f.key,
      // ako postoji pitanje/duža etiketa u questions.json, koristi nju; inače label iz structure.json
      label: q[f.key] ?? f.label,
      long: f.type === "textarea",
      required: f.required ?? false,
    }));
    return { id: sec.id, title: sec.title, fields };
  });
}

export const UI_SECTIONS: UiSection[] = toUiSections(structureJson as any, questionsJson as any);

// helper koji vraća prazne vrijednosti po sekciji
export function emptyAllValues(): AllValues {
  const acc: AllValues = {};
  UI_SECTIONS.forEach((s) => { acc[s.id] = {}; });
  return acc;
}

// primjer ulijevo za aktivnu sekciju
export function exampleFor(sectionId: string): SectionValues {
  const ex = (examplesJson as any)[sectionId];
  return ex ? { ...ex } : {};
}
