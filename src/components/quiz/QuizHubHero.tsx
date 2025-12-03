import React from 'react';
import { Trophy, Flame, Target, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizPlayerStats } from '@/hooks/useQuizPlayerStats';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function QuizHubHero() {
  const { user } = useAuth();
  const { stats, isLoading } = useQuizPlayerStats(user?.id);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/30 via-primary/20 to-blue-900/30 py-16">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
            🎮 Muziek Quiz Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test je muziekkennis, verdien badges en daag vrienden uit!
          </p>
        </div>
        
        {user ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <StatCard 
              icon={<Trophy className="w-5 h-5 text-yellow-500" />}
              label="Punten"
              value={isLoading ? '...' : stats?.total_points?.toLocaleString() || '0'}
              color="yellow"
            />
            <StatCard 
              icon={<Flame className="w-5 h-5 text-orange-500" />}
              label="Streak"
              value={isLoading ? '...' : `${stats?.daily_streak || 0} 🔥`}
              color="orange"
            />
            <StatCard 
              icon={<Target className="w-5 h-5 text-green-500" />}
              label="Quizzen"
              value={isLoading ? '...' : stats?.total_quizzes?.toString() || '0'}
              color="green"
            />
            <StatCard 
              icon={<Star className="w-5 h-5 text-blue-500" />}
              label="Best"
              value={isLoading ? '...' : `${stats?.best_score || 0}%`}
              color="blue"
            />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Log in om je voortgang bij te houden</p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-to-r from-primary to-purple-600">
                Start met Spelen
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
}) {
  const colorClasses = {
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-4 border backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
