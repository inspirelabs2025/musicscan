import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { CartProvider } from "@/contexts/CartContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navigation } from "@/components/Navigation";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
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
import ShopOrProductRouter from "./pages/ShopOrProductRouter";
import PublicCollection from "./pages/PublicCollection";
import PublicCatalog from "./pages/PublicCatalog";
import PublicShopsOverview from "./pages/PublicShopsOverview";
import UserScans from "./pages/UserScans";
import AlbumDetail from "./pages/AlbumDetail";
import ReleaseDetail from "./pages/ReleaseDetail";
import MusicNews from "./pages/MusicNews";
import Verhalen from "./pages/Verhalen";
import Nieuws from "./pages/Nieuws";
import Releases from "./pages/Releases";
import TestMusicNews from "./pages/TestMusicNews";
import TestNewsUpdate from "./pages/TestNewsUpdate";
import TestNewsGeneration from "./pages/TestNewsGeneration";
import TestBlogRegeneration from "./pages/TestBlogRegeneration";
import TestAlbumCoverBackfill from "./pages/TestAlbumCoverBackfill";
import TestDiscogsFlow from "./pages/TestDiscogsFlow";
import TestDiscogsBlogGeneration from "./pages/TestDiscogsBlogGeneration";
import TestDiscogsIdFinder from "./pages/TestDiscogsIdFinder";
import TestAnecdoteGeneration from "./pages/admin/TestAnecdoteGeneration";
import DiscogsLookup from "./pages/admin/DiscogsLookup";
import AutoComments from "./pages/admin/AutoComments";
import { AdminLayout } from "./components/admin/AdminLayout";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Podcasts from "./pages/Podcasts";
import { ShopProducts } from "./pages/admin/ShopProducts";
import PlatformProducts from "./pages/admin/PlatformProducts";
import AllProducts from "./pages/admin/AllProducts";
import ArtGenerator from "./pages/admin/ArtGenerator";
import BulkArtGenerator from "./pages/admin/BulkArtGenerator";
import SketchArtGenerator from "./pages/admin/SketchArtGenerator";
import PhotoStylizer from "./pages/admin/PhotoStylizer";
import PhotoModeration from "./pages/admin/PhotoModeration";
import GenerateSeed from "./pages/admin/GenerateSeed";
import BulkPosterUpload from "./pages/admin/BulkPosterUpload";
import FixProductTitles from "./pages/admin/FixProductTitles";
import BulkProductCleanup from "./pages/admin/BulkProductCleanup";
import AutoCleanupToday from "./pages/admin/AutoCleanupToday";
import FixBlogSlugs from "./pages/admin/FixBlogSlugs";
import BackfillArtistFanwalls from "./pages/admin/BackfillArtistFanwalls";
import CreateArtistFanwall from "./pages/admin/CreateArtistFanwall";
import NotFound from "./pages/NotFound";
import { PlaatVerhaal } from "./pages/PlaatVerhaal";
import Community from "./pages/Community";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import PriceHistoryAdmin from "./pages/admin/PriceHistoryAdmin";
import SitemapManagement from "./pages/admin/SitemapManagement";
import SEOMonitoring from "./pages/admin/SEOMonitoring";
import CuratedArtists from "./pages/admin/CuratedArtists";
import MainAdmin from "./pages/admin/MainAdmin";
import CronjobMonitorPage from "./pages/admin/CronjobMonitorPage";
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
import PlatformProductDetail from "./pages/PlatformProductDetail";
import ArtShop from "./pages/ArtShop";
import PosterShop from "./pages/PosterShop";
import CanvasShop from "./pages/CanvasShop";
import TimeMachine from "./pages/TimeMachine";
import TimeMachineStory from "./pages/TimeMachineStory";
import TimeMachineManager from "./pages/admin/TimeMachineManager";
import LyricPosterGenerator from "./pages/admin/LyricPosterGenerator";
import SockGenerator from "./pages/admin/SockGenerator";
import TshirtGenerator from "./pages/admin/TshirtGenerator";
import SinglesImporterPage from "./pages/admin/SinglesImporterPage";
import ArtistStoriesGenerator from "./pages/admin/ArtistStoriesGenerator";
import SocksShop from "./pages/SocksShop";
import TshirtsShop from "./pages/TshirtsShop";
import MerchandiseShop from "./pages/MerchandiseShop";
import AnecdotesOverview from "./pages/AnecdotesOverview";
import AnecdoteDetail from "./pages/AnecdoteDetail";
import Echo from "./pages/Echo";
import FanWall from "./pages/FanWall";
import ArtistFanWallOverview from "./pages/ArtistFanWallOverview";
import ArtistFanWall from "./pages/ArtistFanWall";
import PhotoDetail from "./pages/PhotoDetail";
import UploadPhoto from "./pages/UploadPhoto";
import MyPhotos from "./pages/MyPhotos";
import LikedPhotos from "./pages/LikedPhotos";
import MusicHistory from "./pages/MusicHistory";
import UserManagement from "./pages/admin/UserManagement";
import Singles from "./pages/Singles";
import SingleDetail from "./pages/SingleDetail";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";

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

// AppContent wrapper to use hooks that need Router context
const AppContent = () => {
  useGoogleAnalytics();
  
  return (
    <>
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
        <Route path="/echo" element={<Echo />} />
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
        <Route path="/shop/:shopSlug" element={<ShopOrProductRouter />} />
        <Route path="/shop/:shopSlug/item/:itemId" element={<PublicShopItemDetail />} />
        <Route path="/product/:slug" element={<PlatformProductDetail />} />
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
        <Route path="/verhalen" element={<Verhalen />} />
        <Route path="/vandaag-in-de-muziekgeschiedenis" element={<MusicHistory />} />
        <Route path="/nieuws" element={<Nieuws />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/news" element={<Navigate to="/verhalen" replace />} />
        <Route path="/nieuws/:slug" element={<NewsPost />} />
        
        {/* Test Pages - Redirect to /admin/test/* */}
        <Route path="/test-music-news" element={<Navigate to="/admin/test/music-news" replace />} />
        <Route path="/test-news-update" element={<Navigate to="/admin/test/news-update" replace />} />
        <Route path="/test-news-generation" element={<Navigate to="/admin/test/news-generation" replace />} />
        <Route path="/test-blog-regeneration" element={<Navigate to="/admin/test/blog-regeneration" replace />} />
        <Route path="/test-album-cover-backfill" element={<Navigate to="/admin/test/album-cover-backfill" replace />} />
        <Route path="/test-discogs-flow" element={<Navigate to="/admin/test/discogs-flow" replace />} />
        <Route path="/test-discogs-blog-generation" element={<Navigate to="/admin/test/discogs-blog-generation" replace />} />
        <Route path="/test-discogs-id" element={<Navigate to="/admin/test/discogs-id" replace />} />
        
        {/* Legacy Admin Redirects */}
        <Route path="/superadmin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/superadmin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Admin Routes with Sidebar Layout */}
        <Route path="/admin/*" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route index element={<MainAdmin />} />
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                
                {/* User Management */}
                <Route path="users" element={<UserManagement />} />
                
                {/* Products & Shop */}
                <Route path="products" element={<AllProducts />} />
                <Route path="platform-products" element={<PlatformProducts />} />
                <Route path="shop-products" element={<ShopProducts />} />
                <Route path="time-machine" element={<TimeMachineManager />} />
                
                {/* Content Generators */}
                <Route path="art-generator" element={<ArtGenerator />} />
                <Route path="bulk-art-generator" element={<BulkArtGenerator />} />
                <Route path="sketch-art-generator" element={<SketchArtGenerator />} />
                <Route path="lyric-poster-generator" element={<LyricPosterGenerator />} />
                <Route path="sock-generator" element={<SockGenerator />} />
                <Route path="tshirt-generator" element={<TshirtGenerator />} />
                <Route path="photo-stylizer" element={<PhotoStylizer />} />
                <Route path="singles-importer" element={<SinglesImporterPage />} />
                <Route path="artist-stories-generator" element={<ArtistStoriesGenerator />} />
                
                {/* Content Management */}
                <Route path="curated-artists" element={<CuratedArtists />} />
                <Route path="discogs-lookup" element={<DiscogsLookup />} />
                <Route path="photo-moderation" element={<PhotoModeration />} />
                
                {/* SEO & Analytics */}
                <Route path="seo-monitoring" element={<SEOMonitoring />} />
                <Route path="sitemap-management" element={<SitemapManagement />} />
                <Route path="price-history" element={<PriceHistoryAdmin />} />
                <Route path="cronjob-monitor" element={<CronjobMonitorPage />} />
                
                {/* Maintenance */}
                <Route path="fix-blog-slugs" element={<FixBlogSlugs />} />
                <Route path="fix-product-titles" element={<FixProductTitles />} />
                <Route path="bulk-cleanup" element={<BulkProductCleanup />} />
                <Route path="auto-cleanup-today" element={<AutoCleanupToday />} />
                <Route path="backfill-artist-fanwalls" element={<BackfillArtistFanwalls />} />
                <Route path="create-artist-fanwall" element={<CreateArtistFanwall />} />
                <Route path="generate-seed" element={<GenerateSeed />} />
                <Route path="bulk-poster-upload" element={<BulkPosterUpload />} />
                
                {/* Testing */}
                <Route path="test/music-news" element={<TestMusicNews />} />
                <Route path="test/news-update" element={<TestNewsUpdate />} />
                <Route path="test/news-generation" element={<TestNewsGeneration />} />
                <Route path="test/blog-regeneration" element={<TestBlogRegeneration />} />
                <Route path="test/album-cover-backfill" element={<TestAlbumCoverBackfill />} />
                <Route path="test/discogs-flow" element={<TestDiscogsFlow />} />
                <Route path="test/discogs-blog-generation" element={<TestDiscogsBlogGeneration />} />
                <Route path="test/discogs-id" element={<TestDiscogsIdFinder />} />
                <Route path="test/anecdote-generation" element={<TestAnecdoteGeneration />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/plaat-verhaal/:slug" element={<PlaatVerhaal />} />
        <Route path="/time-machine" element={<TimeMachine />} />
        <Route path="/time-machine/:slug" element={<TimeMachineStory />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/art-shop" element={<ArtShop />} />
        <Route path="/metaalprints" element={<ArtShop />} />
        <Route path="/posters" element={<PosterShop />} />
        <Route path="/canvas" element={<CanvasShop />} />
        <Route path="/doeken" element={<CanvasShop />} />
        <Route path="/sokken" element={<SocksShop />} />
        <Route path="/socks" element={<SocksShop />} />
        <Route path="/shirts" element={<TshirtsShop />} />
        <Route path="/tshirts" element={<TshirtsShop />} />
        <Route path="/merchandise" element={<MerchandiseShop />} />
        <Route path="/merch" element={<MerchandiseShop />} />
        <Route path="/merchandise-shop" element={<MerchandiseShop />} />
        
        {/* Anecdotes Routes */}
        <Route path="/anekdotes" element={<AnecdotesOverview />} />
        <Route path="/anekdotes/:slug" element={<AnecdoteDetail />} />
        
        <Route path="/muziek-verhaal/:slug" element={<MuziekVerhaal />} />
        <Route path="/singles" element={<Singles />} />
        <Route path="/singles/:slug" element={<SingleDetail />} />
        <Route path="/artist" element={<Navigate to="/artists" replace />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/artists/:slug" element={<ArtistDetail />} />
        <Route path="/fanwall" element={<ArtistFanWallOverview />} />
        <Route path="/fanwall/:slug" element={<ArtistFanWall />} />
        <Route path="/photo/:slug" element={<PhotoDetail />} />
        <Route path="/upload" element={<UploadPhoto />} />
        <Route path="/my/photos" element={
          <ProtectedRoute>
            <MyPhotos />
          </ProtectedRoute>
        } />
        <Route path="/my/liked" element={
          <ProtectedRoute>
            <LikedPhotos />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalFooter />
      <AudioPlayer />
    </>
  );
};

const App = () => {
  console.log('🎯 App.tsx: Rendering App component');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <AudioProvider>
            <TooltipProvider>
              <ErrorBoundary showDetails={true}>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AudioProvider>
    </CartProvider>
  </AuthProvider>
</QueryClientProvider>
  );
};

export default App;
