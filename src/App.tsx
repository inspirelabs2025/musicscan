import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AudioProvider } from "@/contexts/AudioContext";
import { CartProvider } from "@/contexts/CartContext";
import { SitePopupProvider } from "@/components/popups/SitePopupProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navigation } from "@/components/Navigation";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { usePageviewTracker } from "@/hooks/usePageviewTracker";
import { initCleanAnalytics } from "@/lib/cleanAnalyticsTracker";

// Loading spinner component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Critical pages - loaded immediately
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages - grouped by feature
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Scan = lazy(() => import("./pages/Scan"));
const QuickPriceCheck = lazy(() => import("./pages/QuickPriceCheck"));
const ArtistSearchResults = lazy(() => import("./pages/ArtistSearchResults"));

// Shop pages
const Shop = lazy(() => import("./pages/Shop"));
const ArtShop = lazy(() => import("./pages/ArtShop"));
const PosterShop = lazy(() => import("./pages/PosterShop"));
const CanvasShop = lazy(() => import("./pages/CanvasShop"));
const SocksShop = lazy(() => import("./pages/SocksShop"));
const TshirtsShop = lazy(() => import("./pages/TshirtsShop"));
const ButtonsShop = lazy(() => import("./pages/ButtonsShop"));
const MerchandiseShop = lazy(() => import("./pages/MerchandiseShop"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const PublicShopItemDetail = lazy(() => import("./pages/PublicShopItemDetail"));
const PlatformProductDetail = lazy(() => import("./pages/PlatformProductDetail"));
const ShopOrProductRouter = lazy(() => import("./pages/ShopOrProductRouter"));

// Content pages
const Verhalen = lazy(() => import("./pages/Verhalen"));
const Nieuws = lazy(() => import("./pages/Nieuws"));
const NewsPost = lazy(() => import("./pages/NewsPost").then(m => ({ default: m.NewsPost })));
const MuziekVerhaal = lazy(() => import("./pages/MuziekVerhaal"));
const PlaatVerhaal = lazy(() => import("./pages/PlaatVerhaal").then(m => ({ default: m.PlaatVerhaal })));
const Singles = lazy(() => import("./pages/Singles"));
const SingleDetail = lazy(() => import("./pages/SingleDetail"));
const Artists = lazy(() => import("./pages/Artists"));
const ArtistDetail = lazy(() => import("./pages/ArtistDetail"));
const AnecdotesOverview = lazy(() => import("./pages/AnecdotesOverview"));
const AnecdoteDetail = lazy(() => import("./pages/AnecdoteDetail"));
const MusicHistory = lazy(() => import("./pages/MusicHistory"));
const Releases = lazy(() => import("./pages/Releases"));
const NewReleaseDetail = lazy(() => import("./pages/NewReleaseDetail"));

// Quiz pages
const Quiz = lazy(() => import("./pages/Quiz"));
const QuizHub = lazy(() => import("./pages/QuizHub"));
const CategoryQuiz = lazy(() => import("./pages/CategoryQuiz"));
const QuizResult = lazy(() => import("./pages/QuizResult"));
const MyQuizzes = lazy(() => import("./pages/MyQuizzes"));

// Community pages
const Community = lazy(() => import("./pages/Community"));
const Social = lazy(() => import("./pages/Social"));
const Profile = lazy(() => import("./pages/Profile"));
const Echo = lazy(() => import("./pages/Echo"));
const FanWall = lazy(() => import("./pages/FanWall"));
const ArtistFanWallOverview = lazy(() => import("./pages/ArtistFanWallOverview"));
const ArtistFanWall = lazy(() => import("./pages/ArtistFanWall"));
const PhotoDetail = lazy(() => import("./pages/PhotoDetail"));
const UploadPhoto = lazy(() => import("./pages/UploadPhoto"));
const MyPhotos = lazy(() => import("./pages/MyPhotos"));
const LikedPhotos = lazy(() => import("./pages/LikedPhotos"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumTopic = lazy(() => import("./pages/ForumTopic"));

// Country/Genre pages
const NederlandseMuziek = lazy(() => import("./pages/NederlandseMuziek"));
const NLMuziekDecennium = lazy(() => import("./pages/NLMuziekDecennium"));
const NLMuziekFeitDetail = lazy(() => import("./pages/NLMuziekFeitDetail"));
const FranseMuziek = lazy(() => import("./pages/FranseMuziek"));
const DanceHouseMuziek = lazy(() => import("./pages/DanceHouseMuziek"));
const DanceHouseFeitDetail = lazy(() => import("./pages/DanceHouseFeitDetail"));

// Year/Month overview
const YearOverview = lazy(() => import("./pages/YearOverview"));
const MonthOverview = lazy(() => import("./pages/MonthOverview"));

// Christmas pages
const Christmas = lazy(() => import("./pages/Christmas"));
const ChristmasSinglesPage = lazy(() => import("./pages/ChristmasSingles"));
const ChristmasPostersPage = lazy(() => import("./pages/ChristmasPostersPage"));
const ChristmasAnecdotesPage = lazy(() => import("./pages/ChristmasAnecdotesPage"));
const ChristmasImporter = lazy(() => import("./pages/admin/ChristmasImporter"));
const ChristmasImportLogs = lazy(() => import("./pages/admin/ChristmasImportLogs"));

// Collection pages
const MyCollection = lazy(() => import("./pages/MyCollection"));
const MyCollectionOld = lazy(() => import("./pages/MyCollectionOld"));
const CollectionOverview = lazy(() => import("./pages/CollectionOverview"));
const CollectionChat = lazy(() => import("./pages/CollectionChat"));
const PublicCollection = lazy(() => import("./pages/PublicCollection"));
const PublicCatalog = lazy(() => import("./pages/PublicCatalog"));
const PublicShopsOverview = lazy(() => import("./pages/PublicShopsOverview"));
const MyShop = lazy(() => import("./pages/MyShop"));
const PublicShop = lazy(() => import("./pages/PublicShop"));

// AI/Scan pages
const AIAnalysis = lazy(() => import("./pages/AIAnalysis"));
const AIScan = lazy(() => import("./pages/AIScan"));
const AIScanOverview = lazy(() => import("./pages/AIScanOverview"));
const AIScanV2 = lazy(() => import("./pages/AIScanV2"));
const AIScanV2Overview = lazy(() => import("./pages/AIScanV2Overview"));
const UnifiedScanOverview = lazy(() => import("./pages/UnifiedScanOverview"));
const BulkerImage = lazy(() => import("./pages/BulkerImage"));
const MarketplaceOverview = lazy(() => import("./pages/MarketplaceOverview"));
const UserScans = lazy(() => import("./pages/UserScans"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const ReleaseDetail = lazy(() => import("./pages/ReleaseDetail"));

// Podcast pages
const Podcasts = lazy(() => import("./pages/Podcasts"));
const PodcastDetail = lazy(() => import("./pages/PodcastDetail"));
const PodcastEpisodeDetail = lazy(() => import("./pages/PodcastEpisodeDetail"));
const DePlaatEnHetVerhaal = lazy(() => import("./pages/DePlaatEnHetVerhaal"));

// TimeMachine pages
const TimeMachine = lazy(() => import("./pages/TimeMachine"));
const TimeMachineStory = lazy(() => import("./pages/TimeMachineStory"));

// Misc pages
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Voorwaarden = lazy(() => import("./pages/Voorwaarden"));
const FacebookCatalogFeed = lazy(() => import("./pages/FacebookCatalogFeed"));
const Feeds = lazy(() => import("./pages/Feeds"));
const Prestaties = lazy(() => import("./pages/Prestaties"));
const SpotifyProfile = lazy(() => import("./pages/SpotifyProfile"));
const SpotifyCallback = lazy(() => import("./pages/SpotifyCallback"));
const TrackOrder = lazy(() => import("./pages/TrackOrder").then(m => ({ default: m.TrackOrder })));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess").then(m => ({ default: m.OrderSuccess })));
const SetPassword = lazy(() => import("./pages/SetPassword"));
const LlmsTxt = lazy(() => import("./pages/LlmsTxt"));
const LlmSitemap = lazy(() => import("./pages/LlmSitemap"));
const MusicNews = lazy(() => import("./pages/MusicNews"));
const YouTubeDiscoveries = lazy(() => import("./pages/YouTubeDiscoveries"));
const Reviews = lazy(() => import("./pages/Reviews"));
const ReviewDetail = lazy(() => import("./pages/ReviewDetail"));
const ArtistSpotlights = lazy(() => import("./pages/ArtistSpotlights"));
const ArtistSpotlight = lazy(() => import("./pages/ArtistSpotlight"));

// Admin pages - all lazy loaded
const AdminLayout = lazy(() => import("./components/admin/AdminLayout").then(m => ({ default: m.AdminLayout })));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const MainAdmin = lazy(() => import("./pages/admin/MainAdmin"));
const AllProducts = lazy(() => import("./pages/admin/AllProducts"));
const PlatformProducts = lazy(() => import("./pages/admin/PlatformProducts"));
const ShopProducts = lazy(() => import("./pages/admin/ShopProducts").then(m => ({ default: m.ShopProducts })));
const ShopOrders = lazy(() => import("./pages/admin/ShopOrders"));
const ArtGenerator = lazy(() => import("./pages/admin/ArtGenerator"));
const BulkArtGenerator = lazy(() => import("./pages/admin/BulkArtGenerator"));
const SketchArtGenerator = lazy(() => import("./pages/admin/SketchArtGenerator"));
const PhotoStylizer = lazy(() => import("./pages/admin/PhotoStylizer"));
const PhotoModeration = lazy(() => import("./pages/admin/PhotoModeration"));
const GenerateSeed = lazy(() => import("./pages/admin/GenerateSeed"));
const BulkPosterUpload = lazy(() => import("./pages/admin/BulkPosterUpload"));
const FixProductTitles = lazy(() => import("./pages/admin/FixProductTitles"));
const BulkProductCleanup = lazy(() => import("./pages/admin/BulkProductCleanup"));
const AutoCleanupToday = lazy(() => import("./pages/admin/AutoCleanupToday"));
const FixBlogSlugs = lazy(() => import("./pages/admin/FixBlogSlugs"));
const CleanupDuplicateBlogs = lazy(() => import("./pages/CleanupDuplicateBlogs"));
const BackfillArtistFanwalls = lazy(() => import("./pages/admin/BackfillArtistFanwalls"));
const CreateArtistFanwall = lazy(() => import("./pages/admin/CreateArtistFanwall"));
const PriceHistoryAdmin = lazy(() => import("./pages/admin/PriceHistoryAdmin"));
const SitemapManagement = lazy(() => import("./pages/admin/SitemapManagement"));
const SEOMonitoring = lazy(() => import("./pages/admin/SEOMonitoring"));
const CuratedArtists = lazy(() => import("./pages/admin/CuratedArtists"));
const CronjobMonitorPage = lazy(() => import("./pages/admin/CronjobMonitorPage"));
const EmailNotificationsPage = lazy(() => import("./pages/admin/EmailNotificationsPage"));
const TimeMachineManager = lazy(() => import("./pages/admin/TimeMachineManager"));
const LyricPosterGenerator = lazy(() => import("./pages/admin/LyricPosterGenerator"));
const SockGenerator = lazy(() => import("./pages/admin/SockGenerator"));
const TshirtGenerator = lazy(() => import("./pages/admin/TshirtGenerator"));
const ButtonGenerator = lazy(() => import("./pages/admin/ButtonGenerator"));
const SinglesImporterPage = lazy(() => import("./pages/admin/SinglesImporterPage"));
const ArtistStoriesGenerator = lazy(() => import("./pages/admin/ArtistStoriesGenerator"));
const FacebookSync = lazy(() => import("./pages/admin/FacebookSync"));
const FacebookAdmin = lazy(() => import("./pages/admin/FacebookAdmin"));
const FacebookTestPost = lazy(() => import("./pages/admin/FacebookTestPost"));
const InstagramAdmin = lazy(() => import("./pages/admin/InstagramAdmin"));
const MetricoolAdmin = lazy(() => import("./pages/admin/MetricoolAdmin"));
const TikTokVideoAdmin = lazy(() => import("./pages/admin/TikTokVideoAdmin"));
const RenderQueue = lazy(() => import("./pages/admin/RenderQueue"));
const RenderJobsPage = lazy(() => import("./pages/admin/RenderJobsPage"));
const NewsRssManager = lazy(() => import("./pages/admin/NewsRssManager"));
const OwnPodcasts = lazy(() => import("./pages/admin/OwnPodcasts"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const Statistics = lazy(() => import("./pages/admin/Statistics"));
const ArtistSpotlightsAdmin = lazy(() => import("./pages/admin/ArtistSpotlights"));
const ArtistSpotlightEditor = lazy(() => import("./components/admin/ArtistSpotlightEditor").then(m => ({ default: m.ArtistSpotlightEditor })));
const AdminAlbumReviews = lazy(() => import("./pages/admin/AdminAlbumReviews"));
const SEOKeywords = lazy(() => import("./pages/admin/SEOKeywords"));
const SystemOverview = lazy(() => import("./pages/admin/SystemOverview"));
const StatusDashboard = lazy(() => import("./pages/admin/StatusDashboard"));
const Top2000Importer = lazy(() => import("./pages/admin/Top2000Importer"));
const Top2000Analyse = lazy(() => import("./pages/Top2000Analyse"));
const MediaLibrary = lazy(() => import("./pages/admin/MediaLibrary"));
const PopupManager = lazy(() => import("./pages/admin/PopupManager"));
const AdminYearOverview = lazy(() => import("./pages/admin/AdminYearOverview"));
const DiscogsLookup = lazy(() => import("./pages/admin/DiscogsLookup"));
const AutoComments = lazy(() => import("./pages/admin/AutoComments"));
const TestAnecdoteGeneration = lazy(() => import("./pages/admin/TestAnecdoteGeneration"));
const TestMusicNews = lazy(() => import("./pages/TestMusicNews"));
const TestNewsUpdate = lazy(() => import("./pages/TestNewsUpdate"));
const TestNewsGeneration = lazy(() => import("./pages/TestNewsGeneration"));
const TestBlogRegeneration = lazy(() => import("./pages/TestBlogRegeneration"));
const TestAlbumCoverBackfill = lazy(() => import("./pages/TestAlbumCoverBackfill"));
const TestBase64ImageCleanup = lazy(() => import("./pages/TestBase64ImageCleanup"));
const TestDiscogsFlow = lazy(() => import("./pages/TestDiscogsFlow"));
const TestDiscogsBlogGeneration = lazy(() => import("./pages/TestDiscogsBlogGeneration"));
const TestDiscogsIdFinder = lazy(() => import("./pages/TestDiscogsIdFinder"));

// Redirect component for old /blog/ URLs to /plaat-verhaal/
const BlogRedirect = () => {
  const params = window.location.pathname.split('/');
  const slug = params[params.length - 1];
  return <Navigate to={`/plaat-verhaal/${slug}`} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error: any) => {
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

// Wrapper for lazy routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// AppContent wrapper to use hooks that need Router context
const AppContent = () => {
  useGoogleAnalytics();
  usePageviewTracker();
  
  // Initialize clean analytics for datacenter/bot traffic detection
  React.useEffect(() => {
    initCleanAnalytics();
  }, []);
  
  return (
    <>
      <Navigation />
      <Routes>
        {/* Core routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/set-password" element={<LazyRoute><SetPassword /></LazyRoute>} />
        
        {/* LLM routes */}
        <Route path="/.well-known/llms.txt" element={<LazyRoute><LlmsTxt /></LazyRoute>} />
        <Route path="/llms.txt" element={<LazyRoute><LlmsTxt /></LazyRoute>} />
        <Route path="/sitemap-llm.xml" element={<LazyRoute><LlmSitemap /></LazyRoute>} />
        
        {/* Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><LazyRoute><Dashboard /></LazyRoute></ProtectedRoute>} />
        <Route path="/search/artist" element={<LazyRoute><ArtistSearchResults /></LazyRoute>} />
        
        {/* Scanner routes */}
        <Route path="/scan" element={<LazyRoute><Scan /></LazyRoute>} />
        <Route path="/scanner" element={<LazyRoute><Scanner /></LazyRoute>} />
        <Route path="/quick-price-check" element={<LazyRoute><QuickPriceCheck /></LazyRoute>} />
        <Route path="/scanner/discogs" element={<ProtectedRoute><LazyRoute><BulkerImage /></LazyRoute></ProtectedRoute>} />
        <Route path="/ai-scan" element={<ProtectedRoute><LazyRoute><AIScan /></LazyRoute></ProtectedRoute>} />
        <Route path="/ai-scan-overview" element={<ProtectedRoute><LazyRoute><AIScanOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/ai-scan-v2" element={<ProtectedRoute><LazyRoute><AIScanV2 /></LazyRoute></ProtectedRoute>} />
        <Route path="/ai-scan-v2-overview" element={<ProtectedRoute><LazyRoute><AIScanV2Overview /></LazyRoute></ProtectedRoute>} />
        <Route path="/unified-scan-overview" element={<ProtectedRoute><LazyRoute><UnifiedScanOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/bulkerimage" element={<ProtectedRoute><LazyRoute><BulkerImage /></LazyRoute></ProtectedRoute>} />
        
        {/* Collection routes */}
        <Route path="/marketplace-overview" element={<ProtectedRoute><LazyRoute><MarketplaceOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/collection-overview" element={<ProtectedRoute><LazyRoute><CollectionOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/collection-chat" element={<ProtectedRoute><LazyRoute><CollectionChat /></LazyRoute></ProtectedRoute>} />
        <Route path="/my-collection" element={<ProtectedRoute><LazyRoute><MyCollection /></LazyRoute></ProtectedRoute>} />
        <Route path="/my-collection-old" element={<ProtectedRoute><LazyRoute><MyCollectionOld /></LazyRoute></ProtectedRoute>} />
        <Route path="/my-shop" element={<ProtectedRoute><LazyRoute><MyShop /></LazyRoute></ProtectedRoute>} />
        <Route path="/user-scans" element={<ProtectedRoute><LazyRoute><UserScans /></LazyRoute></ProtectedRoute>} />
        <Route path="/ai-analysis" element={<ProtectedRoute><LazyRoute><AIAnalysis /></LazyRoute></ProtectedRoute>} />
        
        {/* Public collection/shop */}
        <Route path="/shop/:identifier" element={<LazyRoute><ShopOrProductRouter /></LazyRoute>} />
        <Route path="/shop/:shopId/:itemId" element={<LazyRoute><PublicShopItemDetail /></LazyRoute>} />
        <Route path="/collection/:userId" element={<LazyRoute><PublicCollection /></LazyRoute>} />
        <Route path="/public-catalog" element={<LazyRoute><PublicCatalog /></LazyRoute>} />
        <Route path="/shops" element={<LazyRoute><PublicShopsOverview /></LazyRoute>} />
        
        {/* Shop routes */}
        <Route path="/shop" element={<LazyRoute><Shop /></LazyRoute>} />
        <Route path="/product/:slug" element={<LazyRoute><PlatformProductDetail /></LazyRoute>} />
        <Route path="/art-shop" element={<LazyRoute><ArtShop /></LazyRoute>} />
        <Route path="/metaalprints" element={<LazyRoute><ArtShop /></LazyRoute>} />
        <Route path="/posters" element={<LazyRoute><PosterShop /></LazyRoute>} />
        <Route path="/canvas" element={<LazyRoute><CanvasShop /></LazyRoute>} />
        <Route path="/doeken" element={<LazyRoute><CanvasShop /></LazyRoute>} />
        <Route path="/sokken" element={<LazyRoute><SocksShop /></LazyRoute>} />
        <Route path="/socks" element={<LazyRoute><SocksShop /></LazyRoute>} />
        <Route path="/shirts" element={<LazyRoute><TshirtsShop /></LazyRoute>} />
        <Route path="/tshirts" element={<LazyRoute><TshirtsShop /></LazyRoute>} />
        <Route path="/buttons" element={<LazyRoute><ButtonsShop /></LazyRoute>} />
        <Route path="/speldjes" element={<LazyRoute><ButtonsShop /></LazyRoute>} />
        <Route path="/badges" element={<LazyRoute><ButtonsShop /></LazyRoute>} />
        <Route path="/merchandise" element={<LazyRoute><MerchandiseShop /></LazyRoute>} />
        <Route path="/merch" element={<LazyRoute><MerchandiseShop /></LazyRoute>} />
        <Route path="/merchandise-shop" element={<LazyRoute><MerchandiseShop /></LazyRoute>} />
        <Route path="/marktplaats" element={<LazyRoute><Marketplace /></LazyRoute>} />
        <Route path="/marketplace" element={<LazyRoute><Marketplace /></LazyRoute>} />
        <Route path="/marketplace/:itemId" element={<LazyRoute><PublicShopItemDetail /></LazyRoute>} />
        
        {/* Order routes */}
        <Route path="/track-order" element={<LazyRoute><TrackOrder /></LazyRoute>} />
        <Route path="/order-success" element={<LazyRoute><OrderSuccess /></LazyRoute>} />
        
        {/* Content routes */}
        <Route path="/verhalen" element={<LazyRoute><Verhalen /></LazyRoute>} />
        <Route path="/nieuws" element={<LazyRoute><Nieuws /></LazyRoute>} />
        <Route path="/nieuws/:slug" element={<LazyRoute><NewsPost /></LazyRoute>} />
        <Route path="/releases" element={<LazyRoute><Releases /></LazyRoute>} />
        <Route path="/new-release/:slug" element={<LazyRoute><NewReleaseDetail /></LazyRoute>} />
        <Route path="/muziek-verhaal/:slug" element={<LazyRoute><MuziekVerhaal /></LazyRoute>} />
        <Route path="/plaat-verhaal/:slug" element={<LazyRoute><PlaatVerhaal /></LazyRoute>} />
        <Route path="/blog/:slug" element={<BlogRedirect />} />
        <Route path="/singles" element={<LazyRoute><Singles /></LazyRoute>} />
        <Route path="/singles/:slug" element={<LazyRoute><SingleDetail /></LazyRoute>} />
        <Route path="/artist" element={<Navigate to="/artists" replace />} />
        <Route path="/artists" element={<LazyRoute><Artists /></LazyRoute>} />
        <Route path="/artists/:slug" element={<LazyRoute><ArtistDetail /></LazyRoute>} />
        <Route path="/anekdotes" element={<LazyRoute><AnecdotesOverview /></LazyRoute>} />
        <Route path="/anekdotes/:slug" element={<LazyRoute><AnecdoteDetail /></LazyRoute>} />
        <Route path="/vandaag-in-de-muziekgeschiedenis" element={<LazyRoute><MusicHistory /></LazyRoute>} />
        <Route path="/music-news" element={<LazyRoute><MusicNews /></LazyRoute>} />
        <Route path="/youtube-discoveries" element={<LazyRoute><YouTubeDiscoveries /></LazyRoute>} />
        <Route path="/reviews" element={<LazyRoute><Reviews /></LazyRoute>} />
        <Route path="/reviews/:slug" element={<LazyRoute><ReviewDetail /></LazyRoute>} />
        <Route path="/spotlights" element={<LazyRoute><ArtistSpotlights /></LazyRoute>} />
        <Route path="/spotlights/:slug" element={<LazyRoute><ArtistSpotlight /></LazyRoute>} />
        
        {/* Quiz routes */}
        <Route path="/echo" element={<LazyRoute><Echo /></LazyRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><LazyRoute><Quiz /></LazyRoute></ProtectedRoute>} />
        <Route path="/quizzen" element={<LazyRoute><QuizHub /></LazyRoute>} />
        <Route path="/quizzen/:category" element={<LazyRoute><CategoryQuiz /></LazyRoute>} />
        <Route path="/quiz/result/:shareToken" element={<LazyRoute><QuizResult /></LazyRoute>} />
        <Route path="/mijn-quizzen" element={<ProtectedRoute><LazyRoute><MyQuizzes /></LazyRoute></ProtectedRoute>} />
        
        {/* Country/Genre hubs */}
        <Route path="/nederland" element={<LazyRoute><NederlandseMuziek /></LazyRoute>} />
        <Route path="/nederland/decennium/:decade" element={<LazyRoute><NLMuziekDecennium /></LazyRoute>} />
        <Route path="/nederland/feit/:slug" element={<LazyRoute><NLMuziekFeitDetail /></LazyRoute>} />
        <Route path="/frankrijk" element={<LazyRoute><FranseMuziek /></LazyRoute>} />
        <Route path="/dance-house" element={<LazyRoute><DanceHouseMuziek /></LazyRoute>} />
        <Route path="/dance-house/feit/:slug" element={<LazyRoute><DanceHouseFeitDetail /></LazyRoute>} />
        
        {/* Year/Month overview */}
        <Route path="/jaar-overzicht" element={<LazyRoute><YearOverview /></LazyRoute>} />
        <Route path="/maand-overzicht" element={<LazyRoute><MonthOverview /></LazyRoute>} />
        <Route path="/top-2000-analyse" element={<LazyRoute><Top2000Analyse /></LazyRoute>} />
        
        {/* Christmas */}
        <Route path="/kerst" element={<LazyRoute><Christmas /></LazyRoute>} />
        <Route path="/kerst-singles" element={<LazyRoute><ChristmasSinglesPage /></LazyRoute>} />
        <Route path="/kerst-posters" element={<LazyRoute><ChristmasPostersPage /></LazyRoute>} />
        <Route path="/kerst/anekdotes" element={<LazyRoute><ChristmasAnecdotesPage /></LazyRoute>} />
        <Route path="/maand-overzicht/:year/:month" element={<LazyRoute><MonthOverview /></LazyRoute>} />
        
        {/* Podcast routes */}
        <Route path="/de-plaat-en-het-verhaal" element={<LazyRoute><DePlaatEnHetVerhaal /></LazyRoute>} />
        <Route path="/podcasts" element={<LazyRoute><Podcasts /></LazyRoute>} />
        <Route path="/podcast/:podcastSlug" element={<LazyRoute><PodcastDetail /></LazyRoute>} />
        <Route path="/podcast/:podcastSlug/:episodeSlug" element={<LazyRoute><PodcastEpisodeDetail /></LazyRoute>} />
        
        {/* TimeMachine */}
        <Route path="/time-machine" element={<LazyRoute><TimeMachine /></LazyRoute>} />
        <Route path="/time-machine/:slug" element={<LazyRoute><TimeMachineStory /></LazyRoute>} />
        
        {/* Community routes */}
        <Route path="/community" element={<ProtectedRoute><LazyRoute><Community /></LazyRoute></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><LazyRoute><Social /></LazyRoute></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><LazyRoute><Profile /></LazyRoute></ProtectedRoute>} />
        <Route path="/forum" element={<ProtectedRoute><LazyRoute><Forum /></LazyRoute></ProtectedRoute>} />
        <Route path="/forum/:topicId" element={<ProtectedRoute><LazyRoute><ForumTopic /></LazyRoute></ProtectedRoute>} />
        <Route path="/fanwall" element={<LazyRoute><ArtistFanWallOverview /></LazyRoute>} />
        <Route path="/fanwall/:slug" element={<LazyRoute><ArtistFanWall /></LazyRoute>} />
        <Route path="/photo/:slug" element={<LazyRoute><PhotoDetail /></LazyRoute>} />
        <Route path="/upload" element={<LazyRoute><UploadPhoto /></LazyRoute>} />
        <Route path="/my/photos" element={<ProtectedRoute><LazyRoute><MyPhotos /></LazyRoute></ProtectedRoute>} />
        <Route path="/my/liked" element={<ProtectedRoute><LazyRoute><LikedPhotos /></LazyRoute></ProtectedRoute>} />
        
        {/* Misc pages */}
        <Route path="/album/:id" element={<LazyRoute><AlbumDetail /></LazyRoute>} />
        <Route path="/release/:id" element={<LazyRoute><ReleaseDetail /></LazyRoute>} />
        <Route path="/pricing" element={<LazyRoute><Pricing /></LazyRoute>} />
        <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
        <Route path="/retourneren" element={<LazyRoute><ReturnPolicy /></LazyRoute>} />
        <Route path="/privacy" element={<LazyRoute><Privacy /></LazyRoute>} />
        <Route path="/voorwaarden" element={<LazyRoute><Voorwaarden /></LazyRoute>} />
        <Route path="/feeds/facebook-catalog.csv" element={<LazyRoute><FacebookCatalogFeed /></LazyRoute>} />
        <Route path="/feeds" element={<LazyRoute><Feeds /></LazyRoute>} />
        <Route path="/prestaties" element={<ProtectedRoute><LazyRoute><Prestaties /></LazyRoute></ProtectedRoute>} />
        <Route path="/spotify/profile" element={<ProtectedRoute><LazyRoute><SpotifyProfile /></LazyRoute></ProtectedRoute>} />
        <Route path="/spotify/callback" element={<LazyRoute><SpotifyCallback /></LazyRoute>} />
        
        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute><LazyRoute><MainAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/superadmin" element={<ProtectedRoute><LazyRoute><SuperAdminDashboard /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute><LazyRoute><AllProducts /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/platform-products" element={<ProtectedRoute><LazyRoute><PlatformProducts /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/shop-products" element={<ProtectedRoute><LazyRoute><ShopProducts /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute><LazyRoute><ShopOrders /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/art-generator" element={<ProtectedRoute><LazyRoute><ArtGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/bulk-art-generator" element={<ProtectedRoute><LazyRoute><BulkArtGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/sketch-generator" element={<ProtectedRoute><LazyRoute><SketchArtGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/photo-stylizer" element={<ProtectedRoute><LazyRoute><PhotoStylizer /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/photo-moderation" element={<ProtectedRoute><LazyRoute><PhotoModeration /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/generate-seed" element={<ProtectedRoute><LazyRoute><GenerateSeed /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/bulk-poster-upload" element={<ProtectedRoute><LazyRoute><BulkPosterUpload /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/fix-product-titles" element={<ProtectedRoute><LazyRoute><FixProductTitles /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/bulk-cleanup" element={<ProtectedRoute><LazyRoute><BulkProductCleanup /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/auto-cleanup" element={<ProtectedRoute><LazyRoute><AutoCleanupToday /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/fix-blog-slugs" element={<ProtectedRoute><LazyRoute><FixBlogSlugs /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/cleanup-duplicate-blogs" element={<ProtectedRoute><LazyRoute><CleanupDuplicateBlogs /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/backfill-fanwalls" element={<ProtectedRoute><LazyRoute><BackfillArtistFanwalls /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/create-fanwall" element={<ProtectedRoute><LazyRoute><CreateArtistFanwall /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/price-history" element={<ProtectedRoute><LazyRoute><PriceHistoryAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/sitemaps" element={<ProtectedRoute><LazyRoute><SitemapManagement /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/seo" element={<ProtectedRoute><LazyRoute><SEOMonitoring /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/seo-keywords" element={<ProtectedRoute><LazyRoute><SEOKeywords /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/curated-artists" element={<ProtectedRoute><LazyRoute><CuratedArtists /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/cronjobs" element={<ProtectedRoute><LazyRoute><CronjobMonitorPage /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/email-notifications" element={<ProtectedRoute><LazyRoute><EmailNotificationsPage /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/time-machine" element={<ProtectedRoute><LazyRoute><TimeMachineManager /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/lyric-poster" element={<ProtectedRoute><LazyRoute><LyricPosterGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/sock-generator" element={<ProtectedRoute><LazyRoute><SockGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/tshirt-generator" element={<ProtectedRoute><LazyRoute><TshirtGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/button-generator" element={<ProtectedRoute><LazyRoute><ButtonGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/singles-importer" element={<ProtectedRoute><LazyRoute><SinglesImporterPage /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/artist-stories-generator" element={<ProtectedRoute><LazyRoute><ArtistStoriesGenerator /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/facebook-sync" element={<ProtectedRoute><LazyRoute><FacebookSync /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/facebook" element={<ProtectedRoute><LazyRoute><FacebookAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/facebook-test" element={<ProtectedRoute><LazyRoute><FacebookTestPost /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/instagram" element={<ProtectedRoute><LazyRoute><InstagramAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/metricool" element={<ProtectedRoute><LazyRoute><MetricoolAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/tiktok-videos" element={<ProtectedRoute><LazyRoute><TikTokVideoAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/render-queue" element={<ProtectedRoute><LazyRoute><RenderQueue /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute><LazyRoute><RenderJobsPage /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/news-rss" element={<ProtectedRoute><LazyRoute><NewsRssManager /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/own-podcasts" element={<ProtectedRoute><LazyRoute><OwnPodcasts /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><LazyRoute><UserManagement /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/statistics" element={<ProtectedRoute><LazyRoute><Statistics /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/artist-spotlights" element={<ProtectedRoute><LazyRoute><ArtistSpotlightsAdmin /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/artist-spotlight/:id" element={<ProtectedRoute><LazyRoute><ArtistSpotlightEditor /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><LazyRoute><AdminAlbumReviews /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/system" element={<ProtectedRoute><LazyRoute><SystemOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/status" element={<ProtectedRoute><LazyRoute><StatusDashboard /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/media-library" element={<ProtectedRoute><LazyRoute><MediaLibrary /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/popups" element={<ProtectedRoute><LazyRoute><PopupManager /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/year-overview" element={<ProtectedRoute><LazyRoute><AdminYearOverview /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/discogs-lookup" element={<ProtectedRoute><LazyRoute><DiscogsLookup /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/auto-comments" element={<ProtectedRoute><LazyRoute><AutoComments /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/anecdote-generation" element={<ProtectedRoute><LazyRoute><TestAnecdoteGeneration /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/christmas-importer" element={<ProtectedRoute><LazyRoute><ChristmasImporter /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/christmas-logs" element={<ProtectedRoute><LazyRoute><ChristmasImportLogs /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/top2000-importer" element={<ProtectedRoute><LazyRoute><Top2000Importer /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/music-news" element={<ProtectedRoute><LazyRoute><TestMusicNews /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/news-update" element={<ProtectedRoute><LazyRoute><TestNewsUpdate /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/news-generation" element={<ProtectedRoute><LazyRoute><TestNewsGeneration /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/blog-regeneration" element={<ProtectedRoute><LazyRoute><TestBlogRegeneration /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/album-cover-backfill" element={<ProtectedRoute><LazyRoute><TestAlbumCoverBackfill /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/discogs-flow" element={<ProtectedRoute><LazyRoute><TestDiscogsFlow /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/discogs-blog-generation" element={<ProtectedRoute><LazyRoute><TestDiscogsBlogGeneration /></LazyRoute></ProtectedRoute>} />
        <Route path="/admin/test/discogs-id-finder" element={<ProtectedRoute><LazyRoute><TestDiscogsIdFinder /></LazyRoute></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalFooter />
      <AudioPlayer />
    </>
  );
};

const App = () => {
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
                  <SitePopupProvider>
                    <AppContent />
                  </SitePopupProvider>
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
