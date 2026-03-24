import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold text-[var(--brand)]">
              MaklerToolkit
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/#features"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#preise"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Preise
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)] transition-colors"
              >
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex gap-6 text-sm text-gray-500">
              <Link
                href="/impressum"
                className="hover:text-gray-700 transition-colors"
              >
                Impressum
              </Link>
              <Link
                href="/datenschutz"
                className="hover:text-gray-700 transition-colors"
              >
                Datenschutz
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              &copy; 2026 MaklerToolkit
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
