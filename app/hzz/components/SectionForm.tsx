// app/hzz/components/SectionForm.tsx
"use client";

import React from "react";
import { FieldControl } from "./FieldControl";

export type UiField = { name: string; label: string; long?: boolean; required?: boolean; placeholder?: string };

type Props = {
  fields: UiField[];
  values: Record<string, string>;
  hints?: Record<string, string>; // { [fieldName]: "Nedostaje…" }
  onChange: (name: string, value: string) => void;
};

export function SectionForm({ fields, values, hints, onChange }: Props) {
  const missingCount = fields.reduce((acc, f) => (hints?.[f.name] ? acc + 1 : acc), 0);

  return (
    <div>
      {missingCount > 0 && (
        <div className="mb-3 text-xs rounded border border-orange-200 bg-orange-50 text-orange-800 px-2.5 py-2">
          Nedostaje {missingCount} polja. Pogledaj označena polja s oznakom <b>Missing</b>.
        </div>
      )}

      {fields.map((f) => (
        <FieldControl
          key={f.name}
          label={f.label}
          long={f.long}
          value={values[f.name] ?? ""}
          placeholder={f.placeholder}
          missingText={hints?.[f.name]}
          onChange={(val) => onChange(f.name, val)}
        />
      ))}
    </div>
  );
}
