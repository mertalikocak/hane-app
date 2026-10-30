# Hane App — Known Issues & Limitations (`KNOWN_ISSUES.md`)

All Critical, High, and Medium UI/UX, TypeScript, PWA, and Service Worker issues discovered during the redesign and QA audit have been resolved and verified. The remaining items below are pre-existing architectural or environment characteristics documented for transparency.

---

## 1. Open Items (Classified by Severity)

| ID | Severity | Category | Description | Impact & Recommendation |
|---|---|---|---|---|
| **KI-01** | **Low** | Tooling / ESLint | `npm run lint` exits with code `1` because `package.json` specifies `"lint": "eslint"` (ESLint v9.39.5) without an `eslint.config.(js\|mjs\|cjs)` flat configuration file in the repository root. | Does not affect `npm run build` or `npx tsc --noEmit` (both pass with 0 errors). If CLI linting is desired, add a minimal `eslint.config.mjs` importing `eslint-config-next`. |
| **KI-02** | **Low** | Performance / Bundle Size | Firebase Firestore SDK (`firebase/firestore`) is imported in `CloudSyncProvider` at the root layout level, contributing ~480 KB to the shared client JS chunks. | Pre-rendering the App Shell in SSR (`CloudSyncProvider` fix) eliminated the pre-hydration blank screen, and `sw.js` (`v2`) caches static chunks with Cache-First. Future optimization could lazy-load `syncService.ts` via dynamic `import()` inside `useEffect`. |
| **KI-03** | **Low** | External API Dependency | AI features in **Hane Calendar** (`/api/calendar-ai`) and **Hane Kalori** (`/api/calorie-ai`) require a valid Gemini API key (`GEMINI_API_KEY` env var or user-supplied key in `localStorage`), and **Hane Wedding** live gold/FX rates fetch from `truncgil.com`. | Both modules gracefully handle missing keys or offline states (Wedding falls back to manual/cached rates; Calorie & Calendar display clear inline error messages and support full manual entry). |
| **KI-04** | **Low** | Network Topology | Accessing a local development server via a private LAN IP (`192.168.x.x`) over Wi-Fi and then switching the mobile device to Cellular Data will fail to reach the private LAN IP. | Expected networking behavior for RFC1918 private addresses. Production/cloud deployments (e.g., Vercel/HTTPS domain) combined with `hane-app-cache-v2` Service Worker work across both Wi-Fi and Cellular Data. |

