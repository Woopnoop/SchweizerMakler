"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Calendar,
  X,
  Loader2,
  Check,
  XCircle,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Termin {
  id: string;
  objektId: string | null;
  interessentId: string | null;
  terminDatum: string;
  notizen: string | null;
  status: string;
  createdAt: string;
  objektTitel: string | null;
  interessentVorname: string | null;
  interessentNachname: string | null;
}

interface Objekt {
  id: string;
  titel: string;
}

interface Interessent {
  id: string;
  vorname: string;
  nachname: string;
}

interface FormData {
  terminDatum: string;
  objektId: string;
  interessentId: string;
  notizen: string;
  status: "geplant" | "durchgefuehrt" | "abgesagt";
}

const emptyForm: FormData = {
  terminDatum: "",
  objektId: "",
  interessentId: "",
  notizen: "",
  status: "geplant",
};

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  geplant: {
    label: "Geplant",
    className: "bg-blue-100 text-blue-800",
    icon: Clock,
  },
  durchgefuehrt: {
    label: "Durchgeführt",
    className: "bg-green-100 text-green-800",
    icon: Check,
  },
  abgesagt: {
    label: "Abgesagt",
    className: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDateTimeValue(d?: Date): string {
  const date = d || new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TerminePage() {
  const [data, setData] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // Select options
  const [objekte, setObjekte] = useState<Objekt[]>([]);
  const [interessenten, setInteressenten] = useState<Interessent[]>([]);

  // Inline status editing
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  // ---- Fetch termine --------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterFrom) params.set("from", new Date(filterFrom).toISOString());
      if (filterTo) params.set("to", new Date(filterTo).toISOString());
      const qs = params.toString();
      const url = `/api/termine${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- Fetch select options -------------------------------------------

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [objRes, intRes] = await Promise.all([
          fetch("/api/objekte"),
          fetch("/api/interessenten"),
        ]);

        if (objRes.ok) {
          const objJson = await objRes.json();
          setObjekte(objJson.data || []);
        }
        if (intRes.ok) {
          const intJson = await intRes.json();
          setInteressenten(intJson.data || []);
        }
      } catch {
        // Silently ignore — selects will be empty
      }
    }
    fetchOptions();
  }, []);

  // ---- Create --------------------------------------------------------

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      terminDatum: new Date(form.terminDatum).toISOString(),
      status: form.status,
    };

    if (form.objektId) payload.objektId = form.objektId;
    if (form.interessentId) payload.interessentId = form.interessentId;
    if (form.notizen) payload.notizen = form.notizen;

    try {
      const res = await fetch("/api/termine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Fehler beim Erstellen");
      }

      setForm(emptyForm);
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Update status inline -------------------------------------------

  async function handleStatusChange(id: string, newStatus: string) {
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/termine/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Fehler beim Aktualisieren");
      setEditingStatusId(null);
      fetchData();
    } catch {
      setError("Status konnte nicht aktualisiert werden.");
    } finally {
      setStatusSaving(false);
    }
  }

  // ---- Delete ---------------------------------------------------------

  async function handleDelete(id: string) {
    if (!window.confirm("Termin wirklich loeschen?")) return;
    try {
      const res = await fetch(`/api/termine/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      fetchData();
    } catch {
      setError("Termin konnte nicht geloescht werden.");
    }
  }

  // ---- Render ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-[var(--brand)]" />
          Termine
        </h1>
        <button
          onClick={() => {
            setForm({
              ...emptyForm,
              terminDatum: toLocalDateTimeValue(),
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-dark)] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neuer Termin
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none bg-white"
        >
          <option value="">Alle Status</option>
          <option value="geplant">Geplant</option>
          <option value="durchgefuehrt">Durchgefuehrt</option>
          <option value="abgesagt">Abgesagt</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Von:</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Bis:</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
          />
        </div>
        {(filterStatus || filterFrom || filterTo) && (
          <button
            onClick={() => {
              setFilterStatus("");
              setFilterFrom("");
              setFilterTo("");
            }}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" /> Filter zuruecksetzen
          </button>
        )}
      </div>

      {/* List */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Keine Termine gefunden.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((termin) => {
              const cfg = statusConfig[termin.status] || statusConfig.geplant;
              const StatusIcon = cfg.icon;
              const isEditing = editingStatusId === termin.id;

              return (
                <div
                  key={termin.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
                >
                  {/* Date/time */}
                  <div className="flex-shrink-0 w-40">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDateTime(termin.terminDatum)}
                    </p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {termin.objektTitel && (
                      <p className="text-sm text-gray-900 truncate">
                        <span className="font-medium">Objekt:</span>{" "}
                        {termin.objektTitel}
                      </p>
                    )}
                    {termin.interessentVorname && (
                      <p className="text-sm text-gray-600 truncate">
                        <span className="font-medium">Interessent:</span>{" "}
                        {termin.interessentVorname}{" "}
                        {termin.interessentNachname}
                      </p>
                    )}
                    {termin.notizen && (
                      <p className="text-xs text-gray-500 truncate">
                        {termin.notizen}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                      <select
                        autoFocus
                        disabled={statusSaving}
                        defaultValue={termin.status}
                        onChange={(e) =>
                          handleStatusChange(termin.id, e.target.value)
                        }
                        onBlur={() => setEditingStatusId(null)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none bg-white"
                      >
                        <option value="geplant">Geplant</option>
                        <option value="durchgefuehrt">Durchgefuehrt</option>
                        <option value="abgesagt">Abgesagt</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatusId(termin.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.className} hover:opacity-80 transition-opacity`}
                        title="Klicken um Status zu aendern"
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(termin.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Termin loeschen"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 rounded-lg border border-gray-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Neuer Termin
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum & Uhrzeit *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.terminDatum}
                  onChange={(e) =>
                    setForm({ ...form, terminDatum: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>

              {/* Property select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objekt (optional)
                </label>
                <select
                  value={form.objektId}
                  onChange={(e) =>
                    setForm({ ...form, objektId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none bg-white"
                >
                  <option value="">— Kein Objekt —</option>
                  {objekte.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.titel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prospect select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interessent (optional)
                </label>
                <select
                  value={form.interessentId}
                  onChange={(e) =>
                    setForm({ ...form, interessentId: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none bg-white"
                >
                  <option value="">— Kein Interessent —</option>
                  {interessenten.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.vorname} {i.nachname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={form.notizen}
                  onChange={(e) =>
                    setForm({ ...form, notizen: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as FormData["status"],
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] outline-none bg-white"
                >
                  <option value="geplant">Geplant</option>
                  <option value="durchgefuehrt">Durchgefuehrt</option>
                  <option value="abgesagt">Abgesagt</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)] disabled:opacity-50 transition-colors"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Termin erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
