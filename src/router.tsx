import React, { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';

const FanwallSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/fan-wall/${slug}`} replace />;
};

const AdminNoIndex = () => (
  <>
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <Outlet />
  </>
);

import App from './App';
import { PageLoader } from './components/shared/page-loader';

// Lazy-load pages
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Welkom = lazy(() => import('./pages/Welkom'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Shop = lazy(() => import('./pages/Shop'));
const Artists = lazy(() => import('./pages/Artists'));
const ArtistDetail = lazy(() => import('./pages/ArtistDetail'));
const Singles = lazy(() => import('./pages/Singles'));
const SingleDetail = lazy(() => import('./pages/SingleDetail'));
const MuziekVerhaal = lazy(() => import('./pages/MuziekVerhaal'));
const AnecdotesOverview = lazy(() => import('./pages/AnecdotesOverview'));
const AnecdoteDetail = lazy(() => import('./pages/AnecdoteDetail'));
const Nieuws = lazy(() => import('./pages/Nieuws'));
const NewsPost = lazy(() => import('./pages/NewsPost').then(m => ({ default: m.NewsPost })));
const MusicHistory = lazy(() => import('./pages/MusicHistory'));
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizHub = lazy(() => import('./pages/QuizHub'));
const QuizResult = lazy(() => import('./pages/QuizResult'));
const CategoryQuiz = lazy(() => import('./pages/CategoryQuiz'));
const MyQuizzes = lazy(() => import('./pages/MyQuizzes'));
const CollectionOverview = lazy(() => import('./pages/CollectionOverview'));
const MyCollection = lazy(() => import('./pages/MyCollection'));
const Profile = lazy(() => import('./pages/Profile'));
const Scan = lazy(() => import('./pages/Scan'));
const AIScanV2 = lazy(() => import('./pages/AIScanV2'));
const AIScanV2Overview = lazy(() => import('./pages/AIScanV2Overview'));
const PosterShop = lazy(() => import('./pages/PosterShop'));
const CanvasShop = lazy(() => import('./pages/CanvasShop'));
const TshirtsShop = lazy(() => import('./pages/TshirtsShop'));
const SocksShop = lazy(() => import('./pages/SocksShop'));
const ButtonsShop = lazy(() => import('./pages/ButtonsShop'));
const ArtShop = lazy(() => import('./pages/ArtShop'));
const MerchandiseShop = lazy(() => import('./pages/MerchandiseShop'));
const PlatformProductDetail = lazy(() => import('./pages/PlatformProductDetail'));
const NederlandseMuziek = lazy(() => import('./pages/NederlandseMuziek'));
const FranseMuziek = lazy(() => import('./pages/FranseMuziek'));
const DanceHouseMuziek = lazy(() => import('./pages/DanceHouseMuziek'));
const NewReleaseDetail = lazy(() => import('./pages/NewReleaseDetail'));
const Community = lazy(() => import('./pages/Community'));
const Chat = lazy(() => import('./pages/chat'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Voorwaarden = lazy(() => import('./pages/Voorwaarden'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const About = lazy(() => import('./pages/About'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Verhalen = lazy(() => import('./pages/Verhalen'));
const Releases = lazy(() => import('./pages/Releases'));
const ReleaseDetail = lazy(() => import('./pages/ReleaseDetail'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const TrackOrder = lazy(() => import('./pages/TrackOrder').then(m => ({ default: m.TrackOrder })));
const PublicCollection = lazy(() => import('./pages/PublicCollection'));
const PublicCatalog = lazy(() => import('./pages/PublicCatalog'));
const PublicShop = lazy(() => import('./pages/PublicShop'));
const PublicShopsOverview = lazy(() => import('./pages/PublicShopsOverview'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const MarketplaceOverview = lazy(() => import('./pages/MarketplaceOverview'));
const MyShop = lazy(() => import('./pages/MyShop'));
const Forum = lazy(() => import('./pages/Forum'));
const ForumTopic = lazy(() => import('./pages/ForumTopic'));
const Echo = lazy(() => import('./pages/Echo'));
const Podcasts = lazy(() => import('./pages/Podcasts'));
const PodcastDetail = lazy(() => import('./pages/PodcastDetail'));
const CollectionChat = lazy(() => import('./pages/CollectionChat'));
const Prestaties = lazy(() => import('./pages/Prestaties'));
const Social = lazy(() => import('./pages/Social'));
const FanWall = lazy(() => import('./pages/FanWall'));
const ArtistFanWall = lazy(() => import('./pages/ArtistFanWall'));
const ArtistFanWallOverview = lazy(() => import('./pages/ArtistFanWallOverview'));
const ArtistSpotlight = lazy(() => import('./pages/ArtistSpotlight'));
const ArtistSpotlights = lazy(() => import('./pages/ArtistSpotlights'));
const AIFeaturesPage = lazy(() => import('./pages/AIFeaturesPage').then(m => ({ default: m.AIFeaturesPage })));
const Filmmuziek = lazy(() => import('./pages/Filmmuziek'));
const StudioStories = lazy(() => import('./pages/StudioStories'));
const StudioStoryDetail = lazy(() => import('./pages/StudioStoryDetail'));
const TimeMachine = lazy(() => import('./pages/TimeMachine'));
const TimeMachineStory = lazy(() => import('./pages/TimeMachineStory'));
const MonthOverview = lazy(() => import('./pages/MonthOverview'));
const YearOverview = lazy(() => import('./pages/YearOverview'));
const UploadPhoto = lazy(() => import('./pages/UploadPhoto'));
const MyPhotos = lazy(() => import('./pages/MyPhotos'));
const PhotoDetail = lazy(() => import('./pages/PhotoDetail'));
const LikedPhotos = lazy(() => import('./pages/LikedPhotos'));
const Reviews = lazy(() => import('./pages/Reviews'));
const ReviewDetail = lazy(() => import('./pages/ReviewDetail'));
const Top2000Analyse = lazy(() => import('./pages/Top2000Analyse'));
const YouTubeDiscoveries = lazy(() => import('./pages/YouTubeDiscoveries'));
const Christmas = lazy(() => import('./pages/Christmas'));
const MijnDiscogs = lazy(() => import('./pages/MijnDiscogs'));
const DiscogsMessages = lazy(() => import('./pages/DiscogsMessages'));
const SpotifyProfile = lazy(() => import('./pages/SpotifyProfile'));
const SpotifyCallback = lazy(() => import('./pages/SpotifyCallback'));
const DePlaatEnHetVerhaal = lazy(() => import('./pages/DePlaatEnHetVerhaal'));
const PlaatVerhaal = lazy(() => import('./pages/PlaatVerhaal').then(m => ({ default: m.PlaatVerhaal })));
const QuickPriceCheck = lazy(() => import('./pages/QuickPriceCheck'));
const ShopOrProductRouter = lazy(() => import('./pages/ShopOrProductRouter'));
const UnifiedScanner = lazy(() => import('./pages/UnifiedScanner'));
const UnifiedScanOverview = lazy(() => import('./pages/UnifiedScanOverview'));
const NLMuziekDecennium = lazy(() => import('./pages/NLMuziekDecennium'));
const NLMuziekFeitDetail = lazy(() => import('./pages/NLMuziekFeitDetail'));
const DanceHouseFeitDetail = lazy(() => import('./pages/DanceHouseFeitDetail'));
const FilmmuziekFeitDetail = lazy(() => import('./pages/FilmmuziekFeitDetail'));
const MusicNews = lazy(() => import('./pages/MusicNews'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const CollectionItemPage = lazy(() => import('./pages/CollectionItemPage'));


// Admin pages
const AdminMainAdmin = lazy(() => import('./pages/admin/MainAdmin'));
const AdminStatusDashboard = lazy(() => import('./pages/admin/StatusDashboard'));
const AdminSystemOverview = lazy(() => import('./pages/admin/SystemOverview'));
const AdminCronjobMonitor = lazy(() => import('./pages/admin/CronjobMonitorPage'));
const AdminEmailNotifications = lazy(() => import('./pages/admin/EmailNotificationsPage'));
const AdminUserManagement = lazy(() => import('./pages/admin/UserManagement'));
const AdminAllProducts = lazy(() => import('./pages/admin/AllProducts'));
const AdminPlatformProducts = lazy(() => import('./pages/admin/PlatformProducts'));
const AdminShopProducts = lazy(() => import('./pages/admin/ShopProducts').then(m => ({ default: m.ShopProducts })));
const AdminShopOrders = lazy(() => import('./pages/admin/ShopOrders'));
const AdminTimeMachineManager = lazy(() => import('./pages/admin/TimeMachineManager'));
const AdminMediaLibrary = lazy(() => import('./pages/admin/MediaLibrary'));
const AdminArtGenerator = lazy(() => import('./pages/admin/ArtGenerator'));
const AdminBulkArtGenerator = lazy(() => import('./pages/admin/BulkArtGenerator'));
const AdminSketchArtGenerator = lazy(() => import('./pages/admin/SketchArtGenerator'));
const AdminLyricPosterGenerator = lazy(() => import('./pages/admin/LyricPosterGenerator'));
const AdminSockGenerator = lazy(() => import('./pages/admin/SockGenerator'));
const AdminTshirtGenerator = lazy(() => import('./pages/admin/TshirtGenerator'));
const AdminButtonGenerator = lazy(() => import('./pages/admin/ButtonGenerator'));
const AdminPhotoStylizer = lazy(() => import('./pages/admin/PhotoStylizer'));
const AdminSinglesImporter = lazy(() => import('./pages/admin/SinglesImporterPage'));
const AdminArtistStoriesGenerator = lazy(() => import('./pages/admin/ArtistStoriesGenerator'));
const AdminArtistSpotlights = lazy(() => import('./pages/admin/ArtistSpotlights'));
const AdminTop2000Importer = lazy(() => import('./pages/admin/Top2000Importer'));
const AdminMasterArtists = lazy(() => import('./pages/admin/MasterArtists'));
const AdminAlbumReviews = lazy(() => import('./pages/admin/AdminAlbumReviews'));
const AdminStudioStories = lazy(() => import('./pages/admin/StudioStoriesPage'));
const AdminOwnPodcasts = lazy(() => import('./pages/admin/OwnPodcasts'));
const AdminNewsRssManager = lazy(() => import('./pages/admin/NewsRssManager'));
const AdminCuratedArtists = lazy(() => import('./pages/admin/CuratedArtists'));
const AdminDiscogsLookup = lazy(() => import('./pages/admin/DiscogsLookup'));
const AdminDiscogsMessages = lazy(() => import('./pages/admin/AdminDiscogsMessages'));
const AdminPhotoModeration = lazy(() => import('./pages/admin/PhotoModeration'));
const AdminAutoComments = lazy(() => import('./pages/admin/AutoComments'));
const AdminMagicMikeProfile = lazy(() => import('./pages/admin/MagicMikeProfile'));
const AdminStatistics = lazy(() => import('./pages/admin/Statistics'));
const AdminAiCostMonitor = lazy(() => import('./pages/admin/AiCostMonitor'));
const AdminSEOMonitoring = lazy(() => import('./pages/admin/SEOMonitoring'));
const AdminSitemapManagement = lazy(() => import('./pages/admin/SitemapManagement'));
const AdminPriceHistory = lazy(() => import('./pages/admin/PriceHistoryAdmin'));
const AdminFixBlogSlugs = lazy(() => import('./pages/admin/FixBlogSlugs'));
const AdminFixProductTitles = lazy(() => import('./pages/admin/FixProductTitles'));
const AdminBulkCleanup = lazy(() => import('./pages/admin/BulkProductCleanup'));
const AdminAutoCleanupToday = lazy(() => import('./pages/admin/AutoCleanupToday'));
const AdminBackfillFanwalls = lazy(() => import('./pages/admin/BackfillArtistFanwalls'));
const AdminCreateFanwall = lazy(() => import('./pages/admin/CreateArtistFanwall'));
const AdminGenerateSeed = lazy(() => import('./pages/admin/GenerateSeed'));
const AdminBulkPosterUpload = lazy(() => import('./pages/admin/BulkPosterUpload'));
const AdminPopupManager = lazy(() => import('./pages/admin/PopupManager'));
const AdminRenderQueue = lazy(() => import('./pages/admin/RenderQueue'));
const AdminTikTokVideos = lazy(() => import('./pages/admin/TikTokVideoAdmin'));
const AdminMetricool = lazy(() => import('./pages/admin/MetricoolAdmin'));
const AdminFacebookAdmin = lazy(() => import('./pages/admin/FacebookAdmin'));
const AdminFacebookSync = lazy(() => import('./pages/admin/FacebookSync'));
const AdminInstagramAdmin = lazy(() => import('./pages/admin/InstagramAdmin'));
const AdminPromoCodes = lazy(() => import('./pages/admin/AdminPromoCodes'));
const AdminSEOKeywords = lazy(() => import('./pages/admin/SEOKeywords'));
const AdminYearOverview = lazy(() => import('./pages/admin/AdminYearOverview'));
const AdminRenderJobs = lazy(() => import('./pages/admin/RenderJobsPage'));
const AdminFacebookTestPost = lazy(() => import('./pages/admin/FacebookTestPost'));
const AdminTestAnecdote = lazy(() => import('./pages/admin/TestAnecdoteGeneration'));
const AdminChristmasImporter = lazy(() => import('./pages/admin/ChristmasImporter'));
const AdminChristmasImportLogs = lazy(() => import('./pages/admin/ChristmasImportLogs'));

const wrap = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: wrap(Home) },
      { path: 'auth', element: wrap(Auth) },
      { path: 'welkom', element: wrap(Welkom) },
      { path: 'auth/set-password', element: wrap(SetPassword) },
      { path: 'set-password', element: wrap(SetPassword) },
      { path: 'dashboard', element: wrap(Dashboard) },
      { path: 'settings', element: wrap(Settings) },
      { path: 'profile', element: wrap(Profile) },
      
      // Content
      { path: 'artists', element: wrap(Artists) },
      { path: 'artists/:slug', element: wrap(ArtistDetail) },
      { path: 'singles', element: wrap(Singles) },
      { path: 'singles/:slug', element: wrap(SingleDetail) },
      { path: 'muziek-verhaal/:slug', element: wrap(MuziekVerhaal) },
      { path: 'anekdotes', element: wrap(AnecdotesOverview) },
      { path: 'anekdotes/:slug', element: wrap(AnecdoteDetail) },
      { path: 'nieuws', element: wrap(Nieuws) },
      { path: 'nieuws/:slug', element: wrap(NewsPost) },
      { path: 'vandaag-in-de-muziekgeschiedenis', element: wrap(MusicHistory) },
      { path: 'verhalen', element: wrap(Verhalen) },
      { path: 'new-release/:slug', element: wrap(NewReleaseDetail) },
      { path: 'reviews', element: wrap(Reviews) },
      { path: 'reviews/:slug', element: wrap(ReviewDetail) },
      
      // Quiz
      { path: 'quizzen', element: wrap(QuizHub) },
      { path: 'quiz', element: wrap(Quiz) },
      { path: 'quiz/:category', element: wrap(CategoryQuiz) },
      { path: 'quiz-result', element: wrap(QuizResult) },
      { path: 'mijn-quizzen', element: wrap(MyQuizzes) },
      
      // Shop
      { path: 'shop', element: wrap(Shop) },
      { path: 'shop/posters', element: wrap(PosterShop) },
      { path: 'shop/canvas', element: wrap(CanvasShop) },
      { path: 'shop/tshirts', element: wrap(TshirtsShop) },
      { path: 'shop/sokken', element: wrap(SocksShop) },
      { path: 'shop/buttons', element: wrap(ButtonsShop) },
      { path: 'shop/art-prints', element: wrap(ArtShop) },
      { path: 'shop/merchandise', element: wrap(MerchandiseShop) },
      { path: 'product/:slug', element: <Navigate to="/shop/art-prints" replace /> },
      // Legacy redirects for old shop URLs
      { path: 'posters', element: <Navigate to="/shop/posters" replace /> },
      { path: 'canvas', element: <Navigate to="/shop/canvas" replace /> },
      { path: 'canvas-doeken', element: <Navigate to="/shop/canvas" replace /> },
      { path: 'tshirts', element: <Navigate to="/shop/tshirts" replace /> },
      { path: 'buttons', element: <Navigate to="/shop/buttons" replace /> },
      { path: 'art-prints', element: <Navigate to="/shop/art-prints" replace /> },
      { path: 'art-shop', element: <Navigate to="/shop/art-prints" replace /> },
      { path: 'merchandise', element: <Navigate to="/shop/merchandise" replace /> },
      { path: 'sokken', element: <Navigate to="/shop/sokken" replace /> },
      { path: 'shop/:slug', element: wrap(ShopOrProductRouter) },
      { path: 'order-success', element: wrap(OrderSuccess) },
      { path: 'track-order', element: wrap(TrackOrder) },
      { path: 'marketplace', element: wrap(MarketplaceOverview) },
      { path: 'marketplace/:slug', element: wrap(Marketplace) },
      { path: 'mijn-winkel', element: wrap(MyShop) },
      { path: 'winkels', element: wrap(PublicShopsOverview) },
      { path: 'winkel/:slug', element: wrap(PublicShop) },
      { path: 'catalogus', element: wrap(PublicCatalog) },
      
      // Hubs
      { path: 'nederland', element: wrap(NederlandseMuziek) },
      { path: 'nederland/decennium/:decade', element: wrap(NLMuziekDecennium) },
      { path: 'nederland/feit/:slug', element: wrap(NLMuziekFeitDetail) },
      { path: 'frankrijk', element: wrap(FranseMuziek) },
      { path: 'dance-house', element: wrap(DanceHouseMuziek) },
      { path: 'dance-house/feit/:slug', element: wrap(DanceHouseFeitDetail) },
      { path: 'filmmuziek', element: wrap(Filmmuziek) },
      { path: 'filmmuziek/feit/:slug', element: wrap(FilmmuziekFeitDetail) },
      
      // Collection & Scan
      { path: 'collection-overview', element: wrap(CollectionOverview) },
      { path: 'mijn-collectie', element: wrap(MyCollection) },
      { path: 'my-collection', element: <Navigate to="/mijn-collectie" replace /> },
      { path: 'collection/:id', element: wrap(CollectionItemPage) },
      { path: 'scan', element: wrap(Scan) },
      { path: 'ai-scan-v2', element: wrap(AIScanV2) },
      { path: 'ai-scan-v2-overview', element: wrap(AIScanV2Overview) },
      { path: 'unified-scanner', element: wrap(UnifiedScanner) },
      { path: 'unified-scan-overview', element: wrap(UnifiedScanOverview) },
      { path: 'quick-price-check', element: wrap(QuickPriceCheck) },
      
      // Community
      { path: 'community', element: wrap(Community) },
      { path: 'chat', element: wrap(Chat) },
      { path: 'collection-chat', element: wrap(CollectionChat) },
      { path: 'forum', element: wrap(Forum) },
      { path: 'forum/:slug', element: wrap(ForumTopic) },
      { path: 'social', element: wrap(Social) },
      { path: 'fan-wall', element: wrap(FanWall) },
      { path: 'fan-wall/:slug', element: wrap(ArtistFanWall) },
      { path: 'fanwall', element: <Navigate to="/fan-wall" replace /> },
      { path: 'fanwall/:slug', element: <FanwallSlugRedirect /> },
      { path: 'fan-wall-overview', element: wrap(ArtistFanWallOverview) },
      { path: 'upload-photo', element: wrap(UploadPhoto) },
      { path: 'mijn-fotos', element: wrap(MyPhotos) },
      { path: 'photo/:id', element: wrap(PhotoDetail) },
      { path: 'liked-photos', element: wrap(LikedPhotos) },
      { path: 'prestaties', element: wrap(Prestaties) },
      
      // Music features
      { path: 'releases', element: wrap(Releases) },
      { path: 'releases/:id', element: wrap(ReleaseDetail) },
      { path: 'album/:slug', element: wrap(AlbumDetail) },
      { path: 'echo', element: wrap(Echo) },
      { path: 'podcasts', element: wrap(Podcasts) },
      { path: 'podcasts/:slug', element: wrap(PodcastDetail) },
      { path: 'tijdmachine', element: wrap(TimeMachine) },
      { path: 'tijdmachine/:slug', element: wrap(TimeMachineStory) },
      { path: 'de-plaat-en-het-verhaal', element: wrap(DePlaatEnHetVerhaal) },
      { path: 'plaatverhaal/:slug', element: wrap(PlaatVerhaal) },
      { path: 'muzieknieuws', element: wrap(MusicNews) },
      { path: 'maand/:month', element: wrap(MonthOverview) },
      { path: 'jaar/:year', element: wrap(YearOverview) },
      { path: 'top-2000-analyse', element: wrap(Top2000Analyse) },
      { path: 'youtube-discoveries', element: wrap(YouTubeDiscoveries) },
      { path: 'kerst', element: wrap(Christmas) },
      { path: 'studio-stories', element: wrap(StudioStories) },
      { path: 'studio-stories/:slug', element: wrap(StudioStoryDetail) },
      { path: 'artist-spotlights', element: wrap(ArtistSpotlights) },
      { path: 'artist-spotlight/:slug', element: wrap(ArtistSpotlight) },
      
      // Tools
      { path: 'slimme-tools', element: wrap(AIFeaturesPage) },
      { path: 'mijn-discogs', element: wrap(MijnDiscogs) },
      { path: 'discogs-messages', element: wrap(DiscogsMessages) },
      { path: 'spotify-profile', element: wrap(SpotifyProfile) },
      { path: 'spotify-callback', element: wrap(SpotifyCallback) },
      { path: 'public-collection/:userId', element: wrap(PublicCollection) },
      
      // Info
      { path: 'privacy', element: wrap(Privacy) },
      { path: 'voorwaarden', element: wrap(Voorwaarden) },
      { path: 'retourbeleid', element: wrap(ReturnPolicy) },
      { path: 'over-ons', element: wrap(About) },
      { path: 'pricing', element: wrap(Pricing) },
      
      // Admin — noindex layout prevents search engines from indexing admin pages
      {
        path: 'admin',
        element: <AdminNoIndex />,
        children: [
          { index: true, element: wrap(AdminMainAdmin) },
          { path: 'dashboard', element: wrap(SuperAdminDashboard) },
          { path: 'status', element: wrap(AdminStatusDashboard) },
          { path: 'system-overview', element: wrap(AdminSystemOverview) },
          { path: 'cronjob-monitor', element: wrap(AdminCronjobMonitor) },
          { path: 'email-notifications', element: wrap(AdminEmailNotifications) },
          { path: 'users', element: wrap(AdminUserManagement) },
          { path: 'products', element: wrap(AdminAllProducts) },
          { path: 'platform-products', element: wrap(AdminPlatformProducts) },
          { path: 'shop-products', element: wrap(AdminShopProducts) },
          { path: 'shop-orders', element: wrap(AdminShopOrders) },
          { path: 'time-machine', element: wrap(AdminTimeMachineManager) },
          { path: 'media-library', element: wrap(AdminMediaLibrary) },
          { path: 'art-generator', element: wrap(AdminArtGenerator) },
          { path: 'bulk-art-generator', element: wrap(AdminBulkArtGenerator) },
          { path: 'sketch-art-generator', element: wrap(AdminSketchArtGenerator) },
          { path: 'lyric-poster-generator', element: wrap(AdminLyricPosterGenerator) },
          { path: 'sock-generator', element: wrap(AdminSockGenerator) },
          { path: 'tshirt-generator', element: wrap(AdminTshirtGenerator) },
          { path: 'button-generator', element: wrap(AdminButtonGenerator) },
          { path: 'photo-stylizer', element: wrap(AdminPhotoStylizer) },
          { path: 'singles-importer', element: wrap(AdminSinglesImporter) },
          { path: 'artist-stories-generator', element: wrap(AdminArtistStoriesGenerator) },
          { path: 'artist-spotlights', element: wrap(AdminArtistSpotlights) },
          { path: 'top2000-importer', element: wrap(AdminTop2000Importer) },
          { path: 'master-artists', element: wrap(AdminMasterArtists) },
          { path: 'album-reviews', element: wrap(AdminAlbumReviews) },
          { path: 'studio-stories', element: wrap(AdminStudioStories) },
          { path: 'own-podcasts', element: wrap(AdminOwnPodcasts) },
          { path: 'news-rss-manager', element: wrap(AdminNewsRssManager) },
          { path: 'curated-artists', element: wrap(AdminCuratedArtists) },
          { path: 'discogs-lookup', element: wrap(AdminDiscogsLookup) },
          { path: 'discogs-messages', element: wrap(AdminDiscogsMessages) },
          { path: 'photo-moderation', element: wrap(AdminPhotoModeration) },
          { path: 'auto-comments', element: wrap(AdminAutoComments) },
          { path: 'magic-mike', element: wrap(AdminMagicMikeProfile) },
          { path: 'statistics', element: wrap(AdminStatistics) },
          { path: 'ai-costs', element: wrap(AdminAiCostMonitor) },
          { path: 'seo-monitoring', element: wrap(AdminSEOMonitoring) },
          { path: 'sitemap-management', element: wrap(AdminSitemapManagement) },
          { path: 'price-history', element: wrap(AdminPriceHistory) },
          { path: 'fix-blog-slugs', element: wrap(AdminFixBlogSlugs) },
          { path: 'fix-product-titles', element: wrap(AdminFixProductTitles) },
          { path: 'bulk-cleanup', element: wrap(AdminBulkCleanup) },
          { path: 'auto-cleanup-today', element: wrap(AdminAutoCleanupToday) },
          { path: 'backfill-artist-fanwalls', element: wrap(AdminBackfillFanwalls) },
          { path: 'create-artist-fanwall', element: wrap(AdminCreateFanwall) },
          { path: 'generate-seed', element: wrap(AdminGenerateSeed) },
          { path: 'bulk-poster-upload', element: wrap(AdminBulkPosterUpload) },
          { path: 'popups', element: wrap(AdminPopupManager) },
          { path: 'render-queue', element: wrap(AdminRenderQueue) },
          { path: 'tiktok-videos', element: wrap(AdminTikTokVideos) },
          { path: 'metricool', element: wrap(AdminMetricool) },
          { path: 'facebook-admin', element: wrap(AdminFacebookAdmin) },
          { path: 'facebook-sync', element: wrap(AdminFacebookSync) },
          { path: 'instagram-admin', element: wrap(AdminInstagramAdmin) },
          { path: 'promo-codes', element: wrap(AdminPromoCodes) },
          { path: 'seo-keywords', element: wrap(AdminSEOKeywords) },
          { path: 'year-overview', element: wrap(AdminYearOverview) },
          { path: 'render-jobs', element: wrap(AdminRenderJobs) },
          { path: 'facebook-test-post', element: wrap(AdminFacebookTestPost) },
          { path: 'test/anecdote', element: wrap(AdminTestAnecdote) },
          { path: 'christmas-importer', element: wrap(AdminChristmasImporter) },
          { path: 'christmas-import-logs', element: wrap(AdminChristmasImportLogs) },
        ],
      },
      
      // Catch-all
      { path: '*', element: wrap(NotFound) },
    ],
  },
]);
