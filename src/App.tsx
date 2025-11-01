import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navigation } from "@/components/Navigation";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import Scan from "./pages/Scan";
import QuickPriceCheck from "./pages/QuickPriceCheck";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { NewsPost } from "./pages/NewsPost";


import BulkerImage from "./pages/BulkerImage";
import MarketplaceOverview from "./pages/MarketplaceOverview";
import CollectionOverview from "./pages/CollectionOverview";
import CollectionChat from "./pages/CollectionChat";
import AIAnalysis from "./pages/AIAnalysis";
import AIScan from "./pages/AIScan";
import AIScanOverview from "./pages/AIScanOverview";
import AIScanV2 from "./pages/AIScanV2";
import AIScanV2Overview from "./pages/AIScanV2Overview";
import UnifiedScanOverview from "./pages/UnifiedScanOverview";
import MyCollection from "./pages/MyCollection";
import MyCollectionOld from "./pages/MyCollectionOld";
import MyShop from "./pages/MyShop";
import PublicShop from "./pages/PublicShop";
import PublicCollection from "./pages/PublicCollection";
import PublicCatalog from "./pages/PublicCatalog";
import PublicShopsOverview from "./pages/PublicShopsOverview";
import UserScans from "./pages/UserScans";
import AlbumDetail from "./pages/AlbumDetail";
import ReleaseDetail from "./pages/ReleaseDetail";
import MusicNews from "./pages/MusicNews";
import TestMusicNews from "./pages/TestMusicNews";
import TestNewsUpdate from "./pages/TestNewsUpdate";
import TestNewsGeneration from "./pages/TestNewsGeneration";
import TestBlogRegeneration from "./pages/TestBlogRegeneration";
import TestAlbumCoverBackfill from "./pages/TestAlbumCoverBackfill";
import TestDiscogsFlow from "./pages/TestDiscogsFlow";
import TestDiscogsBlogGeneration from "./pages/TestDiscogsBlogGeneration";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Podcasts from "./pages/Podcasts";
import { ShopProducts } from "./pages/admin/ShopProducts";
import PlatformProducts from "./pages/admin/PlatformProducts";
import ArtGenerator from "./pages/admin/ArtGenerator";
import NotFound from "./pages/NotFound";
import { PlaatVerhaal } from "./pages/PlaatVerhaal";
import Community from "./pages/Community";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import PriceHistoryAdmin from "./pages/admin/PriceHistoryAdmin";
import Quiz from "./pages/Quiz";
import Pricing from "./pages/Pricing";
import Prestaties from "./pages/Prestaties";
import SpotifyProfile from "./pages/SpotifyProfile";
import SpotifyCallback from "./pages/SpotifyCallback";
import { TrackOrder } from "./pages/TrackOrder";
import { OrderSuccess } from "./pages/OrderSuccess";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import MuziekVerhaal from "./pages/MuziekVerhaal";
import Marketplace from "./pages/Marketplace";
import PublicShopItemDetail from "./pages/PublicShopItemDetail";

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
  // Force refresh to fix module resolution
  console.log('🎯 App.tsx: Rendering App component');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioProvider>
          <TooltipProvider>
            <ErrorBoundary showDetails={true}>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Navigation />
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/scan" element={<Scan />} />
            <Route path="/scanner" element={
              <ProtectedRoute>
                <Scanner />
              </ProtectedRoute>
            } />
            <Route path="/quick-price-check" element={<QuickPriceCheck />} />
            <Route path="/scanner/discogs" element={
              <ProtectedRoute>
                <BulkerImage />
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
            <Route path="/unified-scan-overview" element={
              <ProtectedRoute>
                <UnifiedScanOverview />
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
            <Route path="/quiz" element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/prestaties" element={
              <ProtectedRoute>
                <Prestaties />
              </ProtectedRoute>
            } />
            <Route path="/social" element={
              <ProtectedRoute>
                <Social />
              </ProtectedRoute>
            } />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/topic/:topicId" element={<ForumTopic />} />
            <Route path="/community" element={<Community />} />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <Profile />
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
            <Route path="/my-collection-old" element={
              <ProtectedRoute>
                <MyCollectionOld />
              </ProtectedRoute>
            } />
            <Route path="/my-shop" element={
              <ProtectedRoute>
                <MyShop />
              </ProtectedRoute>
            } />
            <Route path="/shop" element={<Navigate to="/shops" replace />} />
            <Route path="/shop/:shopSlug" element={<PublicShop />} />
            <Route path="/shop/:shopSlug/item/:itemId" element={<PublicShopItemDetail />} />
            <Route path="/shop/order-success" element={<OrderSuccess />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/collection/:userId" element={<PublicCollection />} />
            <Route path="/spotify-profile" element={<ProtectedRoute><SpotifyProfile /></ProtectedRoute>} />
            <Route path="/auth/spotify/callback" element={<ProtectedRoute><SpotifyCallback /></ProtectedRoute>} />
            <Route path="/album/:albumId" element={
              <ProtectedRoute>
                <AlbumDetail />
              </ProtectedRoute>
            } />
        <Route path="/release/:releaseId" element={<ReleaseDetail />} />
        <Route path="/catalog" element={<PublicCatalog />} />
        <Route path="/shops" element={<PublicShopsOverview />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/user-scans" element={<UserScans />} />
            <Route path="/news" element={<MusicNews />} />
            <Route path="/nieuws/:slug" element={<NewsPost />} />
            <Route path="/test-music-news" element={
              <ProtectedRoute>
                <TestMusicNews />
              </ProtectedRoute>
            } />
            <Route path="/plaat-verhaal/:slug" element={<PlaatVerhaal />} />
            <Route path="/test-news-update" element={
              <ProtectedRoute>
                <TestNewsUpdate />
              </ProtectedRoute>
            } />
            <Route path="/test-news-generation" element={
              <ProtectedRoute>
                <TestNewsGeneration />
              </ProtectedRoute>
            } />
            <Route path="/test-blog-regeneration" element={
              <ProtectedRoute>
                <TestBlogRegeneration />
              </ProtectedRoute>
            } />
            <Route path="/test-album-cover-backfill" element={
              <ProtectedRoute>
                <TestAlbumCoverBackfill />
              </ProtectedRoute>
            } />
            <Route path="/test-discogs-flow" element={
              <ProtectedRoute>
                <TestDiscogsFlow />
              </ProtectedRoute>
            } />
            <Route path="/test-discogs-blog-generation" element={
              <ProtectedRoute>
                <TestDiscogsBlogGeneration />
              </ProtectedRoute>
            } />
            <Route path="/superadmin" element={<SuperAdminDashboard />} />
            <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
            <Route path="/podcasts" element={
              <ProtectedRoute>
                <Podcasts />
              </ProtectedRoute>
            } />
            <Route path="/admin/price-history" element={
              <ProtectedRoute>
                <PriceHistoryAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/shop-products" element={
              <ProtectedRoute>
                <ShopProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/platform-products" element={
              <ProtectedRoute>
                <PlatformProducts />
              </ProtectedRoute>
            } />
            <Route path="/admin/art-generator" element={
              <ProtectedRoute>
                <ArtGenerator />
              </ProtectedRoute>
            } />
            <Route path="/muziek-verhaal/:slug" element={<MuziekVerhaal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
                <ConditionalFooter />
                <AudioPlayer />
             </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AudioProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
