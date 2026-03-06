import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../auth/AuthProvider';
import Sidebar from './Sidebar/Sidebar';
import MainContent from './MainContent';
import { MobileHeader } from './MobileHeader';
import { Toaster } from '@/components/ui/toaster';
import useProjectStore from '@/features/projects/projectStore';
import useGlobalSearch from '../global-search/useGlobalSearch';
import { GlobalSearch } from '../global-search/GlobalSearch';
import { hasUsedAiFeatures } from '@/lib/ai-usage-tracker';
import { getVariant, trackExperiment, trackConversion } from '@/lib/ab-test';
import { AINudge } from '@/components/ui/ai-nudge';
import { useDispatch, useSelector } from 'react-redux';
import { dismissAiNudge, getAiNudgeState, showAiNudge } from '../ai-nudge/aiNudgeSlice';
import { createClient } from '@/lib/supabase';

const AppLayout: React.FC = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProject } = useProjectStore();
  const { isSearchOpen, closeSearch } = useGlobalSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const { isVisible: isAiNudgeVisible, hasDismissed: hasAiNudgeDismissed, displayCount: aiNudgeDisplayCount } = useSelector(getAiNudgeState);

  const supabase = createClient();

  const aiNudgeVariant = getVariant('aiNudge');

  useEffect(() => {
    if (!isLoading && !session) {
      navigate('/login', { replace: true });
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    // Only consider showing the nudge if the user is logged in (session exists)
    // and the nudge experiment variant is 'nudge'
    if (session && !hasUsedAiFeatures() && aiNudgeVariant === 'nudge' && !hasAiNudgeDismissed && aiNudgeDisplayCount < 3) {
      const lastDisplayDate = localStorage.getItem('ai_nudge_last_display_date');
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      if (!lastDisplayDate || new Date(lastDisplayDate) < oneDayAgo) {
        dispatch(showAiNudge());
        trackExperiment('aiNudge', 'nudge');
        // Update display count on backend
        if (session?.user?.id) {
          supabase.from('profiles').update({ ai_nudge_display_count: aiNudgeDisplayCount + 1 }).eq('id', session.user.id).then(({ error }) => {
            if (error) console.error('Error updating AI nudge display count:', error);
          });
        }
      }
    }
  }, [session, aiNudgeVariant, hasAiNudgeDismissed, aiNudgeDisplayCount, dispatch, supabase]);

  useEffect(() => {
    // Close AI nudge if user navigates to an AI-related page
    if (isAiNudgeVisible && (location.pathname.includes('/ai') || location.pathname.includes('/gpt')) ) {
        dispatch(hideAiNudge());
    }
  }, [location.pathname, isAiNudgeVisible, dispatch]);

  const handleNudgeClose = () => {
    dispatch(dismissAiNudge());
    trackConversion('aiNudge', 'nudge_dismissed');
  };

  const handleNudgeExplore = () => {
    dispatch(dismissAiNudge());
    trackConversion('aiNudge', 'nudge_explore_click');
    navigate('/ai-features'); // Or the relevant AI features page
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading || !session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Helmet>
        <title>{activeProject ? `${activeProject.name} | Lovable` : 'Lovable'}</title>
      </Helmet>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <MobileHeader onMenuClick={handleMenuClick} />
        <MainContent>
          <React.Suspense fallback={<div>Loading...</div>}>
            <Outlet />
          </React.Suspense>
        </MainContent>
      </div>
      <Toaster />
      <GlobalSearch isOpen={isSearchOpen} onClose={closeSearch} />
      {isAiNudgeVisible && (
        <AINudge onClose={handleNudgeClose} onExplore={handleNudgeExplore} />
      )}
    </div>
  );
};

export default AppLayout;
