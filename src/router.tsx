import React, { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { PageLoader } from './components/shared/page-loader';

// Lazy-load pages
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
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
const AdminPages = lazy(() => import('./pages/admin/BulkArtGenerator'));

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
      { path: 'product/:slug', element: wrap(PlatformProductDetail) },
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
      { path: 'plaat-verhaal/:slug', element: wrap(PlaatVerhaal) },
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
      
      // Admin
      { path: 'admin', element: wrap(SuperAdminDashboard) },
      
      // Catch-all
      { path: '*', element: wrap(NotFound) },
    ],
  },
]);
