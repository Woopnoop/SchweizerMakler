"use client";

import { useEffect, useState, useRef } from "react";
import { ExternalLink, Trash2, Inbox, Save, X } from "lucide-react";

interface Lead {
  id: string;
  portal: string;
  url: string;
  title: string;
  location: string;
  currentPrice: number;
  listingType: "miete" | "kauf";
  areaSqm?: number;
  rooms?: number;
  standortScore?: number;
  priceHistory: Array<{ timestamp: number; price: number }>;
  receivedAt: number;
  notizen?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatPriceWithSqm(price: number, areaSqm?: number): string {
  const priceStr = formatPrice(price);
  if (areaSqm && areaSqm > 0) {
    const sqmPrice = Math.round(price / areaSqm);
    return `${priceStr} (${sqmPrice} €/m²)`;
  }
  return priceStr;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const portalColors: Record<string, string> = {
  kleinanzeigen: "bg-green-100 text-green-800",
  "wg-gesucht": "bg-orange-100 text-orange-800",
  immowelt: "bg-blue-100 text-blue-800",
  immoscout: "bg-purple-100 text-purple-800",
};

// Resizable Column Header
function ResizableHeader({
  children,
  width,
  onResize,
  className = "",
}: {
  children: React.ReactNode;
  width: number;
  onResize: (newWidth: number) => void;
  className?: string;
}) {
  const startX = useRef(0);
  const startWidth = useRef(0);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startX.current = e.clientX;
    startWidth.current = width;

    function handleMouseMove(e: MouseEvent) {
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(60, startWidth.current + diff);
      onResize(newWidth);
    }

    function handleMouseUp() {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <th
      className={`relative px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 select-none ${className}`}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {children}
      <div
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-500"
        onMouseDown={handleMouseDown}
      />
    </th>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Spaltenbreiten (resizable)
  const [colWidths, setColWidths] = useState({
    portal: 110,
    title: 350,
    location: 180,
    price: 180,
    type: 80,
    score: 70,
    received: 150,
    notizen: 200,
    actions: 60,
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads");
      if (res.ok) setLeads(await res.json());
    } catch {
      // API not reachable
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Lead wirklich entfernen?")) return;
    try {
      const res = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch { /* */ }
  }

  async function handleSaveNote(id: string) {
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notizen: noteText }),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, notizen: noteText } : l))
      );
      setEditingNote(null);
    } catch { /* */ }
  }

  function startEditNote(lead: Lead) {
    setEditingNote(lead.id);
    setNoteText(lead.notizen ?? "");
  }

  function updateColWidth(col: keyof typeof colWidths, width: number) {
    setColWidths((prev) => ({ ...prev, [col]: width }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Immobilien, die aus der Browser-Extension gesendet wurden. Spaltenbreiten per Drag anpassbar.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16">
          <Inbox className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-500">
            Noch keine Leads. Senden Sie Immobilien aus der Browser-Extension.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
            <table className="divide-y divide-gray-200" style={{ tableLayout: "fixed" }}>
              <thead className="bg-gray-50">
                <tr>
                  <ResizableHeader width={colWidths.portal} onResize={(w) => updateColWidth("portal", w)}>
                    Portal
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.title} onResize={(w) => updateColWidth("title", w)}>
                    Titel
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.location} onResize={(w) => updateColWidth("location", w)}>
                    Ort
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.price} onResize={(w) => updateColWidth("price", w)} className="text-right">
                    Preis
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.type} onResize={(w) => updateColWidth("type", w)} className="text-center">
                    Typ
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.score} onResize={(w) => updateColWidth("score", w)} className="text-center">
                    Score
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.notizen} onResize={(w) => updateColWidth("notizen", w)}>
                    Notizen
                  </ResizableHeader>
                  <ResizableHeader width={colWidths.received} onResize={(w) => updateColWidth("received", w)}>
                    Empfangen
                  </ResizableHeader>
                  <th className="px-2 py-3" style={{ width: `${colWidths.actions}px` }} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    {/* Portal */}
                    <td className="px-4 py-3" style={{ width: `${colWidths.portal}px` }}>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          portalColors[lead.portal] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {lead.portal}
                      </span>
                    </td>

                    {/* Titel */}
                    <td
                      className="px-4 py-3 text-sm font-medium text-gray-900"
                      style={{ width: `${colWidths.title}px`, maxWidth: `${colWidths.title}px` }}
                    >
                      <a
                        href={lead.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-start gap-1 hover:text-blue-600 hover:underline"
                        title={lead.title}
                      >
                        <span className="break-words" style={{ wordBreak: "break-word" }}>
                          {lead.title}
                        </span>
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      </a>
                    </td>

                    {/* Ort */}
                    <td
                      className="px-4 py-3 text-sm text-gray-600"
                      style={{ width: `${colWidths.location}px`, maxWidth: `${colWidths.location}px`, wordBreak: "break-word" }}
                    >
                      {lead.location || "-"}
                    </td>

                    {/* Preis */}
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatPriceWithSqm(lead.currentPrice, lead.areaSqm)}
                    </td>

                    {/* Typ */}
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          lead.listingType === "miete"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {lead.listingType === "miete" ? "Miete" : "Kauf"}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-medium text-gray-700">
                      {lead.standortScore != null ? `${lead.standortScore}` : "-"}
                    </td>

                    {/* Notizen */}
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ width: `${colWidths.notizen}px`, maxWidth: `${colWidths.notizen}px` }}
                    >
                      {editingNote === lead.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveNote(lead.id);
                              if (e.key === "Escape") setEditingNote(null);
                            }}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveNote(lead.id)}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                            title="Speichern"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingNote(null)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                            title="Abbrechen"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => startEditNote(lead)}
                          className="block cursor-pointer rounded px-1 py-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          style={{ wordBreak: "break-word", minHeight: "24px" }}
                          title="Klicken um Notiz zu bearbeiten"
                        >
                          {lead.notizen || "Notiz hinzufügen..."}
                        </span>
                      )}
                    </td>

                    {/* Empfangen */}
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatDate(lead.receivedAt)}
                    </td>

                    {/* Aktionen */}
                    <td className="whitespace-nowrap px-2 py-3 text-right">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Lead entfernen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
