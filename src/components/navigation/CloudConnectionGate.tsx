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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="Hane App Logo"
            className="mx-auto h-16 w-16 rounded-[14px] object-cover shadow-[var(--shadow-sm)] border border-border"
          />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Hane App Bulut Bağlantısı
            </h1>
            <p className="text-sm text-foreground-secondary max-w-md mx-auto">
              Cihazlarınız arasında senkronizasyon için Firebase veritabanınızı bağlayın veya yerel modda devam edin.
            </p>
          </div>
        </div>

        <div className="rounded-[18px] border border-border bg-surface p-6 sm:p-7 shadow-[var(--shadow-md)] space-y-5">
          <div className="rounded-[10px] border border-border-lavender bg-surface-lavender p-4 space-y-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
              2 Dakikalık Hızlı Kurulum
            </span>
            <ol className="text-xs text-foreground-secondary space-y-1.5 list-decimal list-inside">
              <li>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold underline hover:text-primary-hover"
                >
                  console.firebase.google.com
                </a>{" "}
                adresinden proje açın.
              </li>
              <li>
                <strong>Build &gt; Firestore Database</strong> oluşturun.
              </li>
              <li>
                <strong>Proje Ayarları &gt; Web App</strong> ekleyip verilen kod bloğunu aşağıya yapıştırın.
              </li>
            </ol>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Firebase Kod Bloğunu Yapıştırın
              </label>
              <textarea
                rows={3}
                value={rawSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder="const firebaseConfig = { apiKey: 'AIzaSy...', projectId: '...', appId: '...' };"
                className="field font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground-secondary">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="field font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground-secondary">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="hane-app-..."
                  className="field font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground-secondary">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456:web:..."
                  className="field font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-foreground-secondary">Auth Domain (Opsiyonel)</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="hane-app.firebaseapp.com"
                  className="field font-mono text-xs"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-[10px] bg-danger-bg border border-danger-border p-3 text-xs font-medium text-danger">
                {errorMessage}
              </div>
            )}

            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full primary-button py-2.5"
              >
                <span>Bağlan ve Hane App&apos;i Başlat</span>
              </button>

              <button
                type="button"
                onClick={onSkipToLocal}
                className="w-full secondary-button py-2.5 text-xs"
              >
                <span>Şimdilik Yerel Modda Devam Et</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
