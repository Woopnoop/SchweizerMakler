"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileDown, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function ExposePage() {
  const params = useParams();
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/expose/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objektId: params.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler bei der Exposé-Erstellung");
        return;
      }

      // HTML-Datei herunterladen
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Expose-${params.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/objekte/${params.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Objekt
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Exposé erstellen</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-6 text-center">
          <FileDown className="mx-auto mb-4 h-16 w-16 text-blue-600" />
          <h2 className="text-lg font-semibold">HTML-Exposé generieren</h2>
          <p className="mt-2 text-sm text-gray-500">
            Erstellt ein professionelles Exposé als HTML-Datei. Öffnen Sie die Datei
            im Browser und drucken Sie als PDF (Strg+P → Als PDF speichern).
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Pflichtangaben nach GEG</p>
              <p className="mt-1">
                Bei gewerblicher Immobilienwerbung müssen Energieausweisdaten
                angegeben werden. Stellen Sie sicher, dass die Daten beim Objekt
                hinterlegt sind.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generating ? "Wird erstellt..." : "Exposé herunterladen"}
        </button>
      </div>
    </div>
  );
}
