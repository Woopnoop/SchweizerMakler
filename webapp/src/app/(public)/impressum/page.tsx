import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — MaklerToolkit",
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>

      {/* Angaben gemäß § 5 DDG */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          Angaben gemäß § 5 DDG
        </h2>
        <div className="mt-4 space-y-1 text-gray-700 leading-relaxed">
          <p>[TODO: Vor- und Nachname / Firmenname einsetzen]</p>
          <p>[TODO: Straße und Hausnummer einsetzen]</p>
          <p>[TODO: PLZ und Ort einsetzen]</p>
          <p>Deutschland</p>
        </div>
      </section>

      {/* Kontakt */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Kontakt</h2>
        <div className="mt-4 space-y-1 text-gray-700 leading-relaxed">
          <p>
            Telefon:{" "}
            <span className="text-gray-500">[TODO: Telefonnummer einsetzen]</span>
          </p>
          <p>
            E-Mail:{" "}
            <span className="text-gray-500">[TODO: E-Mail-Adresse einsetzen]</span>
          </p>
        </div>
      </section>

      {/* Umsatzsteuer-ID */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          Umsatzsteuer-ID
        </h2>
        <div className="mt-4 text-gray-700 leading-relaxed">
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a
            Umsatzsteuergesetz:
          </p>
          <p className="mt-2 text-gray-500">[TODO: USt-IdNr. einsetzen]</p>
        </div>
      </section>

      {/* Verantwortlich für den Inhalt */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <div className="mt-4 space-y-1 text-gray-700 leading-relaxed">
          <p>[TODO: Vor- und Nachname einsetzen]</p>
          <p>[TODO: Straße und Hausnummer einsetzen]</p>
          <p>[TODO: PLZ und Ort einsetzen]</p>
        </div>
      </section>

      {/* Haftungsausschluss */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          Haftung für Inhalte
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen.
        </p>
        <p className="mt-3 text-gray-700 leading-relaxed">
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
          Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir
          diese Inhalte umgehend entfernen.
        </p>
      </section>

      {/* Haftung für Links */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">
          Haftung für Links
        </h2>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
          der Seiten verantwortlich. Die verlinkten Seiten wurden zum
          Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
          Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht
          erkennbar.
        </p>
      </section>
    </div>
  );
}
