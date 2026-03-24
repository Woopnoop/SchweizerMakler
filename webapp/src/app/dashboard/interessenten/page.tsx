"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Interessent {
  id: string;
  vorname: string;
  nachname: string;
  email: string | null;
  telefon: string | null;
  notizen: string | null;
  suchkriterien: {
    minPreis?: number;
    maxPreis?: number;
    minFlaeche?: number;
    zimmer?: number;
    stadtteile?: string[];
  } | null;
  dsgvoEinwilligungAm: string | null;
  createdAt: string;
}

interface FormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  notizen: string;
  dsgvoEinwilligung: boolean;
  suchkriterien: {
    minPreis: string;
    maxPreis: string;
    minFlaeche: string;
    zimmer: string;
    stadtteile: string;
  };
}

const emptyForm: FormData = {
  vorname: "",
  nachname: "",
  email: "",
  telefon: "",
  notizen: "",
  dsgvoEinwilligung: false,
  suchkriterien: {
    minPreis: "",
    maxPreis: "",
    minFlaeche: "",
    zimmer: "",
    stadtteile: "",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InteressentenPage() {
  const router = useRouter();
  const [data, setData] = useState<Interessent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Fetch ---------------------------------------------------------

  const fetchData = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const url = q
        ? `/api/interessenten?search=${encodeURIComponent(q)}`
        : "/api/interessenten";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Interessenten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchData]);

  // ---- Create --------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      vorname: form.vorname,
      nachname: form.nachname,
      dsgvoEinwilligung: form.dsgvoEinwilligung,
    };

    if (form.email) payload.email = form.email;
    if (form.telefon) payload.telefon = form.telefon;
    if (form.notizen) payload.notizen = form.notizen;

    // Build suchkriterien only if at least one field is filled
    const sk = form.suchkriterien;
    const hasCriteria =
      sk.minPreis || sk.maxPreis || sk.minFlaeche || sk.zimmer || sk.stadtteile;

    if (hasCriteria) {
      const criteria: Record<string, unknown> = {};
      if (sk.minPreis) criteria.minPreis = Number(sk.minPreis);
      if (sk.maxPreis) criteria.maxPreis = Number(sk.maxPreis);
      if (sk.minFlaeche) criteria.minFlaeche = Number(sk.minFlaeche);
      if (sk.zimmer) criteria.zimmer = Number(sk.zimmer);
      if (sk.stadtteile) {
        criteria.stadtteile = sk.stadtteile
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      payload.suchkriterien = criteria;
    }

    try {
      const res = await fetch("/api/interessenten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Fehler beim Erstellen");
      }

      setForm(emptyForm);
      setShowForm(false);
      fetchData(search);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Render --------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Interessenten</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-dark)] transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Abbrechen" : "Neuer Interessent"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-gray-200 bg-white p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Neuen Interessenten anlegen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vorname *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.vorname}
                onChange={(e) => setForm({ ...form, vorname: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nachname *
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={form.nachname}
                onChange={(e) => setForm({ ...form, nachname: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="text"
                value={form.telefon}
                onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              maxLength={5000}
              rows={3}
              value={form.notizen}
              onChange={(e) => setForm({ ...form, notizen: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
            />
          </div>

          {/* Suchkriterien */}
          <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
            <legend className="text-sm font-medium text-gray-700 px-1">
              Suchkriterien (optional)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Min. Preis (EUR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.suchkriterien.minPreis}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      suchkriterien: {
                        ...form.suchkriterien,
                        minPreis: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Max. Preis (EUR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.suchkriterien.maxPreis}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      suchkriterien: {
                        ...form.suchkriterien,
                        maxPreis: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Min. Flaeche (m2)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.suchkriterien.minFlaeche}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      suchkriterien: {
                        ...form.suchkriterien,
                        minFlaeche: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Zimmer (min.)
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.suchkriterien.zimmer}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      suchkriterien: {
                        ...form.suchkriterien,
                        zimmer: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Stadtteile (kommagetrennt)
              </label>
              <input
                type="text"
                placeholder="z.B. Erlangen-Süd, Bruck, Röthelheimpark"
                value={form.suchkriterien.stadtteile}
                onChange={(e) =>
                  setForm({
                    ...form,
                    suchkriterien: {
                      ...form.suchkriterien,
                      stadtteile: e.target.value,
                    },
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
              />
            </div>
          </fieldset>

          {/* DSGVO */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.dsgvoEinwilligung}
              onChange={(e) =>
                setForm({ ...form, dsgvoEinwilligung: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
            />
            <span className="text-sm text-gray-700">
              Der Interessent hat in die Verarbeitung seiner personenbezogenen
              Daten gemaess Art. 6 Abs. 1 lit. a DSGVO eingewilligt. *
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setShowForm(false);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-50 transition-colors"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Speichern
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Suche nach Name oder E-Mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            {search
              ? "Keine Interessenten gefunden."
              : "Noch keine Interessenten angelegt."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">
                    E-Mail
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">
                    Telefon
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    DSGVO
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">
                    Erstellt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() =>
                      router.push(`/dashboard/interessenten/${item.id}`)
                    }
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {item.vorname} {item.nachname}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {item.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {item.telefon || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.dsgvoEinwilligungAm ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 inline-block" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {new Date(item.createdAt).toLocaleDateString("de-DE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
