"use client";

import { useState } from "react";
import {
  saveFirebaseCustomConfig,
  FirebaseConfigOptions,
} from "@/lib/firebase/config";

interface CloudConnectionGateProps {
  onConnected: () => void;
  onSkipToLocal: () => void;
}

export function CloudConnectionGate({ onConnected, onSkipToLocal }: CloudConnectionGateProps) {
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  const [rawSnippet, setRawSnippet] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleParseSnippet = (snippet: string) => {
    setRawSnippet(snippet);
    if (!snippet.trim()) return;

    try {
      const apiKeyMatch = snippet.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = snippet.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = snippet.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = snippet.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = snippet.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = snippet.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch) setApiKey(apiKeyMatch[1]);
      if (authDomainMatch) setAuthDomain(authDomainMatch[1]);
      if (projectIdMatch) setProjectId(projectIdMatch[1]);
      if (storageBucketMatch) setStorageBucket(storageBucketMatch[1]);
      if (messagingSenderIdMatch) setMessagingSenderId(messagingSenderIdMatch[1]);
      if (appIdMatch) setAppId(appIdMatch[1]);

      setErrorMessage(null);
    } catch {
      // ignore
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setErrorMessage("Lütfen Firebase yapılandırma kod bloğunu yapıştırın veya alanları doldurun.");
      return;
    }

    setIsSubmitting(true);

    const config: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    try {
      saveFirebaseCustomConfig(config);
      onConnected();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bağlantı kaydedilemedi.";
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-foreground flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-xl space-y-6">
        {/* Branding & Welcome Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-4xl shadow-xl shadow-orange-500/20 text-white">
            🏡
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Hane App Bulut Bağlantısı
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
              Telefon ve bilgisayarınız arasında anlık senkronizasyon için Firebase veritabanınızı bağlayın.
            </p>
          </div>
        </div>

        {/* Setup Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* 3 Step Guide */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              ⚡ 2 Dakikalık Hızlı Kurulum:
            </span>
            <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside">
              <li>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 font-bold underline hover:text-amber-300"
                >
                  console.firebase.google.com
                </a>{" "}
                adresinden ücretsiz proje açın.
              </li>
              <li>
                <strong>Build &gt; Firestore Database</strong> oluşturun (Test modunda).
              </li>
              <li>
                <strong>Proje Ayarları (⚙️) &gt; Web App</strong> ekleyip verilen kod bloğunu kopyalayın.
              </li>
            </ol>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            {/* Quick paste textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-200">
                Firebase Kod Bloğunu Yapıştırın:
              </label>
              <textarea
                rows={3}
                value={rawSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder="const firebaseConfig = { apiKey: 'AIzaSy...', projectId: '...', appId: '...' };"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-3.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-400">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-400">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="hane-app-..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-400">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456:web:..."
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-400">Auth Domain (Opsiyonel)</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="hane-app.firebaseapp.com"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs font-bold text-rose-400 animate-in fade-in">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 p-4 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:from-amber-400 hover:to-orange-500 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                <span>🔥</span>
                <span>Bağlan ve Hane App&apos;i Başlat</span>
              </button>

              <button
                type="button"
                onClick={onSkipToLocal}
                className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition py-1 cursor-pointer"
              >
                veya Şimdilik Yerel / Çevrimdışı Modda Aç →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
