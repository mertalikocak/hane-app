"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getFirebaseConfig,
  saveFirebaseCustomConfig,
  removeFirebaseCustomConfig,
  FirebaseConfigOptions,
} from "@/lib/firebase/config";
import { useCloudSync } from "./CloudSyncProvider";

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FirebaseSetupModal({ isOpen, onClose }: FirebaseSetupModalProps) {
  const [mounted, setMounted] = useState(false);
  const { syncState, pushNow, pullNow, deleteCloudNow, isConfigured } = useCloudSync();

  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  const [rawSnippet, setRawSnippet] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const cfg = getFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || "");
        setAuthDomain(cfg.authDomain || "");
        setProjectId(cfg.projectId || "");
        setStorageBucket(cfg.storageBucket || "");
        setMessagingSenderId(cfg.messagingSenderId || "");
        setAppId(cfg.appId || "");
      }
      setStatusMessage(null);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Parse direct snippet pasted from Firebase console
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

      setStatusMessage({
        text: "✓ Firebase kod bloğu başarıyla ayrıştırıldı ve alanlara dolduruldu.",
        type: "success",
      });
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = () => {
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setStatusMessage({
        text: "Lütfen en az API Key, Project ID ve App ID alanlarını doldurun.",
        type: "error",
      });
      return;
    }

    const config: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseCustomConfig(config);
    setStatusMessage({
      text: "✓ Firebase ayarları kaydedildi. Bulut bağlantısı başlatılıyor...",
      type: "success",
    });

    setTimeout(() => {
      pushNow();
    }, 500);
  };

  const handleDisconnect = () => {
    if (confirm("Firebase bulut bağlantısını kaldırmak istediğinize emin misiniz? (Cihazınızdaki yerel veriler silinmez)")) {
      removeFirebaseCustomConfig();
      setApiKey("");
      setAuthDomain("");
      setProjectId("");
      setStorageBucket("");
      setMessagingSenderId("");
      setAppId("");
      setRawSnippet("");
      setStatusMessage({
        text: "Bulut bağlantısı kaldırıldı. Uygulama yerel modda çalışıyor.",
        type: "success",
      });
    }
  };

  const handleManualPush = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    const res = await pushNow();
    setIsProcessing(false);
    if (res.success) {
      setStatusMessage({
        text: "✓ Bu cihazdaki tüm veriler başarıyla Firebase bulutuna aktarıldı!",
        type: "success",
      });
    } else {
      setStatusMessage({
        text: `Hata: ${res.error || "Yükleme başarısız"}`,
        type: "error",
      });
    }
  };

  const handleManualPull = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    const res = await pullNow();
    setIsProcessing(false);
    if (res.success) {
      setStatusMessage({
        text: "✓ Firebase bulutundaki güncel veriler bu cihaza çekildi ve eşitlendi!",
        type: "success",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setStatusMessage({
        text: `Hata: ${res.error || "İndirme başarısız"}`,
        type: "error",
      });
    }
  };

  const handleDeleteCloudData = async () => {
    if (
      !confirm(
        "⚠️ DİKKAT: Firebase bulutundaki veritabanı yedeğini tamamen silmek istediğinize emin misiniz? (Bu işlem buluttaki veriyi sıfırlar)"
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    const res = await deleteCloudNow();
    setIsProcessing(false);

    if (res.success) {
      setStatusMessage({
        text: "✓ Firebase bulutundaki veri kaydı başarıyla silindi.",
        type: "success",
      });
    } else {
      setStatusMessage({
        text: `Silme hatası: ${res.error || "Bilinmeyen hata"}`,
        type: "error",
      });
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/70 bg-surface/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xl font-bold">
              🔥
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Firebase Bulut Senkronizasyonu</span>
              </h2>
              <p className="text-xs text-muted">
                Mobil ve masaüstü arasında canlı veri eşitlemesi ve yönetim
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface-raised text-muted hover:text-foreground transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* 1. Connection Status Card */}
          <div
            className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              syncState.status === "synced"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-300"
                : syncState.status === "syncing" || syncState.status === "connecting"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-300"
                : isConfigured
                ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-300"
                : "bg-surface-raised/80 border-border text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {syncState.status === "synced"
                  ? "🟢"
                  : syncState.status === "syncing"
                  ? "🔄"
                  : isConfigured
                  ? "🔴"
                  : "⚙️"}
              </span>
              <div>
                <span className="text-xs sm:text-sm font-bold block">
                  {syncState.status === "synced"
                    ? "Bulut Senkronizasyonu Aktif"
                    : syncState.status === "syncing"
                    ? "Veriler Senkronize Ediliyor..."
                    : syncState.status === "connecting"
                    ? "Firebase'e Bağlanılıyor..."
                    : isConfigured
                    ? "Bağlantı Hatası (Kuralları Kontrol Edin)"
                    : "Bulut Kurulumu Bekleniyor"}
                </span>
                <span className="text-[11px] sm:text-xs opacity-80 block">
                  {syncState.lastSyncedAt
                    ? `Son eşitleme: ${syncState.lastSyncedAt.toLocaleTimeString("tr-TR")}`
                    : isConfigured
                    ? syncState.errorMessage || "Bağlantı kuruluyor..."
                    : "Telefon ve PC eşitlemesi için Firebase bilgilerinizi girin"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Manual Cloud Operations (Buluta Aktar / Buluttan Çek / Buluttan Sil) */}
          {isConfigured && (
            <div className="rounded-2xl border border-border/80 bg-surface-raised/50 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted block">
                ⚡ Manuel Bulut İşlemleri:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Buluta Aktar */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualPush}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-surface hover:bg-emerald-500/10 hover:border-emerald-500/40 text-foreground transition cursor-pointer shadow-xs group"
                >
                  <span className="text-lg mb-1">📤</span>
                  <span className="text-xs font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    Buluta Aktar
                  </span>
                  <span className="text-[10px] text-muted text-center mt-0.5">
                    Bu cihazdaki verileri buluta yükler
                  </span>
                </button>

                {/* 2. Buluttan Eşitle */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleManualPull}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-surface hover:bg-blue-500/10 hover:border-blue-500/40 text-foreground transition cursor-pointer shadow-xs group"
                >
                  <span className="text-lg mb-1">📥</span>
                  <span className="text-xs font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Bulutla Eşitle
                  </span>
                  <span className="text-[10px] text-muted text-center mt-0.5">
                    Buluttaki güncel verileri çeker
                  </span>
                </button>

                {/* 3. Buluttaki Veriyi Sil */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleDeleteCloudData}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-rose-500/30 bg-surface hover:bg-rose-500/10 hover:border-rose-500/50 text-foreground transition cursor-pointer shadow-xs group"
                >
                  <span className="text-lg mb-1">🗑️</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Buluttaki Veriyi Sil
                  </span>
                  <span className="text-[10px] text-muted text-center mt-0.5">
                    Bulut veritabanını sıfırlar
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Step-by-step instructions */}
          <div className="rounded-2xl border border-border/70 bg-surface-raised/40 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span>📋</span>
              <span>2 Dakikada Firebase Bağlantısı Nasıl Yapılır?</span>
            </h3>
            <ol className="text-xs text-muted/90 space-y-1.5 list-decimal list-inside">
              <li>
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 dark:text-amber-400 font-bold underline"
                >
                  console.firebase.google.com
                </a>{" "}
                adresine gidip <strong>Yeni Proje</strong> oluşturun.
              </li>
              <li>
                Soldan <strong>Build &gt; Firestore Database</strong> seçeneğine tıklayıp <strong>Create Database</strong> deyin (Start in test mode seçin).
              </li>
              <li>
                Proje Ayarlarından (⚙️) <strong>Web App (&lt;/&gt;)</strong> ekleyin ve verilen <code>const firebaseConfig = &#123; ... &#125;</code> bloğunu aşağıya yapıştırın.
              </li>
            </ol>
          </div>

          {/* 4. Quick Snippet Paste Area */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-foreground">
              ⚡ Hızlı Yapıştır (Firebase Kod Bloğu):
            </label>
            <textarea
              rows={3}
              value={rawSnippet}
              onChange={(e) => handleParseSnippet(e.target.value)}
              placeholder="const firebaseConfig = { apiKey: '...', projectId: '...', appId: '...' };"
              className="field text-xs font-mono"
            />
          </div>

          {/* 5. Manual Field Inputs */}
          <div className="space-y-3 pt-2 border-t border-border/60">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
              veya Alanları Tek Tek Girin:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="field text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted">Project ID</label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="hane-app-12345"
                  className="field text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted">App ID</label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="1:123456789:web:abcdef"
                  className="field text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-muted">Auth Domain (Opsiyonel)</label>
                <input
                  type="text"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  placeholder="hane-app-12345.firebaseapp.com"
                  className="field text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {statusMessage && (
            <div
              className={`rounded-2xl p-3 text-xs font-bold animate-in fade-in ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {statusMessage.text}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-border/70 bg-surface/95 backdrop-blur-md shrink-0">
          <div>
            {isConfigured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Bağlantıyı Kaldır
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button cursor-pointer"
            >
              Kapat
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="primary-button bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-bold shadow-md cursor-pointer"
            >
              Kaydet & Bağlan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
