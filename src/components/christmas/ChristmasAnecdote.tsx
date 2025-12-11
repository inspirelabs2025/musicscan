import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChristmasAnecdote {
  id: number;
  title: string;
  content: string;
  artist: string;
  song: string;
  year?: number;
}

const CHRISTMAS_ANECDOTES: ChristmasAnecdote[] = [
  {
    id: 1,
    title: "Mariah's Miljardenhit die 25 Jaar Moest Wachten",
    content: "Mariah Carey's 'All I Want for Christmas Is You' werd in 1994 uitgebracht en was meteen een hit, maar bereikte pas in 2019 - 25 jaar later - de felbegeerde nummer 1 positie in de Billboard Hot 100. Het nummer werd geschreven in slechts 15 minuten samen met co-schrijver Walter Afanasieff. Mariah wilde bewust geen sample of cover maken, maar een volledig originele kerstklassieker creëren die de tijdloze kwaliteit van klassiekers als 'White Christmas' zou evenaren. Sindsdien verdient ze naar schatting €2,5 tot €3 miljoen per jaar aan royalties, en het nummer is inmiddels meer dan 1,2 miljard keer gestreamd op Spotify alleen. Elk jaar in december schiet het nummer weer naar de top van de hitlijsten wereldwijd.",
    artist: "Mariah Carey",
    song: "All I Want for Christmas Is You",
    year: 1994
  },
  {
    id: 2,
    title: "De 15-Minuten Kersthit die Nooit Meer Wegging",
    content: "Bobby Helms' 'Jingle Bell Rock' uit 1957 werd volgens co-schrijver Joe Beal in slechts 15 minuten geschreven op een zomerse dag in juli. Het nummer combineerde voor het eerst rock-and-roll met traditionele kerstmuziek, wat destijds zeer ongebruikelijk was. Platenmaatschappijen twijfelden of het publiek wel klaar was voor 'rockin' round the Christmas tree'. Ze hadden het mis: het nummer is sindsdien meer dan 100 miljoen keer gestreamd op Spotify, staat al 67 jaar onafgebroken in de kersthitlijsten, en heeft Bobby Helms' nabestaanden miljoenen opgeleverd.",
    artist: "Bobby Helms",
    song: "Jingle Bell Rock",
    year: 1957
  },
  {
    id: 3,
    title: "De Oorlogshit die de Wereld Troostte",
    content: "'White Christmas' van Bing Crosby uit 1942 is met naar schatting 50 miljoen verkochte exemplaren de best verkochte single aller tijden. Het nummer werd geschreven door Irving Berlin, een Joodse immigrant uit Rusland die het irónisch genoeg over een christelijke feestdag schreef. Berlin noemde het zelf 'het beste liedje dat ooit geschreven is' - en voegde eraan toe dat hij dat mocht zeggen omdat hij het zelf had geschreven. Het nummer werd uitgebracht tijdens de Tweede Wereldoorlog en werd een symbool van hoop voor Amerikaanse soldaten overzee die heimwee hadden naar huis. Tot op de dag van vandaag blijft het de ultieme kerstklassieker.",
    artist: "Bing Crosby",
    song: "White Christmas",
    year: 1942
  },
  {
    id: 4,
    title: "Band Aid: Een Supergroep in 24 Uur",
    content: "'Do They Know It's Christmas?' werd in november 1984 in slechts 24 uur opgenomen met de grootste Britse popsterren van dat moment: Bono, George Michael, Phil Collins, Boy George, Sting, en vele anderen. Bob Geldof en Midge Ure organiseerden de sessie als reactie op de hongersnood in Ethiopië. De artiesten werden letterlijk van hun bed gelicht of van concerten gehaald om mee te doen. Het resultaat werd de snelst verkopende single in de Britse geschiedenis en haalde £8 miljoen op voor hongerbestrijding. De iconische openingszin 'It's Christmas time, there's no need to be afraid' werd gezongen door Paul Young.",
    artist: "Band Aid",
    song: "Do They Know It's Christmas?",
    year: 1984
  },
  {
    id: 5,
    title: "Wham!'s Tragische Nummer 2",
    content: "'Last Christmas' van Wham! stond in december 1984 op nummer 2 in de UK Charts, geblokkeerd door niemand minder dan Band Aid's 'Do They Know It's Christmas?' - ironisch genoeg een nummer waar George Michael zelf aan had meegewerkt. Het duurde 36 jaar voordat 'Last Christmas' alsnog de nummer 1 positie bereikte: in januari 2021, kort na het overlijden van George Michael op Eerste Kerstdag 2016. Het nummer is inmiddels meer dan 1,6 miljard keer gestreamd en wordt beschouwd als een van de beste popliedjes over liefdesverdriet tijdens de feestdagen. De videoclip, gefilmd in het Zwitserse skiresort Saas-Fee, is ook iconisch geworden.",
    artist: "Wham!",
    song: "Last Christmas",
    year: 1984
  },
  {
    id: 6,
    title: "Rudolph's Controversiële Rode Neus",
    content: "Gene Autry's 'Rudolph the Red-Nosed Reindeer' uit 1949 is gebaseerd op een verhaaltje dat tien jaar eerder, in 1939, werd geschreven door Robert L. May voor warenhuis Montgomery Ward als marketingactie. Het rendier met de rode neus werd bijna verworpen door de directie: een rode neus werd destijds geassocieerd met alcoholisme en men vreesde een negatief imago. May overtuigde hen door illustrator Denver Gillen een schattig rendier te laten tekenen. Het boekje werd 2,4 miljoen keer uitgedeeld, en toen May's zwager Johnny Marks er een liedje van maakte, werd het een instant klassieker die meer dan 200 covers heeft geïnspireerd.",
    artist: "Gene Autry",
    song: "Rudolph the Red-Nosed Reindeer",
    year: 1949
  },
  {
    id: 7,
    title: "De 13-Jarige met de Miljardenstem",
    content: "Brenda Lee nam 'Rockin' Around the Christmas Tree' op in 1958 toen ze pas 13 jaar oud was. Haar producer Owen Bradley vond haar stem zo volwassen klinken dat niemand zou geloven dat ze een tiener was. Het nummer werd opgenomen in juli, midden in de zomer, in Nashville. Brenda moest kerstdecoraties in de studio hangen om 'in de stemming te komen'. Aanvankelijk was het geen grote hit, maar in 1960 explodeerde het en het nummer is nu goed voor meer dan 1,3 miljard streams op Spotify. Brenda Lee ontvangt nog steeds royalties en het nummer levert haar jaarlijks naar schatting €850.000 op.",
    artist: "Brenda Lee",
    song: "Rockin' Around the Christmas Tree",
    year: 1958
  },
  {
    id: 8,
    title: "De Verboden Kersthit uit een Ierse Kroeg",
    content: "'Fairytale of New York' van The Pogues met Kirsty MacColl werd door de BBC gecensureerd vanwege controversiële teksten met scheldwoorden. Desondanks - of misschien juist daardoor - is het al decennia de meest gedraaide kersthit in het VK en Ierland. Het nummer vertelt het verhaal van een alcoholverslaafde man in een New Yorkse gevangenis die droomt over een betere tijd met zijn geliefde. Shane MacGowan schreef het nummer oorspronkelijk voor een vrouw genaamd Cait O'Riordan, maar Kirsty MacColl nam haar plaats in en creëerde een van de meest ontroerende duetten uit de popgeschiedenis. Kirsty overleed tragisch in 2000.",
    artist: "The Pogues ft. Kirsty MacColl",
    song: "Fairytale of New York",
    year: 1987
  },
  {
    id: 9,
    title: "Slade's Slimme Pensioeninvestering",
    content: "Noddy Holder van Slade schreef 'Merry Xmas Everybody' in 1973 samen met bassist Jim Lea. Het iconische 'IT'S CHRISTMAAAAS!' aan het begin is een van de meest herkenbare openingen in de popgeschiedenis. Holder heeft het nummer ooit zijn 'pensioen' genoemd: hij verdient naar verluidt nog steeds £500.000 tot £1 miljoen per jaar aan royalties. Het nummer werd nummer 1 in het VK en bleef dat vijf weken lang. Bijzonder is dat de melodie al in 1967 was geschreven, maar de tekst pas in 1973 werd toegevoegd toen de band op het hoogtepunt van hun glam-rock succes stond.",
    artist: "Slade",
    song: "Merry Xmas Everybody",
    year: 1973
  },
  {
    id: 10,
    title: "Van Vergeten Flop naar Eeuwige Klassieker",
    content: "'Christmas (Baby Please Come Home)' van Darlene Love uit 1963 was oorspronkelijk een commerciële flop en verscheen slechts als albumtrack op Phil Spector's legendarische 'A Christmas Gift for You' album. Het duurde decennia voordat het werd erkend als een van de beste kerstnummers ooit gemaakt. Darlene Love's jaarlijkse live-optredens bij David Letterman's Late Show werden een traditie die 29 jaar duurde, van 1986 tot 2014. Deze optredens hielpen het nummer herontdekken door een nieuwe generatie. De Wall of Sound-productie van Spector, met lagen van echo en instrumenten, wordt nog steeds als een meesterwerk beschouwd.",
    artist: "Darlene Love",
    song: "Christmas (Baby Please Come Home)",
    year: 1963
  },
  {
    id: 11,
    title: "Nederland's Meest Gedraaide Kerstlied",
    content: "'Vrolijk Kerstfeest' van BZN uit 1987 is de meest gedraaide Nederlandse kersthit ooit en een vast onderdeel van elke Nederlandse kerstplaylist. De band nam het op in hun eigen studio in Volendam, waar ook al hun andere hits waren ontstaan. Het nummer combineerde hun karakteristieke Volendamse geluid met traditionele kerstsfeer en werd direct een hit. Frontman Jan Keizer en gitarist/producer Jan Tuijp creëerden een tijdloze klassieker die elk jaar opnieuw miljoenen keren wordt gestreamd. Het succes inspireerde andere Nederlandse artiesten om ook kerstmuziek op te nemen.",
    artist: "BZN",
    song: "Vrolijk Kerstfeest",
    year: 1987
  },
  {
    id: 12,
    title: "Het Kerstalbum dat in Juli werd Opgenomen",
    content: "The Carpenters namen hun kerstalbum 'Christmas Portrait' op in de zomer van 1978, wanneer het buiten 35 graden was. Karen Carpenter vond het vreemd om kerstliedjes te zingen terwijl de zon scheen, dus werden er kerstbomen en decoraties in de studio geplaatst om de sfeer te creëren. Het album bevat verfijnde arrangementen van klassieke kerstliedjes en is een van de best verkochte kerstalbums ooit. Karen's warme altstem geeft nummers als 'Merry Christmas, Darling' een intieme, nostalgische kwaliteit die fans over de hele wereld aanspreekt. Tragisch genoeg overleed Karen in 1983, maar haar kerstmuziek leeft voort.",
    artist: "The Carpenters",
    song: "Merry Christmas, Darling",
    year: 1978
  },
  {
    id: 13,
    title: "Paul McCartney's Controversiële Synth-Kerst",
    content: "Paul McCartney's 'Wonderful Christmastime' uit 1979 werd volledig door hemzelf opgenomen met vroege synthesizers in zijn thuisstudio. Het nummer verdeelt fans tot op de dag van vandaag: sommigen vinden de synth-geluiden irritant, anderen beschouwen het als een briljante modernisering van kerstmuziek. Ondanks gemengde kritieken verdient McCartney er jaarlijks naar schatting €400.000 tot €600.000 aan royalties. Hij schreef het nummer in slechts enkele uren en nam alle instrumenten zelf op. De videoclip, met Paul en zijn band Wings in een victoriaanse setting, is ook iconisch geworden.",
    artist: "Paul McCartney",
    song: "Wonderful Christmastime",
    year: 1979
  },
  {
    id: 14,
    title: "De Kerstoorlog tegen X Factor",
    content: "In december 2009 organiseerden Facebook-gebruikers een campagne om Rage Against the Machine's 'Killing in the Name' naar nummer 1 te krijgen in het VK - puur om te voorkomen dat de X Factor-winnaar (dat jaar Joe McElderry) automatisch de kerstnummer 1 zou worden. De campagne was een protest tegen de voorspelbaarheid van de Britse hitlijsten. Tegen alle verwachtingen in slaagden ze: RATM bereikte nummer 1 en versloeg de X Factor-single. De band doneerde de opbrengsten aan goede doelen. Het was de eerste keer sinds 2004 dat de X Factor-winnaar niet op nummer 1 stond met Kerst.",
    artist: "Rage Against the Machine",
    song: "Killing in the Name",
    year: 2009
  },
  {
    id: 15,
    title: "Het Kerstlied Geschreven op de Heetste Dag",
    content: "'The Christmas Song' (Chestnuts Roasting on an Open Fire) werd geschreven op een van de heetste dagen van 1945. Schrijvers Mel Tormé en Bob Wells probeerden af te koelen door aan koude winterse dingen te denken, en het resultaat was dit iconische nummer. Tormé claimde dat hij de muziek in slechts 45 minuten schreef. Nat King Cole's versie uit 1961, opgenomen met een volledig strijkorkest, is nu de definitieve versie geworden. Cole nam het nummer eigenlijk vier keer op tussen 1946 en 1961, elke keer met verbeterde technologie. Het is het meest opgenomen kerstlied in de Amerikaanse geschiedenis.",
    artist: "Nat King Cole",
    song: "The Christmas Song",
    year: 1961
  },
  {
    id: 16,
    title: "De Tweetalige Hit die Grenzen Overwon",
    content: "'Feliz Navidad' van José Feliciano uit 1970 was controversieel omdat het Spaans en Engels mengde in één nummer - iets wat destijds ongebruikelijk was voor mainstream radio. Feliciano, blind geboren in Puerto Rico, schreef het nummer in slechts vijf minuten als een simpele boodschap van vrede en vreugde. Nu is het een van de meest gestreamde kerstnummers ter wereld met meer dan 1 miljard plays op streamingplatforms. Het nummer wordt in meer dan 30 landen gedraaid en heeft Feliciano levenslange royalties opgeleverd. De eenvoud van de tekst - 'I want to wish you a Merry Christmas from the bottom of my heart' - maakt het universeel.",
    artist: "José Feliciano",
    song: "Feliz Navidad",
    year: 1970
  },
  {
    id: 17,
    title: "50 Muzikanten voor Één Nummer",
    content: "Wizzard's 'I Wish It Could Be Christmas Everyday' uit 1973 werd opgenomen in augustus met maar liefst 50 muzikanten in de studio. Frontman Roy Wood wilde het overdadige Phil Spector Wall of Sound-effect nabootsen en nam geen halve maatregelen. Het nummer bevat meerdere saxofoons, trompetten, strijkers, en zelfs een kinderkoor. De productiekosten waren astronomisch voor die tijd. Ondanks dat het nooit nummer 1 bereikte in het VK (het bleef steken op 4), is het een van de meest gedraaide Britse kerstnummers geworden en levert het de bandleden nog steeds aanzienlijke royalties op.",
    artist: "Wizzard",
    song: "I Wish It Could Be Christmas Everyday",
    year: 1973
  },
  {
    id: 18,
    title: "Michael Bublé: De Man die Alleen Met Kerst Bestaat",
    content: "Michael Bublé's kerstalbum 'Christmas' uit 2011 verkocht meer dan 12 miljoen exemplaren wereldwijd en maakte hem synoniem met de feestdagen. Bublé heeft hier gemengde gevoelens over: hij grapte ooit dat mensen hem in januari op straat stoppen om te vragen of hij nog leeft, alsof hij alleen in december bestaat. Het album bevat zowel klassiekers als originele nummers en staat elk jaar opnieuw in de top 10 van albumlijsten. Bublé's crooner-stijl, geïnspireerd door Frank Sinatra en Dean Martin, geeft de nummers een nostalgische kwaliteit die perfect past bij de kerstsfeer.",
    artist: "Michael Bublé",
    song: "It's Beginning to Look a Lot Like Christmas",
    year: 2011
  },
  {
    id: 19,
    title: "De Nieuwste Toevoeging aan de Klassiekers",
    content: "Kelly Clarkson's 'Underneath the Tree' uit 2013 is een van de weinige volledig originele kerstnummers van de afgelopen decennia die de status van 'instant klassieker' heeft bereikt. In tegenstelling tot de meeste moderne kerstalbums, die vol staan met covers, schreef Clarkson dit nummer speciaal voor haar album 'Wrapped in Red'. Het nummer, geproduceerd door hitmaker Greg Kurstin, channelt het retro Phil Spector-geluid met moderne productie. Het heeft inmiddels meer dan 800 miljoen streams en is een vast onderdeel van kerstplaylists geworden, wat bewijst dat het nog steeds mogelijk is om een nieuwe kerstklassieker te creëren.",
    artist: "Kelly Clarkson",
    song: "Underneath the Tree",
    year: 2013
  },
  {
    id: 20,
    title: "Rock-and-Roll's Eerste Kerstman",
    content: "'Run Rudolph Run' van Chuck Berry uit 1958 was een van de allereerste rock-and-roll kerstnummers en bewees dat kerstmuziek niet alleen voor crooners en koren was. Berry bracht zijn kenmerkende gitaarriffs naar het kerstgenre en creëerde een energiek nummer dat perfect paste bij de opkomende rock-and-roll beweging. Het inspireerde talloze covers, waaronder versies van Keith Richards, Bryan Adams, en Sheryl Crow. Berry's invloed op de rockgeschiedenis strekte zich dus ook uit tot de kerstmuziek, en hij bewees dat de feestdagen ook konden swingen.",
    artist: "Chuck Berry",
    song: "Run Rudolph Run",
    year: 1958
  },
  {
    id: 21,
    title: "De Tragische Dood Achter de Mooiste Duet",
    content: "Kirsty MacColl, die de vrouwelijke stem in 'Fairytale of New York' met The Pogues zong, overleed tragisch op 18 december 2000 bij een bootongeval in Mexico. Ze duwde haar zoon uit de weg van een speedboot en werd zelf geraakt. Elk jaar wordt het nummer nu aan haar opgedragen, en in Soho, Londen staat een bankje ter ere van haar met de tekst 'One day I'll be waiting there, no empty bench in Soho Square'. Het nummer, dat zij en Shane MacGowan samen zongen, wordt nog steeds beschouwd als het mooiste kerstduet ooit opgenomen.",
    artist: "Kirsty MacColl & The Pogues",
    song: "Fairytale of New York",
    year: 1987
  },
  {
    id: 22,
    title: "Lennon's Laatste Kerst-Vredesboodschap",
    content: "John Lennon's 'Happy Xmas (War Is Over)' uit 1971 was een protestlied tegen de Vietnamoorlog, gecreëerd als onderdeel van zijn en Yoko Ono's vredescampagne. De iconische kinderkoor-delen werden opgenomen door het Harlem Community Choir, en de boodschap 'War is over, if you want it' was afkomstig van hun eerdere reclameborden in steden wereldwijd. Het nummer werd in slechts twee dagen opgenomen in de Record Plant studio in New York. Tragisch genoeg werd Lennon in december 1980 vermoord, waardoor het nummer een extra emotionele lading kreeg tijdens de feestdagen.",
    artist: "John Lennon & Yoko Ono",
    song: "Happy Xmas (War Is Over)",
    year: 1971
  },
  {
    id: 23,
    title: "Het Onwaarschijnlijkste Duo in Muziekgeschiedenis",
    content: "In 1977 kwamen Bing Crosby en David Bowie samen voor een duetversie van 'Peace on Earth/Little Drummer Boy' - een van de meest onwaarschijnlijke samenwerkingen in muziekgeschiedenis. De 74-jarige crooner en de 30-jarige glam-rockster ontmoetten elkaar op de set van Crosby's kerstshow. Bowie wilde oorspronkelijk niet 'Little Drummer Boy' zingen omdat hij het nummer niet kende, dus werd er ter plekke een nieuw couplet ('Peace on Earth') geschreven. De opname duurde slechts één take. Vijf weken later overleed Crosby, wat dit zijn laatste grote opname maakte.",
    artist: "Bing Crosby & David Bowie",
    song: "Peace on Earth/Little Drummer Boy",
    year: 1977
  },
  {
    id: 24,
    title: "Elvis' Blauwe Kerst in Drie Sessies",
    content: "Elvis Presley's 'Blue Christmas' uit 1957 werd opgenomen voor zijn legendarische kerstalbum 'Elvis' Christmas Album', dat in slechts drie studio-sessies werd voltooid. Het album verkocht meer dan 20 miljoen exemplaren en is nog steeds een van de bestverkochte kerstalbums aller tijden. 'Blue Christmas' was oorspronkelijk een country-nummer uit 1948, maar Elvis' versie met The Jordanaires transformeerde het tot een rock-and-roll klassieker. Het nummer gaat over eenzaamheid tijdens de feestdagen en resoneert nog steeds met miljoenen luisteraars die de melancholische kant van kerst herkennen.",
    artist: "Elvis Presley",
    song: "Blue Christmas",
    year: 1957
  },
  {
    id: 25,
    title: "Van Vergeten Albumtrack naar Reclamegigant",
    content: "Andy Williams' 'It's the Most Wonderful Time of the Year' uit 1963 was oorspronkelijk slechts een albumtrack die weinig aandacht kreeg. Het duurde letterlijk decennia voordat het werd ontdekt door adverteerders en een comeback maakte. Nu is het een van de meest gebruikte nummers in kerstcommercials wereldwijd, van supermarkten tot speelgoedwinkels. Het opgewekte nummer, met zijn iconische 'It's the most wonderful time of the year!' opening, wordt geschat op meer dan 500 miljoen streams per jaar. Williams, die overleed in 2012, leefde lang genoeg om de herontdekking van zijn kerstklassieker mee te maken.",
    artist: "Andy Williams",
    song: "It's the Most Wonderful Time of the Year",
    year: 1963
  }
];

export const getDailyAnecdote = (): ChristmasAnecdote => {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const index = (dayOfMonth - 1) % CHRISTMAS_ANECDOTES.length;
  return CHRISTMAS_ANECDOTES[index];
};

export const getAllAnecdotes = (): ChristmasAnecdote[] => CHRISTMAS_ANECDOTES;

const ChristmasAnecdote = () => {
  const [anecdote, setAnecdote] = useState<ChristmasAnecdote | null>(null);

  useEffect(() => {
    setAnecdote(getDailyAnecdote());
  }, []);

  if (!anecdote) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            Kerst Muziek Anekdote van de Dag
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </h2>
        </div>

        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-red-900/20 to-green-900/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <span className="text-6xl mb-4 block">🎄</span>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {anecdote.title}
              </h3>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {anecdote.content}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <span className="font-medium">{anecdote.artist}</span>
                <span>•</span>
                <span>"{anecdote.song}"</span>
                {anecdote.year && (
                  <>
                    <span>•</span>
                    <span>{anecdote.year}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button asChild variant="outline" className="border-red-500/50 hover:bg-red-500/10">
            <Link to="/kerst/anekdotes" className="flex items-center gap-2">
              Bekijk alle kerst anekdotes
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChristmasAnecdote;
