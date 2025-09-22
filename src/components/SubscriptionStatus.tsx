import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Settings, TrendingUp, AlertCircle, MessageSquare, Upload, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Link } from 'react-router-dom';

interface SubscriptionStatusProps {
  compact?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ compact = false }) => {
  const { subscription, openCustomerPortal, loading } = useSubscription();
  const { usage, aiScansUsed, aiChatUsed, bulkUploadsUsed, getUsagePercentage } = useUsageTracking();

  const planConfig = {
    free: { 
      color: 'bg-slate-500', 
      aiScanLimit: 10, 
      aiChatLimit: 5, 
      bulkUploadLimit: 0, 
      name: 'FREE' 
    },
    basic: { 
      color: 'bg-blue-500', 
      aiScanLimit: 50, 
      aiChatLimit: 20, 
      bulkUploadLimit: 0, 
      name: 'BASIC' 
    },
    plus: { 
      color: 'bg-purple-500', 
      aiScanLimit: 200, 
      aiChatLimit: null, 
      bulkUploadLimit: 5, 
      name: 'PLUS' 
    },
    pro: { 
      color: 'bg-gold-500', 
      aiScanLimit: null, 
      aiChatLimit: null, 
      bulkUploadLimit: 50, 
      name: 'PRO' 
    },
    business: { 
      color: 'bg-emerald-500', 
      aiScanLimit: null, 
      aiChatLimit: null, 
      bulkUploadLimit: null, 
      name: 'BUSINESS' 
    }
  };

  const currentPlan = planConfig[subscription?.plan_slug as keyof typeof planConfig] || planConfig.free;
  const aiScanPercentage = getUsagePercentage('ai_scans', currentPlan.aiScanLimit);
  const aiChatPercentage = getUsagePercentage('ai_chat', currentPlan.aiChatLimit);
  const bulkUploadPercentage = getUsagePercentage('bulk_uploads', currentPlan.bulkUploadLimit);
  
  const isAiScanNearLimit = aiScanPercentage >= 80;
  const isAiChatNearLimit = aiChatPercentage >= 80;
  const isBulkUploadNearLimit = bulkUploadPercentage >= 80;

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
        
        {currentPlan.aiScanLimit && (
          <div className="text-sm text-muted-foreground">
            {aiScansUsed}/{currentPlan.aiScanLimit} scans
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
      
      <CardContent className="space-y-6">
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

        {/* AI Scans Usage Progress */}
        {currentPlan.aiScanLimit && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Scans deze maand
              </span>
              <span className={isAiScanNearLimit ? 'text-orange-500 font-medium' : ''}>
                {aiScansUsed}/{currentPlan.aiScanLimit}
              </span>
            </div>
            
            <Progress 
              value={aiScanPercentage} 
              className={`h-2 ${isAiScanNearLimit ? '[&>div]:bg-orange-500' : ''}`}
            />
            
            {isAiScanNearLimit && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>AI Scans: Je nadert je maandelijkse limiet</span>
              </div>
            )}
          </div>
        )}

        {/* AI Chat Usage Progress */}
        {currentPlan.aiChatLimit && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Chat deze maand
              </span>
              <span className={isAiChatNearLimit ? 'text-orange-500 font-medium' : ''}>
                {aiChatUsed}/{currentPlan.aiChatLimit}
              </span>
            </div>
            
            <Progress 
              value={aiChatPercentage} 
              className={`h-2 ${isAiChatNearLimit ? '[&>div]:bg-orange-500' : ''}`}
            />
            
            {isAiChatNearLimit && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>AI Chat: Je nadert je maandelijkse limiet</span>
              </div>
            )}
          </div>
        )}

        {/* Bulk Upload Usage Progress */}
        {currentPlan.bulkUploadLimit && currentPlan.bulkUploadLimit > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Uploads deze maand
              </span>
              <span className={isBulkUploadNearLimit ? 'text-orange-500 font-medium' : ''}>
                {bulkUploadsUsed}/{currentPlan.bulkUploadLimit}
              </span>
            </div>
            
            <Progress 
              value={bulkUploadPercentage} 
              className={`h-2 ${isBulkUploadNearLimit ? '[&>div]:bg-orange-500' : ''}`}
            />
            
            {isBulkUploadNearLimit && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span>Bulk Upload: Je nadert je maandelijkse limiet</span>
              </div>
            )}
          </div>
        )}

        {/* Unlimited Usage */}
        {(!currentPlan.aiScanLimit || !currentPlan.aiChatLimit || !currentPlan.bulkUploadLimit) && subscription?.subscribed && (
          <div className="space-y-2">
            {!currentPlan.aiScanLimit && (
              <div className="flex items-center gap-2 text-green-600">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Onbeperkte AI scans</span>
              </div>
            )}
            {!currentPlan.aiChatLimit && (
              <div className="flex items-center gap-2 text-green-600">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Onbeperkte AI chat</span>
              </div>
            )}
            {currentPlan.bulkUploadLimit === null && (
              <div className="flex items-center gap-2 text-green-600">
                <Crown className="h-4 w-4" />
                <span className="text-sm font-medium">Onbeperkte bulk uploads</span>
              </div>
            )}
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
              Upgrade voor meer AI scans, chat queries en bulk upload features
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