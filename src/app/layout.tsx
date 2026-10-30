import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/navigation/Sidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { CloudSyncProvider } from "@/components/navigation/CloudSyncProvider";
import { ServiceWorkerRegister } from "@/components/navigation/ServiceWorkerRegister";
import { ProfileProvider } from "@/context/ProfileContext";
import { GlobalProfileModal } from "@/components/profile/GlobalProfileModal";
import { QuickActionLauncher } from "@/components/quick-action/QuickActionLauncher";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hane App — Ev & Yaşam Yönetim Sistemi",
  description:
    "Hane Gider, Hane Yemek, Hane Takvim, Alışveriş, Hane Temizlik, Hane Kalori, Hane Fit, Düğün & Çeyiz, İstek Listesi ve Hane Araç tek çatı altında.",
  applicationName: "Hane App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hane App",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F0E8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Hane App" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased bg-background text-foreground selection:bg-accent selection:text-foreground">
        <div
          hidden
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `<script>(function(){try{var t=localStorage.getItem("hane_theme_v1");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;document.documentElement.classList.toggle("dark",t==="dark");}var isLocal=location.hostname==="localhost"||location.hostname==="127.0.0.1";if(isLocal&&("serviceWorker" in navigator||"caches" in window)){var tasks=[];if("serviceWorker" in navigator){tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){var had=rs.length>0;return Promise.all(rs.map(function(r){return r.unregister();})).then(function(){return had;});}));}if("caches" in window){tasks.push(caches.keys().then(function(ks){var had=ks.length>0;return Promise.all(ks.map(function(k){return caches.delete(k);})).then(function(){return had;});}));}Promise.all(tasks).then(function(res){var cleaned=res.some(Boolean);if(cleaned&&!sessionStorage.getItem("hane_dev_sw_cleared")){sessionStorage.setItem("hane_dev_sw_cleared","1");location.reload();}});}}catch(e){}})();</script>`,
          }}
        />
        <ServiceWorkerRegister />
        <CloudSyncProvider>
          <ProfileProvider>
            <div className="flex min-h-screen flex-col lg:flex-row">
              <Sidebar />
              <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
                <TopBar />
                <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                  {children}
                </div>
              </main>
            </div>
            <GlobalProfileModal />
            <QuickActionLauncher />
          </ProfileProvider>
        </CloudSyncProvider>
      </body>
    </html>
  );
}
