# HANE APP — COMPREHENSIVE PROJECT AUDIT (`PROJECT_AUDIT.md`)

> **Phase 1 Audit Deliverable**
> **Status:** Read-Only Architectural & Technical Audit (Zero Code Modifications)
> **Scope:** Complete directory structure, tech stack, styling architecture, routing map, state & persistence (`localStorage` + Firebase Firestore sync), API routes, reusable vs. fragmented components, dead/orphaned code, and PWA configuration.

---

## 1. Executive Summary

**Hane App** ("Hane Paneli — Ev Yönetim Sistemi") is a local-first, cloud-synced progressive web application (PWA) built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, and **Tailwind CSS v4**. It serves as an all-in-one household super-app encompassing **10 distinct functional modules**:

1. **Genel Bakış (`/`)** — Household command center & live module summaries
2. **Hane Takvim (`/calendar`)** — Shared calendar, special day countdowns & Gemini AI assistant
3. **Hane Yemek (`/dinner`)** — Recipe vault, 7-day dinner planner & auto-aggregated shopping list
4. **Alışveriş (`/shopping`)** — Categorized custom grocery list + synced dinner ingredient checklist + WhatsApp export
5. **Hane Temizlik (`/cleaning`)** — Room hygiene freshness tracker, quick-clean logger & history
6. **Dilek & İstek (`/wishlist`)** — Personal/shared wishlist with priority, budget & purchase tracking
7. **Düğün & Çeyiz (`/wedding`)** — Trousseau/wedding checklist, Gold/FX/TL piggy bank (`Kumbara`) & category progress
8. **Hane Araç / CarDoList (`/cardolist`)** — Vehicle maintenance, inspection/insurance countdowns & expense tracker
9. **Hane Kalori (`/kalori`)** — Daily macro/calorie tracker, AI meal text/photo estimator, templates & dinner sync
10. **Hane Fit (`/fit`)** — Multi-profile body & muscle measurement tracker, US Navy body fat calculator & SVG progress charts
11. **Hane Gider (`/gider`)** — Shared household budget, credit card cutoff/due calculator, 50/50 settlement (`Mahsuplaşma`) & installment (`Taksit`) engine

Because these modules were built iteratively over time, the codebase exhibits **three different styling paradigms**, **multiple competing modal/header/button patterns**, **hardcoded user names ("Mert" & "Havsa") alongside a dynamic profile context**, and **several orphaned V1 components**.

---

## 2. Complete Folder & File Structure

```text
hane-app/
├── package.json                                  # Next 16.3.3, React 19.2.8, Firebase 12.11.0, Tailwind v4
├── next.config.ts                                # Minimal NextConfig (empty default config)
├── tsconfig.json                                 # Strict TS config with @/* -> ./src/* alias
├── postcss.config.mjs                            # @tailwindcss/postcss plugin
├── eslint.config.mjs                             # Next core-web-vitals + TypeScript ESLint
├── public/
│   ├── manifest.json                             # Static PWA manifest (#ea580c theme) — duplicates src/app/manifest.ts
│   ├── sw.js                                     # Service worker (hane-pwa-v1 cache + push notifications)
│   └── icons/                                    # PWA icons (icon-192.png, icon-512.png, SVG assets)
└── src/
    ├── app/
    │   ├── globals.css                           # Tailwind v4 @import, CSS custom properties, utility classes
    │   ├── layout.tsx                            # RootLayout: Sidebar, TopBar, QuickActionLauncher, Cloud & Profile providers
    │   ├── manifest.ts                           # Next.js dynamic PWA manifest (#0f172a theme) — conflicts with public/manifest.json
    │   ├── page.tsx                              # Dashboard ("Genel Bakış") aggregating all 10 modules
    │   ├── api/
    │   │   ├── calendar-ai/route.ts              # POST route calling Gemini 2.5 Flash for calendar CRUD & Q&A
    │   │   └── calorie-ai/route.ts               # POST route calling Gemini 2.5 Flash for text/photo meal macro estimation
    │   ├── calendar/
    │   │   └── page.tsx                          # Hane Takvim module entry
    │   ├── cardolist/
    │   │   └── page.tsx                          # Hane Araç (CarDoList) module entry
    │   ├── cleaning/
    │   │   └── page.tsx                          # Hane Temizlik module entry
    │   ├── dinner/
    │   │   ├── page.tsx                          # Hane Yemek main view (TodayMealBanner, WeekPlan, ShoppingList)
    │   │   └── meals/
    │   │       ├── page.tsx                      # Recipe vault list & search
    │   │       ├── new/page.tsx                  # Create new recipe page
    │   │       └── [id]/edit/page.tsx            # Edit existing recipe page
    │   ├── fit/
    │   │   ├── layout.tsx                        # Sub-navigation bar for Hane Fit (/fit/dashboard, /measurements, /profiles)
    │   │   ├── page.tsx                          # Client redirect to /fit/dashboard or /fit/profiles
    │   │   ├── dashboard/page.tsx                # Fit KPIs, SVG charts, measurement cards & modal triggers
    │   │   ├── measurements/
    │   │   │   ├── page.tsx                      # Legacy/secondary measurement list page
    │   │   │   └── new/page.tsx                  # Legacy/secondary standalone measurement form page
    │   │   └── profiles/
    │   │       ├── page.tsx                      # Profile switcher, inline creation form & profile deletion
    │   │       └── new/page.tsx                  # Duplicate standalone profile creation page
    │   ├── gider/
    │   │   └── page.tsx                          # Hane Gider main entry (renders EvGiderleriSayfasiV2)
    │   ├── gider2/
    │   │   └── page.tsx                          # Server redirect (`redirect("/gider")`)
    │   ├── kalori/
    │   │   └── page.tsx                          # Hane Kalori main entry
    │   ├── shopping/
    │   │   └── page.tsx                          # Alışveriş Listeleri (Custom + Dinner Sync tabs)
    │   ├── wedding/
    │   │   └── page.tsx                          # Düğün & Çeyiz + Kumbara tracker
    │   └── wishlist/
    │       └── page.tsx                          # Dilek & İstek listesi
    ├── components/
    │   ├── calendar/
    │   │   ├── CalendarAiModal.tsx               # Gemini chat modal for calendar queries & natural-language event creation
    │   │   ├── CalendarEventModal.tsx            # Create/Edit/Delete event modal with recurring & reminder support
    │   │   ├── CalendarView.tsx                  # Month grid, special day strip, upcoming reminders & event list
    │   │   └── TodayEventBanner.tsx              # Dismissible banner for today's scheduled events
    │   ├── cardolist/
    │   │   ├── CarDoModule.tsx                   # Self-contained vehicle expense, countdown & category manager
    │   │   └── CarDo.module.css                  # Scoped CSS module with custom `--cardo-*` variables
    │   ├── cleaning/
    │   │   ├── AddRoomModal.tsx                  # Create room with target interval (days)
    │   │   ├── CleaningHistoryList.tsx           # Chronological cleaning log with delete action
    │   │   ├── CleaningReminderModal.tsx         # Daily hygiene notification settings modal
    │   │   ├── QuickCleanModal.tsx               # Log cleaning for an existing room or ad-hoc area
    │   │   └── RoomStatusCards.tsx               # Color-coded room cards (Temiz / Yaklaşıyor / Gecikti)
    │   ├── dinner/
    │   │   ├── DeleteMealButton.tsx              # Recipe deletion button with inline confirmation
    │   │   ├── MealForm.tsx                      # Recipe create/edit form with dynamic ingredient rows
    │   │   ├── MealReminderModal.tsx             # Dinner planning & daily cooking notification settings
    │   │   ├── ShoppingItemCheckbox.tsx          # Individual ingredient toggle row
    │   │   ├── ShoppingList.tsx                  # Embedded weekly ingredient checklist inside /dinner
    │   │   ├── TodayMealBanner.tsx               # Highlights tonight's planned meal & prep notes
    │   │   └── WeekPlan.tsx                      # 7-day meal planner with week navigation & searchable meal picker
    │   ├── fit/
    │   │   ├── MeasurementModal.tsx              # Tabbed modal (Temel Vücut + Kas Çevre) for creating/editing measurements
    │   │   └── ProgressCharts.tsx                # Pure SVG area/line charts + comparison table
    │   ├── gider/
    │   │   ├── EvGiderleriSayfasi.tsx            # [DEAD CODE] Legacy V1 2,097-line component (superseded by V2)
    │   │   ├── EvGiderleriSayfasi.css            # [DEAD CODE] Legacy V1 605-line BEM stylesheet
    │   │   ├── taksit/
    │   │   │   ├── KartModal.tsx                 # Add/Edit credit card for installment tracking
    │   │   │   ├── TaksitAktarimModal.tsx        # Selective preview & sync modal for pushing installments to monthly Gider
    │   │   │   ├── TaksitKartGrubu.tsx           # Expandable card group with progress bars & early payoff actions
    │   │   │   ├── TaksitModal.tsx               # Create/Edit installment plan with custom monthly distribution
    │   │   │   ├── TaksitProjeksiyonu.tsx        # 12-month future installment matrix & debt-free date estimator
    │   │   │   └── TaksitSayfasi.tsx             # Main Taksit tab view inside Hane Gider
    │   │   └── v2/
    │   │       ├── EvGiderleriSayfasiV2.tsx      # Active Hane Gider V2 orchestrator (Giderler + Taksitler tabs)
    │   │       ├── GiderV2BireyselGelirSection.tsx # Personal out-of-pocket expenses & monthly income accordion
    │   │       ├── GiderV2CardList.tsx           # Credit card statement simulator & payment status cards
    │   │       ├── GiderV2Header.tsx             # Month selector, quick-add buttons, JSON backup/restore menu
    │   │       ├── GiderV2KpiCards.tsx           # 4 financial KPI cards (Toplam, Ortak, Bireysel, Bütçe Durumu)
    │   │       ├── GiderV2LedgerTable.tsx        # Filterable transaction table + mobile card list
    │   │       ├── GiderV2MahsuplasmaCard.tsx    # 50/50 Mert vs. Havsa settlement engine & transfer history
    │   │       └── GiderV2Modals.tsx             # 8 portal modals (Ortak, Bireysel, Kart, Gelir, Bütçe, Transfer, Sil, Yedek)
    │   ├── kalori/
    │   │   ├── AddMealModal.tsx                  # 1,440-line multi-mode modal (AI, Manual, Templates, Saved Foods, Portions)
    │   │   ├── ApiKeyModal.tsx                   # Gemini API key configuration modal
    │   │   ├── CalorieHeader.tsx                 # Active profile badge, date switcher, dinner-fetch & target buttons
    │   │   ├── CalorieSummaryCards.tsx           # Circular SVG calorie gauge + Protein/Carb/Fat progress bars
    │   │   ├── EditTargetModal.tsx               # Custom daily kcal target or BMR/TDEE auto-calculator
    │   │   ├── FetchDinnerModal.tsx              # Imports tonight's planned meal from Hane Yemek into Hane Kalori
    │   │   ├── MealSection.tsx                   # 4 meal slot cards (Kahvaltı, Öğle, Akşam, Ara Öğün)
    │   │   └── SaveTemplateModal.tsx             # Saves current meal slot items as a reusable template
    │   ├── navigation/
    │   │   ├── AyarlarModal.tsx                  # Unified 4-tab Settings modal (Bildirimler, Veriler, Bulut, Bulgular)
    │   │   ├── CloudConnectionGate.tsx           # Full-screen blocker when Firebase is unconfigured on startup
    │   │   ├── CloudSyncIndicator.tsx            # Live sync status badge (Senkronize / Kaydediliyor / Çevrimdışı)
    │   │   ├── FirebaseSetupModal.tsx            # [ORPHANED] Standalone Firebase setup modal (has regex paste parser)
    │   │   ├── Sidebar.tsx                       # Desktop left sidebar + mobile top header & slide-over drawer
    │   │   ├── SidebarOrderModal.tsx             # Up/Down module reordering modal
    │   │   ├── TopBar.tsx                        # Desktop-only (`hidden lg:flex`) top bar
    │   │   └── YedekModal.tsx                    # [ORPHANED] Standalone backup modal (superseded by AyarlarModal)
    │   ├── notifications/
    │   │   └── NotificationBellButton.tsx        # [ORPHANED] Standalone notification bell (superseded by AyarlarModal)
    │   ├── profile/
    │   │   ├── GlobalProfileModal.tsx            # Full-screen "Kim Kullanıyor?" profile gate & inline profile creator
    │   │   └── ProfileHeaderMenu.tsx             # Active user badge + dropdown switcher
    │   ├── providers/
    │   │   ├── CloudSyncProvider.tsx             # Initializes Firebase sync & background 60s notification scheduler
    │   │   └── ServiceWorkerRegister.tsx         # Registers `/sw.js` on window load
    │   ├── quick-action/
    │   │   ├── QuickActionLauncher.tsx           # Global FAB (`fixed bottom-6 right-6`) + `Ctrl+K` / `Alt+N` listener
    │   │   └── QuickActionModal.tsx              # 4-tab omni-modal (Gider, Kalori, Temizlik, Alışveriş)
    │   ├── shopping/
    │   │   ├── CustomShoppingList.tsx            # Categorized custom shopping list with inline add/filter/check
    │   │   ├── FoodShoppingSyncList.tsx          # Synced weekly dinner ingredients list inside /shopping
    │   │   └── WhatsAppShareModal.tsx            # Formats & shares unchecked items via WhatsApp (`wa.me`) or clipboard
    │   ├── ui/
    │   │   ├── Container.tsx                     # Simple max-w-5xl wrapper (used only in /dinner pages)
    │   │   └── Icons.tsx                         # Shared inline SVG icon primitives
    │   ├── wedding/
    │   │   ├── KumbaraModal.tsx                  # Gold (Gram/Çeyrek/Tam), FX (USD/EUR) & TL savings manager
    │   │   ├── WeddingItemModal.tsx              # Create/Edit wedding/trousseau item with installment support
    │   │   └── WeddingOzetKartlari.tsx           # Wedding budget, spent, remaining & Kumbara net-worth cards
    │   └── wishlist/
    │       ├── WishlistModal.tsx                 # Create/Edit wishlist item with image URL, link, priority & price
    │       └── WishlistView.tsx                  # Grid/List toggle, status/category/priority filters & summary bar
    ├── context/
    │   └── ProfileContext.tsx                    # Global active profile state (`activeProfile`, `selectProfile`, `isProfileModalOpen`)
    ├── domain/
    │   ├── bodyCalculations.ts                   # BMI, US Navy Body Fat %, Fat Mass, Lean Mass, Waist-to-Height Ratio
    │   ├── calendarStorage.ts                    # Calendar Event CRUD, special days, upcoming reminders
    │   ├── calorieStorage.ts                     # Daily logs, macro calculations, templates, saved foods, history
    │   ├── cleaningStorage.ts                    # Room freshness logic, cleaning logs, default room seeding
    │   ├── gider/
    │   │   ├── ekstreHesapla.ts                  # Credit card billing cycle, statement cutoff & 50/50 settlement math
    │   │   └── types.ts                          # TypeScript interfaces for Gider V2 & Taksit
    │   ├── measurementService.ts                 # Fit measurement validation & CRUD wrapper
    │   ├── profileService.ts                     # Fit profile validation & CRUD wrapper
    │   ├── weddingStorage.ts                     # Trousseau items + Kumbara asset valuation math
    │   └── wishlistStorage.ts                    # Wishlist item CRUD
    ├── lib/
    │   ├── date/
    │   │   └── week.ts                           # ISO Monday week-start & date formatting helpers
    │   ├── firebase/
    │   │   ├── client.ts                         # Dynamic Firebase initialization from `localStorage` or `process.env`
    │   │   └── syncService.ts                    # Bidirectional Firestore (`hane_vaults/main_data`) <-> `localStorage` sync
    │   ├── local-storage/
    │   │   ├── keys.ts                           # Storage keys for Hane Yemek (`hane-dinner:*`)
    │   │   └── store.ts                          # Recipe, Weekly Plan & Shopping aggregation logic
    │   └── utils.ts                              # `cn()` helper & currency/date formatters
    ├── storage/
    │   ├── bodyStorage.ts                        # Low-level `localStorage` persistence for Fit profiles & measurements
    │   └── gider/
    │       ├── ayDeposu.ts                       # Monthly Gider storage (`hane-gider-ay:YYYY-MM`) + installment sync
    │       ├── taksitStorage.ts                  # Installment & card storage + monthly distribution engine
    │       └── yedekDeposu.ts                    # Full JSON export/import for Gider & Taksit data
    └── types/
        ├── bodyTracking.ts                       # Profile, BodyMeasurement, MuscleMeasurement interfaces
        └── index.ts                              # Meal, Ingredient, WeeklyPlan, ShoppingItem interfaces
```

---

## 3. Frontend Framework, Styling System & Routing Architecture

### 3.1 Framework & Runtime
- **Next.js 16.3.3** using the **App Router** (`src/app/`).
- **React 19.2.8** (`react` & `react-dom`).
- **Rendering Model**: Almost 100% **Client-Side Rendered (`"use client"`)** because all domain data resides in browser `localStorage` synchronized with Firebase Firestore on the client.
- **Zero External UI Libraries**: No Radix UI, Headless UI, Shadcn, Material UI, Lucide React, or Framer Motion. Every modal, dropdown, chart, and icon is hand-coded.

### 3.2 Three Competing Styling Systems
The application currently mixes three different styling methodologies:

1. **Tailwind CSS v4 (`src/app/globals.css`)**:
   - Imported via `@import "tailwindcss";`.
   - Defines root theme CSS variables (`--background`, `--foreground`, `--surface`, `--surface-raised`, `--muted`, `--border`, `--primary: #ea580c`, `--accent: #0f766e`, `--success: #15803d`) with `@media (prefers-color-scheme: dark)` overrides (`--background: #120f0d`, `--surface: #1c1714`, `--primary: #f97316`).
   - Defines global component classes in `@layer components`: `.field`, `.primary-button`, `.secondary-button`, `.accent-button`, `.icon-button`.
   - **Conflict**: Many components ignore these semantic variables and hardcode Tailwind palettes (`bg-slate-900`, `text-sky-400`, `bg-indigo-600`, `bg-emerald-600`, `bg-rose-600`, `bg-amber-600`), causing severe visual fragmentation and light/dark mode contrast bugs.
2. **Scoped CSS Modules (`src/components/cardolist/CarDo.module.css`)**:
   - Used exclusively by `/cardolist` (`CarDoModule.tsx`).
   - Defines its own isolated design tokens (`--cardo-primary: #2563eb`, `--cardo-bg: #f8fafc`, etc.) and custom class names (`.dashboardGrid`, `.statCard`, `.modalOverlay`).
3. **Legacy Plain BEM CSS (`src/components/gider/EvGiderleriSayfasi.css`)**:
   - 605 lines of plain CSS (`.ev-giderleri`, `.gider-kart`, etc.) tied to the unused V1 `EvGiderleriSayfasi.tsx`.

### 3.3 Complete Routing Map

| Route Path | Type | Primary Component | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | Client Page | `src/app/page.tsx` | **Genel Bakış (Dashboard)** — Live widgets for all 10 modules |
| `/calendar` | Client Page | `CalendarView.tsx` | **Hane Takvim** — Monthly grid, special days, AI assistant |
| `/dinner` | Client Page | `DinnerHomePage` | **Hane Yemek** — Today's meal banner, 7-day plan, shopping list |
| `/dinner/meals` | Server Shell + Client | `MealsListPage` | **Yemek Listesi** — Searchable recipe catalog |
| `/dinner/meals/new` | Server Shell + Client | `MealForm.tsx` | **Yeni Yemek** — Recipe creation form |
| `/dinner/meals/[id]/edit` | Server Shell + Client | `MealForm.tsx` | **Yemek Düzenle** — Recipe edit form |
| `/shopping` | Client Page | `ShoppingPage` | **Alışveriş** — Custom shopping list + Dinner ingredient sync |
| `/cleaning` | Client Page | `CleaningPage` | **Hane Temizlik** — Room hygiene status & cleaning history |
| `/wishlist` | Client Page | `WishlistView.tsx` | **Dilek & İstek** — Personal/household wish tracker |
| `/wedding` | Client Page | `WeddingPage` | **Düğün & Çeyiz** — Trousseau list & Gold/FX/TL Kumbara |
| `/cardolist` | Client Page | `CarDoModule.tsx` | **Hane Araç** — Vehicle maintenance & expense ledger |
| `/kalori` | Client Page | `KaloriPage` | **Hane Kalori** — Macro/calorie tracker & AI estimator |
| `/fit` | Client Redirect | `FitIndexPage` | Redirects to `/fit/dashboard` (if profile exists) or `/fit/profiles` |
| `/fit/dashboard` | Client Page | `DashboardPage` | **Hane Fit Özet** — Body KPIs, SVG progress charts, history |
| `/fit/measurements` | Client Page | `MeasurementsPage` | **Hane Fit Ölçümler** — Secondary tabular/card measurement list |
| `/fit/measurements/new` | Client Page | `NewMeasurementPage` | **Yeni Ölçüm** — Standalone measurement entry page |
| `/fit/profiles` | Client Page | `ProfilesPage` | **Profiller** — Profile switcher & inline creation |
| `/fit/profiles/new` | Client Page | `NewProfilePage` | **Yeni Profil** — Duplicate standalone profile form |
| `/gider` | Client Page | `EvGiderleriSayfasiV2` | **Hane Gider** — Shared expenses, cards, settlement & installments |
| `/gider2` | Server Redirect | `redirect("/gider")` | Legacy redirect to `/gider` |
| `/api/calendar-ai` | API Route (POST) | `route.ts` | Gemini 2.5 Flash endpoint for natural-language calendar actions |
| `/api/calorie-ai` | API Route (POST) | `route.ts` | Gemini 2.5 Flash endpoint for food text/photo macro analysis |

---

## 4. State Management, Data Persistence & Cloud Sync

### 4.1 Local-First Reactivity (`localStorage` + Custom DOM Events)
Hane App does not use Redux, Zustand, or React Query. Instead, each module reads/writes JSON arrays or objects in `window.localStorage` and broadcasts mutations via `window.dispatchEvent(new Event(...))` or `CustomEvent`. Components subscribe to these events in `useEffect` hooks to stay reactive across tabs, modals, and the global Quick Action launcher.

### 4.2 Complete `localStorage` Key & Event Matrix

| Module / Scope | `localStorage` Key | Custom DOM Event | Cloud Synced? | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Cloud & Auth** | `hane_firebase_config` | `storage` | Yes* | Firebase project config JSON (`apiKey`, `projectId`, etc.) |
| **AI Assistant** | `hane_gemini_api_key` | — | Yes | Shared Google Gemini API Key used by `/kalori` & `/calendar` |
| **Navigation** | `hane_sidebar_order_v1` | `hane_sidebar_order_changed` | Yes | Custom ordered array of sidebar module `href` strings |
| **Feedback** | `hane_uygulama_bulgular_v1` | `hane:bulgular-changed` | Yes | In-app bug reports / UX notes logged in `AyarlarModal` |
| **Notifications** | `hane_notification_settings` | `hane_notification_settings_updated` | Yes | Master & per-module notification toggles and `HH:mm` times |
| **Notifications** | `hane_notified_log` | — | Yes | Daily deduplication map preventing repeat browser notifications |
| **Profile Context** | `hane_fit_profiles` | `fit_profiles_updated` | Yes | Array of household `Profile` objects |
| **Profile Context** | `hane_fit_active_profile_id` | `fit_profile_changed` | **NO** (Device-local) | Active user profile ID on the current device |
| **Profile Context** | `hane_profile_selected_at` | — | **NO** (Device-local) | Timestamp of last profile selection on current device |
| **Hane Fit** | `hane_fit_measurements` | `fit_measurements_updated` | Yes | Array of `BodyMeasurement` records across all profiles |
| **Hane Fit** | `hane_fit_muscle_measurements` | `fit_measurements_updated` | Yes | Array of `MuscleMeasurement` records across all profiles |
| **Hane Yemek** | `hane-dinner:meals` | `hane-dinner:storage` | Yes | Saved recipes (`Meal[]`) with ingredients & prep notes |
| **Hane Yemek** | `hane-dinner:plans` | `hane-dinner:storage` | Yes | Weekly dinner assignments (`WeeklyPlan[]` keyed by Monday date) |
| **Hane Yemek** | `hane-dinner:shopping` | `hane-dinner:storage` | Yes | Aggregated weekly recipe ingredients (`ShoppingItem[]`) |
| **Hane Yemek** | `hane_dinner_reminder_settings` | — | Yes | Legacy/module-specific dinner reminder toggle & time |
| **Alışveriş** | `hane_custom_shopping_items` | `hane-shopping:updated` | Yes | Custom grocery items with category & checked state |
| **Alışveriş** | `hane_custom_shopping_categories` | `hane-shopping:updated` | Yes | Custom grocery categories |
| **Hane Takvim** | `hane_calendar_events` | `calendar_events_updated` | Yes | Calendar events, special days, recurring flags & reminder days |
| **Hane Temizlik** | `hane_cleaning_rooms` | `hane_cleaning_updated` | Yes | Household rooms with target cleaning intervals (in days) |
| **Hane Temizlik** | `hane_cleaning_records` | `hane_cleaning_updated` | Yes | Historical cleaning log entries |
| **Hane Temizlik** | `hane_cleaning_reset_done` | — | Yes | One-time migration/seed flag for default rooms |
| **Hane Temizlik** | `hane_cleaning_reminder_settings` | — | Yes | Module-specific cleaning reminder toggle & time |
| **Dilek & İstek** | `hane_wishlist_items` | `wishlist_items_updated` | Yes | Wishlist items with priority, status, links & prices |
| **Düğün & Çeyiz** | `hane_wedding_data` | `wedding_data_updated` | Yes | Wedding items, categories, budget & `Kumbara` assets/rates |
| **Hane Araç** | `cardo_expenses_v1` | `cardo:expenses-updated` | Yes | Vehicle expenses, dates, categories & reminder target dates |
| **Hane Araç** | `cardo_AllCategories_v1` | `cardo:expenses-updated` | Yes | Custom vehicle expense categories |
| **Hane Araç** | `cardo_HiddenDefaults_v1` | `cardo:expenses-updated` | Yes | Hidden default vehicle categories |
| **Hane Kalori** | `hane_calorie_daily_records` | `hane_calorie_updated` | Yes | Keyed by `{profileId}_{YYYY-MM-DD}` containing 4 meal slots |
| **Hane Kalori** | `hane_calorie_custom_targets` | `hane_calorie_updated` | Yes | Keyed by `{profileId}` for custom daily kcal goal |
| **Hane Kalori** | `hane_calorie_saved_templates` | `hane_calorie_updated` | Yes | Reusable multi-item meal templates per profile |
| **Hane Kalori** | `hane_calorie_saved_foods` | `hane_calorie_updated` | Yes | Custom single food items saved per profile |
| **Hane Kalori** | `hane_calorie_food_history` | `hane_calorie_updated` | Yes | Recent food entries per profile for 1-click re-add |
| **Hane Gider** | `hane-gider-ay:YYYY-MM` | `hane-gider:updated` | Yes | Monthly Gider document (budget, cards, shared/personal expenses, incomes, settlements) |
| **Hane Gider** | `hane-gider-taksit-yedek:YYYY-MM` | `hane-gider:updated` | Yes | Pre-sync backup snapshot allowing 1-click installment rollback |
| **Hane Gider** | `hane_taksit_kartlari` | `hane-taksit:updated` | Yes | Credit cards registered in the Installment (`Taksit`) module |
| **Hane Gider** | `hane_taksitler` | `hane-taksit:updated` | Yes | Multi-month installment plans & payment schedules |

### 4.3 Firebase Firestore Real-Time Sync (`src/lib/firebase/syncService.ts`)
- **Single-Vault Document**: All `localStorage` keys (except `hane_fit_active_profile_id` and `hane_profile_selected_at`) are serialized into a single Firestore document at `hane_vaults/main_data`.
- **Monkey-Patched `localStorage`**: `syncService.ts` wraps `localStorage.setItem`, `removeItem`, and `clear`. Whenever any module writes to `localStorage`, a **1,200ms debounced push** writes the full payload + `_updatedAt` timestamp to Firestore and updates `CloudSyncIndicator`.
- **Real-Time Listener**: `onSnapshot` listens to `hane_vaults/main_data`. When remote changes arrive (`isReceivingFromCloud = true`), it updates `localStorage` keys and fires all module custom events (`hane-dinner:storage`, `calendar_events_updated`, `hane-gider:updated`, etc.) so active screens refresh without a page reload.

---

## 5. Inventory of Reusable vs. Fragmented Components & Dead Code

### 5.1 Shared / Reusable Components
- `src/components/ui/Icons.tsx` — Central inline SVG icon library.
- `src/components/ui/Container.tsx` — Used only by `/dinner` routes (`max-w-5xl`).
- `src/context/ProfileContext.tsx`, `GlobalProfileModal.tsx`, `ProfileHeaderMenu.tsx` — Global active household member management.
- `src/components/quick-action/QuickActionLauncher.tsx` & `QuickActionModal.tsx` — Global floating action button & `Ctrl+K` / `Alt+N` quick-entry modal.
- `src/components/navigation/Sidebar.tsx`, `TopBar.tsx`, `AyarlarModal.tsx`, `SidebarOrderModal.tsx`, `CloudSyncIndicator.tsx`.

### 5.2 Dead / Orphaned Code Identified During Audit
1. **`src/components/gider/EvGiderleriSayfasi.tsx` (2,097 lines) & `EvGiderleriSayfasi.css` (605 lines)**:
   - Completely unused. `src/app/gider/page.tsx` renders `EvGiderleriSayfasiV2`.
2. **`src/components/navigation/FirebaseSetupModal.tsx`**:
   - Orphaned after `AyarlarModal.tsx` introduced its own "Bulut (Firebase)" tab.
   - *Important Note*: `FirebaseSetupModal.tsx` contains a convenient **regex snippet parser** (`parseConfigSnippet` that extracts `apiKey`, `projectId`, etc. from a pasted `const firebaseConfig = { ... }` block) which was accidentally omitted when `AyarlarModal.tsx` was built!
3. **`src/components/navigation/YedekModal.tsx`**:
   - Orphaned after `AyarlarModal.tsx` integrated full backup/restore into its "Veriler" tab.
4. **`src/components/notifications/NotificationBellButton.tsx`**:
   - Orphaned after `AyarlarModal.tsx` integrated notification settings into its "Bildirimler" tab.
5. **Duplicate Hane Fit Pages**:
   - `/fit/profiles/new/page.tsx` duplicates the inline "Yeni Profil Ekle" form already embedded in `/fit/profiles/page.tsx` (and uses slightly different validation rules).
   - `/fit/measurements/new/page.tsx` duplicates `MeasurementModal.tsx` (and forces Neck & Waist to be required, whereas `MeasurementModal` allows Weight-only entries).

---

## 6. PWA & Service Worker Audit

- **Dual Manifest Conflict**:
  - `src/app/layout.tsx` exports `manifest: "/manifest.json"` (pointing to `public/manifest.json` with `theme_color: "#ea580c"`, `background_color: "#fffaf5"`).
  - Simultaneously, `src/app/manifest.ts` generates `/manifest.webmanifest` with `theme_color: "#0f172a"`, `background_color: "#0f172a"`.
- **Service Worker (`public/sw.js`)**:
  - Uses a naive Cache-First / Network-Fallback strategy (`CACHE_NAME = 'hane-pwa-v1'`) for **every GET request** on the same origin (`event.request.method === 'GET'`).
  - **Risk**: Caching Next.js App Router `_next/static` chunks and RSC payload requests indiscriminately under a static cache name without version invalidation can serve stale UI bundles after deployments.
  - Supports Web Push / `showNotification` click handling to focus or open `/` when a notification is tapped.
- **Background Notification Engine (`CloudSyncProvider.tsx`)**:
  - Runs a `setInterval` every **60 seconds** while the app is open, checking `hane_notification_settings` against current `HH:mm` time and triggering native browser notifications (via `ServiceWorkerRegistration.showNotification` or `new Notification()`) for:
    1. **Takvim**: Today's events & upcoming reminder-window events.
    2. **Yemek**: Tonight's planned dinner or "plan your week" prompt.
    3. **Temizlik**: Overdue rooms (`Gecikti`).
    4. **Gider**: Credit cards within 0–3 days of their payment due date (`sonOdemeGunu`).

