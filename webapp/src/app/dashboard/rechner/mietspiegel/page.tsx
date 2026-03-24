"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface MietspiegelResult {
  proQm: { min: number; mitte: number; max: number };
  gesamt: { min: number; mitte: number; max: number };
  vergleich?: {
    ueberSpiegel: boolean;
    differenzProzent: number;
    differenzAbsolut: number;
  };
  quellenangabe: string;
  gueltigBis: string;
}

// ============================================================
// Constants
// ============================================================

const STAEDTE = [
  { value: "nuernberg", label: "Nürnberg" },
  { value: "erlangen", label: "Erlangen" },
  { value: "fuerth", label: "Fürth" },
] as const;

const BAUJAHR_KLASSEN = [
  { value: "vor 1918", label: "vor 1918" },
  { value: "1919-1948", label: "1919 - 1948" },
  { value: "1949-1968", label: "1949 - 1968" },
  { value: "1969-1990", label: "1969 - 1990" },
  { value: "1991-2000", label: "1991 - 2000" },
  { value: "2001-2010", label: "2001 - 2010" },
  { value: "nach 2010", label: "nach 2010" },
] as const;

const LAGEN = [
  {
    value: "einfach",
    label: "Einfache Lage",
    tooltip: "Hohe Verkehrsdichte, wenig Grün, einfache Bebauung",
  },
  {
    value: "mittel",
    label: "Mittlere Lage",
    tooltip: "Durchschnittliche Wohnqualität, gute Infrastruktur",
  },
  {
    value: "gut",
    label: "Gute Lage",
    tooltip: "Ruhig, gepflegt, gute Anbindung, viel Grün",
  },
] as const;

const AUSSTATTUNGEN = [
  { value: "einfach", label: "Einfach" },
  { value: "mittel", label: "Mittel" },
  { value: "gut", label: "Gut" },
  { value: "gehoben", label: "Gehoben" },
] as const;

/** Format number to German locale */
function eur(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ============================================================
// Main Page
// ============================================================

export default function MietspiegelPage() {
  // Form state
  const [stadt, setStadt] = useState("nuernberg");
  const [baujahr, setBaujahr] = useState("1969-1990");
  const [lage, setLage] = useState("mittel");
  const [ausstattung, setAusstattung] = useState("mittel");
  const [wohnflaeche, setWohnflaeche] = useState(70);
  const [aktuelleMiete, setAktuelleMiete] = useState<string>("");
  const [showLageTooltip, setShowLageTooltip] = useState(false);

  // Result state
  const [result, setResult] = useState<MietspiegelResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: Record<string, unknown> = {
        stadt,
        baujahr,
        lage,
        ausstattung,
        wohnflaeche,
      };

      if (aktuelleMiete && Number(aktuelleMiete) > 0) {
        payload.aktuelleMiete = Number(aktuelleMiete);
      }

      const res = await fetch("/api/rechner/mietspiegel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Ein Fehler ist aufgetreten.");
        return;
      }

      setResult(json.result);
    } catch {
      setError("Verbindungsfehler — bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  const stadtLabel =
    STAEDTE.find((s) => s.value === stadt)?.label ?? stadt;

  return (
    <div>
      {/* Header with back link */}
      <div className="mb-8">
        <Link
          href="/dashboard/rechner"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[var(--brand)] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Rechner
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <Calculator className="h-5 w-5 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mietpreisspiegel
            </h1>
            <p className="text-sm text-gray-600">
              Ortsübliche Vergleichsmiete für Erlangen, Fürth und Nürnberg
            </p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            Beispieldaten — Bitte verifizieren Sie die Werte anhand der
            offiziellen Mietspiegel-Publikationen.
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Die angezeigten Werte dienen als Orientierungshilfe und ersetzen
            nicht die offiziellen Mietspiegel der jeweiligen Stadt.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">Eingaben</h2>

          <div className="mt-6 space-y-6">
            {/* Stadt */}
            <div>
              <label
                htmlFor="stadt"
                className="block text-sm font-medium text-gray-700"
              >
                Stadt
              </label>
              <select
                id="stadt"
                value={stadt}
                onChange={(e) => setStadt(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              >
                {STAEDTE.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Baujahr */}
            <div>
              <label
                htmlFor="baujahr"
                className="block text-sm font-medium text-gray-700"
              >
                Baujahr
              </label>
              <select
                id="baujahr"
                value={baujahr}
                onChange={(e) => setBaujahr(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              >
                {BAUJAHR_KLASSEN.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lage */}
            <div>
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="lage"
                  className="block text-sm font-medium text-gray-700"
                >
                  Wohnlage
                </label>
                <button
                  type="button"
                  onClick={() => setShowLageTooltip((p) => !p)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              {showLageTooltip && (
                <div className="mt-1 mb-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 space-y-1">
                  {LAGEN.map((l) => (
                    <p key={l.value}>
                      <span className="font-semibold">{l.label}:</span>{" "}
                      {l.tooltip}
                    </p>
                  ))}
                </div>
              )}
              <select
                id="lage"
                value={lage}
                onChange={(e) => setLage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              >
                {LAGEN.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Ausstattung */}
            <div>
              <label
                htmlFor="ausstattung"
                className="block text-sm font-medium text-gray-700"
              >
                Ausstattung
              </label>
              <select
                id="ausstattung"
                value={ausstattung}
                onChange={(e) => setAusstattung(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
              >
                {AUSSTATTUNGEN.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wohnfläche */}
            <div>
              <label
                htmlFor="wohnflaeche"
                className="block text-sm font-medium text-gray-700"
              >
                Wohnfläche
              </label>
              <div className="relative mt-1">
                <input
                  id="wohnflaeche"
                  type="number"
                  min={10}
                  max={500}
                  step={1}
                  value={wohnflaeche}
                  onChange={(e) => setWohnflaeche(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-12 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  m&sup2;
                </span>
              </div>
            </div>

            {/* Aktuelle Kaltmiete (optional) */}
            <div>
              <label
                htmlFor="aktuelleMiete"
                className="block text-sm font-medium text-gray-700"
              >
                Aktuelle Kaltmiete{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative mt-1">
                <input
                  id="aktuelleMiete"
                  type="number"
                  min={0}
                  step={1}
                  value={aktuelleMiete}
                  onChange={(e) => setAktuelleMiete(e.target.value)}
                  placeholder="z.B. 650"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm placeholder:text-gray-300 focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  &euro;
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Geben Sie die aktuelle Nettokaltmiete ein, um einen Vergleich
                mit dem Mietspiegel zu erhalten.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Berechne..." : "Mietspiegel berechnen"}
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!result && !error && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <Calculator className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">
                Füllen Sie das Formular aus und klicken Sie auf
                &quot;Mietspiegel berechnen&quot;.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Rent range highlight */}
              <div className="rounded-xl bg-[var(--brand)] p-6 text-white shadow-sm">
                <p className="text-sm font-medium text-blue-100">
                  Ortsübliche Vergleichsmiete (Mitte)
                </p>
                <p className="mt-2 text-4xl font-bold">
                  {eur(result.gesamt.mitte)} &euro;
                </p>
                <p className="mt-1 text-sm text-blue-200">
                  {eur(result.proQm.mitte)} &euro;/m&sup2; &middot;{" "}
                  {wohnflaeche} m&sup2;
                </p>
              </div>

              {/* Per m² breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Mietspanne pro m&sup2;
                </h2>
                <div className="mt-4">
                  {/* Visual range bar */}
                  <div className="relative mt-2 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 w-16 text-right">
                        {eur(result.proQm.min)} &euro;
                      </span>
                      <div className="relative flex-1 h-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100" />
                        {/* Mitte indicator */}
                        <div
                          className="absolute top-0 h-8 w-0.5 bg-[var(--brand)]"
                          style={{
                            left: `${
                              result.proQm.max > result.proQm.min
                                ? ((result.proQm.mitte - result.proQm.min) /
                                    (result.proQm.max - result.proQm.min)) *
                                  100
                                : 50
                            }%`,
                          }}
                        />
                        {/* Current rent indicator */}
                        {result.vergleich &&
                          aktuelleMiete &&
                          Number(aktuelleMiete) > 0 && (
                            <div
                              className={`absolute top-0 h-8 w-1 rounded ${
                                result.vergleich.ueberSpiegel
                                  ? "bg-red-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                left: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    result.proQm.max > result.proQm.min
                                      ? ((Number(aktuelleMiete) /
                                          wohnflaeche -
                                          result.proQm.min) /
                                          (result.proQm.max -
                                            result.proQm.min)) *
                                        100
                                      : 50,
                                  ),
                                )}%`,
                              }}
                            />
                          )}
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-16">
                        {eur(result.proQm.max)} &euro;
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between px-18 text-xs text-gray-400">
                      <span>Minimum</span>
                      <span>Maximum</span>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="py-3 text-gray-600">Minimum</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {eur(result.proQm.min)} &euro;/m&sup2;
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-600 font-medium">
                          Mittelwert
                        </td>
                        <td className="py-3 text-right font-bold text-gray-900">
                          {eur(result.proQm.mitte)} &euro;/m&sup2;
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 text-gray-600">Maximum</td>
                        <td className="py-3 text-right font-medium text-gray-900">
                          {eur(result.proQm.max)} &euro;/m&sup2;
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total rent breakdown */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gesamtmiete ({wohnflaeche} m&sup2;)
                </h2>
                <table className="mt-4 w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 text-gray-600">Minimum</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {eur(result.gesamt.min)} &euro;
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-medium">
                        Mittelwert
                      </td>
                      <td className="py-3 text-right font-bold text-gray-900">
                        {eur(result.gesamt.mitte)} &euro;
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600">Maximum</td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {eur(result.gesamt.max)} &euro;
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comparison with current rent */}
              {result.vergleich && (
                <div
                  className={`rounded-xl border p-6 shadow-sm ${
                    result.vergleich.ueberSpiegel
                      ? "border-red-200 bg-red-50"
                      : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.vergleich.ueberSpiegel ? (
                      <TrendingUp className="mt-0.5 h-5 w-5 text-red-500" />
                    ) : Math.abs(result.vergleich.differenzProzent) < 5 ? (
                      <Minus className="mt-0.5 h-5 w-5 text-gray-500" />
                    ) : (
                      <TrendingDown className="mt-0.5 h-5 w-5 text-emerald-500" />
                    )}
                    <div>
                      <h3
                        className={`font-semibold ${
                          result.vergleich.ueberSpiegel
                            ? "text-red-800"
                            : "text-emerald-800"
                        }`}
                      >
                        {result.vergleich.ueberSpiegel
                          ? "Aktuelle Miete liegt über dem Mietspiegel"
                          : Math.abs(result.vergleich.differenzProzent) < 5
                            ? "Aktuelle Miete liegt im Bereich des Mietspiegels"
                            : "Aktuelle Miete liegt unter dem Mietspiegel"}
                      </h3>
                      <p
                        className={`mt-1 text-sm ${
                          result.vergleich.ueberSpiegel
                            ? "text-red-700"
                            : "text-emerald-700"
                        }`}
                      >
                        Differenz zum Mittelwert:{" "}
                        <span className="font-semibold">
                          {result.vergleich.differenzAbsolut > 0 ? "+" : ""}
                          {eur(result.vergleich.differenzAbsolut)} &euro;
                        </span>{" "}
                        (
                        {result.vergleich.differenzProzent > 0 ? "+" : ""}
                        {result.vergleich.differenzProzent.toLocaleString(
                          "de-DE",
                          { maximumFractionDigits: 1 },
                        )}
                        %)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Source */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">Quelle:</span>{" "}
                  {result.quellenangabe}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Gültig bis:{" "}
                  {new Date(result.gueltigBis).toLocaleDateString("de-DE")}
                </p>
              </div>
            </>
          )}

          {/* General disclaimer */}
          <p className="text-xs text-gray-400 leading-relaxed">
            Alle Angaben ohne Gewähr. Die Berechnung dient als
            Orientierungshilfe und ersetzt keine professionelle Mietberatung.
            Die ortsübliche Vergleichsmiete ist die Nettokaltmiete ohne
            Betriebskosten.
          </p>
        </div>
      </div>
    </div>
  );
}
