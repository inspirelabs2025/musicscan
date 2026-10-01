/**
 * Teksten van de hubs /waarde/lp en /waarde/cd.
 *
 * Los van de React-pagina zodat scripts/prerender.mjs precies dezelfde tekst
 * in de voorgerenderde HTML kan zetten. Geen imports: vite bakt dit bestand
 * los voor de prerender.
 */

export type Media = 'lp' | 'cd';

export const WAARDE_HUB_COPY: Record<Media, {
  title: string;
  description: string;
  h1: string;
  intro: string[];
  sections: Array<{ h: string; p: string[] }>;
  faq: Array<{ q: string; a: string }>;
  linksHeading: string;
}> = {
  lp: {
    title: 'Waarde van je lp bepalen | MusicScan',
    description:
      'Wat is je lp waard? De prijs hangt af van de persing en de conditie, niet van het album. Zo lees je het catalogusnummer en de matrixcode van je plaat.',
    h1: 'Wat is je lp waard?',
    intro: [
      'De vraag "wat is deze plaat waard" heeft zelden één antwoord. Van een bekend album bestaan al snel honderden uitgaven: een eerste persing uit het land van herkomst, licentiepersingen voor andere markten, heruitgaven, jubileumedities, kleurvinyl. Tussen de goedkoopste en de duurste daarvan zit vaak een factor tien of meer, en het verschil zit niet in de muziek maar in welk exemplaar je in handen hebt.',
      'Daarom werken wij met een vork in plaats van één bedrag, met daarbij het bedrag waar de meeste exemplaren voor weggaan. Dat cijfer is een aggregaat over alle persingen die op dat moment daadwerkelijk te koop staan, niet de vraagprijs van één verkoper.',
    ],
    sections: [
      {
        h: 'Het catalogusnummer is de sleutel',
        p: [
          'Elke uitgave heeft een catalogusnummer van het platenlabel. Je vindt het op het label in het midden van de plaat, op de rug van de hoes en meestal ook achterop rechtsboven. Het ziet eruit als SD 7200, 25098 XOT of MERH 58.',
          'Dat nummer verschilt per land. Dezelfde plaat kreeg in Nederland een ander nummer dan in de Verenigde Staten, en juist dat bepaalt wat je exemplaar waard is. Wie alleen op artiest en albumtitel zoekt, krijgt een gemiddelde van honderden uitgaven te zien en dus een getal dat voor bijna niemand klopt.',
        ],
      },
      {
        h: 'De matrixcode vertelt welke persing het is',
        p: [
          'In de gladde ring tussen de laatste groef en het label staat een code ingekrast of gestempeld. Dat is de matrix- of runout-code, en die identificeert de persmatrijs. Twee platen met hetzelfde catalogusnummer kunnen verschillende matrixcodes hebben, en bij vroege persingen is dat precies het onderscheid waar verzamelaars naar zoeken.',
          'Kantel de plaat onder een lamp om de code te kunnen lezen. Letters en cijfers zijn vaak klein en ondiep ingekrast.',
        ],
      },
      {
        h: 'Conditie weegt zwaarder dan je denkt',
        p: [
          'De gangbare schaal loopt van Mint via Near Mint, Very Good Plus en Very Good naar Good. Tussen Near Mint en Very Good zit bij een gewilde plaat al snel de helft van de waarde. Beoordeel hoes en plaat apart: een gave plaat in een versleten hoes levert minder op dan beide in nette staat.',
          'Kijk naar krassen die je met je nagel voelt, ringslijtage op de hoes, naadscheuren en of de binnenhoes en eventuele inserts er nog in zitten. Ontbrekende inserts drukken de prijs merkbaar.',
        ],
      },
      {
        h: 'Schaarste is vraag tegen aanbod',
        p: [
          'Zeldzaam betekent niet automatisch waardevol. Een plaat die bijna niemand bezit maar die ook niemand zoekt, brengt weinig op. Op onze albumpagina’s staat daarom hoeveel verzamelaars een persing bezitten tegenover hoeveel er naar zoeken. Ligt de vraag hoger dan het aanbod, dan trekt dat de vork omhoog.',
        ],
      },
    ],
    faq: [
      {
        q: 'Waarom krijg ik overal een ander bedrag te zien?',
        a: 'Omdat de meeste bronnen prijzen van verschillende persingen door elkaar halen. Een Amerikaanse eerste persing en een Europese heruitgave uit 2015 staan onder dezelfde albumtitel, terwijl ze tientallen euro’s uit elkaar liggen.',
      },
      {
        q: 'Is een eerste persing altijd het meest waard?',
        a: 'Meestal wel, maar niet altijd. Er zijn latere heruitgaven in kleine oplage of met beter geluid die hoger genoteerd staan dan de originele uitgave.',
      },
      {
        q: 'Telt kleurvinyl mee?',
        a: 'Ja. Gekleurde of gelimiteerde persingen hebben vaak een eigen catalogusnummer en een eigen prijsniveau, los van de gewone zwarte uitgave.',
      },
    ],
    linksHeading: 'Albums waarvan de waarde al is uitgezocht',
  },
  cd: {
    title: 'Waarde van je cd bepalen | MusicScan',
    description:
      'Wat is je cd waard? Oplage, persland en de matrixcode in de binnenring bepalen de prijs. Zo herken je welke uitgave je in handen hebt.',
    h1: 'Wat is je cd waard?',
    intro: [
      'Cd’s hebben een slechtere reputatie dan ze verdienen. Het klopt dat de meeste titels uit de jaren negentig voor een paar euro van eigenaar gaan: er zijn er miljoenen van geperst en het aanbod is enorm. Maar de uitzonderingen zijn scherp. Vroege West-Duitse persingen, Japanse uitgaven met obi-strook, korte oplagen en titels die nooit zijn heruitgegeven lopen ver boven dat niveau uit.',
      'Net als bij vinyl geldt: het album zegt weinig, de uitgave zegt alles. Daarom tonen wij een vork met daarbij het bedrag waar de meeste exemplaren voor weggaan.',
    ],
    sections: [
      {
        h: 'Waar je het catalogusnummer vindt',
        p: [
          'Het catalogusnummer staat op de rug van het doosje, op het schijfje zelf en meestal achterop het boekje. Het ziet eruit als 258 123 of CDP 7 46001 2.',
          'Let op de streepjescode: die verschilt per markt en helpt onderscheiden of je een Europese, Amerikaanse of Japanse uitgave hebt.',
        ],
      },
      {
        h: 'De matrixcode in de binnenring',
        p: [
          'In de doorzichtige binnenring van het schijfje staat een code gedrukt, vaak met de naam van de perserij erbij. Vermeldingen als "Made in West Germany by PDO" of "Made in Japan" wijzen op vroege persingen uit de begintijd van de cd, en dat is precies waar de hogere prijzen zitten.',
          'Houd het schijfje schuin onder een lamp; de tekst is klein en staat in de heldere rand rond het gat.',
        ],
      },
      {
        h: 'Conditie: het boekje bepaalt mee',
        p: [
          'Het schijfje zelf is redelijk robuust, dus de conditie van het boekje, het achterblad en het doosje maakt hier relatief meer uit dan bij vinyl. Een compleet boekje zonder vochtvlekken en een ongebroken doosje schelen echt.',
          'Controleer ook of de promotiestickers en eventuele obi-strook er nog zijn. Bij Japanse uitgaven is een ontbrekende obi goed voor een flinke afwaardering.',
        ],
      },
      {
        h: 'Waarom de meeste cd’s weinig opbrengen',
        p: [
          'Van een succesvol album uit de jaren negentig zijn er vaak miljoenen geperst, en die liggen nu allemaal tegelijk op de markt. Vraag en aanbod doen de rest. Dat maakt het des te belangrijker om te controleren of jouw exemplaar toevallig uit een van de kleine, vroege of regionale oplagen komt.',
        ],
      },
    ],
    faq: [
      {
        q: 'Zijn oude cd’s meer waard dan nieuwe?',
        a: 'Niet per definitie. Leeftijd op zich telt niet; oplage en persland wel. Een vroege West-Duitse persing is gewild omdat er weinig van zijn, niet omdat hij oud is.',
      },
      {
        q: 'Wat is een obi-strook?',
        a: 'De smalle papieren strook langs de zijkant van Japanse uitgaven, met de titel in het Japans. Verzamelaars rekenen die mee; zonder obi is een Japanse cd aanzienlijk minder waard.',
      },
      {
        q: 'Mijn cd zit in een kartonnen hoesje in plaats van een doosje.',
        a: 'Dan heb je waarschijnlijk een promo-uitgave of een latere heruitgave in cardsleeve. Beide hebben een eigen catalogusnummer en een eigen prijsniveau.',
      },
    ],
    linksHeading: 'Albums waarvan de waarde al is uitgezocht',
  },
};
