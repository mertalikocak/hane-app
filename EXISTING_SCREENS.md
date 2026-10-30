# HANE APP — EXISTING SCREENS & FEATURE SPECIFICATION (`EXISTING_SCREENS.md`)

> **Phase 1 Audit Deliverable**
> **Purpose:** Exhaustive catalog of every existing screen, sub-route, tab, modal, dialog, component, and user interaction in Hane App. Every behavior documented here **must be 100% preserved** during the UI/UX redesign.

---

## 1. Global Application Shell & Cross-Cutting Flows

### 1.1 Root Layout (`src/app/layout.tsx`)
- **Providers & Gates (Outer to Inner)**:
  1. `ServiceWorkerRegister`: Registers `/sw.js` on window `load`.
  2. `CloudSyncProvider`: Starts Firestore real-time sync (`initCloudSync`) and the 60-second local notification scheduler.
  3. `CloudConnectionGate`: Checks if Firebase is configured (`isFirebaseConfigured()`). If not configured and not skipped in the current React session, renders a full-screen gate with two actions:
     - **"Bulut Bağlantısını Kur"** -> Opens `AyarlarModal` directly on the `bulut` tab.
     - **"Şimdilik Yerel Modda Devam Et"** -> Dismisses the gate for the current page session.
  4. `ProfileProvider`: Loads profiles from `hane_fit_profiles` and active ID from `hane_fit_active_profile_id`.
  5. `GlobalProfileModal`: Full-screen modal ("Kim Kullanıyor?") shown if no active profile is selected or when triggered from the profile menu. Allows selecting an existing profile or creating a new profile inline (First Name, Last Name, Gender, Birth Year, Height cm, Initial Weight kg).
- **Navigation Chrome**:
  - **Desktop (`lg:flex`)**: Fixed left `Sidebar` (`w-72`) + sticky `TopBar` (`h-16`) + scrollable main content area.
  - **Mobile/Tablet (`< lg`)**: Sticky top bar inside `Sidebar.tsx` (`h-16`) with brand logo + hamburger menu button -> opens full-screen slide-over drawer.

### 1.2 Sidebar (`src/components/navigation/Sidebar.tsx`) & Ordering (`SidebarOrderModal.tsx`)
- Displays 10 primary module links:
  1. **Genel Bakış** (`/`)
  2. **Hane Takvim** (`/calendar`)
  3. **Hane Yemek** (`/dinner`)
  4. **Alışveriş** (`/shopping`)
  5. **Hane Temizlik** (`/cleaning`)
  6. **Dilek & İstek** (`/wishlist`)
  7. **Düğün & Çeyiz** (`/wedding`)
  8. **Hane Araç** (`/cardolist`)
  9. **Hane Kalori** (`/kalori`)
  10. **Hane Fit** (`/fit`)
  11. **Hane Gider** (`/gider`)
-*(Note: Genel Bakış + 10 specialized modules = 11 total navigation items).*
- **Custom Reordering**: Clicking the sort icon next to "Ana Menü" opens `SidebarOrderModal`, allowing the user to move modules Up/Down or reset to default order (`hane_sidebar_order_v1`).
- **Footer Actions (Mobile Drawer & Desktop Footer)**:
  - Active Profile switcher (`ProfileHeaderMenu`).
  - Cloud Sync status indicator (`CloudSyncIndicator`).
  - **"Uygulama Ayarları"** button -> opens `AyarlarModal`.
  - Quick Action shortcut hint (`Ctrl + K` / `Alt + N`).

### 1.3 Desktop TopBar (`src/components/navigation/TopBar.tsx`)
- Visible only on `lg:` (`>= 1024px`).
- Left: Current date formatted in Turkish (`toLocaleDateString("tr-TR", { weekday: 'long', day: 'numeric', month: 'long' })`).
- Right:
  1. **"Hızlı Ekle"** button (`Ctrl+K`) -> dispatches `hane:open-quick-action`.
  2. **"Bulgular"** button -> shows badge count of logged UX/bug notes (`hane_uygulama_bulgular_v1`) and opens `AyarlarModal` on the `bulgular` tab.
  3. `CloudSyncIndicator` -> shows live Firestore sync state (`Senkronize`, `Kaydediliyor...`, `Çevrimdışı`, `Bulut Kapalı`).
  4. `ProfileHeaderMenu` -> shows active user avatar/name; dropdown allows switching profiles, opening `GlobalProfileModal` to add a profile, or navigating to `/fit/profiles`.
  5. **Settings Gear Icon** -> opens `AyarlarModal` on the `bildirimler` tab.

### 1.4 Unified Settings Modal (`src/components/navigation/AyarlarModal.tsx`)
Contains **4 tabs**:
1. **Bildirimler (`bildirimler`)**:
   - Browser notification permission status banner + "İzin İste" / "Test Bildirimi Gönder" buttons.
   - Master notification toggle (`enabled`).
   - Per-module toggles & `HH:mm` time pickers for:
     - **Takvim & Özel Günler** (`calendarEnabled`, `calendarTime`)
     - **Akşam Yemeği Planı** (`dinnerEnabled`, `dinnerTime`)
     - **Temizlik Hatırlatıcı** (`cleaningEnabled`, `cleaningTime`)
     - **Gider & Ekstre Hatırlatıcı** (`expenseEnabled`, `expenseTime`)
2. **Veriler (`veriler`)**:
   - **Yedek İndir (JSON)**: Exports all `localStorage` keys into a timestamped `hane-yedek-YYYY-MM-DD.json` file.
   - **Yedek Yükle (JSON)**: File picker that restores all keys from a JSON backup file and reloads the app.
   - **Fabrika Ayarlarına Dön (Tüm Verileri Sil)**: Double-confirmation destructive action that clears `localStorage` and reloads.
3. **Bulut (`bulut`)**:
   - Connection status indicator (`Bağlı` vs `Yapılandırılmamış`).
   - 6 manual input fields for Firebase configuration (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
   - **"Kaydet ve Bağlan"** (saves to `hane_firebase_config` and initializes sync), **"Şimdi Senkronize Et"** (forces push/pull), and **"Bağlantıyı Kes"** (removes config).
4. **Bulgular (`bulgular`)**:
   - Built-in issue/feedback tracker stored in `hane_uygulama_bulgular_v1`.
   - Users can add a note tagged by module/category, toggle its resolved state, copy all notes to clipboard, or delete individual notes.

### 1.5 Global Quick Action System (`QuickActionLauncher.tsx` & `QuickActionModal.tsx`)
- **Trigger**: Floating Action Button (`fixed bottom-6 right-6 z-40`), TopBar "Hızlı Ekle" button, or keyboard shortcuts `Ctrl+K` / `Cmd+K` / `Alt+N`.
- **4 Quick-Entry Tabs**:
  1. **Gider Ekle**:
     - Toggle between **Ortak Gider** (Shared) and **Bireysel Gider** (Personal).
     - Amount (`₺`), Description, Category selector, Payment Method (`Kredi Kartı` vs `Nakit/Banka`), Payer (`Mert` vs `Havsa`), Credit Card selector (filtered by payer if cards exist), and Date.
     - Saves directly to `hane-gider-ay:YYYY-MM` and dispatches `hane-gider:updated`.
  2. **Kalori Ekle**:
     - Adds a quick food entry to the active profile's today log (`hane_calorie_daily_records`): Meal Type (`Kahvaltı`, `Öğle`, `Akşam`, `Ara Öğün`), Food Name, Calories (kcal), and optional Protein/Carb/Fat grams.
  3. **Temizlik İşaretle**:
     - Lists all rooms from `hane_cleaning_rooms` sorted by urgency (`Gecikti` first).
     - 1-click **"Temizlendi"** button logs a cleaning record for today with the active profile's name.
  4. **Alışverişe Ekle**:
     - Item Name + Category selector -> appends directly to `hane_custom_shopping_items`.

---

## 2. Screen-by-Screen Functional Specification

---

### Module 1: Genel Bakış — Dashboard (`src/app/page.tsx` — Route: `/`)
- **Purpose**: Unified household overview displaying live status cards for all 10 modules + quick action bar.
- **Interactive Elements & Data Displayed**:
  - **Greeting Header**: Displays active profile's name, current date, and quick-launch buttons for Quick Action (`+ Hızlı İşlem Ekle`), Settings, and Profile switching.
  - **Today's Alerts Strip**: Highlights urgent items across modules (e.g., today's calendar events, overdue cleaning rooms, upcoming credit card due dates).
  - **Module Summary Bento Grid** (clicking any card navigates to that module):
    1. **Hane Gider**: Current month's total shared expense, total personal expense, budget usage %, and Mert/Havsa net settlement balance.
    2. **Hane Yemek**: Tonight's planned meal name (or "Planlanmadı" CTA) + count of unchecked weekly recipe ingredients.
    3. **Alışveriş**: Count of pending custom grocery items + pending recipe ingredients.
    4. **Hane Takvim**: Next upcoming event/special day with countdown badge.
    5. **Hane Temizlik**: Counts of Clean (`Temiz`), Approaching (`Yaklaşıyor`), and Overdue (`Gecikti`) rooms.
    6. **Hane Kalori**: Active profile's today calorie intake vs. daily target kcal + progress bar.
    7. **Hane Fit**: Active profile's latest weight (kg), BMI, and body fat %.
    8. **Dilek & İstek**: Pending wishlist count & total estimated cost.
    9. **Düğün & Çeyiz**: Purchased vs. total trousseau item progress % + total Kumbara net worth (`₺`).
    10. **Hane Araç**: Total vehicle expenses & nearest upcoming vehicle reminder (inspection/insurance).

---

### Module 2: Hane Takvim (`src/app/calendar/page.tsx` — Route: `/calendar`)
- **Components**: `CalendarView.tsx`, `CalendarEventModal.tsx`, `CalendarAiModal.tsx`, `TodayEventBanner.tsx`.
- **Features & Interactions**:
  1. **Today Event Banner (`TodayEventBanner.tsx`)**: Shown at the top if there are events today; includes a dismiss button (`×`).
  2. **Header Actions**:
     - **"✨ AI Asistan"** button -> opens `CalendarAiModal`.
     - **"+ Etkinlik Ekle"** button -> opens `CalendarEventModal` for today or selected date.
  3. **Special Days Horizontal Strip ("Özel Günler & Geri Sayım")**:
     - Displays events marked as `isSpecialDay: true` or categorized as `birthday` / `anniversary` / `holiday` with days-remaining countdown badges (`Bugün!`, `X gün kaldı`).
     - Supports annual recurrence (`isRecurringYearly`: automatically rolls date forward to next year once passed).
  4. **Upcoming Reminders Strip ("Yaklaşan Hatırlatmalar")**:
     - Lists events whose reminder window (`reminderDaysBefore`: 0, 1, 3, 7, 14, or 30 days) is currently active.
  5. **Interactive Monthly Calendar Grid**:
     - Month/Year navigation (`< Önceki Ay`, `Bugün`, `Sonraki Ay >`).
     - 7-column Monday-start grid showing day numbers, color-coded event pills (`general`, `birthday`, `anniversary`, `bill`, `health`, `holiday`, `other`), and a hover `+` button on each cell.
     - Clicking a day selects it and opens/filters the day detail panel; clicking an event pill opens `CalendarEventModal` in edit mode.
  6. **Create/Edit Event Modal (`CalendarEventModal.tsx`)**:
     - Fields: Title, Date (`YYYY-MM-DD`), Time (`HH:mm` optional), Category (7 types with distinct colors/emojis), Description, **"Özel Gün / Geri Sayım"** checkbox, **"Her Yıl Tekrarla"** checkbox, and **"Kaç Gün Önceden Hatırlatılsın?"** select.
     - Includes Delete button with confirmation when editing an existing event.
  7. **Calendar AI Modal (`CalendarAiModal.tsx` -> `/api/calendar-ai`)**:
     - Uses `hane_gemini_api_key` (prompts user to enter key if missing).
     - Chat interface where users can ask questions about their schedule or type natural-language commands (e.g., *"Her yıl 14 Şubat'a Evlilik Yıldönümü ekle"*, *"Bu ayki etkinlikleri sil"*).
     - Processes structured JSON actions returned by Gemini (`add`, `update`, `delete`) directly against `calendarStorage` and displays confirmation chips.

---

### Module 3: Hane Yemek (`src/app/dinner/*` — Routes: `/dinner`, `/dinner/meals`, `/dinner/meals/new`, `/dinner/meals/[id]/edit`)
- **Components**: `TodayMealBanner.tsx`, `WeekPlan.tsx`, `ShoppingList.tsx`, `MealForm.tsx`, `DeleteMealButton.tsx`, `MealReminderModal.tsx`.
- **Features & Interactions**:
  1. **Dinner Home (`/dinner`)**:
     - **Header**: Links to **"Yemek Listesi"** (`/dinner/meals`), **"+ Yeni Yemek"** (`/dinner/meals/new`), and **Notification Bell** (`MealReminderModal`).
     - **Today Meal Banner (`TodayMealBanner.tsx`)**: Displays tonight's assigned meal, ingredient tags, and preparation notes (or a prompt to assign one).
     - **7-Day Weekly Planner (`WeekPlan.tsx`)**:
       - Week switcher (`← Önceki Hafta`, `Bu Hafta`, `Sonraki Hafta →`) based on ISO Monday (`src/lib/date/week.ts`).
       - Displays 7 day cards (Pazartesi–Pazar) with today highlighted.
       - Each day card has a **searchable Meal Picker modal/dropdown** to assign a saved recipe from `hane-dinner:meals`, plus an inline **Quick-Create Meal** flow if the typed meal doesn't exist yet, and a **"Kaldır"** button to clear the day.
       - Every change automatically recalculates `hane-dinner:shopping` (aggregating ingredients across all meals planned for the active week while preserving checked states).
     - **Embedded Weekly Shopping List (`ShoppingList.tsx`)**:
       - Displays aggregated ingredients for the selected week, grouped into unchecked ("Alınacaklar") and checked ("Tamamlananlar"), with progress bar and "Listeyi Sıfırla" action.
  2. **Recipe Vault (`/dinner/meals`)**:
     - Search input filtering recipes by title or ingredient name.
     - Recipe cards showing title, ingredient count, ingredient pills, prep notes preview, **"Düzenle"** link (`/dinner/meals/[id]/edit`), and `DeleteMealButton` (deleting a meal also removes it from weekly plans and recalculates shopping).
  3. **Recipe Create/Edit Form (`MealForm.tsx` at `/dinner/meals/new` & `/dinner/meals/[id]/edit`)**:
     - Meal Title (`required`), Preparation Notes (textarea), and dynamic Ingredient rows (Name, Amount, Unit: `adet`, `gram`, `kg`, `ml`, `litre`, `paket`, `yemek kaşığı`, `çay kaşığı`, `su bardağı`, `diş`, `demet`).

---

### Module 4: Alışveriş (`src/app/shopping/page.tsx` — Route: `/shopping`)
- **Components**: `CustomShoppingList.tsx`, `FoodShoppingSyncList.tsx`, `WhatsAppShareModal.tsx`.
- **Features & Interactions**:
  1. **2-Tab Switcher**:
     - **Genel Alışveriş Listesi** (`CustomShoppingList`): Standalone household shopping items (`hane_custom_shopping_items`).
     - **Yemek Planı Malzemeleri** (`FoodShoppingSyncList`): Live mirror of `hane-dinner:shopping` generated by `/dinner`, grouped by recipe or ingredient, with week switcher.
  2. **Custom Shopping List Features**:
     - Quick-add bar: Item name, quantity/note, and Category selector (Market, Manav, Kasap, Temizlik, Kişisel Bakım, Fırın, Diğer + ability to add/delete custom categories in `hane_custom_shopping_categories`).
     - Category filter pills + search input.
     - Progress bar showing completed vs. total items.
     - Bulk actions: **"Alınanları Temizle"** (removes checked items) and **"Tümünü Sil"**.
  3. **WhatsApp Export (`WhatsAppShareModal.tsx`)**:
     - Allows selecting Custom List items, Dinner Plan ingredients, or both.
     - Generates a formatted Turkish checklist with emojis, lets user preview/edit the text, copy to clipboard, or open `https://wa.me/?text=...`.

---

### Module 5: Hane Temizlik (`src/app/cleaning/page.tsx` — Route: `/cleaning`)
- **Components**: `RoomStatusCards.tsx`, `QuickCleanModal.tsx`, `AddRoomModal.tsx`, `CleaningHistoryList.tsx`, `CleaningReminderModal.tsx`.
- **Features & Interactions**:
  1. **Default Room Seeding**: On first load, seeds default rooms (Salon, Mutfak, Banyo, Yatak Odası, Tuvalet, Balkon/Antre) if `hane_cleaning_reset_done` is not set.
  2. **Header & Summary KPIs**:
     - Shows counts of **Temiz** (Green), **Yaklaşıyor** (Amber — within last 25% of target interval or `>= 75%` elapsed), and **Gecikti** (Red — days since last cleaned `>= targetIntervalDays` or never cleaned).
     - Action buttons: **"🧹 Hızlı Temizlik Ekle"** (`QuickCleanModal`), **"+ Oda Ekle"** (`AddRoomModal`), and **Reminder Settings** (`CleaningReminderModal`).
  3. **Room Freshness Grid (`RoomStatusCards.tsx`)**:
     - Each room card displays room name, target interval (`Her X günde bir`), days elapsed since last cleaning, last cleaned by whom, visual freshness progress bar, 1-click **"Temizlendi İşaretle"** button, and room delete button.
  4. **Quick Clean Modal (`QuickCleanModal.tsx`)**:
     - Allows selecting an existing room OR typing a custom ad-hoc area, picking the date/time, selecting who cleaned it (defaults to active profile), and adding optional notes (e.g., "Camlar silindi, perde yıkandı").
  5. **Cleaning History (`CleaningHistoryList.tsx`)**:
     - Chronological log of past cleaning records with room name, cleaner badge, date, notes, and delete button.

---

### Module 6: Dilek & İstek (`src/app/wishlist/page.tsx` — Route: `/wishlist`)
- **Components**: `WishlistView.tsx`, `WishlistModal.tsx`.
- **Features & Interactions**:
  1. **Summary Bar**: Total items, Pending ("Bekleyen") count, Purchased ("Alınan") count, and Total Estimated Budget (`₺`) of pending items.
  2. **Filters & View Modes**:
     - Status Tabs: **Tümü**, **Alınacaklar** (`pending`), **Alınanlar** (`purchased`).
     - Filters: Category filter (`Teknoloji`, `Ev & Yaşam`, `Giyim`, `Kitap & Hobi`, `Kozmetik`, `Diğer`), Priority filter (`Yüksek`, `Orta`, `Düşük`), Owner/Profile filter, and Sort order (Priority, Price High/Low, Newest).
     - View Mode Toggle: **Grid View** (image cards) vs. **List View** (compact rows).
  3. **Item Cards**:
     - Displays product image (or category placeholder), priority badge, category badge, owner name, estimated price (`₺`), external store link (`Ürüne Git ↗`), notes, 1-click **"Alındı İşaretle"** toggle, Edit button, and Delete button.

---

### Module 7: Düğün & Çeyiz (`src/app/wedding/page.tsx` — Route: `/wedding`)
- **Components**: `WeddingOzetKartlari.tsx`, `WeddingItemModal.tsx`, `KumbaraModal.tsx`.
- **Features & Interactions**:
  1. **Top KPI Cards (`WeddingOzetKartlari.tsx`)**:
     - **Toplam Bütçe / Hedef**, **Toplam Harcanan** (purchased items), **Kalan Bütçe**, **Tamamlanma Oranı (%)**, and **Kumbara Net Birikim (`₺`)** with button to open `KumbaraModal`.
  2. **Category Progress & Filtering**:
     - Predefined & custom categories: *Beyaz Eşya, Mobilya, Küçük Ev Aletleri, Mutfak & Sofra, Ev Tekstili, Elektronik, Düğün Organizasyonu, Diğer*.
     - Category filter pills showing completion count and spent total per category.
     - Status filter (**Tümü**, **Alınacaklar**, **Alınanlar**), Payer filter (**Tümü**, **Mert**, **Havsa**, **Ortak**), and search bar.
  3. **Wedding Item Modal (`WeddingItemModal.tsx`)**:
     - Fields: Item Name, Category, Brand/Model, Status (`Alınacak` / `Alındı`), Estimated Price (`₺`), Actual Purchase Price (`₺`), Who Paid (`Mert`, `Havsa`, `Ortak`), Payment Method (`Nakit` / `Taksitli` with installment count), Product Link, and Notes.
  4. **Kumbara (Piggy Bank) Modal (`KumbaraModal.tsx`)**:
     - Tracks wedding savings across multiple asset types: **Gram Altın**, **Çeyrek Altın**, **Yarım Altın**, **Tam Altın**, **Dolar ($)**, **Euro (€)**, and **TL Nakit (₺)**.
     - Includes editable live exchange/gold unit prices (`kurBilgileri`) so total `₺` value is dynamically calculated, plus a transaction log for adding/withdrawing assets.

---

### Module 8: Hane Araç / CarDoList (`src/app/cardolist/page.tsx` — Route: `/cardolist`)
- **Component**: `CarDoModule.tsx` (styled via `CarDo.module.css`).
- **Features & Interactions**:
  1. **KPI Summary Row**:
     - Total All-Time Vehicle Expense (`₺`), Selected Month/Year Expense (`₺`), Total Record Count, and Nearest Upcoming Reminder Countdown.
  2. **Upcoming Vehicle Reminders Banner**:
     - Tracks expenses/events with a future `reminderDate` (e.g., *Muayene, Trafik Sigortası, Kasko, Periyodik Bakım, Lastik Değişimi*), showing days remaining (`Gecikti`, `Bugün`, `X gün kaldı`).
  3. **Expense Ledger & Filters**:
     - Filter by Category (*Yakıt, Bakım/Servis, Sigorta/Kasko, Muayene, Vergi (MTV), Yıkama/Kuaför, Aksesuar, Ceza/HGS, Diğer* + custom categories), Month/Year filter, and text search.
     - Category Breakdown horizontal progress bars showing percentage share of total vehicle spend.
  4. **Modals inside `CarDoModule.tsx`**:
     - **Add/Edit Expense Modal**: Title, Amount (`₺`), Date, Category, Odometer (KM), Notes, and optional Reminder Date (`Hatırlatma Tarihi`).
     - **Category Manager Modal**: Create custom vehicle categories or hide/restore default categories (`cardo_HiddenDefaults_v1`).

---

### Module 9: Hane Kalori (`src/app/kalori/page.tsx` — Route: `/kalori`)
- **Components**: `CalorieHeader.tsx`, `CalorieSummaryCards.tsx`, `MealSection.tsx`, `AddMealModal.tsx`, `EditTargetModal.tsx`, `FetchDinnerModal.tsx`, `SaveTemplateModal.tsx`, `ApiKeyModal.tsx`.
- **Features & Interactions**:
  1. **Profile & Date Header (`CalorieHeader.tsx`)**:
     - Bound to global `activeProfile` (displays warning/selector if no profile is active).
     - Date navigation (`< Önceki Gün`, date picker, `Bugün`, `Sonraki Gün >`).
     - Action buttons: **"🍽️ Akşam Yemeğini Çek"** (`FetchDinnerModal`), **"🎯 Hedef Düzenle"** (`EditTargetModal`), and **"🔑 AI Anahtarı"** (`ApiKeyModal`).
  2. **Calorie & Macro Summary (`CalorieSummaryCards.tsx`)**:
     - Circular SVG ring gauge showing Consumed kcal vs. Target kcal and Remaining/Over kcal.
     - 3 Macro cards with progress bars: **Karbonhidrat (g)**, **Protein (g)**, **Yağ (g)**.
  3. **4 Meal Slot Sections (`MealSection.tsx`)**:
     - **Kahvaltı**, **Öğle Yemeği**, **Akşam Yemeği**, **Ara Öğünler**.
     - Each slot shows total kcal, macro pills, list of logged food items (with inline quantity adjustment & delete button), **"Şablon Olarak Kaydet"** (`SaveTemplateModal`), and **"+ Yemek Ekle"** (`AddMealModal`).
  4. **Multi-Mode Add Meal Modal (`AddMealModal.tsx` — 1,440 lines)**:
     - **Tab 1: ✨ Yapay Zeka (AI) ile Ekle**:
       - Text prompt (e.g., *"1 porsiyon kuru fasulye, 1 kase pilav, 1 bardak ayran"*) AND/OR **Photo Upload / Camera Capture** (base64 image sent to `/api/calorie-ai` using Gemini 2.5 Flash).
       - Returns itemized foods with estimated grams, kcal, protein, carb, and fat; user can adjust multipliers/portions before clicking "Öğüne Ekle".
     - **Tab 2: ✍️ Manuel / Kayıtlı Yemekler**:
       - Search built-in Turkish food database + user's `hane_calorie_saved_foods` + `hane_calorie_food_history`.
       - Supports portion/unit conversion (`porsiyon`, `gram`, `adet`, `su bardağı`, `yemek kaşığı`, `kase`, `dilim`) with automatic macro scaling.
       - Allows entering a custom food from scratch and optionally saving it to `hane_calorie_saved_foods`.
     - **Tab 3: 📋 Kayıtlı Şablonlar (Menüler)**:
       - 1-click insertion of saved multi-item meal templates (`hane_calorie_saved_templates`).
  5. **Fetch Dinner Modal (`FetchDinnerModal.tsx`)**:
     - Reads the meal planned for the selected date from `hane-dinner:plans`, sends its title & ingredients to `/api/calorie-ai` (or allows manual macro entry), and adds it to the **Akşam Yemeği** slot.
  6. **Edit Target Modal (`EditTargetModal.tsx`)**:
     - Calculates BMR (Mifflin-St Jeor) & TDEE from the active profile's gender, age, height, latest weight from `hane_fit_measurements`, and activity level + goal (Lose/Maintain/Gain weight), or lets the user enter a manual kcal target.

---

### Module 10: Hane Fit (`src/app/fit/*` — Routes: `/fit/dashboard`, `/fit/measurements`, `/fit/measurements/new`, `/fit/profiles`, `/fit/profiles/new`)
- **Components**: `src/app/fit/layout.tsx`, `MeasurementModal.tsx`, `ProgressCharts.tsx`.
- **Domain Math (`src/domain/bodyCalculations.ts`)**:
  - **BMI**: $\text{weight} / (\text{height}/100)^2$ with WHO category badge.
  - **US Navy Body Fat %**: Uses height, neck, waist (and hip for females); falls back to BMI-based Deurenberg formula if neck/waist are omitted.
  - **Fat Mass (kg)** & **Lean Body Mass (kg)**.
  - **Waist-to-Height Ratio (WHtR)** cardiovascular risk classification.
- **Features & Interactions**:
  1. **Fit Dashboard (`/fit/dashboard`)**:
     - **KPI Row**: Current Weight (with delta from initial & previous measurement), Body Fat %, BMI, Lean Body Mass, and Waist-to-Height ratio.
     - **Interactive SVG Progress Charts (`ProgressCharts.tsx`)**:
       - Toggle between **Temel Vücut Analizi** (Weight, Body Fat %, BMI, Waist, Neck, Hip) and **Kas Çevre Ölçümleri** (Chest, Shoulder, Right/Left Arm, Forearm, Right/Left Thigh, Calf).
       - Pure SVG responsive area/line chart with interactive data points + initial-vs-latest comparison table showing net change ($\Delta$).
     - **Measurement History Cards**:
       - Expandable chronological cards showing body metrics, muscle metrics, notes, **"Düzenle"** button (opens `MeasurementModal` pre-filled), and **"Sil"** button (opens custom confirmation modal).
  2. **Measurement Modal (`MeasurementModal.tsx`)**:
     - 2 Tabs: **Temel Ölçümler** (Date, Weight kg `required`, optional Neck, Waist, Hip, Notes) and **Kas Ölçümleri** (Chest, Shoulder, Arms, Forearms, Thighs, Calves).
  3. **Secondary Routes (`/fit/measurements`, `/fit/measurements/new`, `/fit/profiles`, `/fit/profiles/new`)**:
     - `/fit/profiles` manages household profiles (selecting active profile, adding a new profile, deleting a profile and its measurements).

---

### Module 11: Hane Gider (`src/app/gider/page.tsx` — Route: `/gider`)
- **Components**: `EvGiderleriSayfasiV2.tsx`, `GiderV2Header.tsx`, `GiderV2KpiCards.tsx`, `GiderV2MahsuplasmaCard.tsx`, `GiderV2CardList.tsx`, `GiderV2LedgerTable.tsx`, `GiderV2BireyselGelirSection.tsx`, `GiderV2Modals.tsx`, and `src/components/gider/taksit/*`.
- **Core Business Logic (`ekstreHesapla.ts`, `ayDeposu.ts`, `taksitStorage.ts`)**:
  - Each month (`YYYY-MM`) is stored independently in `hane-gider-ay:YYYY-MM`.
  - When a new month is opened for the first time, credit cards and monthly budget carry over automatically from the previous month.
  - **Credit Card Billing Cycle Simulator (`ekstreHesapla.ts`)**: Calculates Active Statement (`buAyOdenecek`), Next Month Rollover (`sonrakiAyaDevreden`), Previous Unpaid Balance (`gecmisDonemBorcu`), Minimum Payment (20% or 40%), and Statement Status (`kesildi_odenmedi`, `odendi`, `kesilmedi`, `gecikti`) based on statement cutoff day (`hesapKesimGunu`) and due day (`sonOdemeGunu`).
  - **50/50 Settlement (`Mahsuplaşma`) Engine**:
    - Aggregates all shared household expenses (`ortakHarcamalar`) paid by **Mert** vs. **Havsa**, accounts for cash settlements (`paraTransferleri`), and computes exact net debt (who owes whom how much `₺` so both partners contribute equally to shared expenses).
- **Tab 1: Aylık Giderler (`EvGiderleriSayfasiV2`)**:
  1. **Header (`GiderV2Header.tsx`)**:
     - Month/Year switcher (`<`, Month Picker, `>`).
     - Action buttons: **"+ Ortak Gider"**, **"+ Bireysel Gider"**, **"🔄 Taksitleri Aktar"** (`TaksitAktarimModal`), **Budget Edit**, and **JSON Backup/Restore dropdown**.
     - Rollback banner shown if installments were synced to the current month (`"Son Taksit Aktarımını Geri Al"` using `hane-gider-taksit-yedek:YYYY-MM`).
  2. **4 KPI Cards (`GiderV2KpiCards.tsx`)**:
     - Toplam Hane Gideri (Ortak + Bireysel), Ortak Giderler (with Mert/Havsa split bar), Bireysel Giderler (Mert vs. Havsa), and Aylık Bütçe Durumu (progress bar + remaining/exceeded `₺`).
  3. **Mahsuplaşma Card (`GiderV2MahsuplasmaCard.tsx`)**:
     - Shows Mert's total shared spend, Havsa's total shared spend, fair share per person (50%), net settlement banner (*"Havsa -> Mert'e X ₺ ödemeli"* or *"Hesaplar Denk"*), **"+ Transfer / Ödeme Kaydet"** button, and recorded transfer history list.
  4. **Credit Cards Section (`GiderV2CardList.tsx`)**:
     - Lists household credit cards with owner badge (`Mert` / `Havsa`), cutoff/due day badges, statement total, rollover total, **"Ödendi İşaretle"** toggle, Edit button, and Delete button.
  5. **Shared Expense Ledger (`GiderV2LedgerTable.tsx`)**:
     - Filter by Category (*Market, Fatura, Kira/Aidat, Yeme-İçme, Ev Eşyası, Ulaşım, Sağlık, Eğlence, Taksit, Diğer*), Payer (`Mert` / `Havsa`), Payment Method (`Kart` / `Nakit`), and Search query.
     - Desktop table + Mobile card view with Edit & Delete actions.
  6. **Personal Expenses & Incomes (`GiderV2BireyselGelirSection.tsx`)**:
     - Collapsible/tabbed section tracking Mert's and Havsa's individual non-shared expenses (`bireyselHarcamalar`) and monthly incomes (`gelirler`) to compute net personal cashflow.
- **Tab 2: Taksit Takibi (`TaksitSayfasi.tsx`)**:
  1. **KPIs**: Total Remaining Installment Debt (`₺`), This Month's Installment Total (`₺`), Active Installment Plans count, and Estimated Debt-Free Date (`Borç Bitiş Tarihi`).
  2. **Installment Card Groups (`TaksitKartGrubu.tsx`)**:
     - Groups active installment plans by credit card.
     - Shows installment progress (`3/6 Taksit`), monthly installment table, ability to toggle individual months as Paid/Unpaid, **"Erken Kapat"** (early payoff), Edit, and Delete.
  3. **12-Month Projection Matrix (`TaksitProjeksiyonu.tsx`)**:
     - Visualizes total installment burden across the next 12 months broken down by card and owner.
  4. **Selective Installment Sync (`TaksitAktarimModal.tsx`)**:
     - Previews installments due in the selected month, detects duplicates already synced, lets the user check/uncheck specific installments, choose target category (`Ortak` vs `Bireysel`), and sync them into `hane-gider-ay:YYYY-MM`.

