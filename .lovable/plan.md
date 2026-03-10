

## Plan: Create `openExternalPayment` utility and replace all Stripe `window.open` calls

### 1. Create `src/utils/externalPayment.ts`
New utility file with:
- `openExternalPayment(url: string)` function
- Checks `(window as any).Capacitor` to detect native app
- Native: dynamically imports `@capacitor/browser` and calls `Browser.open({ url })`
- Web: calls `window.open(url, '_blank')`

### 2. Replace `window.open` calls in 4 files

| File | Line | Current | New |
|------|------|---------|-----|
| `src/hooks/useSubscription.ts` | 64 | `window.open(data.url, '_blank')` | `openExternalPayment(data.url)` |
| `src/hooks/useSubscription.ts` | 84 | `window.open(data.url, '_blank')` | `openExternalPayment(data.url)` |
| `src/components/GuestCheckoutModal.tsx` | 63 | `window.open(data.url, '_blank')` | `openExternalPayment(data.url)` |
| `src/components/ShoppingCartWidget.tsx` | 33 | `window.open(result.url, '_blank')` | `openExternalPayment(result.url)` |
| `src/pages/Pricing.tsx` | 66 | `window.open(data.url, '_blank')` | `openExternalPayment(data.url)` |

Each call gets a `// External browser for app store compliance` comment. Each file gets the import added.

### Note on `@capacitor/browser`
The package isn't installed yet. We'll add it as a dependency. The dynamic import pattern ensures it won't break on web where Capacitor isn't present.

