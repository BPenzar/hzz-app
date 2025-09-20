// app/hzz/components/SectionForm.tsx
import { useFormStore } from "../lib/formStore";
import { getSectionConfig } from "../lib/hzzSchema";

export default function SectionForm({
  side,
  sectionId,
}: {
  side: "left" | "right";
  sectionId: string;
}) {
  const { dataLeft, dataRight, updateField } = useFormStore();
  const section = getSectionConfig(sectionId);
  const values = side === "left" ? dataLeft[sectionId] : dataRight[sectionId];

  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{section.label}</h2>
      {section.fields.map(f => {
        const val = values?.[f.key] ?? "";
        const placeholder =
          side === "right" && !val
            ? f.example ?? "" // placeholder iz primjera nakon obrade
            : f.placeholder ?? "";

        // "missing" naglasi crveno u desnom panelu
        const missing = side === "right" && !val;

        return (
          <div key={f.key}>
            <label className="block text-sm font-medium mb-1">{f.label}</label>
            <input
              value={val}
              onChange={(e) => updateField(side, sectionId, f.key, e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded border px-3 py-2 ${missing ? "placeholder-red-600 text-red-700/90" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
}
