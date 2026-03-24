"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  MapPin,
  Home,
  Zap,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Energieausweis {
  art?: string;
  endenergiebedarf?: number;
  effizienzklasse?: string;
  energietraeger?: string;
  baujahrHeizung?: number;
}

interface Objekt {
  id: string;
  maklerId: string;
  titel: string;
  beschreibung: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
  locationLat: string | null;
  locationLon: string | null;
  preis: string | null;
  listingType: string;
  wohnflaeche: string | null;
  grundstueck: string | null;
  zimmer: string | null;
  baujahr: number | null;
  energieausweis: Energieausweis | null;
  ausstattung: Record<string, boolean> | null;
  bilder: string[] | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  titel: string;
  beschreibung: string;
  listingType: string;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPreis(value: string | null, listingType: string): string {
  if (!value) return "\u2014";
  const formatted = Number(value).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  return listingType === "miete" ? `${formatted}/Monat` : formatted;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<string, string> = {
  aktiv: "bg-green-100 text-green-800",
  reserviert: "bg-yellow-100 text-yellow-800",
  verkauft: "bg-blue-100 text-blue-800",
  vermietet: "bg-purple-100 text-purple-800",
};

const statusLabels: Record<string, string> = {
  aktiv: "Aktiv",
  reserviert: "Reserviert",
  verkauft: "Verkauft",
  vermietet: "Vermietet",
};

function objektToForm(obj: Objekt): FormData {
  return {
    titel: obj.titel,
    beschreibung: obj.beschreibung ?? "",
    listingType: obj.listingType,
    preis: obj.preis ?? "",
    status: obj.status,
    adresse: obj.adresse ?? "",
    plz: obj.plz ?? "",
    stadt: obj.stadt ?? "",
    wohnflaeche: obj.wohnflaeche ?? "",
    grundstueck: obj.grundstueck ?? "",
    zimmer: obj.zimmer ?? "",
    baujahr: obj.baujahr != null ? String(obj.baujahr) : "",
    energieausweis: {
      art: obj.energieausweis?.art ?? "",
      endenergiebedarf:
        obj.energieausweis?.endenergiebedarf != null
          ? String(obj.energieausweis.endenergiebedarf)
          : "",
      effizienzklasse: obj.energieausweis?.effizienzklasse ?? "",
      energietraeger: obj.energieausweis?.energietraeger ?? "",
      baujahrHeizung:
        obj.energieausweis?.baujahrHeizung != null
          ? String(obj.energieausweis.baujahrHeizung)
          : "",
    },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ObjektDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [objekt, setObjekt] = useState<Objekt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchObjekt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/objekte/${params.id}`);
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? "Objekt nicht gefunden"
            : "Fehler beim Laden des Objekts",
        );
      }
      const json = await res.json();
      setObjekt(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchObjekt();
  }, [fetchObjekt]);

  // Enter edit mode
  function startEditing() {
    if (!objekt) return;
    setForm(objektToForm(objekt));
    setFieldErrors({});
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
    setFieldErrors({});
    setSaveError(null);
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateEnergieausweis(
    field: keyof FormData["energieausweis"],
    value: string,
  ) {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            energieausweis: { ...prev.energieausweis, [field]: value },
          }
        : prev,
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setFieldErrors({});
    setSaveError(null);

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
      const res = await fetch(`/api/objekte/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 422) {
        const json = await res.json();
        setFieldErrors(json.details ?? {});
        setSaving(false);
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Fehler beim Speichern");
      }

      const json = await res.json();
      setObjekt(json.data);
      setEditing(false);
      setForm(null);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Unbekannter Fehler",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/objekte/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Fehler beim Löschen");
      }
      router.push("/dashboard/objekte");
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Fehler beim Löschen",
      );
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-500">Lade Objekt...</span>
      </div>
    );
  }

  if (error || !objekt) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard/objekte"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            {error || "Objekt nicht gefunden"}
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  if (editing && form) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button
            type="button"
            onClick={cancelEditing}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Abbrechen
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Objekt bearbeiten
          </h1>
        </div>

        {saveError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {saveError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Basisdaten */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Basisdaten
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-titel" className="block text-sm font-medium text-gray-700 mb-1">
                  Titel <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-titel"
                  type="text"
                  value={form.titel}
                  onChange={(e) => updateField("titel", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {fieldErrors.titel && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.titel[0]}</p>
                )}
              </div>
              <div>
                <label htmlFor="edit-beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  id="edit-beschreibung"
                  rows={4}
                  value={form.beschreibung}
                  onChange={(e) => updateField("beschreibung", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {fieldErrors.beschreibung && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.beschreibung[0]}</p>
                )}
              </div>
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
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-preis" className="block text-sm font-medium text-gray-700 mb-1">
                    Preis ({form.listingType === "miete" ? "EUR/Monat" : "EUR"}){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-preis"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.preis}
                    onChange={(e) => updateField("preis", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {fieldErrors.preis && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.preis[0]}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
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

          {/* Adresse */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Adresse</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-adresse" className="block text-sm font-medium text-gray-700 mb-1">
                  Straße und Hausnummer
                </label>
                <input
                  id="edit-adresse"
                  type="text"
                  value={form.adresse}
                  onChange={(e) => updateField("adresse", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-plz" className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ
                  </label>
                  <input
                    id="edit-plz"
                    type="text"
                    maxLength={5}
                    value={form.plz}
                    onChange={(e) => updateField("plz", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {fieldErrors.plz && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.plz[0]}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-stadt" className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    id="edit-stadt"
                    type="text"
                    value={form.stadt}
                    onChange={(e) => updateField("stadt", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-wohnflaeche" className="block text-sm font-medium text-gray-700 mb-1">
                  Wohnfläche (m²)
                </label>
                <input
                  id="edit-wohnflaeche"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.wohnflaeche}
                  onChange={(e) => updateField("wohnflaeche", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-grundstueck" className="block text-sm font-medium text-gray-700 mb-1">
                  Grundstück (m²)
                </label>
                <input
                  id="edit-grundstueck"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.grundstueck}
                  onChange={(e) => updateField("grundstueck", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-zimmer" className="block text-sm font-medium text-gray-700 mb-1">
                  Zimmer
                </label>
                <input
                  id="edit-zimmer"
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.zimmer}
                  onChange={(e) => updateField("zimmer", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-baujahr" className="block text-sm font-medium text-gray-700 mb-1">
                  Baujahr
                </label>
                <input
                  id="edit-baujahr"
                  type="number"
                  min="1800"
                  max="2026"
                  value={form.baujahr}
                  onChange={(e) => updateField("baujahr", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {fieldErrors.baujahr && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.baujahr[0]}</p>
                )}
              </div>
            </div>
          </section>

          {/* Energieausweis */}
          <section className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Energieausweis
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-ea-art" className="block text-sm font-medium text-gray-700 mb-1">
                  Art
                </label>
                <select
                  id="edit-ea-art"
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
                <label htmlFor="edit-ea-endenergiebedarf" className="block text-sm font-medium text-gray-700 mb-1">
                  Endenergiebedarf (kWh/m²a)
                </label>
                <input
                  id="edit-ea-endenergiebedarf"
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.energieausweis.endenergiebedarf}
                  onChange={(e) => updateEnergieausweis("endenergiebedarf", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-ea-effizienzklasse" className="block text-sm font-medium text-gray-700 mb-1">
                  Effizienzklasse
                </label>
                <select
                  id="edit-ea-effizienzklasse"
                  value={form.energieausweis.effizienzklasse}
                  onChange={(e) => updateEnergieausweis("effizienzklasse", e.target.value)}
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
                <label htmlFor="edit-ea-energietraeger" className="block text-sm font-medium text-gray-700 mb-1">
                  Energieträger
                </label>
                <input
                  id="edit-ea-energietraeger"
                  type="text"
                  value={form.energieausweis.energietraeger}
                  onChange={(e) => updateEnergieausweis("energietraeger", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="edit-ea-baujahrHeizung" className="block text-sm font-medium text-gray-700 mb-1">
                  Baujahr Heizung
                </label>
                <input
                  id="edit-ea-baujahrHeizung"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.energieausweis.baujahrHeizung}
                  onChange={(e) => updateEnergieausweis("baujahrHeizung", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelEditing}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
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
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // View mode
  // ---------------------------------------------------------------------------

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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {objekt.titel}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  objekt.listingType === "kauf"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {objekt.listingType === "kauf" ? "Kauf" : "Miete"}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  statusColors[objekt.status] ?? "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[objekt.status] ?? objekt.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Bearbeiten
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Löschen
            </button>
          </div>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Objekt löschen?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Möchten Sie &ldquo;{objekt.titel}&rdquo; wirklich unwiderruflich
              löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content cards */}
      <div className="space-y-6">
        {/* Preis */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-3xl font-bold text-gray-900">
            {formatPreis(objekt.preis, objekt.listingType)}
          </p>
        </div>

        {/* Beschreibung */}
        {objekt.beschreibung && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Beschreibung
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {objekt.beschreibung}
            </p>
          </div>
        )}

        {/* Adresse */}
        {(objekt.adresse || objekt.plz || objekt.stadt) && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-gray-400" />
              Adresse
            </h2>
            <div className="text-sm text-gray-700">
              {objekt.adresse && <p>{objekt.adresse}</p>}
              {(objekt.plz || objekt.stadt) && (
                <p>
                  {objekt.plz} {objekt.stadt}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Home className="h-5 w-5 text-gray-400" />
            Details
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Wohnfläche
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {objekt.wohnflaeche
                  ? `${Number(objekt.wohnflaeche).toLocaleString("de-DE")} m²`
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Grundstück
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {objekt.grundstueck
                  ? `${Number(objekt.grundstueck).toLocaleString("de-DE")} m²`
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Zimmer
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {objekt.zimmer
                  ? Number(objekt.zimmer).toLocaleString("de-DE")
                  : "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Baujahr
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {objekt.baujahr ?? "\u2014"}
              </p>
            </div>
          </div>
        </div>

        {/* Energieausweis */}
        {objekt.energieausweis &&
          Object.values(objekt.energieausweis).some(
            (v) => v !== undefined && v !== null && v !== "",
          ) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Zap className="h-5 w-5 text-gray-400" />
                Energieausweis
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {objekt.energieausweis.art && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Art
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                      {objekt.energieausweis.art}
                    </p>
                  </div>
                )}
                {objekt.energieausweis.endenergiebedarf != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Endenergiebedarf
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {objekt.energieausweis.endenergiebedarf} kWh/m²a
                    </p>
                  </div>
                )}
                {objekt.energieausweis.effizienzklasse && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Effizienzklasse
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {objekt.energieausweis.effizienzklasse}
                    </p>
                  </div>
                )}
                {objekt.energieausweis.energietraeger && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Energieträger
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {objekt.energieausweis.energietraeger}
                    </p>
                  </div>
                )}
                {objekt.energieausweis.baujahrHeizung != null && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                      Baujahr Heizung
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {objekt.energieausweis.baujahrHeizung}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Timestamps */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Erstellt am
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(objekt.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                Zuletzt aktualisiert
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {formatDate(objekt.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
