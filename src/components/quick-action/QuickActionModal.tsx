"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, BoltIcon } from "@/components/ui/Icons";
import { getCurrentWeekStart } from "@/lib/date/week";
import { addCustomShoppingItem } from "@/storage/shoppingStorage";
import type { ShoppingCategory } from "@/domain/shoppingTypes";
import { ayAnahtariOlustur, ayVerisiOku, ayVerisiYaz } from "@/storage/ayDeposu";
import type { KullaniciId, BireyselAyriHarcama } from "@/domain/haneGiderTypes";
import { getCleaningRooms, saveCleaningRecord } from "@/storage/cleaningStorage";
import type { CleaningRoom } from "@/domain/cleaningTypes";
import { saveCalendarEvent } from "@/storage/calendarStorage";
import type { CalendarCategory } from "@/domain/calendarTypes";
import { useProfile } from "@/context/ProfileContext";

export type QuickActionTab = "shopping" | "gider" | "cleaning" | "calendar" | "cardo";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: QuickActionTab;
}

export function QuickActionModal({
  isOpen,
  onClose,
  initialTab = "shopping",
}: QuickActionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<QuickActionTab>(initialTab);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { activeProfile } = useProfile();

  // Shopping form state
  const [shopTitle, setShopTitle] = useState("");
  const [shopQuantity, setShopQuantity] = useState("");
  const [shopCategory, setShopCategory] = useState<ShoppingCategory>("market");

  // Gider form state
  const defaultUser: KullaniciId =
    activeProfile?.firstName?.toLowerCase().includes("havsa") ? "havsa" : "mert";
  const [giderKullanici, setGiderKullanici] = useState<KullaniciId>(defaultUser);
  const [giderAciklama, setGiderAciklama] = useState("");
  const [giderTutar, setGiderTutar] = useState("");

  // Cleaning rooms state
  const [rooms, setRooms] = useState<CleaningRoom[]>([]);
  const [cleanedRoomIds, setCleanedRoomIds] = useState<Set<string>>(new Set());

  // Calendar form state
  const todayStr = new Date().toISOString().split("T")[0];
  const [calTitle, setCalTitle] = useState("");
  const [calDate, setCalDate] = useState(todayStr);
  const [calTime, setCalTime] = useState("");
  const [calCategory, setCalCategory] = useState<CalendarCategory>("default");

  // CarDo form state
  const [carName, setCarName] = useState("");
  const [carPrice, setCarPrice] = useState("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setToastMsg(null);
      setCleanedRoomIds(new Set());
      setRooms(getCleaningRooms());
      setCalDate(new Date().toISOString().split("T")[0]);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 2500);
  };

  // 1. SHOPPING SUBMIT
  const handleShoppingSubmit = (closeAfter: boolean) => {
    if (!shopTitle.trim()) return;
    const currentWeek = getCurrentWeekStart();
    addCustomShoppingItem(currentWeek, {
      title: shopTitle,
      quantity: shopQuantity,
      category: shopCategory,
    });
    showToast(`✓ "${shopTitle}" alışveriş listesine eklendi!`);
    setShopTitle("");
    setShopQuantity("");
    if (closeAfter) {
      setTimeout(onClose, 400);
    } else {
      inputRef.current?.focus();
    }
  };

  // 2. GIDER SUBMIT
  const handleGiderSubmit = (closeAfter: boolean) => {
    const tutarNum = parseFloat(giderTutar.replace(",", "."));
    if (!giderAciklama.trim() || isNaN(tutarNum) || tutarNum <= 0) return;

    const now = new Date();
    const ayKey = ayAnahtariOlustur(now.getFullYear(), now.getMonth());
    const ayVeri = ayVerisiOku(ayKey);

    const yeniHarcama: BireyselAyriHarcama = {
      id: `bireysel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      kullaniciId: giderKullanici,
      aciklama: giderAciklama.trim(),
      tutar: tutarNum,
    };

    ayVeri.bireyselAyriHarcamalar.unshift(yeniHarcama);
    ayVerisiYaz(ayKey, ayVeri);

    showToast(`✓ ${tutarNum} ₺ harcama kaydedildi!`);
    setGiderAciklama("");
    setGiderTutar("");
    if (closeAfter) {
      setTimeout(onClose, 400);
    } else {
      inputRef.current?.focus();
    }
  };

  // 3. CLEANING ROOM CLICK
  const handleCleanRoom = (room: CleaningRoom) => {
    saveCleaningRecord({
      roomId: room.id,
      roomName: room.name,
      date: new Date().toISOString().split("T")[0],
      methods: ["vacuum"],
      cleanedBy: activeProfile?.firstName || "Mert",
      note: "Hızlı eylem üzerinden tamamlandı",
    });
    setCleanedRoomIds((prev) => new Set(prev).add(room.id));
    showToast(`✓ "${room.name}" temizlendi olarak işaretlendi!`);
  };

  // 4. CALENDAR SUBMIT
  const handleCalendarSubmit = (closeAfter: boolean) => {
    if (!calTitle.trim() || !calDate) return;
    saveCalendarEvent({
      title: calTitle.trim(),
      date: calDate,
      time: calTime ? calTime : undefined,
      category: calCategory,
      isAllDay: !calTime,
      scope: "common",
      createdByProfileId: activeProfile?.id || "default",
      createdByName: activeProfile?.firstName || "Mert",
    });
    showToast(`✓ "${calTitle}" takvime eklendi!`);
    setCalTitle("");
    setCalTime("");
    if (closeAfter) {
      setTimeout(onClose, 400);
    } else {
      inputRef.current?.focus();
    }
  };

  // 5. CARDO SUBMIT
  const handleCarSubmit = (closeAfter: boolean) => {
    const priceNum = parseFloat(carPrice.replace(",", "."));
    if (!carName.trim() || isNaN(priceNum) || priceNum < 0) return;

    try {
      const raw = localStorage.getItem("carExpenses");
      const list = raw ? JSON.parse(raw) : [];
      const newExp = {
        id: Date.now(),
        name: carName.trim(),
        price: priceNum,
        completed: true,
        createdAt: new Date().toISOString(),
      };
      list.unshift(newExp);
      localStorage.setItem("carExpenses", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("cardo:expenses-updated"));
      window.dispatchEvent(new Event("storage"));

      showToast(`✓ "${carName}" araç masrafı kaydedildi!`);
      setCarName("");
      setCarPrice("");
      if (closeAfter) {
        setTimeout(onClose, 400);
      } else {
        inputRef.current?.focus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/70 bg-surface/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-sm shadow-primary/25">
              <BoltIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                  Hızlı Ekle & Kaydet
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-surface-raised border border-border text-[10px] font-mono text-muted">
                  Ctrl+K
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Herhangi bir sayfadan ayrılmadan hane verilerini kaydedin
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-surface-raised text-muted hover:text-foreground transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-5 p-2 bg-surface-raised/40 border-b border-border/60 gap-1 text-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("shopping")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "shopping"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>🛒</span>
            <span className="truncate text-[11px] sm:text-xs">Alışveriş</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gider")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "gider"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>💰</span>
            <span className="truncate text-[11px] sm:text-xs">Gider</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cleaning")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "cleaning"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>🧹</span>
            <span className="truncate text-[11px] sm:text-xs">Temizlik</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "calendar"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>📅</span>
            <span className="truncate text-[11px] sm:text-xs">Takvim</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cardo")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === "cardo"
                ? "bg-surface text-primary shadow-xs border border-border"
                : "text-muted hover:text-foreground hover:bg-surface/50"
            }`}
          >
            <span>🚗</span>
            <span className="truncate text-[11px] sm:text-xs">Araç</span>
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="mx-5 mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
            <span>✨</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: SHOPPING */}
          {activeTab === "shopping" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Ne alınacak? *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={shopTitle}
                  onChange={(e) => setShopTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleShoppingSubmit(false);
                  }}
                  placeholder="örn: Süt, Deterjan, Maden Suyu..."
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Miktar (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={shopQuantity}
                    onChange={(e) => setShopQuantity(e.target.value)}
                    placeholder="örn: 2 adet, 1 kg"
                    className="field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Kategori
                  </label>
                  <select
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value as ShoppingCategory)}
                    className="field"
                  >
                    <option value="market">🍎 Gıda & Market</option>
                    <option value="cleaning">🧼 Temizlik & Hijyen</option>
                    <option value="personal">🧴 Kişisel Bakım</option>
                    <option value="home">🏠 Ev & Yaşam</option>
                    <option value="other">📦 Diğer</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShoppingSubmit(true)}
                  disabled={!shopTitle.trim()}
                  className="primary-button flex-1"
                >
                  Kaydet & Kapat
                </button>
                <button
                  type="button"
                  onClick={() => handleShoppingSubmit(false)}
                  disabled={!shopTitle.trim()}
                  className="secondary-button flex-1"
                >
                  Kaydet & Yeni Yaz
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GIDER */}
          {activeTab === "gider" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Harcamayı Yapan Kişi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGiderKullanici("mert")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      giderKullanici === "mert"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                    }`}
                  >
                    👤 Mert
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiderKullanici("havsa")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      giderKullanici === "havsa"
                        ? "bg-primary text-white border-primary shadow-xs"
                        : "bg-surface-raised border-border text-foreground hover:bg-border/30"
                    }`}
                  >
                    👤 Havsa
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Harcama Açıklaması *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={giderAciklama}
                  onChange={(e) => setGiderAciklama(e.target.value)}
                  placeholder="örn: Kahve, Benzin, Öğle Yemeği..."
                  className="field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={giderTutar}
                  onChange={(e) => setGiderTutar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGiderSubmit(false);
                  }}
                  placeholder="0.00"
                  className="field"
                />
              </div>

              <p className="text-[11px] text-muted">
                * Bu ayın bireysel harcamalarına doğrudan yansıtılır.
              </p>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGiderSubmit(true)}
                  disabled={!giderAciklama.trim() || !giderTutar}
                  className="primary-button flex-1"
                >
                  Kaydet & Kapat
                </button>
                <button
                  type="button"
                  onClick={() => handleGiderSubmit(false)}
                  disabled={!giderAciklama.trim() || !giderTutar}
                  className="secondary-button flex-1"
                >
                  Kaydet & Yeni Yaz
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CLEANING */}
          {activeTab === "cleaning" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">
                  Bugün Temizlenen Odayı Seçin
                </span>
                <p className="text-[11px] text-muted">
                  Tek dokunuşla odayı bugün temizlendi olarak kaydedin:
                </p>
              </div>

              {rooms.length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-border text-xs text-muted">
                  Henüz kayıtlı oda yok. Hane Cleaning sayfasından oda ekleyebilirsiniz.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {rooms.map((room) => {
                    const isCleaned = cleanedRoomIds.has(room.id);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleCleanRoom(room)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer group ${
                          isCleaned
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-surface-raised border-border text-foreground hover:border-primary/40 hover:bg-surface"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0">
                            {room.icon || "🧹"}
                          </span>
                          <span className="text-xs font-bold truncate">
                            {room.name}
                          </span>
                        </div>
                        <span className="text-xs font-bold shrink-0">
                          {isCleaned ? "✓ Temizlendi" : "Temizle +"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CALENDAR */}
          {activeTab === "calendar" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Etkinlik Başlığı *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={calTitle}
                  onChange={(e) => setCalTitle(e.target.value)}
                  placeholder="örn: Veli toplantısı, Fatura son ödeme..."
                  className="field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Tarih *
                  </label>
                  <input
                    type="date"
                    value={calDate}
                    onChange={(e) => setCalDate(e.target.value)}
                    className="field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    Saat (İsteğe bağlı)
                  </label>
                  <input
                    type="time"
                    value={calTime}
                    onChange={(e) => setCalTime(e.target.value)}
                    className="field"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Kategori
                </label>
                <select
                  value={calCategory}
                  onChange={(e) => setCalCategory(e.target.value as CalendarCategory)}
                  className="field"
                >
                  <option value="default">📅 Genel</option>
                  <option value="family">🏠 Aile & Ev</option>
                  <option value="bill">💰 Fatura & Ödeme</option>
                  <option value="work">💼 İş & Randevu</option>
                  <option value="health">🏥 Sağlık</option>
                  <option value="birthday">🎂 Doğum Günü</option>
                  <option value="trip">✈️ Seyahat & Tatil</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCalendarSubmit(true)}
                  disabled={!calTitle.trim()}
                  className="primary-button flex-1"
                >
                  Kaydet & Kapat
                </button>
                <button
                  type="button"
                  onClick={() => handleCalendarSubmit(false)}
                  disabled={!calTitle.trim()}
                  className="secondary-button flex-1"
                >
                  Kaydet & Yeni Yaz
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: CARDO */}
          {activeTab === "cardo" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Masraf / İşlem Adı *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={carName}
                  onChange={(e) => setCarName(e.target.value)}
                  placeholder="örn: Benzin, Oto Yıkama, Otopark, Cam Suyu..."
                  className="field"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  Tutar (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={carPrice}
                  onChange={(e) => setCarPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCarSubmit(false);
                  }}
                  placeholder="0.00"
                  className="field"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCarSubmit(true)}
                  disabled={!carName.trim() || !carPrice}
                  className="primary-button flex-1"
                >
                  Kaydet & Kapat
                </button>
                <button
                  type="button"
                  onClick={() => handleCarSubmit(false)}
                  disabled={!carName.trim() || !carPrice}
                  className="secondary-button flex-1"
                >
                  Kaydet & Yeni Yaz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
