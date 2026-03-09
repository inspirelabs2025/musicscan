

## Complete Dashboard Redesign

The current dashboard is visually cluttered: too many sections stacked vertically, inconsistent card sizes, no visual hierarchy, and the screenshot shows mostly empty skeleton boxes with no clear structure. Time for a clean, modern dashboard with clear visual grouping.

### Design Concept

A clean, card-based dashboard with three distinct zones:

```text
┌─────────────────────────────────────────────────┐
│  Welcome Hero Bar (gradient, name + quick stats)│
├────────────────────┬────────────────────────────┤
│                    │                            │
│  MAIN CONTENT      │  SIDEBAR                  │
│  (2/3 width)       │  (1/3 width)              │
│                    │                            │
│  ┌──────────────┐  │  ┌────────────────────┐   │
│  │ Quick Actions│  │  │ Credits & Sub      │   │
│  │ (scan, quiz) │  │  │ (compact stack)    │   │
│  └──────────────┘  │  └────────────────────┘   │
│                    │                            │
│  ┌──────┬───────┐  │  ┌────────────────────┐   │
│  │Echo  │ Chat  │  │  │ Spotify Widget     │   │
│  └──────┴───────┘  │  └────────────────────┘   │
│                    │                            │
│  ┌──────┬───────┐  │  ┌────────────────────┐   │
│  │Quiz  │Insights│  │  │ Recent Activity    │   │
│  └──────┴───────┘  │  └────────────────────┘   │
│                    │                            │
│  ┌──────────────┐  │  ┌────────────────────┐   │
│  │ Music Story  │  │  │ Music Style        │   │
│  └──────────────┘  │  └────────────────────┘   │
│                    │                            │
├────────────────────┴────────────────────────────┤
│  Unified Content Feed (full width)              │
├─────────────────────────────────────────────────┤
│  Latest Albums (full width)                     │
└─────────────────────────────────────────────────┘
```

### Changes to `src/pages/Dashboard.tsx`

Complete rewrite of the layout structure:

1. **Welcome Hero** — A compact gradient banner (purple theme) with user name, 4 inline stats (collection size, value, scans, success rate), and primary CTA buttons. Replaces the separate header + quick actions + stats row (3 sections → 1).

2. **Two-column layout** (`lg:grid-cols-3`, main = `col-span-2`, sidebar = `col-span-1`):
   - **Main column**: Smart Tools widgets in 2×2 grid (Echo, Chat, Quiz, AIInsights), then MusicStory + AlbumOfTheDay + CollectionPersonality
   - **Sidebar**: Credits, Subscription, Spotify, Recent Activity, Music Style — stacked vertically

3. **Full-width sections below**: UnifiedContent feed, LatestAlbums, Quick Nav footer

4. **Remove clutter**: Drop duplicate section headers, redundant "Muziek Fun" / "Discover & Learn" labels. Let the cards speak for themselves.

5. **Consistent spacing**: `gap-4` everywhere, `space-y-6` between major zones.

### Key design decisions
- Hero uses `bg-gradient-to-r from-[hsl(271,81%,20%)] to-[hsl(271,81%,40%)]` (existing purple theme)
- Stats embedded in hero as small pill badges instead of separate StatCard row
- Sidebar keeps related utility widgets (credits, spotify, activity) out of the main flow
- All cards use standard `Card` component, no variant mixing
- Mobile: single column, sidebar stacks below main
- Container: `max-w-6xl mx-auto px-4 py-6`

### Files to edit
- **`src/pages/Dashboard.tsx`** — full layout rewrite (same components, new arrangement)
- **`src/components/StatCard.tsx`** — not used anymore in new layout (stats in hero), keep file but unused

