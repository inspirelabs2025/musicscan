

## Problem

The dashboard "Scan Credits" card has a massively oversized iDEAL payment icon that dominates the card, pushing everything out of proportion. The payment method SVGs (especially iDEAL) lack proper sizing constraints -- they have `viewBox="0 0 60 40"` but no `width`/`height` attributes, so the `h-6` Tailwind class sets height but the SVG expands to fill available width.

## Solution

### 1. Fix payment icon sizing in `CreditsDisplay.tsx`
- Add explicit `w-auto` alongside height classes on all payment `<img>` tags so they maintain aspect ratio without expanding
- Reduce overall icon sizes slightly for a cleaner look: all icons `h-5` with `w-auto`

### 2. Fix all payment SVGs (5 files)
Add explicit `width` and `height` attributes to each SVG so they have intrinsic dimensions and don't blow up:
- `public/images/payment/ideal.svg` - add `width="60" height="40"`
- `public/images/payment/visa.svg` - add `width="60" height="40"` 
- `public/images/payment/mastercard.svg` - add `width="60" height="40"`
- `public/images/payment/paypal.svg` - add `width="60" height="40"`
- `public/images/payment/klarna.svg` - add `width="60" height="40"`

### 3. Tighten CreditsDisplay card layout
- Wrap payment icons row in a container with `max-w` constraint
- Ensure consistent small icon sizing: all `h-4 w-auto` with proper gap

### Files to edit
- `src/components/credits/CreditsDisplay.tsx` (lines 55-64): Fix img sizing classes
- `public/images/payment/ideal.svg`: Add width/height attributes
- `public/images/payment/visa.svg`: Add width/height attributes  
- `public/images/payment/mastercard.svg`: Add width/height attributes
- `public/images/payment/paypal.svg`: Add width/height attributes
- `public/images/payment/klarna.svg`: Add width/height attributes

