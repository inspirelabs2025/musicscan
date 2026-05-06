import React from 'react';
import { Helmet } from 'react-helmet-async';

const AccountVerwijderen: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Account verwijderen | MusicScan</title>
        <meta
          name="description"
          content="Hoe verwijder je je MusicScan account en alle bijbehorende data. Instructies in de app of per email."
        />
        <link rel="canonical" href="https://musicscan.app/account-verwijderen" />
      </Helmet>

      <main className="container mx-auto max-w-3xl px-4 py-12 pt-24">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Account verwijderen</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Hoe verwijder je je MusicScan account en alle bijbehorende data
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">1. In de app verwijderen</h2>
          <p className="text-foreground mb-3">De makkelijkste manier om je account te verwijderen:</p>
          <ol className="list-decimal pl-6 space-y-1 text-foreground mb-3">
            <li>Open de MusicScan app</li>
            <li>Login met je account</li>
            <li>Ga naar Instellingen</li>
            <li>Scroll naar Gevarenzone (Danger Zone)</li>
            <li>Klik op 'Account verwijderen' en bevestig</li>
          </ol>
          <p className="text-muted-foreground">
            Je account wordt direct verwijderd. Alle scangeschiedenis, foto's en persoonlijke gegevens
            worden binnen 30 dagen permanent verwijderd uit onze databases.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">2. Per email aanvragen</h2>
          <p className="text-foreground mb-3">
            Geen toegang meer tot de app? Stuur een email naar{' '}
            <a href="mailto:info@musicscan.app" className="text-primary underline">
              info@musicscan.app
            </a>{' '}
            met:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-foreground mb-3">
            <li>Het email-adres van je account</li>
            <li>Onderwerp: 'Account verwijdering'</li>
          </ul>
          <p className="text-muted-foreground">We bevestigen verwijdering binnen 5 werkdagen.</p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">3. Wat wordt verwijderd</h2>
          <p className="text-foreground mb-3">Bij accountverwijdering verwijderen we:</p>
          <ul className="list-disc pl-6 space-y-1 text-foreground mb-4">
            <li>Je profielgegevens (naam, email)</li>
            <li>Alle gescande vinyl/CDs en scangeschiedenis</li>
            <li>Geüploade foto's en analysedata</li>
            <li>AI-chatgeschiedenis</li>
            <li>Discogs verbinding (token)</li>
            <li>Notificatie-instellingen</li>
          </ul>
          <p className="text-foreground mb-2 font-medium">Wat we bewaren (wettelijk verplicht):</p>
          <ul className="list-disc pl-6 space-y-1 text-foreground">
            <li>Bestelgegevens: 7 jaar (fiscaal)</li>
            <li>Anonieme analytics: vrij van persoonsgegevens</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">4. Contact</h2>
          <p className="text-foreground">
            Vragen? Mail ons op{' '}
            <a href="mailto:info@musicscan.app" className="text-primary underline">
              info@musicscan.app
            </a>
          </p>
        </section>
      </main>
    </>
  );
};

export default AccountVerwijderen;
