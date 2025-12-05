import { useState } from "react";
import { useMonthOverview, useGenerateMonthOverview, getMonthName, getCurrentMonth } from "@/hooks/useMonthOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Calendar, Disc, Newspaper, Users, Music, Trophy, BarChart3, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const MONTHS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maart" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Augustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

export default function MonthOverview() {
  const current = getCurrentMonth();
  const [selectedYear, setSelectedYear] = useState(current.year);
  const [selectedMonth, setSelectedMonth] = useState(11); // Default november
  
  const { data: monthData, isLoading, error } = useMonthOverview(selectedYear, selectedMonth);
  const generateMutation = useGenerateMonthOverview();
  const { toast } = useToast();

  const handleGenerate = async (regenerate = false) => {
    try {
      toast({
        title: regenerate ? "Opnieuw genereren..." : "Genereren...",
        description: `Maandoverzicht ${getMonthName(selectedMonth)} ${selectedYear} wordt ${regenerate ? 'opnieuw ' : ''}gegenereerd. Dit kan 1-2 minuten duren.`,
      });
      
      await generateMutation.mutateAsync({ 
        year: selectedYear, 
        month: selectedMonth, 
        regenerate 
      });
      
      toast({
        title: "Succes!",
        description: `Maandoverzicht ${getMonthName(selectedMonth)} ${selectedYear} is gegenereerd.`,
      });
    } catch (error: any) {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het genereren.",
        variant: "destructive",
      });
    }
  };

  const dataPoints = monthData?.data_points;
  const narrative = monthData?.generated_narratives?.main;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-accent/10 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                🗓️ Maandoverzicht
              </h1>
              <p className="text-muted-foreground text-lg">
                Alles wat er gebeurde in de muziekindustrie
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => handleGenerate(!monthData)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {monthData ? "Vernieuwen" : "Genereren"}
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Calendar className="w-5 h-5 mr-2" />
              {getMonthName(selectedMonth)} {selectedYear}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Laden...</span>
          </div>
        ) : !monthData ? (
          <Card className="text-center py-16">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Geen data beschikbaar</h2>
              <p className="text-muted-foreground mb-6">
                Er is nog geen maandoverzicht voor {getMonthName(selectedMonth)} {selectedYear}.
              </p>
              <Button onClick={() => handleGenerate(false)} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Genereer Maandoverzicht
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Narrative */}
            {narrative && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5" />
                    Het Verhaal van {getMonthName(selectedMonth)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown>{narrative}</ReactMarkdown>
                </CardContent>
              </Card>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center p-4">
                <Disc className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{dataPoints?.releases?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Releases</div>
              </Card>
              <Card className="text-center p-4">
                <Newspaper className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{dataPoints?.news?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Nieuws</div>
              </Card>
              <Card className="text-center p-4">
                <Users className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                <div className="text-2xl font-bold">{dataPoints?.in_memoriam?.length || 0}</div>
                <div className="text-sm text-muted-foreground">In Memoriam</div>
              </Card>
              <Card className="text-center p-4">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{dataPoints?.awards?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Awards</div>
              </Card>
            </div>

            {/* Releases */}
            {dataPoints?.releases && dataPoints.releases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc className="w-5 h-5" />
                    📀 Belangrijke Releases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dataPoints.releases.slice(0, 12).map((release, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{release.artist}</div>
                          <div className="text-sm text-muted-foreground truncate">"{release.album}"</div>
                          {release.genre && (
                            <Badge variant="secondary" className="mt-1 text-xs">{release.genre}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News */}
            {dataPoints?.news && dataPoints.news.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5" />
                    📰 Muzieknieuws
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataPoints.news.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="border-b border-border last:border-0 pb-4 last:pb-0">
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>
                        {item.category && (
                          <Badge variant="outline" className="mt-2">{item.category}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Memoriam */}
            {dataPoints?.in_memoriam && dataPoints.in_memoriam.length > 0 && (
              <Card className="border-gray-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🕯️ In Memoriam
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dataPoints.in_memoriam.map((person, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="font-semibold">{person.name}</div>
                        {person.age && <span className="text-muted-foreground"> ({person.age} jaar)</span>}
                        {person.date && (
                          <div className="text-sm text-muted-foreground mt-1">† {person.date}</div>
                        )}
                        {person.known_for && (
                          <div className="text-sm mt-2">{person.known_for}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Concerts */}
            {dataPoints?.concerts && dataPoints.concerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    🎤 Concerten & Tours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dataPoints.concerts.slice(0, 8).map((concert, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/50">
                        <div className="font-semibold">{concert.artist}</div>
                        {concert.tour_name && (
                          <div className="text-sm text-primary">{concert.tour_name}</div>
                        )}
                        {concert.venue && (
                          <div className="text-sm text-muted-foreground">
                            📍 {concert.venue}{concert.city ? `, ${concert.city}` : ''}
                          </div>
                        )}
                        {concert.attendance && (
                          <Badge variant="secondary" className="mt-2">{concert.attendance}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Streaming */}
            {dataPoints?.streaming && dataPoints.streaming.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    📊 Streaming Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dataPoints.streaming.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.type}</Badge>
                          {item.platform && <Badge variant="secondary">{item.platform}</Badge>}
                        </div>
                        <div className="font-semibold mt-2">{item.title}</div>
                        {item.artist && <div className="text-sm text-muted-foreground">{item.artist}</div>}
                        {item.statistic && <div className="text-sm text-primary mt-1">{item.statistic}</div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Awards */}
            {dataPoints?.awards && dataPoints.awards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    🏆 Awards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dataPoints.awards.slice(0, 10).map((award, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">
                            {award.award_show}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{award.category}</div>
                        <div className="font-semibold mt-1">🏆 {award.winner}</div>
                        {award.nominees && award.nominees.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Genomineerd: {award.nominees.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dutch Music */}
            {dataPoints?.dutch_music && dataPoints.dutch_music.length > 0 && (
              <Card className="border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    🇳🇱 Nederlandse Muziek
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {dataPoints.dutch_music.slice(0, 10).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                        <Badge variant="outline" className="mb-2">{item.type}</Badge>
                        <div className="font-semibold">{item.title}</div>
                        {item.artist && <div className="text-sm text-muted-foreground">{item.artist}</div>}
                        {item.description && <div className="text-sm mt-2">{item.description}</div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            {monthData.sources && (
              <div className="text-center text-sm text-muted-foreground">
                Bronnen: {monthData.sources.join(', ')} | 
                Laatst bijgewerkt: {monthData.updated_at ? new Date(monthData.updated_at).toLocaleString('nl-NL') : 'Onbekend'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
