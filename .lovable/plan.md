

# Performance Audit & Speed Optimization Plan

## Key Issues Found

### 1. Render-Blocking Scripts in `<head>` (HIGH)
- **GTM script** (line 4 of `index.html`) is synchronous and render-blocking — it runs before anything paints.
- **PathSignals** inline script (lines 168-188) runs synchronously in `<head>`, creating `localStorage` calls and defining functions before the page renders.
- **GA4 config script** (lines 117-124) runs synchronously even though the gtag.js library is deferred.

### 2. Duplicate SEO/Meta Management (MEDIUM)
- `react-helmet` is used in 72+ pages, BUT there's also a custom `useSEO` hook that does the same thing via DOM manipulation. Both run simultaneously on every page, causing redundant work. Pick one and remove the other.

### 3. Heavy Dependencies in Main Bundle (HIGH)
- `@ffmpeg/ffmpeg` and `@huggingface/transformers` are in `manualChunks` — even though excluded from `optimizeDeps`, they still create separate chunks that the browser may preload/prefetch. These are massive libraries used only by admin/scanner features.
- `framer-motion` is used in 33 components but loaded as a vendor chunk even when visiting pages that don't use it. The homepage itself doesn't import it (except one unused `TimeMachineSpotlight`).

### 4. SubscriptionProvider on Every Page (MEDIUM)
- `SubscriptionProvider` wraps the entire app and calls a Supabase Edge Function on every page load, even for anonymous visitors on the homepage. This adds a blocking network request to every initial render.

### 5. Cache-Busting on Every Load (LOW-MEDIUM)
- `main.tsx` lines 11-18: Every page load deletes ALL caches (`caches.keys()` → `caches.delete()`), defeating the purpose of service worker caching. This contradicts registering a service worker on lines 2-9.

### 6. Continuous CSS Animations (LOW)
- Hero section has two large `Disc3` icons with `animate-vinyl-spin` (4s infinite rotation) and two `Sparkles` with `animate-pulse`. These cause constant GPU compositing on mobile.

### 7. `react-helmet` Library Choice (LOW)
- `react-helmet` is unmaintained. It synchronously manages `<head>` on every render. `react-helmet-async` is the maintained fork and is lighter.

---

## Implementation Plan

### Step 1: Defer all third-party scripts
**File: `index.html`**
- Move GTM to after `</body>` or wrap in `requestIdleCallback` like Meta Pixel already is.
- Move PathSignals script to end of `<body>` or defer it.
- Remove inline GA4 config script; merge it into the deferred gtag.js setup.

### Step 2: Remove duplicate SEO management
- Remove `react-helmet` dependency and all `<Helmet>` usage across 72+ files.
- Keep the custom `useSEO` hook (it's lighter, no extra library, already works).
- OR: keep `react-helmet` and remove `useSEO`. Pick one path.
- **Recommendation**: Keep `useSEO` — it's zero-dependency, already covers all meta tags.

### Step 3: Lazy-load SubscriptionProvider
**File: `src/providers.tsx`**
- Don't wrap the entire app in `SubscriptionProvider`. Instead, only load subscription data when user is authenticated and on relevant pages (dashboard, settings, scan).
- Make `useSubscription` lazy — skip the edge function call for anonymous users (it already returns a default `free` plan, but still runs the wrapper).

### Step 4: Fix cache-busting contradiction
**File: `src/main.tsx`**
- Remove the `caches.keys()` → `caches.delete()` block (lines 11-18). This destroys all offline caching. If cache-busting is needed for deployments, handle it via service worker versioning, not blanket deletion.

### Step 5: Reduce hero GPU cost
**File: `src/components/home/ScannerHero.tsx`**
- Add `will-change: transform` to spinning discs for GPU layer promotion.
- Or: replace continuous CSS animation with a static visual on mobile (use `prefers-reduced-motion` media query and a `md:` breakpoint).

### Step 6: Tree-shake framer-motion from homepage
- Verify homepage sections don't import framer-motion (currently clean except `TimeMachineSpotlight` which isn't rendered on homepage). No action needed unless it's re-added.

### Step 7: Split heavy vendor chunks
**File: `vite.config.ts`**
- Remove `@ffmpeg/ffmpeg`, `@ffmpeg/util`, `@huggingface/transformers` from `manualChunks`. They're already in `optimizeDeps.exclude` — let Vite handle them as dynamic imports naturally. Putting them in `manualChunks` forces them into named chunks.

---

## Expected Impact

| Change | Estimated Improvement |
|---|---|
| Defer GTM/PathSignals | -200-400ms FCP on mobile |
| Remove react-helmet overhead | -50-100ms per navigation |
| Lazy SubscriptionProvider | -100-300ms initial load (saves 1 API call) |
| Fix cache deletion | Better repeat-visit performance |
| Reduce hero animations | Lower CPU/GPU on mobile |
| Clean vendor chunks | Smaller initial JS parse |

**Total estimated improvement**: 400-800ms faster initial load on mobile.

