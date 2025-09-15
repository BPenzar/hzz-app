import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

type PlanItem = { naziv: string; iznos: number };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const {
    status = "",
    nkd = "",
    zupanija = "",
    plan = [] as PlanItem[],
  } = body as {
    status?: string;
    nkd?: string;
    zupanija?: string;
    plan?: PlanItem[];
  };

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: "HZZ – Nacrt zahtjeva", bold: true, size: 32 })] }),
          new Paragraph(" "),
          new Paragraph(`Status podnositelja: ${status}`),
          new Paragraph(`NKD: ${nkd}`),
          new Paragraph(`Županija: ${zupanija}`),
          new Paragraph(" "),
          new Paragraph({ children: [new TextRun({ text: "Plan troškova:", bold: true })] }),
          ...plan.map((p: PlanItem) => new Paragraph(`- ${p.naziv}: ${p.iznos.toFixed(2)} EUR`)),
          new Paragraph(" "),
          new Paragraph({ children: [new TextRun({ text: "Napomena:", bold: true })] }),
          new Paragraph("Ovo je automatski generiran nacrt. Provjerite iznose, datume i priloge prije predaje."),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="hzz-nacrt.docx"',
    },
  });
}
