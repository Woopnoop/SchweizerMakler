"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calculator, ArrowRight, Home as HomeIcon } from "lucide-react";

/** Format number to German locale (e.g. 1.234,56) */
function eur(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function eurInt(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const GRUNDERWERBSTEUER_BAYERN = 3.5;
const NOTAR_UND_GRUNDBUCH = 2.0;

const zinsbindungOptions = [10, 15, 20, 25, 30] as const;

export default function RechnerPage() {
  const [kaufpreis, setKaufpreis] = useState(350000);
  const [eigenkapital, setEigenkapital] = useState(70000);
  const [maklerprovision, setMaklerprovision] = useState(3.57);
  const [zinssatz, setZinssatz] = useState(3.5);
  const [tilgung, setTilgung] = useState(2.0);
  const [zinsbindung, setZinsbindung] = useState<number>(10);

  const result = useMemo(() => {
    const grunderwerbsteuer = kaufpreis * (GRUNDERWERBSTEUER_BAYERN / 100);
    const notarKosten = kaufpreis * (NOTAR_UND_GRUNDBUCH / 100);
    const maklerKosten = kaufpreis * (maklerprovision / 100);
    const gesamtnebenkosten = grunderwerbsteuer + notarKosten + maklerKosten;
    const gesamtkosten = kaufpreis + gesamtnebenkosten;
    const darlehensbetrag = Math.max(0, gesamtkosten - eigenkapital);

    // Monthly annuity calculation
    const monatszins = zinssatz / 100 / 12;
    const jahresAnnuitaet = darlehensbetrag * ((zinssatz + tilgung) / 100);
    const monatsrate = jahresAnnuitaet / 12;

    // Remaining debt after Zinsbindung period (annuity formula)
    const monate = zinsbindung * 12;
    let restschuld = darlehensbetrag;
    for (let i = 0; i < monate; i++) {
      const zinsenMonat = restschuld * monatszins;
      const tilgungMonat = monatsrate - zinsenMonat;
      restschuld = Math.max(0, restschuld - tilgungMonat);
      if (restschuld <= 0) break;
    }

    const beleihungsquote =
      kaufpreis > 0 ? (darlehensbetrag / kaufpreis) * 100 : 0;

    return {
      grunderwerbsteuer,
      notarKosten,
      maklerKosten,
      gesamtnebenkosten,
      gesamtkosten,
      darlehensbetrag,
      monatsrate,
      restschuld,
      beleihungsquote,
    };
  }, [kaufpreis, eigenkapital, maklerprovision, zinssatz, tilgung, zinsbindung]);

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Calculator className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kaufnebenkosten-Rechner
          </h1>
          <p className="text-sm text-gray-600">
            Bayern &mdash; Grunderwerbsteuer {GRUNDERWERBSTEUER_BAYERN}%
          </p>
        </div>
      </div>

      {/* Calculator navigation tabs */}
      <div className="mb-8 flex flex-wrap gap-3">
        <span className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white">
          <Calculator className="h-4 w-4" />
          Kaufnebenkosten
        </span>
        <Link
          href="/dashboard/rechner/mietspiegel"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-[var(--brand)] transition-colors group"
        >
          <HomeIcon className="h-4 w-4 text-gray-400 group-hover:text-[var(--brand)]" />
          Mietpreisspiegel
          <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[var(--brand)]" />
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Eingaben</h2>

          <div className="mt-6 space-y-6">
            {/* Kaufpreis */}
            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="kaufpreis"
                  className="text-sm font-medium text-gray-700"
                >
                  Kaufpreis
                </label>
                <span className="text-sm font-semibold text-gray-900">
                  {eurInt(kaufpreis)} &euro;
                </span>
              </div>
              <input
                id="kaufpreis"
                type="range"
                min={50000}
                max={5000000}
                step={5000}
                value={kaufpreis}
                onChange={(e) => setKaufpreis(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--brand)]"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>50.000 &euro;</span>
                <span>5.000.000 &euro;</span>
              </div>
            </div>

            {/* Eigenkapital */}
            <div>
              <label
                htmlFor="eigenkapital"
                className="block text-sm font-medium text-gray-700"
              >
                Eigenkapital
              </label>
              <div className="relative mt-1">
                <input
                  id="eigenkapital"
                  type="number"
                  min={0}
                  max={kaufpreis}
                  step={1000}
                  value={eigenkapital}
                  onChange={(e) => setEigenkapital(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  &euro;
                </span>
              </div>
            </div>

            {/* Maklerprovision */}
            <div>
              <label
                htmlFor="maklerprovision"
                className="block text-sm font-medium text-gray-700"
              >
                Maklerprovision (Käuferanteil)
              </label>
              <div className="relative mt-1">
                <input
                  id="maklerprovision"
                  type="number"
                  min={0}
                  max={7}
                  step={0.01}
                  value={maklerprovision}
                  onChange={(e) => setMaklerprovision(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </div>

            {/* Zinssatz */}
            <div>
              <label
                htmlFor="zinssatz"
                className="block text-sm font-medium text-gray-700"
              >
                Sollzinssatz
              </label>
              <div className="relative mt-1">
                <input
                  id="zinssatz"
                  type="number"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={zinssatz}
                  onChange={(e) => setZinssatz(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </div>

            {/* Tilgung */}
            <div>
              <label
                htmlFor="tilgung"
                className="block text-sm font-medium text-gray-700"
              >
                Anfängliche Tilgung
              </label>
              <div className="relative mt-1">
                <input
                  id="tilgung"
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={tilgung}
                  onChange={(e) => setTilgung(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/25"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  %
                </span>
              </div>
            </div>

            {/* Zinsbindung */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Zinsbindung
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {zinsbindungOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setZinsbindung(option)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      zinsbindung === option
                        ? "bg-[var(--brand)] text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option} Jahre
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Monthly Payment Highlight */}
          <div className="rounded-xl bg-[var(--brand)] p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-blue-100">
              Monatliche Rate
            </p>
            <p className="mt-2 text-4xl font-bold">
              {eur(result.monatsrate)} &euro;
            </p>
            <p className="mt-1 text-sm text-blue-200">
              bei {zinssatz}% Zins und {tilgung}% Tilgung
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Kostenaufstellung
            </h2>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 text-gray-600">Kaufpreis</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(kaufpreis)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">
                    Grunderwerbsteuer ({GRUNDERWERBSTEUER_BAYERN}%)
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(result.grunderwerbsteuer)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">
                    Notar &amp; Grundbuch (~{NOTAR_UND_GRUNDBUCH}%)
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(result.notarKosten)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">
                    Maklerprovision ({maklerprovision}%)
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(result.maklerKosten)} &euro;
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-3 font-semibold text-gray-900">
                    Kaufnebenkosten gesamt
                  </td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    {eur(result.gesamtnebenkosten)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold text-gray-900">
                    Gesamtkosten
                  </td>
                  <td className="py-3 text-right font-bold text-gray-900">
                    {eur(result.gesamtkosten)} &euro;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financing Details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Finanzierung
            </h2>
            <table className="mt-4 w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 text-gray-600">Eigenkapital</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(eigenkapital)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">Darlehensbetrag</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(result.darlehensbetrag)} &euro;
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">Beleihungsquote</td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {result.beleihungsquote.toLocaleString("de-DE", {
                      maximumFractionDigits: 1,
                    })}
                    %
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600">
                    Restschuld nach {zinsbindung} Jahren
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900">
                    {eur(result.restschuld)} &euro;
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 leading-relaxed">
            Alle Angaben ohne Gewähr. Die Berechnung dient als
            Orientierungshilfe und ersetzt keine Finanzierungsberatung.
            Grunderwerbsteuer für Bayern: {GRUNDERWERBSTEUER_BAYERN}%. Notar-
            und Grundbuchkosten sind Richtwerte (~{NOTAR_UND_GRUNDBUCH}% vom
            Kaufpreis).
          </p>
        </div>
      </div>
    </div>
  );
}
