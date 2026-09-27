import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/navigation/Sidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { CloudSyncProvider } from "@/components/navigation/CloudSyncProvider";
import { ServiceWorkerRegister } from "@/components/navigation/ServiceWorkerRegister";
import { ProfileProvider } from "@/context/ProfileContext";
import { GlobalProfileModal } from "@/components/profile/GlobalProfileModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hane App - Ev & Yaşam Yönetim Çatısı",
  description: "Hane Car (Araç Masraf Takibi), Hane Dinner (Akşam Yemeği Planı), Hane Gider (Ev Bütçesi) ve Hane Fit (Vücut Ölçüleri & Yağ Takibi) tek çatı altında.",
  applicationName: "Hane App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hane App" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <ServiceWorkerRegister />
        <CloudSyncProvider>
          <ProfileProvider>
            <div className="flex min-h-screen flex-col lg:flex-row">
              <Sidebar />
              <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
                <TopBar />
                <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </div>
            <GlobalProfileModal />
          </ProfileProvider>
        </CloudSyncProvider>
      </body>
    </html>
  );
}
