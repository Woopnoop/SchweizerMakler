import {
  Building2,
  Users,
  Calendar,
  ArrowRight,
  Calculator,
  FileText,
  MapPin,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Aktive Objekte",
    value: "12",
    icon: Building2,
    href: "/dashboard/objekte",
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Interessenten",
    value: "47",
    icon: Users,
    href: "/dashboard/interessenten",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Termine diese Woche",
    value: "5",
    icon: Calendar,
    href: "/dashboard/termine",
    color: "text-amber-600 bg-amber-50",
  },
];

const quickActions = [
  {
    label: "Nebenkosten berechnen",
    icon: Calculator,
    href: "/dashboard/rechner",
  },
  {
    label: "Exposé erstellen",
    icon: FileText,
    href: "/dashboard/objekte",
  },
  {
    label: "Standort bewerten",
    icon: MapPin,
    href: "/dashboard/karte",
  },
];

export default function DashboardPage() {
  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Willkommen zurück
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Hier ist Ihre aktuelle Übersicht.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Schnellzugriff
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:border-[var(--brand)] hover:shadow-md transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <action.icon className="h-5 w-5 text-[var(--brand)]" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Placeholder: Recent Activity */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Letzte Aktivitäten
        </h2>
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Hier werden Ihre letzten Aktivitäten angezeigt, sobald Sie das
            Toolkit nutzen.
          </p>
        </div>
      </div>
    </div>
  );
}
