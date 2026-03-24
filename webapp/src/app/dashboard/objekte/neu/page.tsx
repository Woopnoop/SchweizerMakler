"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  titel: string;
  beschreibung: string;
  listingType: "miete" | "kauf";
  preis: string;
  status: string;
  adresse: string;
  plz: string;
  stadt: string;
  wohnflaeche: string;
  grundstueck: string;
  zimmer: string;
  baujahr: string;
  energieausweis: {
    art: string;
    endenergiebedarf: string;
    effizienzklasse: string;
    energietraeger: string;
    baujahrHeizung: string;
  };
}

type FieldErrors = Record<string, string[] | undefined>;

const initialFormData: FormData = {
  titel: "",
  beschreibung: "",
  listingType: "kauf",
  preis: "",
  status: "aktiv",
  adresse: "",
  plz: "",
  stadt: "",
  wohnflaeche: "",
  grundstueck: "",
  zimmer: "",
  baujahr: "",
  energieausweis: {
    art: "",
    endenergiebedarf: "",
    effizienzklasse: "",
    energietraeger: "",
    baujahrHeizung: "",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NeuesObjektPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateEnergieausweis(
    field: keyof FormData["energieausweis"],
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      energieausweis: { ...prev.energieausweis, [field]: value },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setGlobalError(null);

    // Build payload
    const energieausweis =
      form.energieausweis.art ||
      form.energieausweis.endenergiebedarf ||
      form.energieausweis.effizienzklasse ||
      form.energieausweis.energietraeger ||
      form.energieausweis.baujahrHeizung
        ? {
            art: form.energieausweis.art || undefined,
            endenergiebedarf: form.energieausweis.endenergiebedarf
              ? Number(form.energieausweis.endenergiebedarf)
              : undefined,
            effizienzklasse:
              form.energieausweis.effizienzklasse || undefined,
            energietraeger:
              form.energieausweis.energietraeger || undefined,
            baujahrHeizung: form.energieausweis.baujahrHeizung
              ? Number(form.energieausweis.baujahrHeizung)
              : undefined,
          }
        : undefined;

    const payload = {
      titel: form.titel,
      beschreibung: form.beschreibung || undefined,
      listingType: form.listingType,
      preis: form.preis ? Number(form.preis) : undefined,
      status: form.status,
      adresse: form.adresse || undefined,
      plz: form.plz || undefined,
      stadt: form.stadt || undefined,
      wohnflaeche: form.wohnflaeche ? Number(form.wohnflaeche) : undefined,
      grundstueck: form.grundstueck ? Number(form.grundstueck) : undefined,
      zimmer: form.zimmer ? Number(form.zimmer) : undefined,
      baujahr: form.baujahr ? Number(form.baujahr) : undefined,
      energieausweis,
    };

    try {
      const res = await fetch("/api/objekte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const json = await res.json();
        setErrors(json.details ?? {});
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Fehler beim Speichern");
      }

      router.push("/dashboard/objekte");
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Unbekannter Fehler",
      );
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/objekte"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Neues Objekt</h1>
        <p className="mt-1 text-sm text-gray-500">
          Erfassen Sie ein neues Immobilien-Objekt.
        </p>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ============================================================ */}
        {/* Basisdaten */}
        {/* ============================================================ */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basisdaten
          </h2>
          <div className="space-y-4">
            {/* Titel */}
            <div>
              <label
                htmlFor="titel"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Titel <span className="text-red-500">*</span>
              </label>
              <input
                id="titel"
                type="text"
                value={form.titel}
                onChange={(e) => updateField("titel", e.target.value)}
                placeholder="z.B. Sonnige 3-Zimmer-Wohnung in Erlangen"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.titel && (
                <p className="mt-1 text-xs text-red-600">{errors.titel[0]}</p>
              )}
            </div>

            {/* Beschreibung */}
            <div>
              <label
                htmlFor="beschreibung"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Beschreibung
              </label>
              <textarea
                id="beschreibung"
                rows={4}
                value={form.beschreibung}
                onChange={(e) => updateField("beschreibung", e.target.value)}
                placeholder="Optionale Beschreibung des Objekts..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.beschreibung && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.beschreibung[0]}
                </p>
              )}
            </div>

            {/* Listing Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Art <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
                <button
                  type="button"
                  onClick={() => updateField("listingType", "kauf")}
                  className={`px-6 py-2 text-sm font-medium transition-colors ${
                    form.listingType === "kauf"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Kauf
                </button>
                <button
                  type="button"
                  onClick={() => updateField("listingType", "miete")}
                  className={`px-6 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                    form.listingType === "miete"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Miete
                </button>
              </div>
              {errors.listingType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.listingType[0]}
                </p>
              )}
            </div>

            {/* Preis + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="preis"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Preis ({form.listingType === "miete" ? "EUR/Monat" : "EUR"}){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="preis"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.preis}
                  onChange={(e) => updateField("preis", e.target.value)}
                  placeholder="z.B. 350000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.preis && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.preis[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="aktiv">Aktiv</option>
                  <option value="reserviert">Reserviert</option>
                  <option value="verkauft">Verkauft</option>
                  <option value="vermietet">Vermietet</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Adresse */}
        {/* ============================================================ */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Adresse</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="adresse"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Straße und Hausnummer
              </label>
              <input
                id="adresse"
                type="text"
                value={form.adresse}
                onChange={(e) => updateField("adresse", e.target.value)}
                placeholder="z.B. Hauptstraße 42"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="plz"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  PLZ
                </label>
                <input
                  id="plz"
                  type="text"
                  maxLength={5}
                  value={form.plz}
                  onChange={(e) => updateField("plz", e.target.value)}
                  placeholder="z.B. 91052"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.plz && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.plz[0]}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="stadt"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Stadt
                </label>
                <input
                  id="stadt"
                  type="text"
                  value={form.stadt}
                  onChange={(e) => updateField("stadt", e.target.value)}
                  placeholder="z.B. Erlangen"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Details */}
        {/* ============================================================ */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="wohnflaeche"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Wohnfläche (m²)
              </label>
              <input
                id="wohnflaeche"
                type="number"
                step="0.01"
                min="0"
                value={form.wohnflaeche}
                onChange={(e) => updateField("wohnflaeche", e.target.value)}
                placeholder="z.B. 85"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="grundstueck"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Grundstück (m²)
              </label>
              <input
                id="grundstueck"
                type="number"
                step="0.01"
                min="0"
                value={form.grundstueck}
                onChange={(e) => updateField("grundstueck", e.target.value)}
                placeholder="z.B. 450"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="zimmer"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Zimmer
              </label>
              <input
                id="zimmer"
                type="number"
                step="0.5"
                min="0"
                value={form.zimmer}
                onChange={(e) => updateField("zimmer", e.target.value)}
                placeholder="z.B. 3"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="baujahr"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Baujahr
              </label>
              <input
                id="baujahr"
                type="number"
                min="1800"
                max="2026"
                value={form.baujahr}
                onChange={(e) => updateField("baujahr", e.target.value)}
                placeholder="z.B. 1995"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.baujahr && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.baujahr[0]}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Energieausweis */}
        {/* ============================================================ */}
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Energieausweis
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="ea-art"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Art
              </label>
              <select
                id="ea-art"
                value={form.energieausweis.art}
                onChange={(e) => updateEnergieausweis("art", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Keine Angabe --</option>
                <option value="bedarfsausweis">Bedarfsausweis</option>
                <option value="verbrauchsausweis">Verbrauchsausweis</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="ea-endenergiebedarf"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Endenergiebedarf (kWh/m²a)
              </label>
              <input
                id="ea-endenergiebedarf"
                type="number"
                step="0.1"
                min="0"
                value={form.energieausweis.endenergiebedarf}
                onChange={(e) =>
                  updateEnergieausweis("endenergiebedarf", e.target.value)
                }
                placeholder="z.B. 120"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="ea-effizienzklasse"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Effizienzklasse
              </label>
              <select
                id="ea-effizienzklasse"
                value={form.energieausweis.effizienzklasse}
                onChange={(e) =>
                  updateEnergieausweis("effizienzklasse", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Keine Angabe --</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="G">G</option>
                <option value="H">H</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="ea-energietraeger"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Energieträger
              </label>
              <input
                id="ea-energietraeger"
                type="text"
                value={form.energieausweis.energietraeger}
                onChange={(e) =>
                  updateEnergieausweis("energietraeger", e.target.value)
                }
                placeholder="z.B. Gas, Fernwärme"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="ea-baujahrHeizung"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Baujahr Heizung
              </label>
              <input
                id="ea-baujahrHeizung"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={form.energieausweis.baujahrHeizung}
                onChange={(e) =>
                  updateEnergieausweis("baujahrHeizung", e.target.value)
                }
                placeholder="z.B. 2010"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Submit */}
        {/* ============================================================ */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/objekte"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Objekt speichern
          </button>
        </div>
      </form>
    </div>
  );
}
