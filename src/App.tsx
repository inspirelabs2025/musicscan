import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Auth from "./pages/Auth";


import BulkerImage from "./pages/BulkerImage";
import MarketplaceOverview from "./pages/MarketplaceOverview";
import CollectionOverview from "./pages/CollectionOverview";
import CollectionChat from "./pages/CollectionChat";
import AIAnalysis from "./pages/AIAnalysis";
import AIScan from "./pages/AIScan";
import AIScanOverview from "./pages/AIScanOverview";
import AIScanV2 from "./pages/AIScanV2";
import AIScanV2Overview from "./pages/AIScanV2Overview";
import MyCollection from "./pages/MyCollection";
import MyShop from "./pages/MyShop";
import PublicShop from "./pages/PublicShop";
import PublicCollection from "./pages/PublicCollection";
import AlbumDetail from "./pages/AlbumDetail";
import ReleaseDetail from "./pages/ReleaseDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
        // Don't retry for authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => {
  console.log('🎯 App.tsx: Rendering App component');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary showDetails={true}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            } />
            <Route path="/ai-scan" element={
              <ProtectedRoute>
                <AIScan />
              </ProtectedRoute>
            } />
            <Route path="/ai-scan-overview" element={
              <ProtectedRoute>
                <AIScanOverview />
              </ProtectedRoute>
            } />
            <Route path="/ai-scan-v2" element={
              <ProtectedRoute>
                <AIScanV2 />
              </ProtectedRoute>
            } />
            <Route path="/ai-scan-v2-overview" element={
              <ProtectedRoute>
                <AIScanV2Overview />
              </ProtectedRoute>
            } />
            <Route path="/bulkerimage" element={
              <ProtectedRoute>
                <BulkerImage />
              </ProtectedRoute>
            } />
            <Route path="/marketplace-overview" element={
              <ProtectedRoute>
                <MarketplaceOverview />
              </ProtectedRoute>
            } />
            <Route path="/collection-overview" element={
              <ProtectedRoute>
                <CollectionOverview />
              </ProtectedRoute>
            } />
            <Route path="/collection-chat" element={
              <ProtectedRoute>
                <CollectionChat />
              </ProtectedRoute>
            } />
            <Route path="/ai-analysis" element={
              <ProtectedRoute>
                <AIAnalysis />
              </ProtectedRoute>
            } />
            <Route path="/my-collection" element={
              <ProtectedRoute>
                <MyCollection />
              </ProtectedRoute>
            } />
            <Route path="/my-shop" element={
              <ProtectedRoute>
                <MyShop />
              </ProtectedRoute>
            } />
            <Route path="/shop/:shopSlug" element={<PublicShop />} />
            <Route path="/collection/:userId" element={<PublicCollection />} />
            <Route path="/album/:albumId" element={
              <ProtectedRoute>
                <AlbumDetail />
              </ProtectedRoute>
            } />
            <Route path="/release/:releaseId" element={
              <ProtectedRoute>
                <ReleaseDetail />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
