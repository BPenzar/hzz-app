export const dynamic = "force-dynamic";
import DownloadDraft from "./DownloadDraft";

export default function ProPage({ searchParams }: { searchParams?: { trial?: string } }) {
  const trialDays = searchParams?.trial ?? "0";
  return (
    <section className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">HZZ Pro</h1>
      <p>Imaš pristup (trial {trialDays} dana).</p>
      <p>Ovdje će kasnije ići generiranje .docx/.pdf i napredna validacija.</p>
      <DownloadDraft />
    </section>
  );
}

