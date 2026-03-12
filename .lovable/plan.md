

## Problem

The Statistics page content overflows horizontally because the header row places the title, period buttons, select dropdown, and calendar picker all in a single `flex` row with `gap-6`. At 944px viewport with ~240px sidebar, only ~700px remains for content -- not enough for all elements in one row.

## Plan

### 1. Fix header layout in `Statistics.tsx` (lines 96-161)

- Stack the title and controls vertically instead of one long horizontal row
- Move period buttons, select, and calendar to a separate row below the title
- Use `flex-wrap` on the controls row so they wrap on smaller screens
- Reduce `gap-6` to `gap-3`

### 2. Add `min-w-0` to AdminLayout content area (line 19)

The `flex-1` child in the AdminLayout needs `min-w-0` to prevent flex children from overflowing. Change:
```
<div className="flex-1 flex flex-col overflow-auto w-full">
```
to:
```
<div className="flex-1 flex flex-col overflow-auto w-full min-w-0">
```

### 3. Constrain TrafficOverview cards

The `grid-cols-2 md:grid-cols-4` grid with 7 items causes uneven wrapping. Reduce to 3 columns max or ensure cards use `min-w-0` and truncate text.

These changes ensure all statistics content fits within the available space next to the sidebar at the user's 944px viewport.

