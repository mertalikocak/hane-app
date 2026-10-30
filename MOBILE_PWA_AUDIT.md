# Hane App — Mobile UX, PWA & Cellular Black Screen Audit Report

## 1. Forensic Investigation: iPhone 11 Black Screen on Cellular Data (vs. Wi-Fi)

### Classification
**Hybrid Root Cause: Client Hydration Gate + Service Worker Fetch/Cache Defect + Legacy `#090d16` Dark Backdrop + Cellular Carrier Transport**

### Evidence Discovered in Codebase & Build Output
1. **Pre-Hydration Blank Screen Gate in `CloudSyncProvider.tsx` (`if (!isMounted) return null`)**:
   - In `src/components/navigation/CloudSyncProvider.tsx`, the provider wrapped the entire application (`<ProfileProvider>`, `<Sidebar>`, `<TopBar>`, and `{children}`) and returned `null` whenever `!isMounted`.
   - Inspection of the production build output (`.next/server/app/index.html`) confirmed that Next.js SSR emitted `<body ...><div hidden=""><!--$--><!--/$--></div><script ...>` — **zero visible HTML elements inside `<body>`**.
   - Furthermore, `CloudSyncProvider.tsx` statically imported `@/lib/firebase/syncService` (`firebase/app` + `firebase/firestore`), placing **> 1.05 MB of JavaScript** (including the 480 KB chunk `2tqi96o8x2anw.js`) on the critical path before React could hydrate and run `useEffect` (`setIsMounted(true)`).
   - **Why Wi-Fi worked while Cellular failed**: Over Wi-Fi, ~1.05 MB downloads in ~100ms, so `isMounted` flips to `true` almost immediately. Over cellular data (or high-latency/packet-loss mobile connections), the browser painted an empty `<body>` until all layout chunks finished downloading and executing. If any single chunk stalled or failed over cellular, `isMounted` remained `false` permanently.

2. **Fatal WebKit Service Worker Bug in `public/sw.js` (`event.respondWith` Resolving to `null` & No Cellular Timeout)**:
   - In `public/sw.js`:
     ```js
     return cached || (event.request.mode === 'navigate' ? caches.match('/') : null);
     ```
   - When a subresource request (such as `/_next/static/chunks/*.js`) failed or timed out over cellular data and was not yet in `CacheStorage`, `event.respondWith()` resolved to `null`. In iOS Safari WebKit, resolving `event.respondWith(null)` throws a fatal `TypeError: FetchEvent.respondWith received an error: Returned response is null`, aborting the script load and preventing React hydration.
   - Additionally, `fetch(event.request)` in `public/sw.js` had **no timeout**. On iOS, transitioning from Wi-Fi to Cellular or waking a standalone PWA on cellular frequently leaves dead TCP sockets that hang for 30–60 seconds before rejecting.
   - `public/sw.js` also used Network-First even for immutable hashed `/_next/static/` chunks and intercepted Next.js `_rsc` flight requests and `/api/*` routes.

3. **Legacy `#090d16` Black `background_color` & `theme_color` in PWA Manifests**:
   - Both `src/app/manifest.ts` and `public/manifest.json` still contained:
     ```json
     "background_color": "#090d16",
     "theme_color": "#090d16"
     ```
   - Combined with the pre-redesign `#090d16` body background and `CloudSyncProvider` returning `null`, any delay or failure before hydration rendered a **solid black screen (`#090d16`)**.

4. **Firestore WebChannel Transport on Mobile Carrier CGNAT / IPv6 (`src/lib/firebase/config.ts`)**:
   - `getFirestore(app)` uses gRPC-Web / WebChannel streaming by default, which frequently stalls or errors on mobile cellular carriers using CGNAT / IPv6 translation while working normally on home Wi-Fi.

5. **Private LAN IP Caveat (Unreproducible Hardware/Network Scenario)**:
   - If the iPhone 11 accessed a local development server via a private LAN IP (e.g. `http://192.168.1.x:3000`) while on Wi-Fi, switching to cellular data makes the private IP unreachable by definition, triggering the defective `public/sw.js` offline path above.

### Evidence-Based Fixes Applied
- **[`CloudSyncProvider.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/navigation/CloudSyncProvider.tsx)**: Removed the pre-hydration `if (!isMounted) return null` blocker and wrapped `localStorage` reads in `try/catch`. Verified in `.next/server/app/index.html` that Next.js now pre-renders the complete App Shell (`<aside>`, mobile top bar, `<main>`, and page layout) directly in the initial HTML response before any JS executes.
- **[`public/sw.js`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/public/sw.js)**: Bumped cache to `hane-app-cache-v2` (purging stale `v1` caches on activate), added `fetchWithTimeout` (4s for navigation, 8s for static assets), switched `/_next/static/` immutable assets to **Cache-First**, bypassed `/api/` and `?_rsc=` requests, and ensured `event.respondWith()` **never** resolves to `null` (always returns a valid `Response` or an inline Warm Cream `#F5F0E8` offline fallback page).
- **[`src/lib/firebase/config.ts`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/lib/firebase/config.ts)**: Configured `initializeFirestore(app, { experimentalAutoDetectLongPolling: true })` and guarded `localStorage` access in `try/catch`.
- **[`src/app/manifest.ts`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/app/manifest.ts) & [`public/manifest.json`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/public/manifest.json)**: Updated `background_color` and `theme_color` from `#090d16` to `#F5F0E8` (Warm Cream) and separated `"any"` and `"maskable"` icon entries.

---

## 2. 10-Point Mobile UX & PWA Audit Results

| # | Audit Area | Findings & Measurements | Fixes Applied & Status |
|---|---|---|---|
| **1** | **iPhone Safari Viewport (`414x896`, `390x844`, `375x667`)** | Tested with iOS 17.4 Safari UA. `100vh` on `body` can shift when Safari's address bar collapses; inputs with `font-size < 16px` trigger forced iOS viewport zoom. | Added `min-height: 100dvh` and `@media (max-width: 639px) { input, select, textarea { font-size: 16px !important; } }` in [`globals.css`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/app/globals.css). |
| **2** | **Android Chrome Viewport (`360x780`, `412x915`)** | Tested across all 15 routes at `360px` (Galaxy S23) and `412px` (Pixel 7). Zero runtime or console errors. | Cards, KPI grids, and action bars wrap cleanly down to `360px` width. |
| **3** | **Responsive Navigation** | Mobile top bar (`lg:hidden sticky top-0 z-40`) + off-canvas drawer (`aside`) + backdrop overlay. | Verified drawer open/close, active route indicator, and sub-route links (`/dinner/*`, `/fit/*`). |
| **4** | **Touch Target Sizes** | Automated CDP check flagged compact links (`16px–26px` height) in Dashboard card footers, Sidebar "Sırala" & sub-links, and Dinner "Hatırlatıcı"/"Yemek ekle". | Increased tap target heights (`min-h-[32px]` to `min-h-[36px]`) in [`Sidebar.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/navigation/Sidebar.tsx), [`page.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/app/page.tsx), [`TodayMealBanner.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/dinner/TodayMealBanner.tsx), and [`WeekPlan.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/dinner/WeekPlan.tsx). |
| **5** | **Safe Area Insets** | `viewportFit: "cover"` is enabled. Mobile header and sidebar drawer respect `env(safe-area-inset-top/bottom)`, but the fixed bottom-right FAB (`QuickActionLauncher`) used static `bottom-5 right-5`. | Updated [`QuickActionLauncher.tsx`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/quick-action/QuickActionLauncher.tsx) to use `bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px))` and `right: calc(1.25rem + env(safe-area-inset-right, 0px))`. |
| **6** | **Virtual Keyboard Behavior** | CDP audit detected 7 inputs/selects across `/fit/*`, `/kalori`, `/wishlist`, `/wedding`, and `/cardolist` with `font-size: 12px` or `14px` on mobile, causing iOS Safari auto-zoom when the virtual keyboard opens. | Enforced `16px` (`1rem`) minimum font size on mobile (`< 640px`) across all inputs/selects/textareas in [`globals.css`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/app/globals.css) and [`CarDo.module.css`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/components/cardolist/CarDo.module.css). All modals use `max-h-[90vh] overflow-y-auto`. |
| **7** | **Scroll & Overflow Problems** | Checked `document.documentElement.scrollWidth > clientWidth` across all 15 routes on `414px`, `390px`, and `360px` (45 route-viewport combinations). | **0 horizontal overflow issues** (`scrollWidth === clientWidth` on all 45 checks). Wide financial tables (`GiderV2LedgerTable`, `TaksitProjeksiyonu`) scroll horizontally within their own `overflow-x-auto` containers. |
| **8** | **PWA Installation & Launch** | Verified `/icon-192.png`, `/icon-512.png`, `/apple-touch-icon.png`, and `/logo.png` in `public/`. Fixed legacy `#090d16` splash screen colors in both manifest files. | [`manifest.ts`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/src/app/manifest.ts) and [`public/manifest.json`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/public/manifest.json) are now synchronized with `#F5F0E8` Warm Cream theme/background colors. |
| **9** | **Service Worker & Caching** | `ServiceWorkerRegister.tsx` registers `/sw.js` on window load. Previous `sw.js` (`v1`) used network-first for static chunks and could resolve `null` to `respondWith`. | Upgraded [`public/sw.js`](file:///c:/Users/MertAli/OneDrive/Desktop/Projeler/hane-app/public/sw.js) to `hane-app-cache-v2` with Cache-First for `/_next/static/*` and Network-First (4s timeout) for navigations. |
| **10** | **Offline & Poor Network Behavior** | Previously, hung cellular requests waited 60s+ and uncached subresources threw a WebKit `TypeError`. | With SSR pre-rendered HTML + 4s SW navigation timeout + styled Warm Cream offline fallback page + local-first `localStorage` persistence, the app remains usable offline and on poor cellular networks. |

