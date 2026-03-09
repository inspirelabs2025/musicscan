

## Problem

The dashboard has horizontal overflow issues - cards and grid items extend beyond the viewport edges, getting cut off on both left and right sides. This is visible in the screenshot where skeleton cards bleed off-screen.

## Root Cause

The container at line 92 has `maxWidth: 1280px` and `padding: 32px 24px`, but child grid elements (especially the 5-column grids like the AI widgets section at line 174 with `lg:grid-cols-4` containing 5 items) can overflow. Additionally, the outer wrapper at line 83 lacks overflow containment.

## Solution

1. **Add `overflow-x: hidden`** to the outer `min-h-screen` wrapper (line 83) to prevent horizontal scrollbar
2. **Add `overflow: hidden`** to the inner container (line 92) to clip any overflowing grid children  
3. **Fix the AI widgets grid** (line 174): There are 5 widgets (`EchoWidget`, `AIInsightsWidget`, `ChatWidget`, `QuizWidget`, `SpotifyWidget`) in a `lg:grid-cols-4` grid - the 5th item wraps awkwardly. Change to a responsive grid that accommodates all 5 items properly, or adjust column counts.

### Files to edit:
- **`src/pages/Dashboard.tsx`** (lines 83, 92, 174):
  - Line 83: Add `overflow-x-hidden` to the outer div
  - Line 92: Add `overflow: 'hidden'` to the inline styles
  - Line 174: Adjust grid columns to properly fit 5 widgets (e.g., `lg:grid-cols-5` or restructure to 4 items per row)

