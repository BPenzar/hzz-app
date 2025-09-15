"use client";

export default function DownloadDraft() {
  async function download() {
    const payload = {
      status: "nezaposlen",
      nkd: "J62.0",
      zupanija: "Grad Zagreb",
      plan: [
        { naziv: "Laptop", iznos: 1200 },
        { naziv: "Softver", iznos: 300 },
      ],
    };
    const res = await fetch("/api/hzz/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "hzz-nacrt.docx",
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return <button className="border px-4 py-2" onClick={download}>Preuzmi .docx nacrt</button>;
}

