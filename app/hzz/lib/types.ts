export type JsonField = { key: string; label: string; type: "text" | "textarea"; required?: boolean };
export type JsonSection = { id: string; key: string; title: string; fields: JsonField[] };

export type UiField = { name: string; label: string; long?: boolean; required?: boolean };
export type UiSection = { id: string; title: string; fields: UiField[] };

export type SectionValues = Record<string, string>;
export type AllValues = Record<string, SectionValues>;
