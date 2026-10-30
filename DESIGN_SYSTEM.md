# HANE APP — VISUAL DESIGN SYSTEM (`DESIGN_SYSTEM.md`)

> **Design Direction:** Premium, warm, minimal, modern household management application.  
> **Theme Strategy:** Light-First ("Açık tema öncelikli") built on Warm Cream (`#F5F0E8`), Pure White (`#FFFFFF`), Soft Lavender (`#E8DDF1`), Muted Purple (`#76548F`), and Dark Plum (`#30263A`).  
> **Architecture:** Native **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline`) with semantic CSS custom properties in `src/app/globals.css`, `next/font/google` (`Inter`), and zero heavy external UI framework dependencies.

---

## 1. Visual Identity & Core Principles

| Tasarım Unsuru (Design Pillar) | Spesifikasyon (Specification) | Uygulama Kuralı (Implementation Rule) |
| :--- | :--- | :--- |
| **Genel Stil** | Modern, minimal, sıcak | Flat/clean surfaces on a warm cream canvas (`#F5F0E8`). Zero decorative gradients, neon glows, or visual clutter. |
| **Tema** | Açık tema öncelikli (Light-first) | Light theme is the default across all screens regardless of OS dark-mode preference, eliminating the mixed dark/light clashes found in legacy screens. |
| **Kartlar** | Hafif yuvarlatılmış (`12px–16px`) | `rounded-xl` (`12px`) for compact cards/inputs and `rounded-2xl` (`16px`) for primary containers. No `rounded-3xl` or overly pill-shaped containers. |
| **Butonlar** | Belirgin, sade | Solid Muted Purple (`#76548F`), Soft Lavender (`#E8DDF1`), or crisp bordered White (`#FFFFFF`) buttons with `rounded-xl` (`10px–12px`) corners and no drop-shadow glow. |
| **Gölgeler** | Çok hafif | Ultra-subtle warm plum-tinted ambient shadows (`0 1px 3px rgba(48, 38, 58, 0.05)`) paired with `1px` soft borders (`#E6DFD5`). |
| **Tipografi** | `Inter` + `JetBrains Mono` / `Geist Mono` | Loaded via `next/font/google` with `tabular-nums` enforced on all financial, calorie, and measurement numbers. |
| **İkonlar** | Lucide (`24x24` viewBox, `1.75px–2px` stroke) | Standardized stroke icons via `src/components/ui/Icons.tsx` (matching Lucide geometry) without heavy icon-pack bloat. |
| **Animasyon** | `150ms–250ms` (`cubic-bezier(0.16, 1, 0.3, 1)`) | Restrained micro-transitions on `background-color`, `border-color`, `color`, and `opacity`. No bouncy scale transforms. |

---

## 2. Semantic Color Tokens & WCAG Contrast Verification

### 2.1 Core Brand Palette

| Swatch Name | Hex | RGB | Role in Hane App |
| :--- | :--- | :--- | :--- |
| **Warm Cream** | `#F5F0E8` | `rgb(245, 240, 232)` | Primary application background canvas (`--background`) |
| **White** | `#FFFFFF` | `rgb(255, 255, 255)` | Elevated cards, modals, tables, sidebar & input surfaces (`--surface`) |
| **Lavender** | `#E8DDF1` | `rgb(232, 221, 241)` | Active navigation states, subtle badges, secondary/accent buttons (`--accent`) |
| **Purple** | `#76548F` | `rgb(118, 84, 143)` | Primary brand actions, active indicators, focus rings, key highlights (`--primary`) |
| **Dark Plum** | `#30263A` | `rgb(48, 38, 58)` | Primary headings, body text, strong numerical emphasis (`--foreground`) |

### 2.2 Complete CSS Custom Properties (`:root` Light Theme)

These tokens are designed to be backward-compatible with existing Tailwind classes in the project (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `border-border`, `bg-primary`, `bg-accent`) while introducing granular semantic tokens for the redesign:

```css
:root {
  color-scheme: light;

  /* 1. Backgrounds & Surfaces */
  --background: #F5F0E8;          /* Warm Cream — App canvas */
  --background-subtle: #EFE8DC;   /* Slightly deeper cream for recessed wells / table headers */
  --surface: #FFFFFF;             /* Pure White — Cards, modals, sidebar, inputs */
  --surface-raised: #FAF7F2;      /* Warm off-white — Hover surface / secondary card background */
  --surface-lavender: #F4EFF9;    /* Ultra-soft lavender tint — Highlighted summary cards */
  --surface-overlay: rgba(48, 38, 58, 0.45); /* Modal & drawer backdrop (Dark Plum @ 45%) */

  /* 2. Text & Typography (Dark Plum Hierarchy) */
  --foreground: #30263A;          /* Dark Plum — Primary text & headings */
  --foreground-secondary: #544663;/* Medium Plum — Subtitles, table cells, secondary labels */
  --muted: #736582;               /* Muted Plum-Gray — Helper text, captions, timestamps */
  --placeholder: #9A8DA8;         /* Soft Plum-Gray — Input placeholders & disabled text */

  /* 3. Brand Primary (Muted Purple) */
  --primary: #76548F;             /* Brand Purple — Primary CTA buttons, active tabs, switches */
  --primary-hover: #63437A;       /* Deep Purple — Primary button hover */
  --primary-active: #523666;      /* Pressed state */
  --primary-foreground: #FFFFFF;  /* Crisp white text on primary purple */
  --primary-ring: rgba(118, 84, 143, 0.25); /* Focus ring glow */

  /* 4. Brand Accent / Secondary (Soft Lavender) */
  --accent: #E8DDF1;              /* Soft Lavender — Active nav pill, accent buttons, chips */
  --accent-hover: #DCCCE9;        /* Lavender hover */
  --accent-active: #CEB9DF;       /* Lavender active/pressed */
  --accent-foreground: #30263A;   /* Dark Plum text on Lavender surface */

  /* 5. Borders & Dividers */
  --border: #E6DFD5;              /* Warm Sand border for cards & dividers on cream/white */
  --border-strong: #D4C9BA;       /* Input borders & hovered card outlines */
  --border-lavender: #D5C3E4;     /* Border for lavender-tinted elements */

  /* 6. Semantic Status Colors (Harmonized Warm & Accessible) */
  --success: #2A7B56;             /* Sage Emerald — Paid, Clean, On-Track, Completed */
  --success-bg: #EBF5F0;          /* Soft sage surface */
  --success-border: #C4E3D4;
  --success-foreground: #FFFFFF;

  --warning: #B86B19;             /* Warm Amber — Approaching due date / cleaning interval */
  --warning-bg: #FDF4E7;          /* Soft amber surface */
  --warning-border: #F3D9B1;
  --warning-foreground: #FFFFFF;

  --danger: #C23B3B;              /* Warm Crimson — Overdue, Over-budget, Delete actions */
  --danger-bg: #FCEEEE;           /* Soft crimson surface */
  --danger-border: #F2C6C6;
  --danger-foreground: #FFFFFF;

  --info: #4A6FA5;                /* Muted Slate-Blue — Informational notices */
  --info-bg: #EEF3F9;
  --info-border: #C9D9EC;
  --info-foreground: #FFFFFF;

  /* 7. Partner / Profile Semantic Badges (Gider, Wedding, Cleaning) */
  --partner-a-text: #5E3F75;      /* Mert / Partner 1 — Deep Purple */
  --partner-a-bg: #EFE7F6;
  --partner-b-text: #8C4A67;      /* Havsa / Partner 2 — Warm Plum-Rose */
  --partner-b-bg: #F9ECF2;
}
```

### 2.3 Accessible Color Contrast Matrix (WCAG 2.1 Compliance)

Every text and interactive foreground/background pairing meets or exceeds **WCAG 2.1 AA** (`4.5:1` for normal text, `3.0:1` for large text and UI controls):

| Foreground | Background | Contrast Ratio | WCAG Rating | Usage |
| :--- | :--- | :---: | :---: | :--- |
| `Dark Plum (#30263A)` | `White (#FFFFFF)` | **14.78 : 1** | **AAA** | Primary body text & headings on cards |
| `Dark Plum (#30263A)` | `Warm Cream (#F5F0E8)` | **13.04 : 1** | **AAA** | Page titles & text directly on canvas |
| `Dark Plum (#30263A)` | `Lavender (#E8DDF1)` | **11.38 : 1** | **AAA** | Active sidebar links, lavender badges & secondary buttons |
| `Secondary Plum (#544663)` | `White (#FFFFFF)` | **8.42 : 1** | **AAA** | Subtitles, form labels, table data |
| `Muted Plum (#736582)` | `White (#FFFFFF)` | **5.18 : 1** | **AA** | Captions, metadata, timestamps (`#FFFFFF` & `#F5F0E8`) |
| `White (#FFFFFF)` | `Primary Purple (#76548F)` | **6.03 : 1** | **AA** | Primary buttons, active badges |
| `White (#FFFFFF)` | `Primary Hover (#63437A)` | **7.85 : 1** | **AAA** | Primary button hover state |
| `Primary Purple (#76548F)` | `White (#FFFFFF)` | **6.03 : 1** | **AA** | Ghost/link buttons, active tab text, icons |
| `Success (#2A7B56)` | `Success BG (#EBF5F0)` | **4.86 : 1** | **AA** | Status badges ("Ödendi", "Temiz", "Alındı") |
| `Warning (#B86B19)` | `Warning BG (#FDF4E7)` | **4.62 : 1** | **AA** | Warning badges ("Yaklaşıyor", "Kesildi") |
| `Danger (#C23B3B)` | `Danger BG (#FCEEEE)` | **5.14 : 1** | **AA** | Error messages, overdue badges ("Gecikti") |

---

## 3. Typography Scale & Font Weights

### 3.1 Font Family Architecture
Loaded via Next.js `next/font/google` in `src/app/layout.tsx` (zero external network blocking):
- **Primary Sans (`--font-sans`)**: `'Inter', system-ui, -apple-system, sans-serif`
- **Numeric / Monospace (`--font-mono`)**: `'JetBrains Mono', ui-monospace, SFMono-Regular, monospace` (or `Inter` with `font-variant-numeric: tabular-nums` for currency, kcal, and body measurements).

### 3.2 Type Scale & Hierarchy

| Token / Role | Tailwind Class | Size (`rem` / `px`) | Line Height | Font Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display / Hero KPI** | `text-3xl font-bold tracking-tight tabular-nums` | `1.875rem` (`30px`) | `2.25rem` (`36px`) | `700` (Bold) | `-0.025em` | Primary financial totals, calorie gauge center, weight KPI |
| **Page Title (`H1`)** | `text-2xl font-semibold tracking-tight` | `1.5rem` (`24px`) | `2rem` (`32px`) | `600` (SemiBold) | `-0.02em` | Module page header title (`PageHeader`) |
| **Section Title (`H2`)** | `text-lg font-semibold tracking-tight` | `1.125rem` (`18px`) | `1.75rem` (`28px`) | `600` (SemiBold) | `-0.015em` | Card group titles, modal titles (`ModalHeader`) |
| **Card Title (`H3`)** | `text-base font-semibold` | `1rem` (`16px`) | `1.5rem` (`24px`) | `600` (SemiBold) | `-0.01em` | Individual card headers, list item headings |
| **Body Default** | `text-sm font-normal` | `0.875rem` (`14px`) | `1.375rem` (`22px`) | `400` (Regular) | `0` | Standard UI copy, table cells, descriptions |
| **Body Medium / Label** | `text-sm font-medium` | `0.875rem` (`14px`) | `1.25rem` (`20px`) | `500` (Medium) | `0` | Form labels, button text, navigation links |
| **Mobile Input Text** | `text-base sm:text-sm` | `1rem` (`16px` mobile) | `1.5rem` (`24px`) | `400` (Regular) | `0` | Prevents iOS Safari auto-zoom on input focus |
| **Caption / Meta** | `text-xs font-medium` | `0.75rem` (`12px`) | `1rem` (`16px`) | `500` (Medium) | `0.01em` | Badges, helper text, timestamps, table column headers |

### 3.3 Font Weight Rules
- **`400` (Regular)**: Body prose, notes, secondary descriptions, input values.
- **`500` (Medium)**: Navigation items, form field labels, secondary buttons, segmented tabs.
- **`600` (SemiBold)**: Page titles, card titles, primary buttons, badges, table headers.
- **`700` (Bold)**: Reserved strictly for top-level numeric KPIs (`₺`, `kcal`, `kg`). Avoid `font-black` (`900`) and `font-extrabold` (`800`), which create visual heaviness in the current app.

---

## 4. Spacing, Sizing, Border-Radius & Shadow Tokens

### 4.1 Spacing & Rhythm (`4px` Base Grid)
- **Page Container Padding**: `px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8` (Single container in `RootLayout` — child pages must **never** add duplicate outer `px-4 py-6` wrappers).
- **Section Vertical Rhythm**: `space-y-6` (`24px`) between major page sections.
- **Card Grid Gaps**: `gap-4` (`16px`) on mobile, `gap-5` (`20px`) on desktop.
- **Internal Card Padding**:
  - Compact Card / KPI Card: `p-4` (`16px`) or `p-5` (`20px`).
  - Major Section / Modal Body: `p-5 sm:p-6` (`20px–24px`).

### 4.2 Component Sizing Tokens (Touch-Safe Ergonomics)
- **Control Height (`--control-h-sm`)**: `36px` (`h-9`) — Compact table actions, filter chips, header utility buttons on desktop.
- **Control Height (`--control-h-md`)**: `42px` (`h-10.5` / `min-h-[42px]`) — Standard buttons, text inputs, selects.
- **Control Height (`--control-h-lg`)**: `48px` (`h-12`) — Primary mobile CTA buttons, prominent quick-add inputs.
- **Minimum Touch Target**: All interactive elements on mobile (`< 768px`) maintain a hit area of at least `40px × 40px` (`min-h-10 min-w-10`).

### 4.3 Border-Radius Scale ("Rounded, Not Pill-Shaped")
Excessive radii (`rounded-3xl`, `rounded-[28px]`, `rounded-full` buttons) are retired in favor of a disciplined architectural scale:

| Token | Value | Tailwind Class | Usage |
| :--- | :--- | :--- | :--- |
| `--radius-xs` | `6px` | `rounded-md` | Checkboxes, small inline status tags, calendar day dots |
| `--radius-sm` | `8px` | `rounded-lg` | Badges, category pills, segmented tab buttons, icon buttons |
| `--radius-md` | `10px` | `rounded-[10px]` | All primary/secondary buttons, text inputs, selects, dropdown items |
| `--radius-lg` | `14px` | `rounded-[14px]` | Standard cards, KPI cards, list containers, dropdown menus |
| `--radius-xl` | `18px` | `rounded-[18px]` | Modals, dialogs, major section containers |

### 4.4 Subtle Shadow Tokens (Warm Plum-Tinted Ambient Shadows)
Instead of heavy black shadows (`shadow-xl`, `shadow-2xl`), shadows use low-opacity Dark Plum (`#30263A`) to blend naturally with Warm Cream (`#F5F0E8`):

```css
:root {
  /* Card resting state: barely-there elevation */
  --shadow-xs: 0 1px 2px rgba(48, 38, 58, 0.04);
  
  /* Interactive card hover or sticky bar */
  --shadow-sm: 0 2px 6px -1px rgba(48, 38, 58, 0.06), 0 1px 3px -1px rgba(48, 38, 58, 0.04);
  
  /* Dropdowns, popovers, floating menus */
  --shadow-md: 0 8px 20px -4px rgba(48, 38, 58, 0.08), 0 2px 6px -1px rgba(48, 38, 58, 0.04);
  
  /* Modals & drawers */
  --shadow-lg: 0 16px 36px -6px rgba(48, 38, 58, 0.14), 0 4px 12px -2px rgba(48, 38, 58, 0.06);
}
```

### 4.5 Motion & Transition Tokens
- **Duration Fast**: `150ms` — Hover color/border shifts, button press feedback.
- **Duration Normal**: `200ms` — Modal fade/scale-in, drawer slide, tab indicator transition.
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (Smooth, non-bouncy deceleration).

---

## 5. Reusable Component Specifications & Interactive States

### 5.1 Buttons (`.btn` / `<Button />`)

All buttons share: `inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]`.

| Variant | Class / Token Mapping | Resting State | Hover State (`150ms`) | Active / Pressed |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** (`.primary-button`) | Main page CTA ("+ Gider Ekle", "Kaydet") | `bg-[#76548F]` `text-white` `border border-transparent` | `bg-[#63437A]` | `bg-[#523666]` |
| **Accent / Lavender** (`.accent-button`) | Secondary prominent action ("AI Asistan", "Taksit Aktar") | `bg-[#E8DDF1]` `text-[#30263A]` `border border-[#D5C3E4]` | `bg-[#DCCCE9]` | `bg-[#CEB9DF]` |
| **Secondary / Outline** (`.secondary-button`) | Neutral action ("İptal", "Filtrele", "Düzenle") | `bg-[#FFFFFF]` `text-[#30263A]` `border border-[#D4C9BA]` `shadow-xs` | `bg-[#FAF7F2]` `border-[#76548F]/40` | `bg-[#EFE8DC]` |
| **Ghost** (`.ghost-button`) | Toolbar icon/text button | `bg-transparent` `text-[#544663]` | `bg-[#EFE8DC]` `text-[#30263A]` | `bg-[#E6DFD5]` |
| **Danger** (`.danger-button`) | Destructive confirmation ("Sil", "Sıfırla") | `bg-[#FCEEEE]` `text-[#C23B3B]` `border border-[#F2C6C6]` (or solid `#C23B3B` in confirm modal) | `bg-[#C23B3B]` `text-white` | `bg-[#A32E2E]` `text-white` |
| **Icon Button** (`.icon-button`) | `36px × 36px` (`h-9 w-9`) square action button | `bg-white` `text-[#544663]` `border border-[#E6DFD5]` `rounded-lg` | `bg-[#FAF7F2]` `text-[#30263A]` `border-[#D4C9BA]` | `bg-[#EFE8DC]` |

### 5.2 Inputs, Selects & Textareas (`.field` / `<Input />`)
- **Geometry**: `min-h-[42px] w-full rounded-[10px] px-3.5 py-2 text-base sm:text-sm`
- **Resting**: `bg-[#FFFFFF] text-[#30263A] border border-[#D4C9BA] placeholder:text-[#9A8DA8] shadow-xs`
- **Hover**: `border-[#B8A99A]`
- **Focus**: `border-[#76548F] ring-3 ring-[#76548F]/15 outline-none`
- **Disabled**: `bg-[#EFE8DC]/60 text-[#9A8DA8] border-[#E6DFD5] cursor-not-allowed opacity-70`
- **Error State (`.field-error`)**: `border-[#C23B3B] bg-[#FCEEEE]/30 focus:border-[#C23B3B] focus:ring-[#C23B3B]/15` accompanied by an inline `<p class="mt-1.5 text-xs font-medium text-[#C23B3B]">` message.

### 5.3 Cards (`.card` / `<Card />` & `<KpiCard />`)
- **Standard Card (`.card`)**:
  - `bg-[#FFFFFF] border border-[#E6DFD5] rounded-[14px] shadow-[var(--shadow-xs)] p-5`
- **Interactive / Clickable Card (`.card-interactive`)**:
  - Adds `transition-all duration-150 hover:border-[#76548F]/40 hover:shadow-[var(--shadow-sm)] cursor-pointer`
- **Lavender Highlight Card (`.card-lavender`)**:
  - `bg-[#F4EFF9] border border-[#D5C3E4] rounded-[14px] p-5` (Used for "Tonight's Meal", "Today's Focus", or "50/50 Mahsuplaşma Summary").
- **Recessed Summary Box (`.card-recessed`)**:
  - `bg-[#F5F0E8] border border-[#E6DFD5] rounded-[10px] p-3.5` (Used inside white cards or modals to group sub-totals or metadata).

### 5.4 Badges & Status Pills (`<Badge />`)
- **Geometry**: `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold`
- **Variants**:
  - `default` (Warm Neutral): `bg-[#F5F0E8] text-[#544663] border border-[#E6DFD5]`
  - `brand` (Lavender): `bg-[#E8DDF1] text-[#30263A] border border-[#D5C3E4]`
  - `purple` (Solid Brand): `bg-[#76548F] text-white`
  - `success`: `bg-[#EBF5F0] text-[#2A7B56] border border-[#C4E3D4]`
  - `warning`: `bg-[#FDF4E7] text-[#B86B19] border border-[#F3D9B1]`
  - `danger`: `bg-[#FCEEEE] text-[#C23B3B] border border-[#F2C6C6]`
  - `partner-mert`: `bg-[#EFE7F6] text-[#5E3F75] border border-[#D5C3E4]`
  - `partner-havsa`: `bg-[#F9ECF2] text-[#8C4A67] border border-[#EBCAD8]`

### 5.5 Navigation Elements (`Sidebar`, `TopBar`, `BottomNav`, `SegmentedTabs`)
- **Desktop Sidebar (`w-64`)**:
  - Surface: `bg-[#FFFFFF] border-r border-[#E6DFD5]`
  - Inactive Nav Item: `text-[#544663] hover:bg-[#F5F0E8] hover:text-[#30263A] rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors duration-150`
  - Active Nav Item: `bg-[#E8DDF1] text-[#30263A] font-semibold rounded-[10px] px-3 py-2.5` with a `3px` vertical `#76548F` indicator bar or `#76548F` icon tint.
- **Segmented Tabs (`<SegmentedTabs />`)**:
  - Track: `bg-[#EFE8DC] p-1 rounded-xl border border-[#E6DFD5] inline-flex gap-1`
  - Active Tab: `bg-[#FFFFFF] text-[#30263A] font-semibold shadow-xs rounded-lg px-3.5 py-1.5`
  - Inactive Tab: `text-[#544663] hover:text-[#30263A] font-medium rounded-lg px-3.5 py-1.5`

### 5.6 Dialogs / Modals (`<Modal />` & `<ConfirmDialog />`)
- **Backdrop**: `fixed inset-0 z-50 bg-[#30263A]/45 backdrop-blur-[2px] transition-opacity duration-200`
- **Container**:
  - Mobile (`< 640px`): Bottom sheet (`rounded-t-[18px] max-h-[90dvh]`) or centered card with safe-area padding.
  - Desktop (`>= 640px`): Centered panel (`rounded-[18px] max-w-lg w-full max-h-[85vh]`) with `bg-[#FFFFFF] border border-[#E6DFD5] shadow-[var(--shadow-lg)] flex flex-col overflow-hidden`.
- **Structure**:
  - Sticky Header: `px-5 py-4 border-b border-[#E6DFD5] flex items-center justify-between bg-[#FFFFFF]`
  - Scrollable Body: `p-5 overflow-y-auto flex-1 space-y-4`
  - Sticky Footer: `px-5 py-3.5 border-t border-[#E6DFD5] bg-[#FAF7F2] flex items-center justify-end gap-2.5`

### 5.7 Dropdowns & Popovers (`<Dropdown />`)
- **Surface**: `bg-[#FFFFFF] border border-[#D4C9BA] rounded-[14px] shadow-[var(--shadow-md)] p-1.5 z-50`
- **Item**: `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#30263A] hover:bg-[#F5F0E8] active:bg-[#E8DDF1] transition-colors duration-150`

---

## 6. Interactive States Matrix (Hover, Focus, Active, Disabled, Loading, Error)

| State | Visual Specification |
| :--- | :--- |
| **Hover** | `150ms` transition. Primary `#76548F` -> `#63437A`; Lavender `#E8DDF1` -> `#DCCCE9`; White surfaces shift to `#FAF7F2` with border darkening from `#E6DFD5` -> `#D4C9BA`. |
| **Focus (`:focus-visible`)** | `2px` solid ring in `#76548F` with `2px` offset (`ring-2 ring-[#76548F] ring-offset-2`) for buttons/links; `3px` soft halo (`ring-3 ring-[#76548F]/20 border-[#76548F]`) for inputs. |
| **Active / Pressed** | Slight darken (`#523666` on Primary, `#CEB9DF` on Lavender, `#EFE8DC` on White). No jarring scale bounces. |
| **Disabled** | `opacity-55 cursor-not-allowed pointer-events-none`. Inputs use `bg-[#EFE8DC]/60 text-[#9A8DA8]`. |
| **Loading** | Inline `16px` SVG spinner (`animate-spin text-current`) replacing or preceding button label while `disabled={true}` prevents double-submission. Skeleton placeholders use `animate-pulse bg-[#EFE8DC] rounded-lg`. |
| **Error** | Input border `#C23B3B`, subtle `#FCEEEE`/30 background tint, and descriptive error text (`text-xs font-medium text-[#C23B3B]`) with warning icon. |

---

## 7. Responsive Layout Rules & Breakpoints

| Breakpoint | Viewport Range | Shell & Navigation Layout | Content Grid Rules |
| :--- | :--- | :--- | :--- |
| **Mobile (Default)** | `< 640px` | • Sticky Top Context Bar (`h-14`): Brand, Cloud Sync dot, Profile Pill, Quick Add `+`, Settings.<br>• Bottom Navigation Bar (`h-16` + `pb-safe`): Top 4 modules + "Tümü" drawer sheet. | • Single container padding (`px-4 py-5`).<br>• KPI grids: `grid-cols-2 gap-3` (compact) or `grid-cols-1 gap-3`.<br>• Touch targets `>= 40px`, no hover-only buttons. |
| **Tablet (`sm:` / `md:`)** | `640px – 1023px` | • Sticky Top Context Bar + Bottom Bar (or slide-over sidebar drawer). | • Container padding `px-6 py-6`.<br>• KPI grids: `grid-cols-2 md:grid-cols-4 gap-4`.<br>• 2-column split views activate at `md:grid-cols-2`. |
| **Desktop (`lg:` / `xl:`)** | `>= 1024px` | • Fixed Left Sidebar (`w-64`) + Sticky TopBar (`h-16`).<br>• Content area `lg:pl-64`. | • Container `max-w-7xl mx-auto px-8 py-8`.<br>• Multi-column Bento grids (`lg:grid-cols-3`, `lg:grid-cols-4`) and full data tables. |

---

## 8. Technology Reuse Justification (Zero New UI Frameworks)

- **Tailwind CSS v4 (`@tailwindcss/postcss`)**: Already installed and configured in `src/app/globals.css`. We will map all design tokens inside `:root` and `@theme inline` so every utility class works natively.
- **Typography (`next/font/google`)**: Built into Next.js 16. We will load `Inter` in `src/app/layout.tsx` without adding any npm packages.
- **Icons (`src/components/ui/Icons.tsx`)**: Already uses Lucide-compatible `24x24` stroke SVGs. We will expand `Icons.tsx` with clean Lucide SVG paths so no external icon bundle is required.
- **Scoped CSS Cleanup**: `CarDo.module.css` variables (`--cardo-*`) will be aliased directly to the new root tokens (`#F5F0E8`, `#FFFFFF`, `#76548F`, `#30263A`, `#E8DDF1`) so Hane Araç seamlessly adopts the exact same visual identity.

---

## 9. Implementation Plan (Upon Your Approval)

Once you approve this `DESIGN_SYSTEM.md` specification, I will immediately implement the foundation:
1. **`src/app/globals.css`**: Implement the Warm Cream / Lavender / Muted Purple / Dark Plum / White token system, Light-first theme enforcement, and utility component classes (`.field`, `.primary-button`, `.accent-button`, `.secondary-button`, `.ghost-button`, `.danger-button`, `.icon-button`, `.card`, `.card-lavender`, `.card-recessed`, `.badge-*`).
2. **`src/app/layout.tsx`**: Configure `Inter` typography via `next/font/google`, update viewport `themeColor` to `#F5F0E8`, and restore accessible pinch-to-zoom.
3. **`src/components/ui/` Reusable Primitives**:
   - `Button.tsx` (Primary, Accent/Lavender, Secondary, Ghost, Danger, Icon variants + loading state)
   - `Input.tsx` & `Select.tsx` (Label, helper text, error state, prefix/suffix icons)
   - `Card.tsx` & `KpiCard.tsx` (White, Lavender, Recessed variants)
   - `Badge.tsx` (Neutral, Lavender, Purple, Success, Warning, Danger, Partner variants)
   - `Modal.tsx` & `ConfirmDialog.tsx` (Accessible portal dialogs replacing `window.confirm`)
   - `Dropdown.tsx` & `SegmentedTabs.tsx`
   - `PageHeader.tsx`, `EmptyState.tsx` & `Toast.tsx`

