import type { CorePageKey, Locale } from '@/config/site';

export interface CoreSeoEntry {
  title: string;
  description: string;
  keywords: string;
}

/** Titles/descriptions for the indexable scan + value pages, per language. */
export const CORE_SEO: Record<CorePageKey, Record<Locale, CoreSeoEntry>> = {
  home: {
    nl: {
      title: 'Scan je platen en ontdek de waarde | MusicScan',
      description:
        'Maak een foto van je LP, vinyl of CD en weet binnen 3-6 seconden wat je plaat is en wat hij waard is. Gratis proberen in de app of op het web.',
      keywords: 'platen scannen, vinyl waarde, lp waarde bepalen, cd scannen, platen taxeren',
    },
    en: {
      title: 'Scan your records and discover their value | MusicScan',
      description:
        'Photograph your LP, vinyl or CD and know within 3-6 seconds what the record is and what it is worth. Free to try in the app or on the web.',
      keywords: 'scan records, vinyl value, lp value checker, cd scanner, record appraisal',
    },
    de: {
      title: 'Schallplatten scannen und Wert entdecken | MusicScan',
      description:
        'Fotografiere deine LP, Vinyl oder CD und erfahre in 3-6 Sekunden, welche Platte es ist und was sie wert ist. Kostenlos testen in der App oder im Web.',
      keywords: 'schallplatten scannen, vinyl wert, lp wert ermitteln, cd scannen, platten schätzen',
    },
    fr: {
      title: 'Scannez vos disques et découvrez leur valeur | MusicScan',
      description:
        'Photographiez votre LP, vinyle ou CD et sachez en 3 à 6 secondes de quel disque il s\'agit et ce qu\'il vaut. Essai gratuit dans l\'app ou sur le web.',
      keywords: 'scanner disques, valeur vinyle, estimation lp, scanner cd, estimer un disque',
    },
  },
  scan: {
    nl: {
      title: 'Scan je LP, vinyl of CD met je camera | MusicScan',
      description:
        'Richt je camera op de hoes of het label en MusicScan herkent artiest, album, persing en barcode. Werkt op vinyl, LP en CD, in 3-6 seconden.',
      keywords: 'lp scannen, vinyl scanner, cd scannen, plaat herkennen, barcode scannen platen',
    },
    en: {
      title: 'Scan your LP, vinyl or CD with your camera | MusicScan',
      description:
        'Point your camera at the sleeve or label and MusicScan recognises artist, album, pressing and barcode. Works on vinyl, LP and CD in 3-6 seconds.',
      keywords: 'scan lp, vinyl scanner, scan cd, identify record, record barcode scanner',
    },
    de: {
      title: 'LP, Vinyl oder CD mit der Kamera scannen | MusicScan',
      description:
        'Richte die Kamera auf Cover oder Label und MusicScan erkennt Künstler, Album, Pressung und Barcode. Für Vinyl, LP und CD, in 3-6 Sekunden.',
      keywords: 'lp scannen, vinyl scanner, cd scannen, platte erkennen, barcode scanner platten',
    },
    fr: {
      title: 'Scannez votre LP, vinyle ou CD avec votre caméra | MusicScan',
      description:
        'Visez la pochette ou le label et MusicScan reconnaît l\'artiste, l\'album, le pressage et le code-barres. Vinyle, LP et CD, en 3 à 6 secondes.',
      keywords: 'scanner lp, scanner vinyle, scanner cd, identifier un disque, code-barres disque',
    },
  },
  value: {
    nl: {
      title: 'Ontdek de waarde van je platen | MusicScan',
      description:
        'Weet wat je vinyl, LP of CD waard is. MusicScan toont actuele marktprijzen per persing en conditie, zodat je nooit te goedkoop verkoopt.',
      keywords: 'waarde vinyl, lp waarde bepalen, platen taxeren, wat is mijn plaat waard, cd waarde',
    },
    en: {
      title: 'Discover what your records are worth | MusicScan',
      description:
        'Find out what your vinyl, LP or CD is worth. MusicScan shows current market prices per pressing and condition, so you never sell too cheap.',
      keywords: 'vinyl value, lp value, record appraisal, what is my record worth, cd value',
    },
    de: {
      title: 'Entdecke den Wert deiner Schallplatten | MusicScan',
      description:
        'Erfahre, was deine Vinyl, LP oder CD wert ist. MusicScan zeigt aktuelle Marktpreise je Pressung und Zustand, damit du nie zu billig verkaufst.',
      keywords: 'vinyl wert, lp wert, platten schätzen, was ist meine platte wert, cd wert',
    },
    fr: {
      title: 'Découvrez la valeur de vos disques | MusicScan',
      description:
        'Sachez ce que valent vos vinyles, LP ou CD. MusicScan affiche les prix du marché par pressage et état, pour ne jamais vendre trop bas.',
      keywords: 'valeur vinyle, valeur lp, estimation disque, que vaut mon disque, valeur cd',
    },
  },
  app: {
    nl: {
      title: 'Download de MusicScan app | Android en web',
      description:
        'Scan je platen onderweg met de MusicScan app voor Android, of gebruik direct de webversie in je browser. De iOS-app volgt binnenkort.',
      keywords: 'musicscan app, platen scan app, vinyl app android, cd scan app',
    },
    en: {
      title: 'Download the MusicScan app | Android and web',
      description:
        'Scan records on the go with the MusicScan app for Android, or use the web version straight from your browser. The iOS app is coming soon.',
      keywords: 'musicscan app, record scanner app, vinyl app android, cd scanner app',
    },
    de: {
      title: 'MusicScan App herunterladen | Android und Web',
      description:
        'Scanne Platten unterwegs mit der MusicScan App für Android oder nutze die Webversion direkt im Browser. Die iOS-App folgt in Kürze.',
      keywords: 'musicscan app, platten scan app, vinyl app android, cd scan app',
    },
    fr: {
      title: 'Téléchargez l\'application MusicScan | Android et web',
      description:
        'Scannez vos disques partout avec l\'app MusicScan pour Android, ou utilisez la version web dans votre navigateur. L\'app iOS arrive bientôt.',
      keywords: 'application musicscan, app scanner disque, app vinyle android, app cd',
    },
  },
  pricing: {
    nl: {
      title: 'Prijzen en credits | MusicScan',
      description:
        'Begin gratis en koop credits wanneer je meer wilt scannen. Heldere prijzen, geen abonnement verplicht.',
      keywords: 'musicscan prijzen, credits kopen, scan credits, vinyl scanner kosten',
    },
    en: {
      title: 'Pricing and credits | MusicScan',
      description:
        'Start for free and buy credits when you want to scan more. Clear pricing, no subscription required.',
      keywords: 'musicscan pricing, buy credits, scan credits, vinyl scanner cost',
    },
    de: {
      title: 'Preise und Credits | MusicScan',
      description:
        'Starte kostenlos und kaufe Credits, wenn du mehr scannen willst. Klare Preise, kein Abo nötig.',
      keywords: 'musicscan preise, credits kaufen, scan credits, vinyl scanner kosten',
    },
    fr: {
      title: 'Tarifs et crédits | MusicScan',
      description:
        'Commencez gratuitement et achetez des crédits pour scanner davantage. Tarifs clairs, sans abonnement.',
      keywords: 'tarifs musicscan, acheter des crédits, crédits de scan, coût scanner vinyle',
    },
  },
};

interface LandingCopy {
  heading: string;
  intro: string;
  steps: { title: string; body: string }[];
  ctaPrimary: string;
  ctaSecondary: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
}

/** Copy for the scan landing page. */
export const SCAN_COPY: Record<Locale, LandingCopy> = {
  nl: {
    heading: 'Scan je platen in 3-6 seconden',
    intro:
      'Vinyl, LP of CD: maak een foto van de hoes of het label en MusicScan herkent artiest, titel, persing en barcode. Geen handmatig typen, geen zoeken in catalogi.',
    steps: [
      { title: 'Maak een foto', body: 'Hoes, label of barcode. Eén foto is genoeg.' },
      { title: 'Herkenning', body: 'De scanner leest de zichtbare kenmerken uit: barcode, matrixcode en IFPI.' },
      { title: 'Resultaat', body: 'Je ziet direct artiest, album, jaar en persing, plus de actuele waarde.' },
    ],
    ctaPrimary: 'Start met scannen',
    ctaSecondary: 'Bekijk de waarde-check',
    faqTitle: 'Veelgestelde vragen',
    faq: [
      { q: 'Werkt het ook op CD\'s?', a: 'Ja. Vinyl, LP, single en CD worden allemaal herkend.' },
      { q: 'Heb ik de app nodig?', a: 'Nee, scannen werkt ook gewoon in je browser. De app is handiger onderweg.' },
      { q: 'Hoe lang duurt een scan?', a: 'Meestal 3 tot 6 seconden.' },
    ],
  },
  en: {
    heading: 'Scan your records in 3-6 seconds',
    intro:
      'Vinyl, LP or CD: photograph the sleeve or the label and MusicScan recognises artist, title, pressing and barcode. No manual typing, no catalogue hunting.',
    steps: [
      { title: 'Take a photo', body: 'Sleeve, label or barcode. One photo is enough.' },
      { title: 'Recognition', body: 'The scanner reads the visible identifiers: barcode, matrix code and IFPI.' },
      { title: 'Result', body: 'You instantly see artist, album, year and pressing, plus the current value.' },
    ],
    ctaPrimary: 'Start scanning',
    ctaSecondary: 'See the value check',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'Does it work on CDs?', a: 'Yes. Vinyl, LP, singles and CDs are all recognised.' },
      { q: 'Do I need the app?', a: 'No, scanning works in your browser too. The app is handier on the go.' },
      { q: 'How long does a scan take?', a: 'Usually 3 to 6 seconds.' },
    ],
  },
  de: {
    heading: 'Scanne deine Platten in 3-6 Sekunden',
    intro:
      'Vinyl, LP oder CD: Fotografiere Cover oder Label und MusicScan erkennt Künstler, Titel, Pressung und Barcode. Kein Tippen, kein Katalogsuchen.',
    steps: [
      { title: 'Foto machen', body: 'Cover, Label oder Barcode. Ein Foto reicht.' },
      { title: 'Erkennung', body: 'Der Scanner liest die sichtbaren Merkmale: Barcode, Matrixcode und IFPI.' },
      { title: 'Ergebnis', body: 'Du siehst sofort Künstler, Album, Jahr und Pressung sowie den aktuellen Wert.' },
    ],
    ctaPrimary: 'Jetzt scannen',
    ctaSecondary: 'Zur Wertermittlung',
    faqTitle: 'Häufige Fragen',
    faq: [
      { q: 'Funktioniert es auch mit CDs?', a: 'Ja. Vinyl, LP, Single und CD werden erkannt.' },
      { q: 'Brauche ich die App?', a: 'Nein, Scannen geht auch im Browser. Die App ist unterwegs praktischer.' },
      { q: 'Wie lange dauert ein Scan?', a: 'Meist 3 bis 6 Sekunden.' },
    ],
  },
  fr: {
    heading: 'Scannez vos disques en 3 à 6 secondes',
    intro:
      'Vinyle, LP ou CD : photographiez la pochette ou le label et MusicScan reconnaît l\'artiste, le titre, le pressage et le code-barres. Sans saisie manuelle.',
    steps: [
      { title: 'Prenez une photo', body: 'Pochette, label ou code-barres. Une photo suffit.' },
      { title: 'Reconnaissance', body: 'Le scanner lit les identifiants visibles : code-barres, matrice et IFPI.' },
      { title: 'Résultat', body: 'Vous voyez aussitôt artiste, album, année, pressage et la valeur actuelle.' },
    ],
    ctaPrimary: 'Commencer à scanner',
    ctaSecondary: 'Voir l\'estimation',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: 'Cela marche-t-il pour les CD ?', a: 'Oui. Vinyle, LP, single et CD sont reconnus.' },
      { q: 'Faut-il l\'application ?', a: 'Non, le scan fonctionne aussi dans le navigateur.' },
      { q: 'Combien de temps dure un scan ?', a: 'En général 3 à 6 secondes.' },
    ],
  },
};

/** Copy for the value landing page. */
export const VALUE_COPY: Record<Locale, LandingCopy> = {
  nl: {
    heading: 'Ontdek wat je platen waard zijn',
    intro:
      'Na de scan zie je de actuele marktwaarde van je plaat: gebaseerd op echte verkopen, per persing en per conditie. Zo weet je of je een zeldzame uitgave in handen hebt.',
    steps: [
      { title: 'Scan de plaat', body: 'Eén foto van hoes of label is genoeg.' },
      { title: 'Persing bepalen', body: 'Matrixcode en barcode bepalen welke uitgave je precies hebt.' },
      { title: 'Waarde bekijken', body: 'Je ziet prijsindicaties per conditie en het verloop over de tijd.' },
    ],
    ctaPrimary: 'Check de waarde',
    ctaSecondary: 'Hoe scannen werkt',
    faqTitle: 'Veelgestelde vragen',
    faq: [
      { q: 'Waar komt de waarde vandaan?', a: 'Uit actuele marktdata van verkochte exemplaren, per persing.' },
      { q: 'Maakt de conditie uit?', a: 'Zeker. Het verschil tussen mint en versleten is vaak een veelvoud.' },
      { q: 'Kost een waardecheck geld?', a: 'Je begint gratis; daarna werk je met credits.' },
    ],
  },
  en: {
    heading: 'Discover what your records are worth',
    intro:
      'After the scan you see the current market value of your record: based on real sales, per pressing and per condition. So you know when you hold a rare edition.',
    steps: [
      { title: 'Scan the record', body: 'One photo of the sleeve or label is enough.' },
      { title: 'Identify the pressing', body: 'Matrix code and barcode pin down the exact edition.' },
      { title: 'See the value', body: 'You get price indications per condition and the trend over time.' },
    ],
    ctaPrimary: 'Check the value',
    ctaSecondary: 'How scanning works',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'Where does the value come from?', a: 'From current market data of sold copies, per pressing.' },
      { q: 'Does condition matter?', a: 'A lot. Mint versus worn is often a multiple in price.' },
      { q: 'Does a value check cost money?', a: 'You start for free, then you use credits.' },
    ],
  },
  de: {
    heading: 'Entdecke den Wert deiner Platten',
    intro:
      'Nach dem Scan siehst du den aktuellen Marktwert: basierend auf echten Verkäufen, je Pressung und Zustand. So erkennst du eine seltene Ausgabe sofort.',
    steps: [
      { title: 'Platte scannen', body: 'Ein Foto von Cover oder Label genügt.' },
      { title: 'Pressung bestimmen', body: 'Matrixcode und Barcode zeigen die genaue Ausgabe.' },
      { title: 'Wert ansehen', body: 'Du bekommst Preisangaben je Zustand und den Verlauf über die Zeit.' },
    ],
    ctaPrimary: 'Wert prüfen',
    ctaSecondary: 'So funktioniert das Scannen',
    faqTitle: 'Häufige Fragen',
    faq: [
      { q: 'Woher kommt der Wert?', a: 'Aus aktuellen Marktdaten verkaufter Exemplare, je Pressung.' },
      { q: 'Zählt der Zustand?', a: 'Sehr. Zwischen Mint und abgenutzt liegt oft ein Vielfaches.' },
      { q: 'Kostet eine Wertprüfung Geld?', a: 'Du startest kostenlos, danach nutzt du Credits.' },
    ],
  },
  fr: {
    heading: 'Découvrez la valeur de vos disques',
    intro:
      'Après le scan, vous voyez la valeur de marché actuelle : basée sur des ventes réelles, par pressage et par état. Vous saurez si vous tenez une édition rare.',
    steps: [
      { title: 'Scannez le disque', body: 'Une photo de la pochette ou du label suffit.' },
      { title: 'Identifier le pressage', body: 'Le code matrice et le code-barres précisent l\'édition.' },
      { title: 'Voir la valeur', body: 'Vous obtenez des prix par état et l\'évolution dans le temps.' },
    ],
    ctaPrimary: 'Estimer la valeur',
    ctaSecondary: 'Comment ça marche',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: 'D\'où vient la valeur ?', a: 'De données de marché récentes sur les exemplaires vendus.' },
      { q: 'L\'état compte-t-il ?', a: 'Beaucoup. Entre mint et usé, le prix varie fortement.' },
      { q: 'L\'estimation est-elle payante ?', a: 'Vous démarrez gratuitement, puis avec des crédits.' },
    ],
  },
};

export const APP_COPY: Record<Locale, {
  heading: string;
  intro: string;
  play: string;
  ios: string;
  web: string;
  webBody: string;
}> = {
  nl: {
    heading: 'MusicScan op je telefoon of in je browser',
    intro: 'Scan je platen waar je ook bent. Nu op Google Play, binnenkort in de App Store.',
    play: 'Download voor Android',
    ios: 'iOS-app: binnenkort',
    web: 'Direct in je browser',
    webBody: 'Geen installatie nodig — scan meteen via de webversie.',
  },
  en: {
    heading: 'MusicScan on your phone or in your browser',
    intro: 'Scan your records anywhere. Available on Google Play, coming soon to the App Store.',
    play: 'Download for Android',
    ios: 'iOS app: coming soon',
    web: 'Straight in your browser',
    webBody: 'No installation needed — start scanning with the web version.',
  },
  de: {
    heading: 'MusicScan auf dem Handy oder im Browser',
    intro: 'Scanne deine Platten überall. Jetzt bei Google Play, bald im App Store.',
    play: 'Für Android herunterladen',
    ios: 'iOS-App: bald verfügbar',
    web: 'Direkt im Browser',
    webBody: 'Keine Installation nötig — scanne sofort mit der Webversion.',
  },
  fr: {
    heading: 'MusicScan sur votre téléphone ou dans le navigateur',
    intro: 'Scannez vos disques partout. Sur Google Play, bientôt sur l\'App Store.',
    play: 'Télécharger pour Android',
    ios: 'App iOS : bientôt',
    web: 'Directement dans le navigateur',
    webBody: 'Aucune installation — scannez avec la version web.',
  },
};
