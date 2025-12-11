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
    title: "Mariah's Miljardenhit",
    content: "Mariah Carey's 'All I Want for Christmas Is You' werd in 1994 uitgebracht, maar bereikte pas in 2019 - 25 jaar later - de nummer 1 positie in de Billboard Hot 100. Sindsdien verdient ze naar schatting €2,5 miljoen per jaar aan royalties.",
    artist: "Mariah Carey",
    song: "All I Want for Christmas Is You",
    year: 1994
  },
  {
    id: 2,
    title: "Geschreven in 15 Minuten",
    content: "Bobby Helms' 'Jingle Bell Rock' uit 1957 werd volgens co-schrijver Joe Beal in slechts 15 minuten geschreven. Het nummer is sindsdien meer dan 100 miljoen keer gestreamd op Spotify alleen.",
    artist: "Bobby Helms",
    song: "Jingle Bell Rock",
    year: 1957
  },
  {
    id: 3,
    title: "De Oorlogshit",
    content: "'White Christmas' van Bing Crosby (1942) is met naar schatting 50 miljoen verkochte exemplaren de best verkochte single aller tijden. Het nummer werd geschreven door Irving Berlin, die het zelf 'het beste liedje dat ooit geschreven is' noemde.",
    artist: "Bing Crosby",
    song: "White Christmas",
    year: 1942
  },
  {
    id: 4,
    title: "Band Aid Recordsnelheid",
    content: "'Do They Know It's Christmas?' werd in 1984 in slechts 24 uur opgenomen met artiesten als Bono, George Michael, en Boy George. Het werd de snelst verkopende single in de Britse geschiedenis.",
    artist: "Band Aid",
    song: "Do They Know It's Christmas?",
    year: 1984
  },
  {
    id: 5,
    title: "Wham!'s Laatste Hit",
    content: "'Last Christmas' van Wham! stond in 1984 op nummer 2, geblokkeerd door... Band Aid. Pas in 2021 - 36 jaar later - bereikte het alsnog de nummer 1 positie in het VK na het overlijden van George Michael.",
    artist: "Wham!",
    song: "Last Christmas",
    year: 1984
  },
  {
    id: 6,
    title: "De Kerstman Bestond Niet",
    content: "Gene Autry's 'Rudolph the Red-Nosed Reindeer' (1949) is gebaseerd op een verhaaltje dat in 1939 werd geschreven voor een warenhuis als marketingactie. Het rendier met de rode neus was bijna verworpen omdat een rode neus geassocieerd werd met alcoholisme.",
    artist: "Gene Autry",
    song: "Rudolph the Red-Nosed Reindeer",
    year: 1949
  },
  {
    id: 7,
    title: "Geschreven op een Zomerse Dag",
    content: "Brenda Lee nam 'Rockin' Around the Christmas Tree' op in 1958 toen ze pas 13 jaar oud was. Het nummer werd opgenomen in juli, midden in de zomer, en is nu goed voor meer dan 1 miljard streams.",
    artist: "Brenda Lee",
    song: "Rockin' Around the Christmas Tree",
    year: 1958
  },
  {
    id: 8,
    title: "De Verboden Kersthit",
    content: "'Fairytale of New York' van The Pogues werd door de BBC gecensureerd vanwege controversiële teksten. Desondanks is het al decennia de meest gedraaide kersthit in het VK en Ierland.",
    artist: "The Pogues ft. Kirsty MacColl",
    song: "Fairytale of New York",
    year: 1987
  },
  {
    id: 9,
    title: "Slade's Slimme Investering",
    content: "Noddy Holder van Slade schreef 'Merry Xmas Everybody' in 1973. Hij verdient naar verluidt nog steeds £500.000 per jaar aan royalties - hij noemde het ooit 'mijn pensioen'.",
    artist: "Slade",
    song: "Merry Xmas Everybody",
    year: 1973
  },
  {
    id: 10,
    title: "Van Flop naar Klassieker",
    content: "'Christmas (Baby Please Come Home)' van Darlene Love uit 1963 was oorspronkelijk een flop. Pas decennia later werd het erkend als een van de beste kerstnummers ooit, mede door haar jaarlijkse optredens bij David Letterman.",
    artist: "Darlene Love",
    song: "Christmas (Baby Please Come Home)",
    year: 1963
  },
  {
    id: 11,
    title: "De Nederlandse Kerstklassieker",
    content: "'Vrolijk Kerstfeest' van BZN uit 1987 is de meest gedraaide Nederlandse kersthit ooit. De band nam het op in hun eigen studio en het werd direct een hit die nog steeds jaarlijks terugkeert.",
    artist: "BZN",
    song: "Vrolijk Kerstfeest",
    year: 1987
  },
  {
    id: 12,
    title: "Opgenomen in Juli",
    content: "The Carpenters namen hun kerstalbum op in de zomer van 1978. Karen Carpenter vond het vreemd om kerstliedjes te zingen terwijl het buiten 35 graden was, maar het album werd een enorm succes.",
    artist: "The Carpenters",
    song: "Merry Christmas, Darling",
    year: 1978
  },
  {
    id: 13,
    title: "Paul's Solo Kerst",
    content: "Paul McCartney's 'Wonderful Christmastime' (1979) werd volledig door hemzelf opgenomen met synthesizers. Ondanks gemengde kritieken verdient hij er jaarlijks naar schatting €400.000 aan.",
    artist: "Paul McCartney",
    song: "Wonderful Christmastime",
    year: 1979
  },
  {
    id: 14,
    title: "De Kerstoorlog",
    content: "In december 2009 organiseerden fans een campagne om Rage Against the Machine's 'Killing in the Name' naar nummer 1 te krijgen in het VK - alleen om de X Factor-winnaar te verslaan. Ze slaagden.",
    artist: "Rage Against the Machine",
    song: "Killing in the Name",
    year: 2009
  },
  {
    id: 15,
    title: "Nat King Cole's Erfenis",
    content: "'The Christmas Song' (Chestnuts Roasting) werd geschreven op een hete zomerdag in 1945. Schrijver Mel Tormé probeerde af te koelen door aan koude dingen te denken. Nat King Cole's versie uit 1961 is nu de definitieve.",
    artist: "Nat King Cole",
    song: "The Christmas Song",
    year: 1961
  },
  {
    id: 16,
    title: "José Feliciano's Controverse",
    content: "'Feliz Navidad' uit 1970 was controversieel omdat het Spaans en Engels mengde. Nu is het een van de meest gestreamde kerstnummers ter wereld met meer dan 1 miljard plays.",
    artist: "José Feliciano",
    song: "Feliz Navidad",
    year: 1970
  },
  {
    id: 17,
    title: "De Onbedoelde Kersthit",
    content: "Wizzard's 'I Wish It Could Be Christmas Everyday' (1973) werd opgenomen in augustus. Roy Wood wilde origineel een Phil Spector-achtig geluid, wat resulteerde in 50 muzikanten in de studio.",
    artist: "Wizzard",
    song: "I Wish It Could Be Christmas Everyday",
    year: 1973
  },
  {
    id: 18,
    title: "Michael Bublé's Transformatie",
    content: "Michael Bublé's kerstalbum uit 2011 verkocht meer dan 12 miljoen exemplaren. Hij wordt nu zo sterk met kerst geassocieerd dat hij grapte: 'In januari stoppen mensen me op straat om te vragen of ik nog leef.'",
    artist: "Michael Bublé",
    song: "It's Beginning to Look a Lot Like Christmas",
    year: 2011
  },
  {
    id: 19,
    title: "De Nieuwste Klassieker",
    content: "Kelly Clarkson's 'Underneath the Tree' uit 2013 is de nieuwste toevoeging aan de kerstklassiekers. Het nummer is volledig origineel en niet een cover, wat zeldzaam is voor moderne kersthits.",
    artist: "Kelly Clarkson",
    song: "Underneath the Tree",
    year: 2013
  },
  {
    id: 20,
    title: "Chuck Berry's Kerst",
    content: "'Run Rudolph Run' van Chuck Berry uit 1958 was een van de eerste rock-and-roll kerstnummers. Het inspireerde talloze covers, waaronder versies van Keith Richards en Bryan Adams.",
    artist: "Chuck Berry",
    song: "Run Rudolph Run",
    year: 1958
  },
  {
    id: 21,
    title: "De Tragische Kersthit",
    content: "Kirsty MacColl, die 'Fairytale of New York' met The Pogues zong, overleed tragisch in 2000 bij een bootongeval in Mexico. Het nummer wordt nu vaak aan haar opgedragen.",
    artist: "Kirsty MacColl & The Pogues",
    song: "Fairytale of New York",
    year: 1987
  },
  {
    id: 22,
    title: "Lennon's Vredesboodschap",
    content: "John Lennon's 'Happy Xmas (War Is Over)' uit 1971 was een protestlied tegen de Vietnamoorlog. De iconische kinderkoor-delen werden opgenomen door het Harlem Community Choir.",
    artist: "John Lennon & Yoko Ono",
    song: "Happy Xmas (War Is Over)",
    year: 1971
  },
  {
    id: 23,
    title: "De Drummer Boy",
    content: "'Little Drummer Boy' werd oorspronkelijk in 1941 geschreven, maar de versie van Bing Crosby en David Bowie uit 1977 - een onwaarschijnlijk duo - werd de meest iconische. De opname duurde slechts één take.",
    artist: "Bing Crosby & David Bowie",
    song: "Peace on Earth/Little Drummer Boy",
    year: 1977
  },
  {
    id: 24,
    title: "Kerstavond Special",
    content: "Elvis Presley's 'Blue Christmas' uit 1957 werd opgenomen voor zijn kerstalbum dat in slechts drie sessies werd voltooid. Het album is nog steeds een van de bestverkochte kerstalbums ooit.",
    artist: "Elvis Presley",
    song: "Blue Christmas",
    year: 1957
  },
  {
    id: 25,
    title: "De Kerstdag Klassieker",
    content: "Andy Williams' 'It's the Most Wonderful Time of the Year' uit 1963 duurde decennia om een hit te worden. Nu is het een van de meest gebruikte nummers in kerstcommercials wereldwijd.",
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
