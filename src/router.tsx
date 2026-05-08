import React, { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';

// Retry wrapper for lazy imports — handles stale chunks after deploy
function lazyWithRetry(importFn: () => Promise<any>) {
  return lazy(() =>
    importFn().catch((error: any) => {
      // Only retry once per session per module
      const key = 'chunk_retry_' + importFn.toString().slice(0, 80);
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves, page reloads
      }
      throw error;
    })
  );
}

// Route-level error boundary for chunk load failures
class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route error:', error, info);
    if (error.message?.includes('dynamically imported module') || error.message?.includes('Failed to fetch')) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
          <p className="text-lg text-muted-foreground">Er ging iets mis bij het laden.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Pagina herladen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';

const FanwallSlugRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/fan-wall/${slug}`} replace />;
};

import { AdminLayout } from './components/admin/AdminLayout';

const AdminLayoutWrapper = () => (
  <AdminLayout>
    <Outlet />
  </AdminLayout>
);

import App from './App';
import { PageLoader } from './components/shared/page-loader';

// Lazy-load pages (with retry for chunk load failures after deploy)
const Home = lazyWithRetry(() => import('./pages/Home'));
const Auth = lazyWithRetry(() => import('./pages/Auth'));
const Welkom = lazyWithRetry(() => import('./pages/Welkom'));
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));
const Settings = lazyWithRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
// Shop verwijderd
const Artists = lazyWithRetry(() => import('./pages/Artists'));
const ArtistDetail = lazyWithRetry(() => import('./pages/ArtistDetail'));
const Singles = lazyWithRetry(() => import('./pages/Singles'));
const SingleDetail = lazyWithRetry(() => import('./pages/SingleDetail'));
const MuziekVerhaal = lazyWithRetry(() => import('./pages/MuziekVerhaal'));
const AnecdotesOverview = lazyWithRetry(() => import('./pages/AnecdotesOverview'));
const AnecdoteDetail = lazyWithRetry(() => import('./pages/AnecdoteDetail'));
const Nieuws = lazyWithRetry(() => import('./pages/Nieuws'));
const NewsPost = lazyWithRetry(() => import('./pages/NewsPost').then(m => ({ default: m.NewsPost })));
const MusicHistory = lazyWithRetry(() => import('./pages/MusicHistory'));
const Quiz = lazyWithRetry(() => import('./pages/Quiz'));
const QuizHub = lazyWithRetry(() => import('./pages/QuizHub'));
const QuizResult = lazyWithRetry(() => import('./pages/QuizResult'));
const CategoryQuiz = lazyWithRetry(() => import('./pages/CategoryQuiz'));
const MyQuizzes = lazyWithRetry(() => import('./pages/MyQuizzes'));
const CollectionOverview = lazyWithRetry(() => import('./pages/CollectionOverview'));
const AIAnalysis = lazyWithRetry(() => import('./pages/AIAnalysis'));
const MyCollection = lazyWithRetry(() => import('./pages/MyCollection'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const Scan = lazyWithRetry(() => import('./pages/Scan'));
const AIScanV2 = lazyWithRetry(() => import('./pages/AIScanV2'));
const AIScanV2Overview = lazyWithRetry(() => import('./pages/AIScanV2Overview'));
// Shop pagina's verwijderd
const NederlandseMuziek = lazyWithRetry(() => import('./pages/NederlandseMuziek'));
const FranseMuziek = lazyWithRetry(() => import('./pages/FranseMuziek'));
const DanceHouseMuziek = lazyWithRetry(() => import('./pages/DanceHouseMuziek'));
const NewReleaseDetail = lazyWithRetry(() => import('./pages/NewReleaseDetail'));
// Community page disabled — DB tables intact
const Chat = lazyWithRetry(() => import('./pages/chat'));
const Privacy = lazyWithRetry(() => import('./pages/Privacy'));
const AccountVerwijderen = lazyWithRetry(() => import('./pages/AccountVerwijderen'));
const Voorwaarden = lazyWithRetry(() => import('./pages/Voorwaarden'));
const ReturnPolicy = lazyWithRetry(() => import('./pages/ReturnPolicy'));
const About = lazyWithRetry(() => import('./pages/About'));
const Pricing = lazyWithRetry(() => import('./pages/Pricing'));
const Verhalen = lazyWithRetry(() => import('./pages/Verhalen'));
const Releases = lazyWithRetry(() => import('./pages/Releases'));
const ReleaseDetail = lazyWithRetry(() => import('./pages/ReleaseDetail'));
const AlbumDetail = lazyWithRetry(() => import('./pages/AlbumDetail'));
const SetPassword = lazyWithRetry(() => import('./pages/SetPassword'));
// Order tracking verwijderd
const PublicCollection = lazyWithRetry(() => import('./pages/PublicCollection'));
// Public catalog/shops/marketplace/my-shop verwijderd
const Forum = lazyWithRetry(() => import('./pages/Forum'));
const ForumTopic = lazyWithRetry(() => import('./pages/ForumTopic'));
const Echo = lazyWithRetry(() => import('./pages/Echo'));
const Podcasts = lazyWithRetry(() => import('./pages/Podcasts'));
const PodcastDetail = lazyWithRetry(() => import('./pages/PodcastDetail'));
const PodcastEpisodeDetail = lazyWithRetry(() => import('./pages/PodcastEpisodeDetail'));
const CollectionChat = lazyWithRetry(() => import('./pages/CollectionChat'));
const Prestaties = lazyWithRetry(() => import('./pages/Prestaties'));
const Social = lazyWithRetry(() => import('./pages/Social'));
const FanWall = lazyWithRetry(() => import('./pages/FanWall'));
const ArtistFanWall = lazyWithRetry(() => import('./pages/ArtistFanWall'));
const ArtistFanWallOverview = lazyWithRetry(() => import('./pages/ArtistFanWallOverview'));
const ArtistSpotlight = lazyWithRetry(() => import('./pages/ArtistSpotlight'));
const ArtistSpotlights = lazyWithRetry(() => import('./pages/ArtistSpotlights'));
const AIFeaturesPage = lazyWithRetry(() => import('./pages/AIFeaturesPage').then(m => ({ default: m.AIFeaturesPage })));
const Filmmuziek = lazyWithRetry(() => import('./pages/Filmmuziek'));
const StudioStories = lazyWithRetry(() => import('./pages/StudioStories'));
const StudioStoryDetail = lazyWithRetry(() => import('./pages/StudioStoryDetail'));
const TimeMachine = lazyWithRetry(() => import('./pages/TimeMachine'));
const TimeMachineStory = lazyWithRetry(() => import('./pages/TimeMachineStory'));
const MonthOverview = lazyWithRetry(() => import('./pages/MonthOverview'));
const YearOverview = lazyWithRetry(() => import('./pages/YearOverview'));
const UploadPhoto = lazyWithRetry(() => import('./pages/UploadPhoto'));
const MyPhotos = lazyWithRetry(() => import('./pages/MyPhotos'));
const PhotoDetail = lazyWithRetry(() => import('./pages/PhotoDetail'));
const LikedPhotos = lazyWithRetry(() => import('./pages/LikedPhotos'));
const Reviews = lazyWithRetry(() => import('./pages/Reviews'));
const ReviewDetail = lazyWithRetry(() => import('./pages/ReviewDetail'));
const Top2000Analyse = lazyWithRetry(() => import('./pages/Top2000Analyse'));
const YouTubeDiscoveries = lazyWithRetry(() => import('./pages/YouTubeDiscoveries'));
const Christmas = lazyWithRetry(() => import('./pages/Christmas'));
const MijnDiscogs = lazyWithRetry(() => import('./pages/MijnDiscogs'));
const DiscogsMessages = lazyWithRetry(() => import('./pages/DiscogsMessages'));
const SpotifyProfile = lazyWithRetry(() => import('./pages/SpotifyProfile'));
const SpotifyCallback = lazyWithRetry(() => import('./pages/SpotifyCallback'));
const DePlaatEnHetVerhaal = lazyWithRetry(() => import('./pages/DePlaatEnHetVerhaal'));
const PodcastVerhalen = lazyWithRetry(() => import('./pages/PodcastVerhalen'));
const PlaatVerhaal = lazyWithRetry(() => import('./pages/PlaatVerhaal').then(m => ({ default: m.PlaatVerhaal })));
const QuickPriceCheck = lazyWithRetry(() => import('./pages/QuickPriceCheck'));
// ShopOrProductRouter verwijderd
const UnifiedScanner = lazyWithRetry(() => import('./pages/UnifiedScanner'));
const UnifiedScanOverview = lazyWithRetry(() => import('./pages/UnifiedScanOverview'));
const NLMuziekDecennium = lazyWithRetry(() => import('./pages/NLMuziekDecennium'));
const NLMuziekFeitDetail = lazyWithRetry(() => import('./pages/NLMuziekFeitDetail'));
const DanceHouseFeitDetail = lazyWithRetry(() => import('./pages/DanceHouseFeitDetail'));
const FilmmuziekFeitDetail = lazyWithRetry(() => import('./pages/FilmmuziekFeitDetail'));
const MusicNews = lazyWithRetry(() => import('./pages/MusicNews'));

const CollectionItemPage = lazyWithRetry(() => import('./pages/CollectionItemPage'));


// Admin pages
const AdminMainAdmin = lazyWithRetry(() => import('./pages/admin/MainAdmin'));
const AdminStatusDashboard = lazyWithRetry(() => import('./pages/admin/StatusDashboard'));

const AdminRecentScans = lazyWithRetry(() => import('./pages/admin/RecentScans'));

const AdminEmailNotifications = lazyWithRetry(() => import('./pages/admin/EmailNotificationsPage'));
const AdminUserManagement = lazyWithRetry(() => import('./pages/admin/UserManagement'));
// Admin shop products/orders verwijderd
const AdminTimeMachineManager = lazyWithRetry(() => import('./pages/admin/TimeMachineManager'));
const AdminMediaLibrary = lazyWithRetry(() => import('./pages/admin/MediaLibrary'));
const AdminArtGenerator = lazyWithRetry(() => import('./pages/admin/ArtGenerator'));
const AdminBulkArtGenerator = lazyWithRetry(() => import('./pages/admin/BulkArtGenerator'));
const AdminSketchArtGenerator = lazyWithRetry(() => import('./pages/admin/SketchArtGenerator'));
// Admin product generators verwijderd
const AdminPhotoStylizer = lazyWithRetry(() => import('./pages/admin/PhotoStylizer'));
const AdminSinglesImporter = lazyWithRetry(() => import('./pages/admin/SinglesImporterPage'));
const AdminArtistStoriesGenerator = lazyWithRetry(() => import('./pages/admin/ArtistStoriesGenerator'));
const AdminArtistSpotlights = lazyWithRetry(() => import('./pages/admin/ArtistSpotlights'));
const AdminTop2000Importer = lazyWithRetry(() => import('./pages/admin/Top2000Importer'));
const AdminMasterArtists = lazyWithRetry(() => import('./pages/admin/MasterArtists'));
const AdminAlbumReviews = lazyWithRetry(() => import('./pages/admin/AdminAlbumReviews'));
const AdminStudioStories = lazyWithRetry(() => import('./pages/admin/StudioStoriesPage'));
const AdminOwnPodcasts = lazyWithRetry(() => import('./pages/admin/OwnPodcasts'));
const AdminNewsRssManager = lazyWithRetry(() => import('./pages/admin/NewsRssManager'));
const AdminCuratedArtists = lazyWithRetry(() => import('./pages/admin/CuratedArtists'));
const AdminDiscogsLookup = lazyWithRetry(() => import('./pages/admin/DiscogsLookup'));
const AdminDiscogsMessages = lazyWithRetry(() => import('./pages/admin/AdminDiscogsMessages'));
const AdminDiscogsBulkEmail = lazyWithRetry(() => import('./pages/admin/AdminDiscogsBulkEmail'));
const AdminPhotoModeration = lazyWithRetry(() => import('./pages/admin/PhotoModeration'));
const AdminAutoComments = lazyWithRetry(() => import('./pages/admin/AutoComments'));
const AdminMagicMikeProfile = lazyWithRetry(() => import('./pages/admin/MagicMikeProfile'));

const AdminSitemapManagement = lazyWithRetry(() => import('./pages/admin/SitemapManagement'));
const AdminPriceHistory = lazyWithRetry(() => import('./pages/admin/PriceHistoryAdmin'));
const AdminFixBlogSlugs = lazyWithRetry(() => import('./pages/admin/FixBlogSlugs'));
// Fix product titles verwijderd
const AdminBulkCleanup = lazyWithRetry(() => import('./pages/admin/BulkProductCleanup'));
const AdminAutoCleanupToday = lazyWithRetry(() => import('./pages/admin/AutoCleanupToday'));
const AdminBackfillFanwalls = lazyWithRetry(() => import('./pages/admin/BackfillArtistFanwalls'));
const AdminCreateFanwall = lazyWithRetry(() => import('./pages/admin/CreateArtistFanwall'));
const AdminGenerateSeed = lazyWithRetry(() => import('./pages/admin/GenerateSeed'));
// Bulk poster upload verwijderd
const AdminPopupManager = lazyWithRetry(() => import('./pages/admin/PopupManager'));
const AdminRenderQueue = lazyWithRetry(() => import('./pages/admin/RenderQueue'));
const AdminTikTokVideos = lazyWithRetry(() => import('./pages/admin/TikTokVideoAdmin'));
const AdminMetricool = lazyWithRetry(() => import('./pages/admin/MetricoolAdmin'));
const AdminFacebookAdmin = lazyWithRetry(() => import('./pages/admin/FacebookAdmin'));
const AdminFacebookSync = lazyWithRetry(() => import('./pages/admin/FacebookSync'));
const AdminInstagramAdmin = lazyWithRetry(() => import('./pages/admin/InstagramAdmin'));
const AdminPromoCodes = lazyWithRetry(() => import('./pages/admin/AdminPromoCodes'));
const AdminSEOKeywords = lazyWithRetry(() => import('./pages/admin/SEOKeywords'));

const AdminRenderJobs = lazyWithRetry(() => import('./pages/admin/RenderJobsPage'));
const AdminFacebookTestPost = lazyWithRetry(() => import('./pages/admin/FacebookTestPost'));
const AdminTestAnecdote = lazyWithRetry(() => import('./pages/admin/TestAnecdoteGeneration'));
const AdminChristmasImporter = lazyWithRetry(() => import('./pages/admin/ChristmasImporter'));
const AdminChristmasImportLogs = lazyWithRetry(() => import('./pages/admin/ChristmasImportLogs'));

const wrap = (Component: React.LazyExoticComponent<any>) => (
  <RouteErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </RouteErrorBoundary>
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
      { path: 'plaat-verhaal/:slug', element: wrap(PlaatVerhaal) },
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
      
      // Shop verwijderd — alle shop/product/cart/checkout/marktplaats routes uitgeschakeld
      
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
      { path: 'ai-analysis', element: wrap(AIAnalysis) },
      { path: 'mijn-collectie', element: wrap(MyCollection) },
      { path: 'my-collection', element: <Navigate to="/mijn-collectie" replace /> },
      { path: 'collection/:id', element: wrap(CollectionItemPage) },
      { path: 'scan', element: wrap(Scan) },
      { path: 'ai-scan-v2', element: wrap(AIScanV2) },
      { path: 'ai-scan-v2-overview', element: wrap(AIScanV2Overview) },
      { path: 'unified-scanner', element: wrap(UnifiedScanner) },
      { path: 'unified-scan-overview', element: wrap(UnifiedScanOverview) },
      { path: 'quick-price-check', element: wrap(QuickPriceCheck) },
      
      // Community page removed — section disabled in UI (DB intact)
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
      { path: 'podcasts/het-verhaal-achter-de-podcast', element: wrap(PodcastVerhalen) },
{ path: 'podcasts/:slug', element: wrap(PodcastDetail) },
{ path: 'podcast/:podcastSlug/:episodeSlug', element: wrap(PodcastEpisodeDetail) },
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
      { path: 'account-verwijderen', element: wrap(AccountVerwijderen) },
      { path: 'delete-account', element: <Navigate to="/account-verwijderen" replace /> },
      { path: 'voorwaarden', element: wrap(Voorwaarden) },
      { path: 'retourbeleid', element: wrap(ReturnPolicy) },
      { path: 'over-ons', element: wrap(About) },
      { path: 'pricing', element: wrap(Pricing) },
      
      // Admin — noindex layout prevents search engines from indexing admin pages
      {
        path: 'admin',
        element: <AdminLayoutWrapper />,
        children: [
          { index: true, element: wrap(AdminMainAdmin) },
          
          { path: 'status', element: wrap(AdminStatusDashboard) },
          
          { path: 'recent-scans', element: wrap(AdminRecentScans) },
          
          { path: 'email-notifications', element: wrap(AdminEmailNotifications) },
          { path: 'users', element: wrap(AdminUserManagement) },
          // Shop admin verwijderd
          { path: 'time-machine', element: wrap(AdminTimeMachineManager) },
          { path: 'media-library', element: wrap(AdminMediaLibrary) },
          { path: 'art-generator', element: wrap(AdminArtGenerator) },
          { path: 'bulk-art-generator', element: wrap(AdminBulkArtGenerator) },
          { path: 'sketch-art-generator', element: wrap(AdminSketchArtGenerator) },
          // Product generators verwijderd
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
          { path: 'discogs-bulk-email', element: wrap(AdminDiscogsBulkEmail) },
          { path: 'photo-moderation', element: wrap(AdminPhotoModeration) },
          { path: 'auto-comments', element: wrap(AdminAutoComments) },
          { path: 'magic-mike', element: wrap(AdminMagicMikeProfile) },
          
          { path: 'sitemap-management', element: wrap(AdminSitemapManagement) },
          { path: 'price-history', element: wrap(AdminPriceHistory) },
          { path: 'fix-blog-slugs', element: wrap(AdminFixBlogSlugs) },
          { path: 'bulk-cleanup', element: wrap(AdminBulkCleanup) },
          { path: 'auto-cleanup-today', element: wrap(AdminAutoCleanupToday) },
          { path: 'backfill-artist-fanwalls', element: wrap(AdminBackfillFanwalls) },
          { path: 'create-artist-fanwall', element: wrap(AdminCreateFanwall) },
          { path: 'generate-seed', element: wrap(AdminGenerateSeed) },
          
          { path: 'popups', element: wrap(AdminPopupManager) },
          { path: 'render-queue', element: wrap(AdminRenderQueue) },
          { path: 'tiktok-videos', element: wrap(AdminTikTokVideos) },
          { path: 'metricool', element: wrap(AdminMetricool) },
          { path: 'facebook-admin', element: wrap(AdminFacebookAdmin) },
          { path: 'facebook-sync', element: wrap(AdminFacebookSync) },
          { path: 'instagram-admin', element: wrap(AdminInstagramAdmin) },
          { path: 'promo-codes', element: wrap(AdminPromoCodes) },
          { path: 'seo-keywords', element: wrap(AdminSEOKeywords) },
          
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
