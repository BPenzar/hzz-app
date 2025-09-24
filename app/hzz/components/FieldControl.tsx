// app/hzz/components/FieldControl.tsx
"use client";

import React from "react";

type Props = {
  label: string;
  value: string;
  long?: boolean;
  placeholder?: string;
  missingText?: string; // npr. "Nedostaje unos…"
  onChange: (v: string) => void;
};

export function FieldControl({ label, value, long, placeholder, missingText, onChange }: Props) {
  const base =
    "w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 text-neutral-900 placeholder:text-neutral-400";
  const cls = [
    base,
    missingText ? "border-orange-300 focus:ring-orange-200 placeholder:text-orange-500" : "focus:ring-neutral-200",
  ].join(" ");

  return (
    <div className="mb-3">
      <label className="block text-sm mb-1">
        {label}{" "}
        {missingText && <span className="ml-1 text-[11px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">Missing</span>}
      </label>

      {long ? (
        <textarea
          className={`${cls} min-h-28`}
          value={value}
          placeholder={placeholder ?? label}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(missingText)}
          data-missing={Boolean(missingText)}
        />
      ) : (
        <input
          className={cls}
          value={value}
          placeholder={placeholder ?? label}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(missingText)}
          data-missing={Boolean(missingText)}
        />
      )}

      {missingText && <p className="mt-1 text-xs text-orange-700">{missingText}</p>}
    </div>
  );
}
