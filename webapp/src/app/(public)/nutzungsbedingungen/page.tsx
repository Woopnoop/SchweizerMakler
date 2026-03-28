import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen — MaklerToolkit",
};

export default function NutzungsbedingungenPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Nutzungsbedingungen
      </h1>
      <p className="mt-4 text-sm text-gray-500">Stand: März 2026</p>

      {/* Geltungsbereich */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          1. Geltungsbereich
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Diese Nutzungsbedingungen gelten für die Nutzung des MaklerToolkit
          Web-Dashboards sowie der SchweizerMakler Browser-Extension
          (zusammen: &ldquo;der Dienst&rdquo;).
        </p>
      </section>

      {/* Leistungsbeschreibung */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          2. Leistungsbeschreibung
        </h2>

        <h3 className="mt-6 text-lg font-medium text-gray-800">
          2.1 Browser-Extension
        </h3>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Die Browser-Extension ist ein <strong>persönliches
          Hilfsmittel</strong> für Immobilienmakler. Sie unterstützt den Nutzer
          beim manuellen Besuch von Immobilienportalen, indem sie:
        </p>
        <ul className="mt-2 list-disc pl-6 space-y-1 text-gray-700">
          <li>den aktuellen Preis einer Anzeige lokal speichert</li>
          <li>Preisänderungen bei erneutem Besuch anzeigt</li>
          <li>eine Standortbewertung auf Basis öffentlicher OpenStreetMap-Daten berechnet</li>
        </ul>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Die Extension liest ausschließlich bereits im Browser geladene
          Seiteninhalte. Sie sendet <strong>keine automatisierten
          Anfragen</strong> an Immobilienportale und speichert alle Daten
          lokal im Browser des Nutzers.
        </p>

        <h3 className="mt-6 text-lg font-medium text-gray-800">
          2.2 Web-Dashboard (MaklerToolkit)
        </h3>
        <p className="mt-2 text-gray-700 leading-relaxed">
          Das Web-Dashboard bietet Werkzeuge für Immobilienmakler:
          Kaufnebenkosten-Rechner, Mietpreisspiegel, Stadtteil-Analyse,
          Exposé-Generator, Interessenten-Verwaltung und Leads-Übersicht.
        </p>
      </section>

      {/* Nutzungspflichten */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          3. Pflichten des Nutzers
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Der Nutzer verpflichtet sich:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            Die Extension ausschließlich als <strong>persönliches
            Hilfsmittel</strong> zu nutzen, nicht zur systematischen
            Datensammlung oder zum Weiterverkauf von Daten
          </li>
          <li>
            Die Nutzungsbedingungen der besuchten Immobilienportale zu
            beachten
          </li>
          <li>
            Keine aus der Extension gewonnenen Daten an Dritte
            weiterzugeben oder öffentlich zugänglich zu machen
          </li>
          <li>
            Keine Modifikationen an der Extension vorzunehmen, die
            automatisierte Massenabfragen ermöglichen
          </li>
          <li>
            Im CRM (Interessenten-Verwaltung) die DSGVO einzuhalten,
            insbesondere die Einwilligung der Betroffenen einzuholen
          </li>
        </ul>
      </section>

      {/* Datenverarbeitung */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          4. Datenverarbeitung
        </h2>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            <strong>Lokale Speicherung:</strong> Die Extension speichert
            Immobiliendaten ausschließlich lokal im Browser
            (chrome.storage.local). Es findet keine automatische
            Übertragung an unsere Server statt.
          </li>
          <li>
            <strong>Freiwilliger Export:</strong> Nur auf ausdrücklichen
            Wunsch des Nutzers (Button &ldquo;An MaklerToolkit
            senden&rdquo;) werden Daten an das Web-Dashboard übermittelt.
          </li>
          <li>
            <strong>Keine Personendaten:</strong> Die Extension erfasst
            keine personenbezogenen Daten von Inserenten (keine Namen,
            E-Mails, Telefonnummern).
          </li>
        </ul>
      </section>

      {/* Geodaten */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          5. Geodaten und Quellennennung
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Die Standortbewertung basiert auf Daten von OpenStreetMap
          (© OpenStreetMap contributors, ODbL-Lizenz). Die Nutzung erfolgt
          im Rahmen der ODbL-Lizenz mit korrekter Quellennennung.
        </p>
      </section>

      {/* Haftungsausschluss */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          6. Haftungsausschluss
        </h2>
        <ul className="mt-4 list-disc pl-6 space-y-2 text-gray-700">
          <li>
            Die berechneten Werte (Kaufnebenkosten, Mietpreisspiegel,
            Standort-Scores) dienen als Orientierung und sind
            <strong> keine rechtsverbindlichen Auskünfte</strong>.
          </li>
          <li>
            Für die Richtigkeit der von Immobilienportalen gelesenen Daten
            (Preise, Flächen) übernehmen wir keine Gewähr.
          </li>
          <li>
            Die Nutzung der Extension erfolgt auf eigenes Risiko des Nutzers.
          </li>
        </ul>
      </section>

      {/* Änderungen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          7. Änderungen der Nutzungsbedingungen
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Wir behalten uns vor, diese Nutzungsbedingungen jederzeit zu
          ändern. Über wesentliche Änderungen werden registrierte Nutzer
          per E-Mail informiert. Die weitere Nutzung des Dienstes nach
          Änderung gilt als Zustimmung.
        </p>
      </section>

      {/* Schlussbestimmungen */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          8. Schlussbestimmungen
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Es gilt das Recht der Bundesrepublik Deutschland.
          Gerichtsstand ist, soweit gesetzlich zulässig, der Sitz des
          Anbieters.
        </p>
      </section>
    </div>
  );
}
