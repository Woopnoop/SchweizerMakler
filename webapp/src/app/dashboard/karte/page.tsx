"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Map,
  Building2,
  Train,
  ShoppingCart,
  Trees,
  Star,
  Users,
  ChevronDown,
  ChevronUp,
  ArrowLeftRight,
  X,
  AlertTriangle,
  Lock,
} from "lucide-react";

// ============================================================
// Types
// ============================================================

interface District {
  id: string;
  name: string;
  stadt: string;
  einwohner: number | null;
  infrastrukturScore: string;
  anbindungScore: string;
  nahversorgungScore: string;
  gruenScore: string;
  gesamtScore: string;
  quellenangabe: string;
}

type Stadt = "erlangen" | "fuerth" | "nuernberg";

const STADT_LABELS: Record<Stadt, string> = {
  erlangen: "Erlangen",
  fuerth: "Fürth",
  nuernberg: "Nürnberg",
};

// ============================================================
// Score color helpers
// ============================================================

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-400";
  if (score >= 40) return "bg-orange-400";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-yellow-700";
  if (score >= 40) return "text-orange-700";
  return "text-red-700";
}

function scoreBgLight(score: number): string {
  if (score >= 80) return "bg-emerald-50";
  if (score >= 60) return "bg-yellow-50";
  if (score >= 40) return "bg-orange-50";
  return "bg-red-50";
}

function scoreBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-200";
  if (score >= 60) return "border-yellow-200";
  if (score >= 40) return "border-orange-200";
  return "border-red-200";
}

// ============================================================
// Score Bar component
// ============================================================

function ScoreBar({
  label,
  score,
  icon: Icon,
}: {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <div className="flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">{label}</span>
          <span className={`font-semibold ${scoreTextColor(score)}`}>
            {score}
          </span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${scoreColor(score)}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// District Card component
// ============================================================

function DistrictCard({
  district,
  isExpanded,
  onToggle,
  compareMode,
  isSelectedForCompare,
  onCompareSelect,
}: {
  district: District;
  isExpanded: boolean;
  onToggle: () => void;
  compareMode: boolean;
  isSelectedForCompare: boolean;
  onCompareSelect: (id: string) => void;
}) {
  const gesamt = Number(district.gesamtScore);

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm transition-all ${
        isSelectedForCompare
          ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/20"
          : scoreBorderColor(gesamt)
      }`}
    >
      <button
        type="button"
        onClick={() => {
          if (compareMode) {
            onCompareSelect(district.id);
          } else {
            onToggle();
          }
        }}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          {compareMode && (
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                isSelectedForCompare
                  ? "border-[var(--brand)] bg-[var(--brand)]"
                  : "border-gray-300"
              }`}
            >
              {isSelectedForCompare && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{district.name}</h3>
            {district.einwohner && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                {district.einwohner.toLocaleString("de-DE")} Einwohner
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall score badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${scoreBgLight(gesamt)} ${scoreTextColor(gesamt)}`}
          >
            <Star className="h-3.5 w-3.5" />
            {gesamt}
          </div>

          {!compareMode &&
            (isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ))}
        </div>
      </button>

      {/* Mini score bars always visible */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="h-2 flex gap-0.5 rounded-full overflow-hidden">
          <div
            className={`${scoreColor(Number(district.infrastrukturScore))}`}
            style={{ width: "25%" }}
            title={`Infrastruktur: ${district.infrastrukturScore}`}
          />
          <div
            className={`${scoreColor(Number(district.anbindungScore))}`}
            style={{ width: "25%" }}
            title={`Anbindung: ${district.anbindungScore}`}
          />
          <div
            className={`${scoreColor(Number(district.nahversorgungScore))}`}
            style={{ width: "25%" }}
            title={`Nahversorgung: ${district.nahversorgungScore}`}
          />
          <div
            className={`${scoreColor(Number(district.gruenScore))}`}
            style={{ width: "25%" }}
            title={`Grün: ${district.gruenScore}`}
          />
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && !compareMode && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          <ScoreBar
            label="Infrastruktur"
            score={Number(district.infrastrukturScore)}
            icon={Building2}
          />
          <ScoreBar
            label="ÖPNV-Anbindung"
            score={Number(district.anbindungScore)}
            icon={Train}
          />
          <ScoreBar
            label="Nahversorgung"
            score={Number(district.nahversorgungScore)}
            icon={ShoppingCart}
          />
          <ScoreBar
            label="Grünflächen"
            score={Number(district.gruenScore)}
            icon={Trees}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Comparison Panel
// ============================================================

function ComparisonPanel({
  districtA,
  districtB,
  onClose,
}: {
  districtA: District;
  districtB: District;
  onClose: () => void;
}) {
  const categories = [
    { key: "gesamtScore", label: "Gesamt", icon: Star },
    { key: "infrastrukturScore", label: "Infrastruktur", icon: Building2 },
    { key: "anbindungScore", label: "ÖPNV-Anbindung", icon: Train },
    { key: "nahversorgungScore", label: "Nahversorgung", icon: ShoppingCart },
    { key: "gruenScore", label: "Grünflächen", icon: Trees },
  ] as const;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-[var(--brand)]" />
          Stadtteil-Vergleich
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 mb-4">
        <div className="text-center">
          <h3 className="font-semibold text-gray-900">{districtA.name}</h3>
          <p className="text-xs text-gray-500">
            {STADT_LABELS[districtA.stadt as Stadt]}
          </p>
        </div>
        <div className="flex items-center text-gray-300 text-sm">vs</div>
        <div className="text-center">
          <h3 className="font-semibold text-gray-900">{districtB.name}</h3>
          <p className="text-xs text-gray-500">
            {STADT_LABELS[districtB.stadt as Stadt]}
          </p>
        </div>
      </div>

      {/* Score comparison rows */}
      <div className="space-y-4">
        {categories.map(({ key, label, icon: Icon }) => {
          const scoreA = Number(districtA[key]);
          const scoreB = Number(districtB[key]);
          const diff = scoreA - scoreB;

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor(scoreA)}`}
                      style={{ width: `${Math.min(scoreA, 100)}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold w-8 text-right ${scoreTextColor(scoreA)}`}
                  >
                    {scoreA}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold w-10 text-center ${
                    diff > 0
                      ? "text-emerald-600"
                      : diff < 0
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {diff > 0 ? `+${diff}` : diff === 0 ? "=" : diff}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold w-8 ${scoreTextColor(scoreB)}`}
                  >
                    {scoreB}
                  </span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor(scoreB)}`}
                      style={{ width: `${Math.min(scoreB, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Einwohner */}
      {districtA.einwohner && districtB.einwohner && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Einwohner</p>
              <p className="font-semibold text-gray-900">
                {districtA.einwohner.toLocaleString("de-DE")}
              </p>
            </div>
            <div />
            <div>
              <p className="text-sm text-gray-500">Einwohner</p>
              <p className="font-semibold text-gray-900">
                {districtB.einwohner.toLocaleString("de-DE")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function KartePage() {
  const [activeStadt, setActiveStadt] = useState<Stadt>("erlangen");
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  const fetchDistricts = useCallback(async (stadt: Stadt) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stadtteile?stadt=${stadt}`);
      const json = await res.json();
      setDistricts(json.data ?? []);
    } catch (error) {
      console.error("Fehler beim Laden der Stadtteile:", error);
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistricts(activeStadt);
    setExpandedId(null);
    setCompareMode(false);
    setSelectedForCompare([]);
  }, [activeStadt, fetchDistricts]);

  function handleCompareSelect(id: string) {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }

  function toggleCompareMode() {
    setCompareMode((prev) => !prev);
    setSelectedForCompare([]);
  }

  const compareDistrictA = districts.find(
    (d) => d.id === selectedForCompare[0],
  );
  const compareDistrictB = districts.find(
    (d) => d.id === selectedForCompare[1],
  );

  // Sort districts by gesamtScore descending
  const sortedDistricts = [...districts].sort(
    (a, b) => Number(b.gesamtScore) - Number(a.gesamtScore),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Map className="h-5 w-5 text-[var(--brand)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Stadtteil-Analyse
          </h1>
          <p className="text-sm text-gray-600">
            Bewertung der Stadtteile in Erlangen, Fürth und Nürnberg
          </p>
        </div>
      </div>

      {/* City Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.entries(STADT_LABELS) as [Stadt, string][]).map(
          ([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveStadt(key)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                activeStadt === key
                  ? "bg-[var(--brand)] text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {/* Compare toggle */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={toggleCompareMode}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            compareMode
              ? "bg-[var(--brand)] text-white"
              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" />
          Vergleichen
        </button>
        {compareMode && (
          <span className="text-sm text-gray-500">
            {selectedForCompare.length === 0
              ? "Wählen Sie zwei Stadtteile zum Vergleich"
              : selectedForCompare.length === 1
                ? "Noch einen Stadtteil auswählen..."
                : "Vergleich bereit"}
          </span>
        )}
      </div>

      {/* Comparison panel */}
      {compareMode && compareDistrictA && compareDistrictB && (
        <div className="mb-8">
          <ComparisonPanel
            districtA={compareDistrictA}
            districtB={compareDistrictB}
            onClose={() => {
              setCompareMode(false);
              setSelectedForCompare([]);
            }}
          />
        </div>
      )}

      {/* Score Legend */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600">
        <span className="font-medium text-gray-700">Legende:</span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Sehr gut (80+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          Gut (60-79)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-400" />
          Mäßig (40-59)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Schwach (&lt;40)
        </span>
      </div>

      {/* District Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      ) : sortedDistricts.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Map className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Keine Stadtteile für {STADT_LABELS[activeStadt]} gefunden.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDistricts.map((district) => (
            <DistrictCard
              key={district.id}
              district={district}
              isExpanded={expandedId === district.id}
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === district.id ? null : district.id,
                )
              }
              compareMode={compareMode}
              isSelectedForCompare={selectedForCompare.includes(district.id)}
              onCompareSelect={handleCompareSelect}
            />
          ))}
        </div>
      )}

      {/* Bodenrichtwerte placeholder (behind feature flag) */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Map className="h-5 w-5 text-gray-400" />
          Bodenrichtwerte
        </h2>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">
                Bodenrichtwert-Karte
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                Bodenrichtwert-Karte wird nach Lizenzierung des LDBV Bayern
                freigeschaltet. Die Daten unterliegen dem Urheberrecht des
                Landesamts für Digitalisierung, Breitband und Vermessung (LDBV).
              </p>
              <div className="mt-4 h-32 rounded-lg border-2 border-dashed border-amber-200 bg-amber-100/50 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-400" />
                  <p className="mt-2 text-xs text-amber-600">
                    Kartenvorschau nicht verfügbar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <div className="mt-8 border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-400">
          Daten: &copy; OpenStreetMap contributors (ODbL). Die angezeigten
          Scores basieren auf öffentlich verfügbaren Geodaten und dienen als
          Orientierungshilfe. Alle Angaben ohne Gewähr.
        </p>
      </div>
    </div>
  );
}
