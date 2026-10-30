# HANE APP — COMPREHENSIVE UI/UX REDESIGN ROADMAP (`REDESIGN_ROADMAP.md`)

> **Phase 1 Audit Deliverable**
> **Objective:** Transform Hane App into a cohesive, modern, accessible, mobile-first household management suite **without altering any routes, `localStorage` keys, Firebase sync mechanics, or business logic**.

---

## 1. Redesign Vision & Core Principles

1. **100% Functional & Data Preservation**:
   - Zero changes to URL routes, `localStorage` keys, custom DOM events, Firebase `hane_vaults/main_data` sync, Gemini AI endpoints, or financial/body/calorie math.
2. **Unified "Warm Modern Household" Design System**:
   - Replace the 11 competing module color schemes and 3 CSS paradigms with a single semantic design token system in `src/app/globals.css`, featuring subtle module accent badges rather than jarring full-page theme shifts.
3. **True Mobile-First PWA Ergonomics**:
   - Introduce a persistent **Mobile Top Context Bar** (Active Profile + Cloud Sync status + Quick Search/Add) and a **Mobile Bottom Navigation Bar** (4 core slots + "Tüm Modüller" sheet) with `env(safe-area-inset-bottom)` support and zero FAB/Toast overlap.
4. **Shared UI Primitives (Zero External Bloat)**:
   - Build lightweight, accessible internal primitives (`Modal`, `ConfirmDialog`, `Toast`, `PageHeader`, `KpiCard`, `SegmentedTabs`, `EmptyState`, `Badge`) in `src/components/ui/` to replace the 25+ fragmented modals and native `window.confirm()` / `window.alert()` calls.
5. **First-Class Light & Dark Mode**:
   - Fix all hardcoded `text-sky-400` / `bg-white/5` / `bg-red-50` contrast failures and add a manual **Theme Switcher (`Sistem / Açık / Koyu`)** in the App Shell and Settings.

---

## 2. Unified Design System Architecture

### 2.1 Color Token System (`src/app/globals.css`)
All components will use semantic CSS variables that automatically adapt between **Light Mode** (Warm Alabaster & Crisp Slate) and **Dark Mode** (Deep Obsidian Slate):

| Token | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#F8FAFC` (Slate 50) | `#0B0F17` (Deep Slate) | App background canvas |
| `--bg-surface` | `#FFFFFF` (Pure White) | `#151C28` (Elevated Slate) | Primary cards, tables, modals |
| `--bg-surface-muted` | `#F1F5F9` (Slate 100) | `#1E293B` (Slate 800) | Secondary cards, input backgrounds, pill tracks |
| `--bg-surface-hover` | `#E2E8F0` (Slate 200/60) | `#263349` | Interactive row/card hover state |
| `--text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Headings, primary values, body text |
| `--text-secondary` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Subtitles, labels, metadata |
| `--text-muted` | `#64748B` (Slate 500) | `#64748B` (Slate 500) | Placeholders, disabled text |
| `--border-subtle` | `#E2E8F0` (Slate 200) | `#1E293B` (Slate 800) | Card & table dividers |
| `--border-strong` | `#CBD5E1` (Slate 300) | `#334155` (Slate 700) | Input borders, active outlines |
| `--brand-primary` | `#EA580C` (Orange 600) | `#F97316` (Orange 500) | Primary brand CTAs, active nav indicator |
| `--status-success` | `#16A34A` (Green 600) | `#22C55E` (Green 500) | Paid, Clean, Purchased, On-Budget |
| `--status-warning` | `#D97706` (Amber 600) | `#F59E0B` (Amber 500) | Approaching due date/cleaning, near limit |
| `--status-danger` | `#DC2626` (Red 600) | `#EF4444` (Red 500) | Overdue, Over-Budget, Delete actions |
| `--status-info` | `#2563EB` (Blue 600) | `#38BDF8` (Sky 400) | Informational badges, AI assistant accents |

- **Subtle Module Accents**: Each module retains a recognizable icon/badge tint (e.g., Emerald for Fit/Kalori, Indigo for Calendar, Rose for Wedding/Wishlist, Blue for CarDoList, Orange for Dinner/Gider), but **all buttons, cards, inputs, tables, and modals share the unified surface and typography tokens**.

### 2.2 Typography & Spacing Scale
- **Font Stack**: `Geist Sans` (Primary UI) & `Geist Mono` (Tabular financial figures, calories, weights, countdowns: `tabular-nums`).
- **Standardized Radius Scale**:
  - Cards & Sections: `rounded-2xl` (`16px`)
  - Modals & Drawers: `rounded-3xl` (`24px` desktop) / `rounded-t-3xl` (mobile bottom sheet)
  - Buttons & Inputs: `rounded-xl` (`12px`) with minimum height `h-11` (`44px` touch target)
  - Badges & Pills: `rounded-lg` (`8px`) or `rounded-full`
- **Single-Container Layout Rule**:
  - Remove redundant nested `max-w-* px-4 py-6` wrappers from child pages so `RootLayout` controls horizontal padding uniformly (`px-4 sm:px-6 lg:px-8`).

### 2.3 Core Reusable UI Primitives (`src/components/ui/`)
1. **`Modal.tsx`**: Portal-based accessible dialog (`role="dialog"`, `aria-modal="true"`, `Escape` to close, scroll-lock, focus management, responsive bottom-sheet on mobile / centered panel on desktop, sticky header & footer).
2. **`ConfirmDialog.tsx`**: Replaces all native `window.confirm()` calls across all 10 modules with a non-blocking, accessible confirmation modal.
3. **`ToastProvider.tsx`**: Unified toast notification system replaces native `window.alert()` and ad-hoc per-page toast divs, positioned safely above mobile bottom navigation (`bottom-20 lg:bottom-6`).
4. **`PageHeader.tsx`**: Standardized module header with icon badge, title, subtitle, and responsive primary/secondary action bar.
5. **`SegmentedTabs.tsx`**: Accessible tab bar (`role="tablist"`) with smooth active indicator and horizontal scroll snapping on mobile.
6. **`KpiCard.tsx`**: Unified metric card with label, tabular value, trend/status badge, optional progress bar, and high-contrast light/dark support.
7. **`EmptyState.tsx`**: Consistent illustration/icon, title, helper text, and primary CTA button when lists or filters return zero items.

---

## 3. App Shell, Navigation & Responsive Breakpoint Redesign

### 3.1 Responsive Navigation Architecture
- **Desktop (`>= 1024px` / `lg:`)**:
  - **Left Sidebar (`w-64` collapsible)**: Clean grouped navigation (*Günlük Yaşam*, *Finans & Planlama*, *Sağlık & Kişisel*) while still respecting the user's custom sort order (`hane_sidebar_order_v1`).
  - **Sticky TopBar (`h-16`)**: Date display, Quick Add (`Ctrl+K`), Bulgular badge, Theme toggle, Cloud Sync badge, Active Profile switcher, and Settings button.
- **Tablet (`768px–1023px` / `md:`)**:
  - Compact collapsible navigation rail (`w-20` icon rail expandable to drawer) + full TopBar so tablet users get desktop-class utility without wasting horizontal space.
- **Mobile (`< 768px`)**:
  - **Compact Sticky Top Header (`h-14`)**: Brand logo on left; **Cloud Sync dot**, **Active Profile Avatar Pill** (tap to switch profile immediately!), **Quick Add (`+`)**, and **Settings gear** on right. (Fixes the hidden `TopBar` problem on mobile!).
  - **Fixed Bottom Navigation Bar (`h-16` + `pb-safe`)**:
    - Displays the top 4 modules from the user's `hane_sidebar_order_v1` (defaulting to **Genel Bakış**, **Gider**, **Yemek**, **Alışveriş**) + a 5th **"Menü / Tümü"** tab that opens a clean bottom-sheet launcher with all 11 modules, custom ordering, and settings.
  - **Repositioned Quick Action FAB**:
    - On mobile, integrated cleanly into the Top Header / Bottom Bar or positioned at `bottom-20 right-4` so it never collides with bottom content or toasts.

### 3.2 Eliminating Startup & Configuration Friction
- **Persist Local-Mode Skip**: Store `CloudConnectionGate`'s "Şimdilik Yerel Modda Devam Et" choice in `localStorage` (`hane_cloud_gate_skipped = "true"`) so local-only users are not blocked on every page refresh, while keeping the "Bulut Kapalı" indicator clickable in the header whenever they want to connect Firebase.
- **Restore Firebase Snippet Paste Parser**: Port the regex snippet parser (`parseConfigSnippet`) from the orphaned `FirebaseSetupModal.tsx` into `AyarlarModal.tsx`'s **Bulut** tab so users can either paste their raw Firebase `const firebaseConfig = {...}` block in one click OR edit the 6 individual fields.

---

## 4. Module-by-Module UI/UX Redesign Specifications

### 4.1 Genel Bakış — Dashboard (`/`)
- **Redesign**:
  - Replace the visually noisy rainbow cards with a clean **Bento Grid** using `KpiCard` and unified surface tokens.
  - Add a prominent **"Bugün Özeti" (Today's Focus)** hero strip combining Tonight's Dinner, Today's Calendar Events, Overdue Cleaning Rooms, and Urgent Card Due Dates.
  - Standardize module summary cards with consistent typography, tabular numbers, and 1-click deep links.

### 4.2 Hane Takvim (`/calendar`)
- **Redesign**:
  - **Responsive Mobile Calendar**: On mobile (`< 640px`), render compact day cells with color dots (`•`) for events instead of truncated 3-letter pills, paired with an interactive **"Seçili Gün Etkinlikleri" (Selected Day Agenda)** list immediately below the month grid. On desktop (`>= 768px`), show a side-by-side split view (Month Grid on left + Selected Day Agenda & Special Day Countdowns on right).
  - Make the `+` add-event button always accessible in the Selected Day panel on touch devices (fixing the hover-only bug).
  - Upgrade `CalendarEventModal` and `CalendarAiModal` to use the unified `Modal` primitive.

### 4.3 Hane Yemek (`/dinner`, `/dinner/meals`, `/dinner/meals/new`, `/dinner/meals/[id]/edit`)
- **Redesign**:
  - Unify `/dinner` and `/dinner/meals` under a consistent `PageHeader` with clear segmented navigation (*Haftalık Plan* vs. *Yemek Tarifleri*).
  - Redesign `WeekPlan.tsx` day cards with clear visual hierarchy (Today highlighted with brand border, quick swap/remove actions with `44px` touch targets).
  - Fix dark-mode contrast issues in `MealForm.tsx` and replace `DeleteMealButton` confirmation with `ConfirmDialog`.

### 4.4 Alışveriş (`/shopping`)
- **Redesign**:
  - Unify the 2 tabs (*Genel Alışveriş* & *Yemek Planı Malzemeleri*) using `SegmentedTabs`.
  - Make the Quick-Add bar sticky on mobile with effortless category pill selection.
  - Ensure all item delete/edit buttons are visible and touch-friendly on mobile (removing hover-only opacity).
  - Upgrade `WhatsAppShareModal` to the unified `Modal` component.

### 4.5 Hane Temizlik (`/cleaning`)
- **Redesign**:
  - Redesign `RoomStatusCards` with clear semantic status badges (`Temiz` Green, `Yaklaşıyor` Amber, `Gecikti` Red), smooth progress bars, and prominent 1-tap **"Temizlendi"** buttons.
  - Replace `window.confirm()` on room/history deletion with `ConfirmDialog`.

### 4.6 Dilek & İstek (`/wishlist`) & Düğün & Çeyiz (`/wedding`)
- **Redesign**:
  - Standardize filter toolbars (search + collapsible/scrollable filter chips on mobile so filters don't consume half the viewport height).
  - Redesign `WeddingOzetKartlari` and `KumbaraModal` with tabular currency formatting, high-contrast light/dark cards, and clean asset breakdown cards.
  - Replace `window.confirm()` calls with `ConfirmDialog`.

### 4.7 Hane Araç — CarDoList (`/cardolist`)
- **Redesign**:
  - **Migrate off isolated `CarDo.module.css` palette**: Refactor `CarDoModule.tsx` styling to use the unified Tailwind v4 semantic tokens (`--bg-surface`, `--text-primary`, `--border-subtle`) so Hane Araç matches the rest of the application in both light and dark modes while preserving 100% of its categories, reminders, odometer fields, and `cardo_*` storage keys.

### 4.8 Hane Kalori (`/kalori`)
- **Redesign**:
  - Redesign `CalorieSummaryCards` with a crisp SVG ring gauge and clear macro progress bars.
  - Streamline the 1,440-line `AddMealModal.tsx` UX: sticky mode tabs (*AI Asistan*, *Arama & Manuel*, *Şablonlar*), sticky bottom summary bar showing selected items count & total kcal before adding, and improved mobile keyboard handling.
  - Replace native `alert()` / `confirm()` calls with unified `Toast` and `ConfirmDialog`.

### 4.9 Hane Fit (`/fit/*`)
- **Redesign & Flow Consolidation (Preserving All Routes)**:
  - Upgrade `/fit/layout.tsx` sub-navigation to a responsive `SegmentedTabs` bar.
  - **Fix Form & Validation Discrepancies**: Align `/fit/measurements/new` and `/fit/measurements` with `/fit/dashboard` and `MeasurementModal` so users get the exact same capabilities (optional Neck/Waist, full Muscle Measurements tab, Edit capability, and `ConfirmDialog` deletion) regardless of which route they visit.
  - Align `/fit/profiles` and `/fit/profiles/new` validation and form UI.
  - Enhance `ProgressCharts.tsx` SVG charts with theme-aware grid lines, tooltips, and legible axis labels in both light and dark modes.

### 4.10 Hane Gider (`/gider`)
- **Redesign**:
  - **Fix Light/Dark Mode Contrast**: Replace all dark-assumed `text-sky-400`, `text-pink-400`, `text-purple-300`, `bg-white/5`, and `border-white/10` classes in `GiderV2*` and `Taksit*` with semantic theme-adaptive classes (`text-sky-700 dark:text-sky-300`, `bg-[var(--bg-surface)]`, etc.).
  - **Responsive Installment Projection Table**: Add a sticky left column (`position: sticky; left: 0`) to `TaksitProjeksiyonu.tsx` so card/installment names remain visible while scrolling horizontally across the 12 months on mobile.
  - Clean up unused legacy V1 dead files (`EvGiderleriSayfasi.tsx` and `EvGiderleriSayfasi.css`) once V2 visual polish is verified.

---

## 5. Accessibility & PWA Improvements

1. **Restore Pinch-to-Zoom (`src/app/layout.tsx`)**:
   - Remove `maximumScale: 1, userScalable: false` from `viewport` export. Ensure all `<input>`, `<select>`, and `<textarea>` elements use `text-base` (`16px`) on mobile so iOS Safari never auto-zooms on focus.
2. **Unify PWA Manifest**:
   - Consolidate `public/manifest.json` and `src/app/manifest.ts` so theme colors, icons, and startup URLs are 100% consistent.
3. **ARIA & Keyboard Compliance**:
   - Add `aria-label` to all icon buttons, `Escape` key dismissal and focus management to all modals via `Modal.tsx`, and `min-h-[44px] min-w-[44px]` touch targets on mobile interactive controls.

---

## 6. Prioritized Phased Implementation Plan

### Phase 2A — Design System Foundation & Shared UI Primitives
1. Refactor `src/app/globals.css` with unified light/dark semantic CSS variables, manual theme toggle support (`light` / `dark` / `system`), and standardized component classes.
2. Create reusable UI primitives in `src/components/ui/`: `Modal.tsx`, `ConfirmDialog.tsx`, `ToastProvider.tsx`, `PageHeader.tsx`, `SegmentedTabs.tsx`, `KpiCard.tsx`, `EmptyState.tsx`, `Badge.tsx`.
3. Fix `src/app/layout.tsx` viewport accessibility (`userScalable: true`) and remove double container padding across pages.

### Phase 2B — App Shell, Mobile Navigation & Settings Unification
1. Redesign `Sidebar.tsx` and `TopBar.tsx` to include:
   - Mobile Top Context Bar (with instant Profile Switcher, Cloud Sync status, Quick Add, and Settings).
   - Mobile Bottom Navigation Bar (top 4 modules + "Tümü" module sheet with `safe-area-inset-bottom`).
   - Repositioned `QuickActionLauncher` FAB that never overlaps content or toasts.
2. Persist `CloudConnectionGate` local-mode skip in `localStorage` (`hane_cloud_gate_skipped`) and port the Firebase snippet paste parser into `AyarlarModal.tsx`.
3. Upgrade `GlobalProfileModal`, `QuickActionModal`, `AyarlarModal`, and `SidebarOrderModal` to the new design system.

### Phase 2C — Core Daily Modules Redesign (Dashboard, Takvim, Yemek, Alışveriş, Temizlik)
1. **Dashboard (`/`)**: Bento grid redesign, Today's Focus strip, unified KPI cards.
2. **Hane Takvim (`/calendar`)**: Mobile dot-grid + Selected Day Agenda split view, touch-friendly controls, unified modals.
3. **Hane Yemek (`/dinner/*`) & Alışveriş (`/shopping`)**: Unified headers, dark-mode fixes in `MealForm`, sticky mobile quick-add bar, `ConfirmDialog` integration.
4. **Hane Temizlik (`/cleaning`)**: Redesigned freshness cards, urgency badges, and history list.

### Phase 2D — Financial & Planning Modules Redesign (Hane Gider, Düğün & Çeyiz, Dilek & İstek, Hane Araç)
1. **Hane Gider (`/gider`)**: Fix all light/dark contrast issues in `GiderV2` & `Taksit`, sticky column in `TaksitProjeksiyonu`, unified modals.
2. **Düğün & Çeyiz (`/wedding`) & Dilek & İstek (`/wishlist`)**: Mobile filter ergonomics, redesigned `KumbaraModal` & summary cards.
3. **Hane Araç (`/cardolist`)**: Migrate `CarDoModule.tsx` from isolated `CarDo.module.css` colors to the unified app design system while preserving all vehicle features.

### Phase 2E — Health & Body Modules Redesign (Hane Kalori, Hane Fit) & Final QA
1. **Hane Kalori (`/kalori`)**: Redesigned macro/calorie gauges and streamlined `AddMealModal` mobile UX.
2. **Hane Fit (`/fit/*`)**: Unify `/fit/dashboard`, `/fit/measurements`, `/fit/measurements/new`, and `/fit/profiles` UX/validation, and upgrade `ProgressCharts.tsx` SVG theme support.
3. **Final Verification**: Verify `npm run build`, test all `localStorage` & Firebase sync flows, verify mobile/tablet/desktop viewports, and remove dead V1/orphaned files if approved.

