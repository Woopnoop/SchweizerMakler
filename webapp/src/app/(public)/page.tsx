import Link from "next/link";
import {
  MapPin,
  Calculator,
  BarChart3,
  FileText,
  Users,
  Landmark,
  Check,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Stadtteil-Analyse",
    description:
      "Detaillierte Standortbewertung mit Infrastruktur, ÖPNV-Anbindung und Umgebungsfaktoren für jeden Stadtteil in Erlangen, Fürth und Nürnberg.",
  },
  {
    icon: Calculator,
    title: "Kaufnebenkosten-Rechner",
    description:
      "Berechnen Sie Grunderwerbsteuer, Notar- und Grundbuchkosten sowie monatliche Raten für Ihre Kunden — inklusive Bayern-spezifischer Sätze.",
  },
  {
    icon: BarChart3,
    title: "Mietpreisspiegel",
    description:
      "Aktuelle Mietpreisspannen pro Stadtteil basierend auf öffentlichen Daten. Ideal für Mietwertermittlung und Beratungsgespräche.",
  },
  {
    icon: FileText,
    title: "Exposé-Generator",
    description:
      "Erstellen Sie professionelle Exposés mit Stadtteil-Infos, Lagebeschreibung und Kaufnebenkosten-Übersicht — direkt als PDF.",
  },
  {
    icon: Users,
    title: "Mini-CRM",
    description:
      "Verwalten Sie Interessenten, Termine und Objekte an einem Ort. Einfach, übersichtlich und ohne unnötige Komplexität.",
  },
  {
    icon: Landmark,
    title: "Bodenrichtwerte",
    description:
      "Zugriff auf aktuelle Bodenrichtwerte aus öffentlichen Quellen für die Metropolregion Nürnberg — direkt in Ihrem Dashboard.",
  },
];

const pricingTiers = [
  {
    name: "Basis",
    price: "Kostenlos",
    priceNote: "für immer",
    features: [
      "Kaufnebenkosten-Rechner",
      "Stadtteil-Übersicht (Basisdaten)",
      "1 Exposé pro Monat",
      "Community-Support",
    ],
    cta: "Kostenlos starten",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "19",
    priceNote: "pro Monat",
    features: [
      "Alles aus Basis",
      "Voller Mietpreisspiegel",
      "10 Exposés pro Monat",
      "Mini-CRM (bis 50 Kontakte)",
      "Bodenrichtwerte",
      "E-Mail-Support",
    ],
    cta: "Jetzt starten",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "39",
    priceNote: "pro Monat",
    features: [
      "Alles aus Starter",
      "Unbegrenzte Exposés",
      "Mini-CRM (unbegrenzt)",
      "Stadtteil-Analyse (alle Details)",
      "Karten-Ansicht mit POI-Overlay",
      "Prioritäts-Support",
      "API-Zugang",
    ],
    cta: "Pro werden",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Das digitale Toolkit
            <br />
            <span className="text-[var(--brand)]">
              für Immobilienmakler
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Stadtteil-Analysen, Kaufnebenkosten-Rechner, Exposé-Generator und
            Mini-CRM — speziell für die Metropolregion Nürnberg, Erlangen und
            Fürth.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="rounded-lg bg-[var(--brand)] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[var(--brand-dark)] transition-colors"
            >
              Kostenlos registrieren
            </Link>
            <Link
              href="/#features"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Features entdecken
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Alles, was Sie als Makler brauchen
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Ein Werkzeugkasten, der speziell für den regionalen
              Immobilienmarkt entwickelt wurde.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <feature.icon className="h-6 w-6 text-[var(--brand)]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="preise" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Transparente Preise
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Starten Sie kostenlos und wachsen Sie mit Ihrem Bedarf.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-[var(--brand)] bg-white shadow-lg ring-2 ring-[var(--brand)] relative"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--brand)] px-4 py-1 text-xs font-semibold text-white">
                    Beliebt
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  {tier.price === "Kostenlos" ? (
                    <span className="text-4xl font-bold text-gray-900">
                      Kostenlos
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        &euro;{tier.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{tier.priceNote}
                      </span>
                    </>
                  )}
                </div>
                {tier.price === "Kostenlos" && (
                  <p className="mt-1 text-sm text-gray-500">{tier.priceNote}</p>
                )}
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0 text-[var(--success)]" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
