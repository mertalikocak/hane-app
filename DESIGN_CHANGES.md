# Hane App — Complete UI/UX Redesign Changelog (`DESIGN_CHANGES.md`)

## 1. Visual Identity & Design System Foundations
- **Light-First Warm Household Palette (`src/app/globals.css`)**:
  - Replaced the legacy dark slate/neon theme (`#090d16` / `#0a0d14`) with a warm, modern light palette:
    - **Warm Cream Backgrounds:** `--background: #F5F0E8`, `--background-subtle: #EFE8DC`
    - **Pure White & Raised Surfaces:** `--surface: #FFFFFF`, `--surface-raised: #FAF7F2`, `--surface-lavender: #F4EFF9`
    - **Brand Purple & Soft Lavender:** `--primary: #76548F`, `--primary-hover: #63437A`, `--accent: #E8DDF1`, `--border-lavender: #D5C3E4`
    - **Dark Plum Typography:** `--foreground: #30263A`, `--foreground-secondary: #544663`, `--muted: #736582`
    - **Accessible Semantic Tokens:** `--success` (`#2A7B56`), `--warning` (`#B86B19`), `--danger` (`#C23B3B`), `--info` (`#4A6FA5`) with matching `-bg` and `-border` tokens.
- **Typography & Component Primitives (`src/app/layout.tsx`, `src/app/globals.css`)**:
  - Configured `Inter` (`latin`, `latin-ext`) with `tabular-nums` on all financial, calorie, and measurement metrics.
  - Standardized component classes in `@layer components`: `.field`, `.primary-button`, `.secondary-button`, `.accent-button`, `.ghost-button`, `.danger-button`, `.icon-button`, `.ds-card`, `.ds-card-interactive`, `.ds-card-lavender`, `.ds-card-recessed`, and `.ds-badge` variants.
- **Unified Iconography & Layout Components (`src/components/ui/Icons.tsx`, `PageHeader.tsx`, `Container.tsx`)**:
  - Replaced inconsistent emoji headers and ad-hoc SVGs with clean Lucide-style stroke icons (`Icons.tsx`) supporting `size` props and module icon mapping (`ModuleLucideIcon`).
  - Standardized all screen headers around `PageHeader` with consistent icon badges, subtitles, and action toolbars.

---

## 2. Application Shell, Navigation & Global Modals
- **Navigation Shell (`Sidebar.tsx`, `TopBar.tsx`, `SidebarOrderModal.tsx`)**:
  - Desktop fixed sidebar (`w-64`) with soft lavender active states, subtle borders, and sub-route indicators.
  - Sticky desktop `TopBar` with personalized greeting, date display, Settings trigger, Quick Action (`Ctrl+K`) button, and `ProfileHeaderMenu`.
  - Mobile sticky header with safe-area top inset, quick-add button, profile switcher, and slide-over navigation drawer.
- **Global Modals (`QuickActionLauncher.tsx`, `QuickActionModal.tsx`, `AyarlarModal.tsx`, `GlobalProfileModal.tsx`, `CloudConnectionGate.tsx`)**:
  - Unified modal backdrop (`bg-[#30263A]/45 backdrop-blur-[2px]`) and elevated white dialog surfaces (`rounded-[18px]`).
  - Replaced blocking browser `window.confirm` and `window.alert` dialogs with inline two-step confirmation buttons and inline status banners.
  - Added safe-area bottom/right offsets to the floating `QuickActionLauncher` FAB.

---

## 3. Screen-by-Screen Redesign Summary

1. **Main Dashboard (`src/app/page.tsx`)**:
   - Redesigned into a structured 4-tier hierarchy: Personalized Welcome + Quick Actions bar, 4-column Primary Household KPI row (Gider, Dinner, Kalori, Cleaning), 3-column Daily Operations row (Shopping/Tasks, Upcoming Calendar Events, Household Goals Summary), and customizable Module Cards grid.
2. **Hane Dinner (`src/app/dinner/*`, `src/components/dinner/*`)**:
   - Redesigned `TodayMealBanner` in soft lavender (`ds-card-lavender`), 7-day `WeekPlan` cards with clear "Bugün" ring highlight, ingredient tooltips, `ShoppingList` check-off grid, and recipe catalog/forms (`MealForm`, `DeleteMealButton`, `MealReminderModal`).
3. **Hane Shopping (`src/app/shopping/page.tsx`, `src/components/shopping/*`)**:
   - Two-column layout pairing `CustomShoppingList` and `FoodShoppingSyncList` with unified progress bars, category badges, and `WhatsAppShareModal`.
4. **Hane Calendar (`src/app/calendar/page.tsx`, `src/components/calendar/*`)**:
   - Redesigned `TodayEventBanner`, monthly/weekly `CalendarView` grid, owner filter pills, `CalendarEventModal`, and `CalendarAiModal`.
5. **Hane Gider (`src/app/gider/page.tsx`, `src/components/gider/v2/*`, `src/components/gider/taksit/*`)**:
   - Redesigned both **Aylık Bütçe & Ekstre (V2)** and **Taksit Takibi** views: KPI summary cards, `GiderV2MahsuplasmaCard`, credit card groups, audit ledger table (`GiderV2LedgerTable`), 12-month installment projection (`TaksitProjeksiyonu`), and all 6 expense/installment modals.
6. **Hane Fit (`src/app/fit/*`, `src/components/fit/*`)**:
   - Unified `fit/layout.tsx` with `PageHeader`, profile switcher, pill sub-navigation, KPI stat cards, warm-palette `ProgressCharts`, measurement history table, and profile/measurement forms.
7. **Hane Kalori (`src/app/kalori/page.tsx`, `src/components/calorie/*`)**:
   - Redesigned `CalorieHeader`, `CalorieSummaryCards` (lavender main calorie card + 3 macro cards), 4-period `MealSection` cards with touch-accessible action buttons, and all 5 calorie/AI modals.
8. **Hane Wish List (`src/app/wishlist/page.tsx`, `src/components/wishlist/*`)**:
   - Redesigned `WishlistView` overview bar, responsive search/category filter, 3-column owner boards (`Hane Ortak`, `Mert`, `Melis`), and `WishlistModal`.
9. **Hane Cleaning (`src/app/cleaning/page.tsx`, `src/components/cleaning/*`)**:
   - Redesigned hygiene KPI cards, interactive `RoomStatusCards` with touch-visible delete actions, `QuickCleanModal`, `AddRoomModal`, `CleaningHistoryList`, and `CleaningReminderModal`.
10. **Hane Wedding (`src/app/wedding/page.tsx`, `src/components/wedding/*`)**:
    - Redesigned `WeddingOzetKartlari`, Gold/FX Kumbara widget (`KumbaraModal`), category/status filter tabs, high-contrast checklist rows, and `WeddingItemModal`.
11. **Hane Car (`src/components/cardolist/CarDo.module.css`, `CarDoModule.tsx`)**:
    - Mapped `--cardo-*` CSS Module variables to the Hane App design system, removed dark-mode overrides and loud gradients, added `PageHeader`, and added real-time event sync with `QuickActionModal`.
12. **PWA & Mobile Infrastructure (`CloudSyncProvider.tsx`, `ServiceWorkerRegister.tsx`, `public/sw.js`, `manifest.ts`, `public/manifest.json`)**:
    - Enabled full SSR pre-rendering of the App Shell, upgraded Service Worker to `hane-app-cache-v2` with cellular timeouts and valid `Response` fallbacks, fixed SW registration timing, and aligned PWA manifest colors to `#F5F0E8`.

