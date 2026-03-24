import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — MaklerToolkit",
};

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Datenschutzerklärung
      </h1>
      <p className="mt-4 text-sm text-gray-500">Stand: März 2026</p>

      {/* Verantwortlicher */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          1. Verantwortlicher
        </h2>
        <div className="mt-4 space-y-1 text-gray-700 leading-relaxed">
          <p>[TODO: Vor- und Nachname / Firmenname einsetzen]</p>
          <p>[TODO: Straße und Hausnummer einsetzen]</p>
          <p>[TODO: PLZ und Ort einsetzen]</p>
          <p>
            E-Mail:{" "}
            <span className="text-gray-500">
              [TODO: E-Mail-Adresse einsetzen]
            </span>
          </p>
          <p>
            Telefon:{" "}
            <span className="text-gray-500">
              [TODO: Telefonnummer einsetzen]
            </span>
          </p>
        </div>
      </section>

      {/* Erhobene Daten */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          2. Erhobene Daten
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Wir erheben und verarbeiten folgende Daten:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Registrierungsdaten:</strong> E-Mail-Adresse, Passwort
            (gehasht gespeichert), Anzeigename, optional Firmenname
          </li>
          <li>
            <strong>Nutzungsdaten:</strong> Angelegte Objekte, Interessenten,
            Termine und Berechnungen innerhalb des Dashboards
          </li>
          <li>
            <strong>Technische Daten:</strong> IP-Adresse (in Server-Logs,
            automatisch nach 7 Tagen gelöscht), Browser-Typ, Zugriffszeitpunkt
          </li>
          <li>
            <strong>Geodaten-Anfragen:</strong> Adressen und Koordinaten, die
            Sie zur Standortbewertung eingeben (werden an OpenStreetMap-Dienste
            übermittelt, siehe Abschnitt 6)
          </li>
        </ul>
      </section>

      {/* Rechtsgrundlagen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          3. Rechtsgrundlagen (Art. 6 DSGVO)
        </h2>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung:
            Verarbeitung zur Bereitstellung des Dienstes (Registrierung,
            Login, Dashboard-Funktionen)
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — Berechtigtes
            Interesse: Sicherheit des Dienstes, Fehleranalyse durch
            Server-Logs
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung: Sofern
            Sie optional Cookies akzeptieren oder Newsletter abonnieren
          </li>
          <li>
            <strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — Rechtliche
            Verpflichtung: Aufbewahrung von Rechnungsdaten gemäß
            Steuerrecht
          </li>
        </ul>
      </section>

      {/* Speicherdauer */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          4. Speicherdauer
        </h2>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Account-Daten:</strong> Bis zur Löschung Ihres Accounts
          </li>
          <li>
            <strong>Server-Logs:</strong> Automatische Löschung nach 7 Tagen
          </li>
          <li>
            <strong>Rechnungsdaten:</strong> 10 Jahre gemäß steuerrechtlichen
            Aufbewahrungsfristen (§ 147 AO)
          </li>
        </ul>
      </section>

      {/* Betroffenenrechte */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          5. Ihre Rechte (Art. 15–21 DSGVO)
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Sie haben jederzeit folgende Rechte:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Auskunftsrecht (Art. 15):</strong> Sie können Auskunft
            über Ihre bei uns gespeicherten Daten verlangen.
          </li>
          <li>
            <strong>Berichtigung (Art. 16):</strong> Sie können die
            Berichtigung unrichtiger Daten verlangen.
          </li>
          <li>
            <strong>Löschung (Art. 17):</strong> Sie können die Löschung
            Ihrer Daten verlangen. In Ihrem Dashboard unter
            &ldquo;Einstellungen&rdquo; können Sie Ihren Account selbständig
            löschen.
          </li>
          <li>
            <strong>Einschränkung (Art. 18):</strong> Sie können die
            Einschränkung der Verarbeitung verlangen.
          </li>
          <li>
            <strong>Datenübertragbarkeit (Art. 20):</strong> Sie können Ihre
            Daten in einem maschinenlesbaren Format (JSON) exportieren. Dies
            ist in Ihrem Dashboard unter &ldquo;Einstellungen&rdquo;
            möglich.
          </li>
          <li>
            <strong>Widerspruch (Art. 21):</strong> Sie können der
            Verarbeitung Ihrer Daten widersprechen.
          </li>
        </ul>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter{" "}
          <span className="text-gray-500">
            [TODO: E-Mail-Adresse einsetzen]
          </span>
          .
        </p>
      </section>

      {/* Drittanbieter */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          6. Drittanbieter und externe Dienste
        </h2>

        <h3 className="mt-6 text-lg font-medium text-gray-800">
          OpenStreetMap (Nominatim / Overpass API)
        </h3>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Für Standortbewertungen und Kartenanzeigen nutzen wir
          OpenStreetMap-Dienste. Dabei werden eingegebene Adressen bzw.
          Koordinaten an Server der OpenStreetMap Foundation (OSMF)
          übermittelt. Die Geodaten unterliegen der Open Data Commons Open
          Database License (ODbL).
        </p>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Datenschutzhinweis OSMF:{" "}
          <a
            href="https://wiki.osmfoundation.org/wiki/Privacy_Policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--brand)] underline hover:no-underline"
          >
            https://wiki.osmfoundation.org/wiki/Privacy_Policy
          </a>
        </p>

        <h3 className="mt-6 text-lg font-medium text-gray-800">
          WMS-Dienste Bayern
        </h3>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Für die Anzeige von Karten und Bodenrichtwerten nutzen wir
          WMS-Dienste (Web Map Service) des Freistaats Bayern (BayernAtlas /
          LDBV). Dabei werden die angefragten Kartenausschnitte (Koordinaten,
          Zoomstufe) an die Server des Landesamts für Digitalisierung,
          Breitband und Vermessung übermittelt. Es werden keine
          personenbezogenen Daten übertragen.
        </p>
      </section>

      {/* Aufsichtsbehörde */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          7. Aufsichtsbehörde
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Zuständige Aufsichtsbehörde für den Datenschutz in Bayern:
        </p>
        <div className="mt-4 space-y-1 text-gray-700 leading-relaxed">
          <p className="font-medium">
            Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)
          </p>
          <p>Promenade 18</p>
          <p>91522 Ansbach</p>
          <p>
            Telefon: +49 (0) 981 180093-0
          </p>
          <p>
            E-Mail: poststelle@lda.bayern.de
          </p>
          <p>
            Website:{" "}
            <a
              href="https://www.lda.bayern.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] underline hover:no-underline"
            >
              www.lda.bayern.de
            </a>
          </p>
        </div>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Sie haben das Recht, sich bei der Aufsichtsbehörde zu beschweren,
          wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer
          personenbezogenen Daten rechtswidrig erfolgt.
        </p>
      </section>

      {/* Cookies */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">8. Cookies</h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Diese Website verwendet ausschließlich technisch notwendige Cookies,
          die für den Betrieb des Dienstes erforderlich sind:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Session-Cookie:</strong> Speichert Ihre
            Anmelde-Sitzung (JWT-Token). Wird beim Schließen des Browsers
            bzw. nach Ablauf der Sitzung gelöscht.
          </li>
        </ul>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Es werden keine Tracking-Cookies, Analyse-Cookies oder
          Werbe-Cookies eingesetzt. Sollte sich dies in Zukunft ändern,
          werden wir Sie vorab um Ihre Einwilligung bitten
          (Cookie-Banner).
        </p>
      </section>
    </div>
  );
}
