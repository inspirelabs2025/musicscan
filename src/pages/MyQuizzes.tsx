import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Trophy, Target, Flame, Star, BarChart3, Filter, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUserQuizResults } from '@/hooks/useUserQuizResults';
import { useQuizPlayerStats } from '@/hooks/useQuizPlayerStats';
import { QuizHistoryCard } from '@/components/quiz/QuizHistoryCard';
import { BadgeCollection } from '@/components/quiz/BadgeCollection';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function MyQuizzes() {
  const { user } = useAuth();
  const { data: quizResults, isLoading: resultsLoading } = useUserQuizResults(user?.id || '');
  const { stats, isLoading: statsLoading } = useQuizPlayerStats(user?.id);
  
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter and sort results
  const filteredResults = React.useMemo(() => {
    if (!quizResults) return [];
    
    let filtered = [...quizResults];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.quiz_type === filterType);
    }
    
    // Sort
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'highest':
        filtered.sort((a, b) => b.score_percentage - a.score_percentage);
        break;
      case 'lowest':
        filtered.sort((a, b) => a.score_percentage - b.score_percentage);
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return filtered;
  }, [quizResults, filterType, sortBy]);

  // Get unique quiz types for filter
  const quizTypes = React.useMemo(() => {
    if (!quizResults) return [];
    return [...new Set(quizResults.map(r => r.quiz_type))];
  }, [quizResults]);

  const isLoading = resultsLoading || statsLoading;

  return (
    <>
      <Helmet>
        <title>Mijn Quizzen & Scores | MusicScan</title>
        <meta name="description" content="Bekijk je quiz geschiedenis, verdiende badges en statistieken." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-2">Mijn Quizzen & Scores</h1>
            <p className="text-muted-foreground">
              Bekijk je voortgang, verdiende badges en quiz geschiedenis
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-2xl font-bold">{stats?.total_points || 0}</p>
                    <p className="text-sm text-muted-foreground">Totaal Punten</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{stats?.total_quizzes || 0}</p>
                    <p className="text-sm text-muted-foreground">Quizzen Gespeeld</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{stats?.average_score || 0}%</p>
                    <p className="text-sm text-muted-foreground">Gem. Score</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{stats?.daily_streak || 0}</p>
                    <p className="text-sm text-muted-foreground">Dagen Streak</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="history" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="history">Quiz Geschiedenis</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
            </TabsList>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter op type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Types</SelectItem>
                      {quizTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sorteer op" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Nieuwste eerst</SelectItem>
                      <SelectItem value="oldest">Oudste eerst</SelectItem>
                      <SelectItem value="highest">Hoogste score</SelectItem>
                      <SelectItem value="lowest">Laagste score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results List */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredResults.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Nog geen quizzen gespeeld</h3>
                    <p className="text-muted-foreground mb-4">
                      Speel je eerste quiz en je resultaten verschijnen hier!
                    </p>
                    <Link to="/quizzen">
                      <Button>Start een Quiz</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map(result => (
                    <QuizHistoryCard key={result.id} result={result} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges">
              <BadgeCollection 
                earnedBadges={stats?.badges_earned || []} 
                totalQuizzes={stats?.total_quizzes || 0}
                bestScore={stats?.best_score || 0}
                dailyStreak={stats?.daily_streak || 0}
              />
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
              <div>
                <h3 className="font-semibold mb-1">Klaar voor een nieuwe uitdaging?</h3>
                <p className="text-sm text-muted-foreground">
                  Test je kennis en verdien meer punten en badges!
                </p>
              </div>
              <Link to="/quizzen">
                <Button className="bg-gradient-to-r from-primary to-purple-600">
                  <Trophy className="w-4 h-4 mr-2" />
                  Nieuwe Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
