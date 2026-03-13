

## Problem Analysis

At 944px viewport, the admin sidebar takes 256px (16rem), leaving only **688px** for page content. Multiple issues cause overflow:

1. **AdminLayout `<main>` has `overflow: hidden`** -- clips content instead of allowing it to be visible or scroll
2. **Many admin pages use `container mx-auto`** which adds its own max-width/padding on top of the already constrained space
3. **Grid layouts assume wider viewports** -- e.g., `grid-cols-4`, `md:grid-cols-3` break at 688px
4. **Tab rows don't wrap** -- 8 tabs in a single row overflow at 688px
5. **Header controls on Statistics** are in one row with `gap-6`

## Plan

### 1. Fix AdminLayout overflow strategy
Change `<main>` from `overflow: hidden` to `overflow: visible` (or `overflow-x: auto`). The parent already handles scrolling. Hidden clips content silently -- the root cause of "nothing changes."

### 2. Replace `container mx-auto` on admin pages with simple padding
Across all admin pages that use `<AdminLayout>`, replace:
```
<div className="container mx-auto py-8 px-4">
```
with:
```
<div className="p-4 space-y-6 w-full min-w-0">
```
This applies to: `MainAdmin.tsx`, `CronjobMonitorPage.tsx`, `SEOMonitoring.tsx`, `EmailNotificationsPage.tsx`, `SEOKeywords.tsx`, `SinglesImporterPage.tsx`, and similar pages using `container mx-auto`.

### 3. Fix Statistics page specifically
- Stack title and controls vertically
- Ensure `TabsList` wraps with `flex flex-wrap`
- Reduce grid columns in `TrafficOverview` (max 3 on this width)
- Use `w-full min-w-0` on all container divs

### 4. Responsive grid adjustments for admin components
- `TrafficOverview`: `grid-cols-2 sm:grid-cols-3` (remove `lg:grid-cols-4`)
- `GrowthMetrics`: `grid-cols-2 sm:grid-cols-3` (remove `lg:grid-cols-5`)
- All admin card grids: cap at 3 columns max since content area is only 688px
- `TabsList` in `EmailNotificationsPage`: change from `grid-cols-6` to `flex flex-wrap`

### 5. Pages to update (all admin pages with container/grid issues)
- `AdminLayout.tsx` -- main overflow fix
- `Statistics.tsx` -- header + tabs
- `MainAdmin.tsx` -- container + grid
- `CronjobMonitorPage.tsx` -- container
- `SEOMonitoring.tsx` -- container + tabs
- `EmailNotificationsPage.tsx` -- grid-cols-6 tabs
- `SEOKeywords.tsx` -- container
- `SinglesImporterPage.tsx` -- container
- `TrafficOverview.tsx` -- grid columns
- `GrowthMetrics.tsx` -- grid columns

The key insight: previous fixes added `overflow: hidden` everywhere thinking it would prevent overflow -- but it just **hid** the overflow, making content unreadable. The correct fix is to make content actually fit within 688px by using responsive grids and removing fixed-width containers.

