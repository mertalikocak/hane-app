# HANE APP — UI/UX, RESPONSIVE & ACCESSIBILITY AUDIT (`UX_PROBLEMS.md`)

> **Phase 1 Audit Deliverable**
> **Scope:** Comprehensive diagnosis of visual design inconsistencies, component fragmentation, mobile/tablet/desktop layout defects, responsive breakpoint failures, navigation friction, accessibility (WCAG 2.1 AA) violations, and PWA/mobile browser compatibility issues.

---

## 1. Design System & Visual Consistency Problems

### 1.1 Fragmented Color Palettes Across Modules (No Unified Semantic Tokens)
While `src/app/globals.css` defines a warm terracotta/earth palette (`--primary: #ea580c`, `--background: #fffaf5`, `--surface: #ffffff`), almost every module overrides it with hardcoded Tailwind color utilities:
- **Dashboard (`/`)**: Warm orange/slate mix with rainbow module cards.
- **Hane Takvim (`/calendar`)**: Indigo & Purple (`bg-indigo-600`, `from-indigo-600 to-purple-600`).
- **Hane Yemek (`/dinner`)**: Terracotta/Orange (`.primary-button` from `globals.css`).
- **Alışveriş (`/shopping`)**: Amber & Orange (`bg-amber-600`, `bg-orange-600`).
- **Hane Temizlik (`/cleaning`)**: Teal & Emerald (`bg-teal-600`, `bg-emerald-600`).
- **Dilek & İstek (`/wishlist`)**: Rose & Pink (`bg-rose-600`, `from-rose-500 to-pink-600`).
- **Düğün & Çeyiz (`/wedding`)**: Pink, Rose & Amber (`bg-pink-600`, `bg-amber-500`).
- **Hane Araç (`/cardolist`)**: Isolated CSS Module (`CarDo.module.css`) with Royal Blue (`#2563eb`) and `#f8fafc` slate backgrounds that completely ignore `globals.css` variables.
- **Hane Kalori (`/kalori`)**: Emerald & Green (`bg-emerald-600`, `text-emerald-500`).
- **Hane Fit (`/fit`)**: Emerald & Teal (`bg-emerald-600`).
- **Hane Gider (`/gider`)**: Dark-slate-assumed Neon Sky/Pink/Purple (`text-sky-400`, `text-pink-400`, `text-purple-300`, `bg-indigo-600`).

**UX Impact**: Navigating from `/dinner` to `/cardolist` to `/gider` feels like switching between three unrelated websites rather than using a cohesive product.

### 1.2 Broken Light Mode & Dark Mode Contrast
The app uses `@media (prefers-color-scheme: dark)` in `globals.css` without a manual theme toggle, and individual components make conflicting assumptions about the active background:
1. **Dark-Assumed Colors on Light Surfaces (`GiderV2` & `AyarlarModal`)**:
   - In `GiderV2KpiCards.tsx`, `GiderV2MahsuplasmaCard.tsx`, and `GiderV2CardList.tsx`, cards use `bg-[var(--surface)]` (which is pure white `#ffffff` in light mode) paired with `text-sky-400`, `text-pink-400`, `text-purple-300`, and `bg-white/5`. On a light-mode screen, `text-purple-300` and `bg-white/5` are nearly invisible (contrast ratio `< 1.8:1`).
2. **Light-Assumed Colors on Dark Surfaces (`MealForm.tsx`, `CarDoModule.tsx`, `WishlistView.tsx`)**:
   - `MealForm.tsx` uses hardcoded `bg-red-50 text-red-700` for errors and `bg-orange-50/50` for boxes without `dark:` variants, producing glaring white/pastel patches in dark mode.
   - `CarDo.module.css` hardcodes `--cardo-bg: #f8fafc` and `--cardo-card: #ffffff` with `@media (prefers-color-scheme: dark)` overrides that use a completely different dark slate (`#0f172a`) than the app shell's warm espresso dark mode (`#120f0d`).

### 1.3 Inconsistent Typography, Border Radii & Elevation
- **Border Radius Chaos**: Components mix `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-3xl` (24px), and `rounded-[28px]` on the same screen.
- **Page Headers**: Every module implements its own header layout from scratch—some use gradient banners (`Cleaning`, `Wedding`), some use compact toolbars (`Kalori`, `Gider`), and some use plain `h1` text (`Dinner`, `Fit`).

---

## 2. Component Fragmentation & Duplicate Implementations

### 2.1 Five Different Modal Patterns
Across 25+ modals in the repository, there is no shared `<Modal />` component:
1. **Portal vs. In-Tree**: `GiderV2Modals.tsx` uses `createPortal(..., document.body)`, whereas `CalendarEventModal`, `AddMealModal`, `WishlistModal`, and `MeasurementModal` render inline inside their parent containers (risking `z-index` and `overflow-hidden` clipping).
2. **Backdrop & Animation**: Backdrops vary between `bg-black/50`, `bg-black/60 backdrop-blur-sm`, `bg-slate-900/70`, and `bg-black/80`.
3. **Keyboard & Backdrop Dismissal**: Most modals do **not** close on `Escape` key press, do **not** lock body scroll (`overflow: hidden` on `document.body`), and do **not** trap keyboard focus.
4. **Native `window.confirm()` & `window.alert()` vs. Custom Dialogs**:
   - `GiderV2` and `FitDashboard` use custom styled confirmation modals.
   - `CalendarEventModal`, `CustomShoppingList`, `CleaningHistoryList`, `RoomStatusCards`, `WishlistView`, `WeddingPage`, `CarDoModule`, `MealSection`, `FitMeasurementsPage`, and `AyarlarModal` use blocking browser `window.confirm()` and `window.alert()`, which feel jarring on mobile PWAs and can be suppressed by mobile webviews.

### 2.2 Conflicting Duplicate Routes in Hane Fit (`/fit`)
- **Measurement Entry Conflict**:
  - Clicking **"+ Yeni Ölçüm"** on `/fit/dashboard` opens `MeasurementModal.tsx`, which explicitly states *"Sadece Tarih + Kilo yeterlidir"* (Neck & Waist are optional) and includes a second tab for **Kas Çevre Ölçümleri** (Chest, Arms, Thighs, etc.).
  - Navigating to `/fit/measurements/new` renders a standalone page that forces **Boyun (Neck)** and **Bel (Waist)** to be mandatory (`required`) and **completely lacks** the Muscle Measurements fields!
- **Measurement List Conflict**:
  - `/fit/dashboard` has rich expandable measurement cards with Edit button (`MeasurementModal`) and custom delete confirmation.
  - `/fit/measurements` has an older card list that **lacks an Edit button**, uses `window.confirm()`, and displays raw internal database IDs.
- **Profile Creation Conflict**:
  - `/fit/profiles` has an inline "Yeni Profil Ekle" form (where Last Name is optional and min height is `100` cm) right below a `"+ Yeni Profil Ekle"` button that navigates to `/fit/profiles/new` (where Last Name is required and min height is `80` cm).

---

## 3. Mobile, Tablet & Desktop Layout & Responsive Problems

### 3.1 Mobile Navigation & Chrome Deficiencies (`< 1024px`)
1. **Desktop `TopBar` is Completely Hidden on Mobile/Tablet (`hidden lg:flex`)**:
   - Mobile and tablet users lose immediate access to:
     - Active Profile indicator & switcher (`ProfileHeaderMenu`)
     - Cloud Sync status indicator (`CloudSyncIndicator`)
     - In-app Feedback (`Bulgular`) button
     - Settings gear button
   - To check if cloud sync is working or switch between Mert and Havsa on mobile, the user must open the full-screen hamburger menu and scroll to the bottom.
2. **No Mobile Bottom Navigation Bar**:
   - For a daily-use mobile PWA (logging calories, checking off groceries, adding expenses), forcing users to open a 11-item hamburger drawer for every module switch adds high interaction cost (2 taps + scroll).
3. **FAB (`QuickActionLauncher`) & Toast Collision at `bottom-6 right-6`**:
   - `QuickActionLauncher` is pinned at `fixed bottom-6 right-6 z-40`.
   - Toast notifications in `KaloriPage` and `EvGiderleriSayfasiV2` are also pinned at `fixed bottom-6 right-6 z-50`.
   - Furthermore, the FAB overlaps bottom action buttons, table rows, and delete buttons on mobile screens because `RootLayout` `<main>` has no extra bottom padding (`pb-24`) to clear the floating button.

### 3.2 Double Container Padding Squeezing Mobile Viewports
- `src/app/layout.tsx` wraps `{children}` inside:
  ```tsx
  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  ```
- Child pages (`WishlistView.tsx`, `KaloriPage.tsx`, `CarDoModule.tsx`, `DinnerHomePage` via `Container.tsx`) add a **second** wrapper with `px-4 py-6` or `p-4`.
- On a `375px` iPhone screen, `16px + 16px = 32px` per side (`64px` total) is lost before card padding even begins, leaving only `~311px` for content.

### 3.3 Module-Specific Mobile Breakpoint Failures
1. **Hane Takvim (`CalendarView.tsx`)**:
   - The 7-column month grid (`grid-cols-7`) renders cells with `min-h-[100px] sm:min-h-[120px]` on mobile. At `375px` width, each day column is `~44px` wide. Event titles inside `text-[10px] truncate` pills show only 3–4 characters, making the month view unreadable on phones without tapping every single day.
2. **Hane Kalori (`AddMealModal.tsx` & `CalorieHeader.tsx`)**:
   - `AddMealModal.tsx` packs 3 mode tabs, search inputs, macro badges, gram/unit selectors, and AI photo controls into a tall scrolling modal without sticky footer actions on small screens.
3. **Hane Gider (`GiderV2Header.tsx` & `TaksitProjeksiyonu.tsx`)**:
   - The 12-month installment projection matrix (`TaksitProjeksiyonu.tsx`) requires heavy horizontal scrolling without a sticky first column for card/installment names.
4. **Hane Fit (`src/app/fit/layout.tsx`)**:
   - The sub-navigation bar (`Özet & Grafikler`, `Ölçümler`, `Yeni Ölçüm`, `Profiller`) overflows horizontally on narrow screens (`320px–360px`) without clear scroll affordances.

### 3.4 Tablet (`768px–1023px`) Dead Zone
- Because the Sidebar breakpoint is `lg:` (`1024px`), iPads and tablets in portrait mode (`768px–1023px`) get the cramped mobile header instead of a collapsible icon rail, while single-column mobile stacks stretch unnaturally wide across `768px` before multi-column grids activate at `lg:`.

---

## 4. Usability & Core Workflow Friction

### 4.1 Startup Friction: `CloudConnectionGate` Resets on Every Reload
- In `CloudSyncProvider.tsx`, `isSkipped` is stored in ephemeral React state (`useState(false)`).
- If a user chooses **"Şimdilik Yerel Modda Devam Et"** (Local Mode without Firebase), refreshing the page or reopening the PWA on mobile immediately blocks the screen again with `CloudConnectionGate`.

### 4.2 Hardcoded `"Mert"` & `"Havsa"` vs. Dynamic `ProfileContext`
- While `ProfileContext` allows creating arbitrary household profiles, **Hane Gider** (`EvGiderleriSayfasiV2`, `Taksit`), **Düğün & Çeyiz** (`WeddingPage`), and the **Quick Action Gider Tab** hardcode `"mert"` and `"havsa"` in data models (`OdeyenKisi = 'mert' | 'havsa'`) and UI labels.
- While we **must not change the underlying storage schema or business logic** (`'mert' | 'havsa'`), the UI presentation and profile alignment need consistent visual badges so the user experience feels unified.

### 4.3 Missing Empty States & Loading Skeletons
- Several modules flash empty/zero values on initial client mount before `useEffect` hydrates from `localStorage`.
- When lists are empty (e.g., no recipes in `/dinner/meals`, no wishlist items matching a filter), empty states vary from plain unstyled text to dashed boxes without clear primary CTA buttons.

---

## 5. Accessibility (WCAG 2.1 AA) & Mobile Browser Compatibility Issues

1. **Viewport Zoom Disabled (`src/app/layout.tsx`) — CRITICAL WCAG VIOLATION**:
   - `layout.tsx` sets `maximumScale: 1, userScalable: false`.
   - This violates **WCAG 2.1 SC 1.4.4 (Resize Text)** and prevents visually impaired users from pinching to zoom on mobile browsers. (If the goal was preventing iOS Safari auto-zoom on input focus, setting input font-size to `>= 16px` (`text-base`) solves it without disabling pinch-to-zoom).
2. **Hover-Only Controls Inaccessible on Touch Devices**:
   - `CalendarView.tsx`: The `+` button inside calendar day cells uses `opacity-0 group-hover:opacity-100`.
   - `CustomShoppingList.tsx`, `RoomStatusCards.tsx`, `MealSection.tsx`: Delete/edit action icons rely on hover states or tiny tap targets (`< 32px x 32px`, below Apple/Android's `44x44px` minimum touch target guideline).
3. **Missing ARIA Roles, Labels & Keyboard Navigation**:
   - Icon-only buttons (close `×`, edit pencil, trash delete, month `<` `>` chevrons, settings gear) frequently lack `aria-label`.
   - Custom tabs (`AyarlarModal`, `QuickActionModal`, `ShoppingPage`, `AddMealModal`, `EvGiderleriSayfasiV2`) lack `role="tablist"`, `role="tab"`, and `aria-selected`.
   - Modals lack `role="dialog"`, `aria-modal="true"`, focus trapping, and `Escape` key listeners.
4. **PWA Manifest & Safe-Area Inset Issues on iOS/Android**:
   - Dual conflicting manifests (`public/manifest.json` with `#ea580c` vs `src/app/manifest.ts` with `#0f172a`).
   - Fixed bottom elements (`QuickActionLauncher`, mobile drawers, bottom modals) do not account for `env(safe-area-inset-bottom)` on notched iPhones/Android gesture bars.

