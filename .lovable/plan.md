

## Problem

The Visa SVG has intrinsic dimensions of 1000x323px. With `h-3.5 w-auto`, the browser calculates width proportionally from the massive native size, causing it to overflow the card. The `w-auto` class is the culprit — it lets SVGs expand based on their native aspect ratio.

## Solution

### 1. Fix `CreditsDisplay.tsx` — constrain all payment icons with explicit max dimensions

Replace `w-auto` with explicit max-width constraints on every `<img>` tag. Use inline `style={{ maxHeight: '16px', maxWidth: '40px' }}` to guarantee no icon can ever exceed a small box, regardless of SVG intrinsic size.

```tsx
// Line 57-63: Replace the icon row with properly constrained images
<div className="flex items-center gap-2">
  <img src="/images/payment/ideal.svg" alt="iDEAL" style={{ height: '16px', width: 'auto', maxWidth: '40px' }} />
  <img src="/images/payment/visa.svg" alt="Visa" style={{ height: '14px', width: 'auto', maxWidth: '40px' }} />
  <img src="/images/payment/mastercard.svg" alt="Mastercard" style={{ height: '16px', width: 'auto', maxWidth: '40px' }} />
  <img src="/images/payment/paypal.svg" alt="PayPal" style={{ height: '14px', width: 'auto', maxWidth: '40px' }} />
  <img src="/images/payment/klarna.svg" alt="Klarna" style={{ height: '14px', width: 'auto', maxWidth: '40px' }} />
</div>
```

### 2. Add `overflow-hidden` to the payment icons container

As a safety net, add `overflow-hidden` to the flex container wrapping the icons so nothing can ever bleed out of the card.

### Files to edit
- `src/components/credits/CreditsDisplay.tsx` (lines 55-64)

