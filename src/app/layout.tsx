import type { Metadata, Viewport } from "next";
import { Sidebar } from "@/components/navigation/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hane App - Ev & Yaşam Yönetim Çatısı",
  description: "CarDo (Araç Masraf Takibi), Hane Dinner (Akşam Yemeği Planı), Hane Gider (Ev Bütçesi) ve Hane Fit (Vücut Ölçüleri & Yağ Takibi) tek çatı altında.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 lg:pl-72 flex flex-col min-w-0">
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
