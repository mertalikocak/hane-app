"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCloudSync } from "./CloudSyncProvider";
import {
  getFirebaseConfig,
  saveFirebaseCustomConfig,
  removeFirebaseCustomConfig,
  type FirebaseConfigOptions,
} from "@/lib/firebase/config";
import {
  tumHaneVerileriniTopla,
  tumHaneYedekDosyasiIndir,
  yedekDosyasiniDogrula,
  tumHaneVerileriniIceAktar,
  type HaneModulOzet,
  type IceAktarmaOnizleme,
} from "@/storage/tumHaneYedekDeposu";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerTestNotification,
  type NotificationPermissionState,
} from "@/lib/notifications/notificationService";
import {
  getBulgular,
  addBulgu,
  toggleBulgu,
  deleteBulgu,
  clearResolvedBulgular,
  BULGU_EVENT,
  type BulguItem,
} from "@/storage/bulguStorage";

interface AyarlarModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "bulut" | "yedek" | "bildirim" | "bulgu";
}

function formatTarih(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Bugün ${saat}`;

    return `${d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${saat}`;
  } catch {
    return "";
  }
}

export function AyarlarModal({
  isOpen,
  onClose,
  initialTab = "bulgu",
}: AyarlarModalProps) {
  const [activeTab, setActiveTab] = useState<"bulut" | "yedek" | "bildirim" | "bulgu">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (initialTab === "bulgu") {
        setTimeout(() => bulguInputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, initialTab]);

  // -------------------------------------------------------------
  // 1. BULUT AYARLARI STATE
  // -------------------------------------------------------------
  const { syncState, pushNow, pullNow, deleteCloudNow, isConfigured } = useCloudSync();

  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [cloudMessage, setCloudMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);

  // Firebase Form inputs
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  useEffect(() => {
    if (isOpen) {
      const cfg = getFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || "");
        setAuthDomain(cfg.authDomain || "");
        setProjectId(cfg.projectId || "");
        setStorageBucket(cfg.storageBucket || "");
        setMessagingSenderId(cfg.messagingSenderId || "");
        setAppId(cfg.appId || "");
      }
    }
  }, [isOpen]);

  // -------------------------------------------------------------
  // 2. MANUEL YEDEKLEME STATE
  // -------------------------------------------------------------
  const [yedekSubTab, setYedekSubTab] = useState<"export" | "import">("export");
  const [currentSummary, setCurrentSummary] = useState<HaneModulOzet | null>(null);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<IceAktarmaOnizleme | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------------------------------------------------
  // 3. BİLDİRİM AYARLARI STATE
  // -------------------------------------------------------------
  const [notifSupported, setNotifSupported] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>("default");
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMessage, setNotifMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // -------------------------------------------------------------
  // 4. BULGU BİLDİRİMİ STATE
  // -------------------------------------------------------------
  const [bulgular, setBulgular] = useState<BulguItem[]>([]);
  const [bulguMetin, setBulguMetin] = useState("");
  const [bulguKategori, setBulguKategori] = useState<"hata" | "oneri" | "not">("hata");
  const [bulguFiltre, setBulguFiltre] = useState<"hepsi" | "bekleyen" | "cozulen">("hepsi");
  const bulguInputRef = useRef<HTMLInputElement>(null);

  const refreshBulgular = () => {
    setBulgular(getBulgular());
  };

  useEffect(() => {
    refreshBulgular();
    const handleBulguChange = () => refreshBulgular();
    window.addEventListener(BULGU_EVENT, handleBulguChange);
    window.addEventListener("storage", handleBulguChange);
    return () => {
      window.removeEventListener(BULGU_EVENT, handleBulguChange);
      window.removeEventListener("storage", handleBulguChange);
    };
  }, []);

  useEffect(() => {
    setNotifSupported(isNotificationSupported());
    setNotifPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      const data = tumHaneVerileriniTopla();
      setCurrentSummary(data.ozet);
      setCloudMessage(null);
      setNotifMessage(null);
      refreshBulgular();
      document.body.style.overflow = "hidden";
      if (initialTab === "bulgu") {
        setTimeout(() => bulguInputRef.current?.focus(), 150);
      }
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  // -------------------------------------------------------------
  // BULUT ACTIONS
  // -------------------------------------------------------------
  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim() || !appId.trim()) {
      setCloudMessage({
        type: "error",
        text: "Lütfen en az API Key, Project ID ve App ID alanlarını doldurun.",
      });
      return;
    }

    const cfg: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseCustomConfig(cfg);
    setCloudMessage({
      type: "success",
      text: "✓ Firebase ayarları kaydedildi. Bulut bağlantısı başlatılıyor...",
    });
    setIsConfigExpanded(false);
  };

  const handleRemoveFirebase = () => {
    if (confirm("Firebase bulut bağlantısını kaldırmak istediğinize emin misiniz? (Cihazınızdaki yerel veriler silinmez)")) {
      removeFirebaseCustomConfig();
      setApiKey("");
      setAuthDomain("");
      setProjectId("");
      setStorageBucket("");
      setMessagingSenderId("");
      setAppId("");
      setCloudMessage({
        type: "success",
        text: "Bulut bağlantısı kaldırıldı. Uygulama yerel modda çalışıyor.",
      });
    }
  };

  const handleCloudUpload = async () => {
    setCloudLoading(true);
    setCloudMessage(null);
    try {
      const res = await pushNow();
      if (res.success) {
        setCloudMessage({
          type: "success",
          text: "✓ Bu cihazdaki tüm veriler başarıyla Firebase bulutuna yüklendi!",
        });
      } else {
        setCloudMessage({
          type: "error",
          text: `Buluta yükleme başarısız oldu: ${res.error || "Yetki veya bağlantı hatası"}`,
        });
      }
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudDownload = async () => {
    setCloudLoading(true);
    setCloudMessage(null);
    try {
      const res = await pullNow();
      if (res.success) {
        setCloudMessage({
          type: "success",
          text: "✓ Firebase bulutundaki güncel veriler bu cihaza çekildi ve eşitlendi!",
        });
      } else {
        setCloudMessage({
          type: "error",
          text: `Buluttan veri çekilemedi: ${res.error || "Bulutta kayıt yok veya yetki hatası"}`,
        });
      }
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudClear = async () => {
    if (confirm("⚠️ DİKKAT: Firebase bulutundaki veritabanı yedeğini tamamen silmek istediğinize emin misiniz?")) {
      setCloudLoading(true);
      setCloudMessage(null);
      try {
        const res = await deleteCloudNow();
        if (res.success) {
          setCloudMessage({
            type: "success",
            text: "✓ Firebase bulutundaki veri kaydı başarıyla silindi.",
          });
        } else {
          setCloudMessage({
            type: "error",
            text: `Buluttan veri silinemedi: ${res.error || "Hata"}`,
          });
        }
      } finally {
        setCloudLoading(false);
      }
    }
  };

  // -------------------------------------------------------------
  // YEDEK ACTIONS
  // -------------------------------------------------------------
  const handleDownloadBackup = () => {
    tumHaneYedekDosyasiIndir();
  };

  const handleCopyBackupJson = () => {
    const data = tumHaneVerileriniTopla();
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        const preview = yedekDosyasiniDogrula(content);
        setImportPreview(preview);
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportPreview = () => {
    if (!importText.trim()) return;
    const preview = yedekDosyasiniDogrula(importText);
    setImportPreview(preview);
    setImportStatus(null);
  };

  const handleExecuteImport = () => {
    if (!importPreview?.gecerli || !importPreview.hamVeriler) return;
    const res = tumHaneVerileriniIceAktar(importPreview.hamVeriler);
    if (res.basarili) {
      setImportStatus(`✓ Başarılı: ${res.eklenenSayisi} adet veri anahtarı yüklendi! Sayfa yenileniyor...`);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } else {
      setImportStatus(`✕ Hata: ${res.hata || "Bilinmeyen hata"}`);
    }
  };

  // -------------------------------------------------------------
  // BİLDİRİM ACTIONS
  // -------------------------------------------------------------
  const handleRequestNotifPermission = async () => {
    setNotifLoading(true);
    setNotifMessage(null);
    try {
      const res = await requestNotificationPermission();
      setNotifPermission(res);
      if (res === "granted") {
        setNotifMessage({ type: "success", text: "Bildirim izni verildi! Artık bildirimleri alabilirsiniz." });
      } else if (res === "denied") {
        setNotifMessage({ type: "error", text: "Bildirim izni reddedildi. Tarayıcı izinlerinden açabilirsiniz." });
      }
    } finally {
      setNotifLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setNotifLoading(true);
    setNotifMessage(null);
    try {
      const res = await triggerTestNotification();
      setNotifPermission(getNotificationPermission());
      setNotifMessage({
        type: res.success ? "success" : "error",
        text: res.message,
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const isNotifGranted = notifPermission === "granted";

  // -------------------------------------------------------------
  // BULGU BİLDİRİMİ ACTIONS
  // -------------------------------------------------------------
  const handleBulguEkle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulguMetin.trim()) return;
    addBulgu(bulguMetin, bulguKategori);
    setBulguMetin("");
  };

  const handleBulguToggle = (id: string) => {
    toggleBulgu(id);
  };

  const handleBulguSil = (id: string) => {
    deleteBulgu(id);
  };

  const bekleyenBulguSayisi = bulgular.filter((b) => !b.cozuldu).length;
  const cozulenBulguSayisi = bulgular.filter((b) => b.cozuldu).length;

  const filtrelenmisBulgular = bulgular.filter((b) => {
    if (bulguFiltre === "bekleyen") return !b.cozuldu;
    if (bulguFiltre === "cozulen") return b.cozuldu;
    return true;
  });

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-surface border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-xs">
        {/* Üst Başlık */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/80 bg-surface/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary text-xl font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Hane App Ayarları
              </h2>
              <p className="text-[11px] text-muted">
                Bulut senkronizasyonu, veri yedekleme, bildirimler ve bulgu takibi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Ana Sekmeler (Tabs) */}
        <div className="p-2 sm:px-5 border-b border-border/70 bg-surface-raised/40 flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("bulgu");
              setTimeout(() => bulguInputRef.current?.focus(), 150);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              activeTab === "bulgu"
                ? "bg-surface text-foreground shadow-xs border border-border font-black text-purple-400"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>📝</span>
            <span>Bulgular</span>
            {bekleyenBulguSayisi > 0 && (
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-400">
                {bekleyenBulguSayisi}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bulut")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              activeTab === "bulut"
                ? "bg-surface text-foreground shadow-xs border border-border font-black text-amber-500"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>☁️</span>
            <span>Bulut</span>
            <span
              className={`h-2 w-2 rounded-full ${
                syncState.status === "synced"
                  ? "bg-emerald-500"
                  : isConfigured
                  ? "bg-amber-500"
                  : "bg-muted/40"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("yedek")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              activeTab === "yedek"
                ? "bg-surface text-foreground shadow-xs border border-border font-black text-primary"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>💾</span>
            <span>Yedek</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bildirim")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 sm:flex-1 ${
              activeTab === "bildirim"
                ? "bg-surface text-foreground shadow-xs border border-border font-black text-sky-400"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>🔔</span>
            <span>Bildirimler</span>
            <span
              className={`h-2 w-2 rounded-full ${
                isNotifGranted ? "bg-emerald-500" : "bg-muted/40"
              }`}
            />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ========================================================= */}
          {/* TAB 1: BULUT SENKRONİZASYONU (FIREBASE)                   */}
          {/* ========================================================= */}
          {activeTab === "bulut" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Durum Bildirim Mesajı */}
              {cloudMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    cloudMessage.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  <span>{cloudMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setCloudMessage(null)}
                    className="text-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 1. Canlı Bağlantı Durumu Kartı */}
              <div
                className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  syncState.status === "synced"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : syncState.status === "syncing"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : isConfigured
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-surface-raised border-border text-foreground"
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
                        ? "Bağlantı Hatası (Firebase)"
                        : "Firebase Kurulumu Bekleniyor"}
                    </span>
                    <span className="text-[11px] opacity-80 block">
                      {syncState.lastSyncedAt
                        ? `Son eşitleme: ${syncState.lastSyncedAt.toLocaleTimeString("tr-TR")}`
                        : isConfigured
                        ? syncState.errorMessage || "Bağlantı bekleniyor..."
                        : "Masaüstü ve cep telefonunda aynı verileri canlı görmek için bağlayın"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={cloudLoading}
                    onClick={handleCloudDownload}
                    className="secondary-button h-8 px-3 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {cloudLoading ? "İşleniyor..." : "🔄 Şimdi Eşitle"}
                  </button>
                </div>
              </div>

              {/* 2. Hızlı Manuel Bulut Aksiyonları */}
              <div className="rounded-2xl p-4 border border-border/70 bg-surface-raised/40 space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted block">
                  Bulut Hızlı İşlemleri
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    disabled={cloudLoading}
                    onClick={handleCloudUpload}
                    className="p-3 rounded-xl border border-border/80 bg-surface hover:bg-surface-raised transition text-left cursor-pointer group shadow-2xs"
                  >
                    <span className="text-base block mb-1">⬆️</span>
                    <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                      Buluta Aktar
                    </span>
                    <span className="text-[10px] text-muted block">
                      Cihazdaki tüm verileri buluta yükler
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={cloudLoading}
                    onClick={handleCloudDownload}
                    className="p-3 rounded-xl border border-border/80 bg-surface hover:bg-surface-raised transition text-left cursor-pointer group shadow-2xs"
                  >
                    <span className="text-base block mb-1">⬇️</span>
                    <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                      Buluttan Çek
                    </span>
                    <span className="text-[10px] text-muted block">
                      Buluttaki güncel verileri bu cihaza çeker
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={cloudLoading}
                    onClick={handleCloudClear}
                    className="p-3 rounded-xl border border-border/80 bg-surface hover:bg-rose-500/10 hover:border-rose-500/30 transition text-left cursor-pointer group shadow-2xs"
                  >
                    <span className="text-base block mb-1">🗑️</span>
                    <span className="font-bold text-muted group-hover:text-rose-400 transition-colors">
                      Buluttaki Veriyi Sil
                    </span>
                    <span className="text-[10px] text-muted block">
                      Buluttaki veritabanını sıfırlar
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. Firebase Yapılandırma Akordeonu */}
              <div className="rounded-2xl border border-border/80 bg-surface-raised/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-foreground hover:bg-surface transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Firebase API Bağlantı Bilgilerini Düzenle</span>
                  </span>
                  <span className="text-muted">{isConfigExpanded ? "▲" : "▼"}</span>
                </button>

                {isConfigExpanded && (
                  <form
                    onSubmit={handleSaveFirebaseConfig}
                    className="p-4 pt-0 border-t border-border/60 space-y-3 animate-in fade-in duration-150"
                  >
                    <p className="text-[11px] text-muted">
                      Firebase Console üzerinden oluşturduğunuz projenin Web SDK bilgilerini girin.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          API Key *
                        </label>
                        <input
                          type="text"
                          required
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="AIzaSy..."
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          Project ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value)}
                          placeholder="hane-app-12345"
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          App ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          placeholder="1:123456:web:abcd"
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          Auth Domain
                        </label>
                        <input
                          type="text"
                          value={authDomain}
                          onChange={(e) => setAuthDomain(e.target.value)}
                          placeholder="hane-app.firebaseapp.com"
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          Storage Bucket
                        </label>
                        <input
                          type="text"
                          value={storageBucket}
                          onChange={(e) => setStorageBucket(e.target.value)}
                          placeholder="hane-app.appspot.com"
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                          Messaging Sender ID
                        </label>
                        <input
                          type="text"
                          value={messagingSenderId}
                          onChange={(e) => setMessagingSenderId(e.target.value)}
                          placeholder="123456789"
                          className="w-full h-8 px-2.5 rounded-xl bg-surface border border-border text-xs font-mono text-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      {isConfigured && (
                        <button
                          type="button"
                          onClick={handleRemoveFirebase}
                          className="text-rose-400 hover:underline text-[11px] font-bold cursor-pointer"
                        >
                          Bağlantıyı Kaldır
                        </button>
                      )}
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setIsConfigExpanded(false)}
                          className="secondary-button h-8 px-3 text-xs font-bold"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="submit"
                          className="primary-button h-8 px-4 text-xs font-black shadow-xs cursor-pointer"
                        >
                          Ayarları Kaydet
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: MANUEL YEDEKLEME (JSON İNDİR / YÜKLE)              */}
          {/* ========================================================= */}
          {activeTab === "yedek" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Alt Sekmeler */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-raised border border-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setYedekSubTab("export")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    yedekSubTab === "export"
                      ? "bg-surface text-foreground font-black shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  📤 Yedeği İndir (Dışa Aktar)
                </button>
                <button
                  type="button"
                  onClick={() => setYedekSubTab("import")}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    yedekSubTab === "import"
                      ? "bg-surface text-foreground font-black shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  📥 Yedeği Yükle (İçe Aktar)
                </button>
              </div>

              {yedekSubTab === "export" ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-surface-raised/40 border border-border/70 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted block">
                      Cihazdaki Tüm Modül Verileri
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="p-2.5 rounded-xl border border-border/70 bg-surface text-center">
                        <span className="text-base block">💰</span>
                        <span className="font-bold text-foreground text-xs block mt-0.5">Ev Gideri</span>
                        <span className="text-[10px] text-muted">{currentSummary?.giderAySayisi || 0} Ay</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border/70 bg-surface text-center">
                        <span className="text-base block">🚗</span>
                        <span className="font-bold text-foreground text-xs block mt-0.5">Hane Car</span>
                        <span className="text-[10px] text-muted">{currentSummary?.carDoGiderSayisi || 0} Masraf</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border/70 bg-surface text-center">
                        <span className="text-base block">🍽️</span>
                        <span className="font-bold text-foreground text-xs block mt-0.5">Yemek</span>
                        <span className="text-[10px] text-muted">{currentSummary?.dinnerYemekSayisi || 0} Tarif</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border/70 bg-surface text-center">
                        <span className="text-base block">📅</span>
                        <span className="font-bold text-foreground text-xs block mt-0.5">Takvim</span>
                        <span className="text-[10px] text-muted">{currentSummary?.calendarEtkinlikSayisi || 0} Etkinlik</span>
                      </div>
                      <div className="p-2.5 rounded-xl border border-border/70 bg-surface text-center col-span-2 sm:col-span-1">
                        <span className="text-base block">📝</span>
                        <span className="font-bold text-foreground text-xs block mt-0.5">Bulgular</span>
                        <span className="text-[10px] text-muted">{currentSummary?.bulguSayisi || 0} Madde</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadBackup}
                      className="w-full sm:flex-1 primary-button h-10 text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      <span>JSON Yedek Dosyasını İndir</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyBackupJson}
                      className="w-full sm:w-auto secondary-button h-10 px-4 text-xs font-bold cursor-pointer"
                    >
                      {isCopied ? "✓ Panoya Kopyalandı" : "📋 JSON Kopyala"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="primary-button h-9 px-4 text-xs font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📂</span>
                      <span>Dosyadan JSON Seç</span>
                    </button>
                    <span className="text-[11px] text-muted">veya metin alanına JSON yapıştırın:</span>
                  </div>

                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => {
                      setImportText(e.target.value);
                      setImportPreview(null);
                    }}
                    placeholder='{"uygulama": "hane-app", "veriler": {...}}'
                    className="w-full p-3 rounded-2xl bg-surface border border-border text-xs font-mono text-foreground focus:border-primary transition"
                  />

                  {importStatus && (
                    <div className="p-3 rounded-xl bg-surface-raised border border-border text-xs font-bold text-foreground">
                      {importStatus}
                    </div>
                  )}

                  {importPreview && (
                    <div
                      className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                        importPreview.gecerli
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{importPreview.gecerli ? "✓ Geçerli Yedek Dosyası" : "✕ Geçersiz Dosya"}</span>
                      </div>
                      {importPreview.hata && <p className="text-[11px] opacity-90">{importPreview.hata}</p>}

                      {importPreview.gecerli && importPreview.hamVeriler && (
                        <button
                          type="button"
                          onClick={handleExecuteImport}
                          className="h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer shadow-xs mt-2"
                        >
                          Verileri Şimdi İçe Aktar ve Yenile
                        </button>
                      )}
                    </div>
                  )}

                  {!importPreview && importText.trim() && (
                    <button
                      type="button"
                      onClick={handleImportPreview}
                      className="secondary-button h-9 px-4 text-xs font-bold cursor-pointer"
                    >
                      Yedeği Doğrula & İncele
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: BİLDİRİM AYARLARI                                  */}
          {/* ========================================================= */}
          {activeTab === "bildirim" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {notifMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in ${
                    notifMessage.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                  }`}
                >
                  <span>{notifMessage.text}</span>
                  <button
                    type="button"
                    onClick={() => setNotifMessage(null)}
                    className="text-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* İzin Durumu Kartı */}
              <div className="p-4 rounded-2xl bg-surface-raised border border-border/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">
                    🔔
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-foreground block">
                      Cihaz Bildirim İzni
                    </span>
                    <span className="text-[11px] text-muted block">
                      {isNotifGranted
                        ? "Etkinlik ve akşam yemeği hatırlatıcıları aktif"
                        : notifPermission === "denied"
                        ? "Tarayıcı tarafından engellendi"
                        : "Bildirim almak için izin verin"}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-black px-2.5 py-1 rounded-full text-[11px] ${
                    isNotifGranted
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : notifPermission === "denied"
                      ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isNotifGranted
                    ? "✓ İzin Verildi"
                    : notifPermission === "denied"
                    ? "✕ Engellendi"
                    : "Beklemede"}
                </span>
              </div>

              {/* Aksiyon Butonları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!isNotifGranted ? (
                  <button
                    type="button"
                    disabled={notifLoading || !notifSupported}
                    onClick={handleRequestNotifPermission}
                    className="primary-button h-10 px-4 text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🔔</span>
                    <span>Bildirim İznini Aç</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={notifLoading}
                    onClick={handleTestNotification}
                    className="primary-button h-10 px-4 text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🧪</span>
                    <span>Test Bildirimi Gönder</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={notifLoading}
                  onClick={handleTestNotification}
                  className="secondary-button h-10 px-4 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>Örnek Bildirim Sına</span>
                </button>
              </div>

              {/* Bilgilendirici Notlar */}
              <div className="p-3.5 rounded-2xl bg-surface-raised/50 border border-border/60 text-[11px] text-muted space-y-2">
                <span className="font-bold text-foreground block">📱 Mobil Cihaz İpuçları:</span>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Android:</strong> Chrome üzerinden "Uygulamayı Yükle" diyerek sistem bildirimlerini sorunsuz alabilirsiniz.</li>
                  <li><strong>iOS (iPhone):</strong> Safari menüsünden <em>"Ana Ekrana Ekle"</em> yaptıktan sonra bildirim izinlerini aktifleştirebilirsiniz.</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: BULGU BİLDİRİMİ (HATA & GELİŞTİRME NOTLARI)        */}
          {/* ========================================================= */}
          {activeTab === "bulgu" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Yeni Bulgu Ekleme Formu */}
              <form
                onSubmit={handleBulguEkle}
                className="p-3.5 rounded-2xl bg-surface-raised border border-border/80 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">
                    Yeni Bulgu / Not Ekle
                  </span>

                  {/* Kategori Seçici */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBulguKategori("hata")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        bulguKategori === "hata"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-black shadow-2xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      🔴 Hata
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulguKategori("oneri")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        bulguKategori === "oneri"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-black shadow-2xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      💡 Öneri
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulguKategori("not")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        bulguKategori === "not"
                          ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 font-black shadow-2xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      📌 Not
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={bulguInputRef}
                    type="text"
                    value={bulguMetin}
                    onChange={(e) => setBulguMetin(e.target.value)}
                    placeholder="Gördüğünüz bulgu veya geliştirme notunu yazın..."
                    className="flex-1 h-9 px-3 rounded-xl bg-surface border border-border text-xs font-semibold text-foreground focus:border-purple-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={!bulguMetin.trim()}
                    className="primary-button h-9 px-3.5 text-xs font-black shrink-0 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    ➕ Ekle
                  </button>
                </div>
              </form>

              {/* Filtre ve İstatistik Çubuğu */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-raised border border-border text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setBulguFiltre("hepsi")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      bulguFiltre === "hepsi"
                        ? "bg-surface text-foreground font-black shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Tümü ({bulgular.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulguFiltre("bekleyen")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      bulguFiltre === "bekleyen"
                        ? "bg-purple-500 text-white font-black shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Bekleyen ({bekleyenBulguSayisi})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulguFiltre("cozulen")}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      bulguFiltre === "cozulen"
                        ? "bg-emerald-500 text-white font-black shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Çözülen ({cozulenBulguSayisi})
                  </button>
                </div>

                {cozulenBulguSayisi > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Çözülen tüm bulguları silmek istediğinize emin misiniz?")) {
                        clearResolvedBulgular();
                      }
                    }}
                    className="text-[10px] text-muted hover:text-rose-400 transition cursor-pointer underline"
                  >
                    Çözülenleri Temizle
                  </button>
                )}
              </div>

              {/* Madde Madde Bulgu Listesi */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {filtrelenmisBulgular.length === 0 ? (
                  <div className="py-8 text-center rounded-2xl border border-dashed border-border/70 p-6 space-y-2">
                    <span className="text-3xl block">✨</span>
                    <p className="font-bold text-foreground text-xs">
                      {bulguFiltre === "cozulen"
                        ? "Henüz çözülen bir bulgu yok."
                        : bulguFiltre === "bekleyen"
                        ? "Bekleyen hiçbir bulgu yok, her şey harika!"
                        : "Henüz kayıtlı bulgu bulunmuyor."}
                    </p>
                    <p className="text-[11px] text-muted max-w-xs mx-auto">
                      Kullanım sırasında aklınıza gelen fikirleri veya karşılaştığınız pürüzleri yukarıdan hızlıca ekleyebilirsiniz.
                    </p>
                  </div>
                ) : (
                  filtrelenmisBulgular.map((b) => (
                    <div
                      key={b.id}
                      className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${
                        b.cozuldu
                          ? "bg-surface-raised/40 border-border/50 opacity-70"
                          : "bg-surface-raised border-border/80 hover:border-border shadow-xs"
                      }`}
                    >
                      {/* Sol: Checkbox & Metin */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleBulguToggle(b.id)}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer ${
                            b.cozuldu
                              ? "bg-emerald-500 border-emerald-500 text-white font-black"
                              : "border-border bg-surface hover:border-purple-400"
                          }`}
                          title={b.cozuldu ? "Tekrar aç" : "Çözüldü olarak işaretle"}
                        >
                          {b.cozuldu ? "✓" : ""}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1">
                          <p
                            onClick={() => handleBulguToggle(b.id)}
                            className={`text-xs font-semibold break-words cursor-pointer transition select-none ${
                              b.cozuldu
                                ? "line-through text-muted/70 decoration-emerald-500/60"
                                : "text-foreground"
                            }`}
                          >
                            {b.metin}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap text-[10px]">
                            <span
                              className={`font-black px-1.5 py-0.2 rounded-md ${
                                b.kategori === "oneri"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  : b.kategori === "not"
                                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                  : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {b.kategori === "oneri"
                                ? "💡 Öneri"
                                : b.kategori === "not"
                                ? "📌 Not"
                                : "🔴 Hata"}
                            </span>

                            <span className="text-muted">{formatTarih(b.tarih)}</span>

                            {b.cozuldu && (
                              <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                                ✓ Çözüldü
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Sil Butonu */}
                      <button
                        type="button"
                        onClick={() => handleBulguSil(b.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs shrink-0"
                        title="Bulguyu sil"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Alt Kapatma Çubuğu */}
        <div className="flex items-center justify-between p-3.5 sm:px-5 border-t border-border/80 bg-surface/95 shrink-0 text-xs">
          <span className="text-[11px] text-muted">
            Hane App • Tüm ayarlar ve bulgular yerel cihazınızda saklanır
          </span>

          <button
            type="button"
            onClick={onClose}
            className="secondary-button h-8 px-4 text-xs font-bold"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
