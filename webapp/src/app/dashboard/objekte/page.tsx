"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Objekt {
  id: string;
  titel: string;
  stadt: string | null;
  preis: string | null;
  listingType: string;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPreis(value: string | null): string {
  if (!value) return "\u2014";
  return Number(value).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ObjektePage() {
  const router = useRouter();

  const [items, setItems] = useState<Objekt[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (statusFilter) params.set("status", statusFilter);
    if (listingTypeFilter) params.set("listingType", listingTypeFilter);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/objekte?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Fehler beim Laden der Objekte");
      }
      const json = await res.json();
      setItems(json.data);
      setPagination(json.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, listingTypeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, listingTypeFilter, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objekte</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination
              ? `${pagination.total} Objekt${pagination.total !== 1 ? "e" : ""} insgesamt`
              : "Lade..."}
          </p>
        </div>
        <Link
          href="/dashboard/objekte/neu"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Neues Objekt
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Titel oder Stadt suchen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Suchen
          </button>
        </form>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Alle Status</option>
          <option value="aktiv">Aktiv</option>
          <option value="reserviert">Reserviert</option>
          <option value="verkauft">Verkauft</option>
          <option value="vermietet">Vermietet</option>
        </select>

        {/* Listing type toggle */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            type="button"
            onClick={() =>
              setListingTypeFilter(listingTypeFilter === "" ? "" : "")
            }
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              listingTypeFilter === ""
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Alle
          </button>
          <button
            type="button"
            onClick={() =>
              setListingTypeFilter(
                listingTypeFilter === "kauf" ? "" : "kauf",
              )
            }
            className={`px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
              listingTypeFilter === "kauf"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Kauf
          </button>
          <button
            type="button"
            onClick={() =>
              setListingTypeFilter(
                listingTypeFilter === "miete" ? "" : "miete",
              )
            }
            className={`px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
              listingTypeFilter === "miete"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Miete
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-500">Lade Objekte...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-20">
          <Building2 className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-900">
            Keine Objekte gefunden
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Erstellen Sie Ihr erstes Objekt, um loszulegen.
          </p>
          <Link
            href="/dashboard/objekte/neu"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Neues Objekt
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Titel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stadt
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Preis
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Typ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Erstellt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((obj) => (
                <tr
                  key={obj.id}
                  onClick={() =>
                    router.push(`/dashboard/objekte/${obj.id}`)
                  }
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {obj.titel}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {obj.stadt || "\u2014"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatPreis(obj.preis)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        obj.listingType === "kauf"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {obj.listingType === "kauf" ? "Kauf" : "Miete"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[obj.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {statusLabels[obj.status] ?? obj.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                    {formatDate(obj.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Seite {pagination.page} von {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Zurück
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Weiter
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
