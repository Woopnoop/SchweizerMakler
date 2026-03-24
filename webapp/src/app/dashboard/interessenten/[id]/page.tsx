"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Building2,
  X,
  Save,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Suchkriterien {
  minPreis?: number;
  maxPreis?: number;
  minFlaeche?: number;
  zimmer?: number;
  stadtteile?: string[];
}

interface Interessent {
  id: string;
  vorname: string;
  nachname: string;
  email: string | null;
  telefon: string | null;
  notizen: string | null;
  suchkriterien: Suchkriterien | null;
  dsgvoEinwilligungAm: string | null;
  createdAt: string;
}

interface MatchedObjekt {
  id: string;
  titel: string;
  preis: string | null;
  wohnflaeche: string | null;
  zimmer: string | null;
  stadt: string | null;
  status: string;
  matchScore: number;
  matchReasons: string[];
}

interface EditFormData {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  notizen: string;
  suchkriterien: {
    minPreis: string;
    maxPreis: string;
    minFlaeche: string;
    zimmer: string;
    stadtteile: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InteressentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<Interessent | null>(null);
  const [matches, setMatches] = useState<MatchedObjekt[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EditFormData>({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    notizen: "",
    suchkriterien: {
      minPreis: "",
      maxPreis: "",
      minFlaeche: "",
      zimmer: "",
      stadtteile: "",
    },
  });

  // ---- Fetch prospect ---------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/interessenten/${id}`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Interessent konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ---- Fetch matching properties ----------------------------------------

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    try {
      const res = await fetch(`/api/interessenten/${id}/matching`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const json = await res.json();
      setMatches(json.data);
    } catch {
      // silently ignore — matching is supplementary
    } finally {
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchMatches();
  }, [fetchData, fetchMatches]);

  // ---- Populate edit form when data arrives -----------------------------

  useEffect(() => {
    if (!data) return;
    const sk = data.suchkriterien;
    setForm({
      vorname: data.vorname,
      nachname: data.nachname,
      email: data.email || "",
      telefon: data.telefon || "",
      notizen: data.notizen || "",
      suchkriterien: {
        minPreis: sk?.minPreis?.toString() || "",
        maxPreis: sk?.maxPreis?.toString() || "",
        minFlaeche: sk?.minFlaeche?.toString() || "",
        zimmer: sk?.zimmer?.toString() || "",
        stadtteile: sk?.stadtteile?.join(", ") || "",
      },
    });
  }, [data]);

  // ---- Save -------------------------------------------------------------

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, unknown> = {
      vorname: form.vorname,
      nachname: form.nachname,
      email: form.email || undefined,
      telefon: form.telefon || undefined,
      notizen: form.notizen || undefined,
    };

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
    } else {
      payload.suchkriterien = undefined;
    }

    try {
      const res = await fetch(`/api/interessenten/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Fehler beim Speichern");
      }

      setEditing(false);
      fetchData();
      fetchMatches();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  }

  // ---- Delete (DSGVO-Widerruf) -----------------------------------------

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/interessenten/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      router.push("/dashboard/interessenten");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setDeleting(false);
    }
  }

  // ---- Render -----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/dashboard/interessenten")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Zurueck
        </button>
        <p className="text-sm text-gray-500">Interessent nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => router.push("/dashboard/interessenten")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Alle Interessenten
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {editing ? (
              <>
                <X className="h-4 w-4" /> Abbrechen
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" /> Bearbeiten
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contact card */}
      {editing ? (
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-gray-200 bg-white p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Interessent bearbeiten
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
              rows={4}
              value={form.notizen}
              onChange={(e) => setForm({ ...form, notizen: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
            />
          </div>

          {/* Suchkriterien */}
          <fieldset className="border border-gray-200 rounded-lg p-4 space-y-3">
            <legend className="text-sm font-medium text-gray-700 px-1">
              Suchkriterien
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

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {data.vorname} {data.nachname}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Erstellt am{" "}
                {new Date(data.createdAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* DSGVO Badge */}
            <div className="flex items-center gap-2">
              {data.dsgvoEinwilligungAm ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  DSGVO-Einwilligung am{" "}
                  {new Date(data.dsgvoEinwilligungAm).toLocaleDateString("de-DE")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Keine DSGVO-Einwilligung
                </span>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                E-Mail
              </span>
              <p className="text-sm text-gray-900 mt-0.5">
                {data.email || "Nicht angegeben"}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefon
              </span>
              <p className="text-sm text-gray-900 mt-0.5">
                {data.telefon || "Nicht angegeben"}
              </p>
            </div>
          </div>

          {/* Notes */}
          {data.notizen && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notizen
              </span>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {data.notizen}
              </p>
            </div>
          )}

          {/* Search criteria */}
          {data.suchkriterien && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Suchkriterien
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.suchkriterien.minPreis !== undefined && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    ab {data.suchkriterien.minPreis.toLocaleString("de-DE")} EUR
                  </span>
                )}
                {data.suchkriterien.maxPreis !== undefined && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    bis {data.suchkriterien.maxPreis.toLocaleString("de-DE")} EUR
                  </span>
                )}
                {data.suchkriterien.minFlaeche !== undefined && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    ab {data.suchkriterien.minFlaeche} m2
                  </span>
                )}
                {data.suchkriterien.zimmer !== undefined && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {data.suchkriterien.zimmer}+ Zimmer
                  </span>
                )}
                {data.suchkriterien.stadtteile?.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Matching properties */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--brand)]" />
          Passende Objekte
        </h3>

        {matchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            Keine passenden Objekte gefunden.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((obj) => (
              <div
                key={obj.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {obj.titel}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                    {obj.preis && (
                      <span>
                        {Number(obj.preis).toLocaleString("de-DE")} EUR
                      </span>
                    )}
                    {obj.wohnflaeche && <span>{obj.wohnflaeche} m2</span>}
                    {obj.zimmer && <span>{obj.zimmer} Zimmer</span>}
                    {obj.stadt && <span>{obj.stadt}</span>}
                  </div>
                  {obj.matchReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {obj.matchReasons.map((reason) => (
                        <span
                          key={reason}
                          className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      obj.matchScore >= 75
                        ? "bg-green-100 text-green-800"
                        : obj.matchScore >= 50
                          ? "bg-yellow-100 text-yellow-800"
                          : obj.matchScore >= 25
                            ? "bg-orange-100 text-orange-800"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {obj.matchScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DSGVO Delete */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-red-800">
          Einwilligung widerrufen & Daten loeschen
        </h3>
        <p className="text-xs text-red-700">
          Gemaess Art. 17 DSGVO hat der Interessent das Recht auf Loeschung
          seiner personenbezogenen Daten. Dieser Vorgang kann nicht
          rueckgaengig gemacht werden.
        </p>

        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-red-800">
              Wirklich loeschen?
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Endgueltig loeschen
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Einwilligung widerrufen & Daten loeschen
          </button>
        )}
      </div>
    </div>
  );
}
