

## Problem

The dashboard layout is messy: cards bleed off-screen (especially the left edge), the 5-column widget grid is too cramped, spacing is inconsistent, and the overall visual hierarchy feels cluttered.

## Root Cause

1. **5-column grid too tight**: At 1280px max-width with 24px padding, 5 widgets in `lg:grid-cols-5` with `gap-5` leaves ~230px per card — too narrow for content-rich widgets (buttons, text, stats). Content forces minimum widths, pushing the grid wider than the container.
2. **No `width: 100%`** on the inner container — with `maxWidth: 1280px` and `margin: 0 auto` but no explicit width, the container may not constrain properly in all contexts.
3. **Inconsistent section structure**: Some sections use `gap-8`, others `gap-6` or `gap-5`. The visual rhythm is broken.

## Solution — Clean, structured dashboard redesign

### 1. Fix container (`src/pages/Dashboard.tsx`, line 92)
- Add `width: '100%'` to the inline style to ensure proper centering
- Reduce `maxWidth` to `1200px` for tighter, more polished feel

### 2. Restructure the 5-widget grid (line 174)
Change from `lg:grid-cols-5` (too cramped) to a **3+2 layout**:
- Row 1: `lg:grid-cols-3` → EchoWidget, AIInsightsWidget, ChatWidget
- Row 2: `lg:grid-cols-2` → QuizWidget, SpotifyWidget (wider, more breathing room)

### 3. Standardize ALL section spacing
- All sections: `mb-12` (not mb-16, which is too much)
- All section headings: `mb-6`
- All grids: `gap-6` consistently
- Remove excessive `animate-fade-in delay-*` variations (keep subtle)

### 4. Tighten Quick Actions hero (lines 106-146)
- Reduce padding from `p-6` to `p-5`
- Reduce heading margin from `mb-5` to `mb-4`

### 5. Clean up cards consistency
- Stats section (line 160): keep `lg:grid-cols-4 gap-6` — fine for simple stat cards
- Credits section (line 149): keep `md:grid-cols-2 gap-6` (reduce from gap-8)
- Fun section (line 190): keep `lg:grid-cols-3 gap-6` (reduce from gap-8)
- Content section (line 203): keep `gap-6` (reduce from gap-8)

### Files to edit
- **`src/pages/Dashboard.tsx`** — all changes in one file:
  - Line 92: add `width: '100%'`, reduce maxWidth to `1200px`
  - Line 149: `gap-8` → `gap-6`
  - Lines 174-180: Split 5-column grid into 3+2 rows
  - All `mb-16` → `mb-12`, all `mb-8` → `mb-6`
  - Line 190: `gap-8` → `gap-6`
  - Line 203: `gap-8` → `gap-6`

