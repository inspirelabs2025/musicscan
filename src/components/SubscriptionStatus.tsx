import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Settings, TrendingUp, AlertCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Link } from 'react-router-dom';

interface SubscriptionStatusProps {
  compact?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ compact = false }) => {
  const { subscription, openCustomerPortal, loading } = useSubscription();
  const { usage, aiScansUsed } = useUsageTracking();

  const planConfig = {
    free: { color: 'bg-slate-500', limit: 10, name: 'FREE' },
    basic: { color: 'bg-blue-500', limit: 50, name: 'BASIC' },
    plus: { color: 'bg-purple-500', limit: 200, name: 'PLUS' },
    pro: { color: 'bg-gold-500', limit: null, name: 'PRO' },
    business: { color: 'bg-emerald-500', limit: null, name: 'BUSINESS' }
  };

  const currentPlan = planConfig[subscription?.plan_slug as keyof typeof planConfig] || planConfig.free;
  const usagePercentage = currentPlan.limit ? Math.min((aiScansUsed / currentPlan.limit) * 100, 100) : 0;
  const isNearLimit = usagePercentage >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Badge 
          variant="outline" 
          className={`${currentPlan.color} text-white border-none`}
        >
          <Crown className="h-3 w-3 mr-1" />
          {currentPlan.name}
        </Badge>
        
        {currentPlan.limit && (
          <div className="text-sm text-muted-foreground">
            {aiScansUsed}/{currentPlan.limit} scans
          </div>
        )}
        
        {subscription?.subscribed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openCustomerPortal}
            disabled={loading}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Abonnement Status
          </div>
          
          {subscription?.subscribed && (
            <Button
              variant="outline"
              size="sm"
              onClick={openCustomerPortal}
              disabled={loading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Beheren
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          <Badge 
            className={`${currentPlan.color} text-white px-3 py-1 text-sm font-medium`}
          >
            {subscription?.plan_name || 'FREE - Music Explorer'}
          </Badge>
          
          {!subscription?.subscribed && (
            <Link to="/pricing">
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>

        {/* Usage Progress */}
        {currentPlan.limit && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>AI Scans deze maand</span>
              <span className={isNearLimit ? 'text-orange-500 font-medium' : ''}>
                {aiScansUsed}/{currentPlan.limit}
              </span>
            </div>
            
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${isNearLimit ? '[&>div]:bg-orange-500' : ''}`}
            />
            
            {isNearLimit && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>Je nadert je maandelijkse limiet</span>
              </div>
            )}
          </div>
        )}

        {/* Unlimited Usage */}
        {!currentPlan.limit && subscription?.subscribed && (
          <div className="flex items-center gap-2 text-green-600">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Onbeperkte AI scans</span>
          </div>
        )}

        {/* Subscription End Date */}
        {subscription?.subscription_end && (
          <div className="text-sm text-muted-foreground">
            Verlengt automatisch op {new Date(subscription.subscription_end).toLocaleDateString('nl-NL')}
          </div>
        )}

        {/* Free Plan CTA */}
        {!subscription?.subscribed && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Upgrade voor meer AI scans en geavanceerde features
            </p>
            <Link to="/pricing">
              <Button className="w-full">
                Bekijk Abonnementen
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};