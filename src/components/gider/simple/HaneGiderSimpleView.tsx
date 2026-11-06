"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type {
  AyHaneGiderVerisi,
  BireyselAyriHarcama,
  BireyselEkstreKalemi,
  BireyselGelirKalemi,
  HaneTransferi,
  KrediKartiEkstresi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import {
  ayGenelToplamlar,
  ayHaneOrtakPayi,
  ayEkstreIciBireyselToplamlar,
  ayMahsuplasmaHesapla,
  ayToplamGelir,
  ayToplamGirisGideri,
  bireyselAyriHarcamaToplamlar,
  bireyselGelirToplamlar,
  tekKartHesabi,
  toplumaDahilKartlar,
} from "@/domain/ekstreHesapla";
import {
  ayAnahtariOlustur,
  ayAnahtariParcala,
  ayVerisiOku,
  ayVerisiYaz,
} from "@/storage/ayDeposu";
import {
  yedekDosyasiDisaAktar,
  yedekDosyasiniIceAktar,
} from "@/storage/yedekDeposu";
import { AYLAR, para, tutarMetniInputIcin, KULLANICI_ETIKET, ODEYEN_ETIKET } from "../v2/constants";
import type { GiderV2Calculations } from "../v2/types";
import {
  KartEkleDuzenleModal,
  ParaTransferiModalV2,
  OnayModal,
  OzetRaporModalV2,
  BireyselKayitModal,
} from "../v2/GiderV2Modals";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  SettingsIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/components/ui/Icons";

function simdikiAyAnahtari(): string {
  const d = new Date();
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth());
}

function ayEtiketi(anahtar: string): string {
  const { yil, ay } = ayAnahtariParcala(anahtar);
  return `${AYLAR[ay] ?? "—"} ${yil}`;
}

function ayKaydir(anahtar: string, delta: number): string {
  const { yil, ay } = ayAnahtariParcala(anahtar);
  const d = new Date(yil, ay + delta, 1);
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth());
}

type GiderFilterTab = "tum" | "ortak" | "bireysel";

export function HaneGiderSimpleView() {
  const [anahtar, setAnahtar] = useState(simdikiAyAnahtari);
  const [veri, setVeri] = useState<AyHaneGiderVerisi>({
    krediKartlari: [],
    bireyselAyriHarcamalar: [],
    bireyselGelirKalemleri: [],
    transferler: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Filtre ve Akordiyon State
  const [filterTab, setFilterTab] = useState<GiderFilterTab>("tum");
  const [expandedKartId, setExpandedKartId] = useState<string | null>(null);
  const [showMathDrawer, setShowMathDrawer] = useState(false);
  const [showTransfersDrawer, setShowTransfersDrawer] = useState(false);
  const [confirmDeleteKartId, setConfirmDeleteKartId] = useState<string | null>(null);

  // Hızlı Bireysel Kalem Ekleme (Kart İçinde)
  const [inlineKalemKartId, setInlineKalemKartId] = useState<string | null>(null);
  const [kalemKisi, setKalemKisi] = useState<KullaniciId>("mert");
  const [kalemAciklama, setKalemAciklama] = useState("");
  const [kalemTutarStr, setKalemTutarStr] = useState("");

  // Menü & Toast
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toastMesaj, setToastMesaj] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modallar
  const [isKartModalOpen, setIsKartModalOpen] = useState(false);
  const [editingKart, setEditingKart] = useState<KrediKartiEkstresi | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [copyConfirmType, setCopyConfirmType] = useState<"gider" | "gelir" | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isOzetModalOpen, setIsOzetModalOpen] = useState(false);

  // Gelir & Kişisel Bütçe Çekmecesi / Modalı
  const [isGelirDrawerOpen, setIsGelirDrawerOpen] = useState(false);
  const [gelirDrawerSubTab, setGelirDrawerSubTab] = useState<"gelir" | "harcama">("gelir");

  // Bireysel Kayıt Düzenleme Modalları
  const [editingBireyselKalem, setEditingBireyselKalem] = useState<{
    kartId: string;
    kartAdi: string;
    kalem: BireyselEkstreKalemi;
  } | null>(null);
  const [editingAyriHarcama, setEditingAyriHarcama] = useState<BireyselAyriHarcama | null>(null);
  const [editingGelir, setEditingGelir] = useState<BireyselGelirKalemi | null>(null);

  const iceAktarInputRef = useRef<HTMLInputElement>(null);
  const sonKaydedilenRef = useRef<string>("");

  const showToast = useCallback((mesaj: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMesaj(mesaj);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMesaj(null);
    }, 3200);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // İlk yükleme
  useEffect(() => {
    const baslangic = ayVerisiOku(anahtar);
    sonKaydedilenRef.current = JSON.stringify(baslangic);
    setVeri(baslangic);
    setIsLoaded(true);
  }, []);

  const handleAnahtarDegis = useCallback((yeniAnahtar: string) => {
    const yeniAy = ayVerisiOku(yeniAnahtar);
    sonKaydedilenRef.current = JSON.stringify(yeniAy);
    setAnahtar(yeniAnahtar);
    setVeri(yeniAy);
    setExpandedKartId(null);
  }, []);

  // Senkronizasyon
  useEffect(() => {
    if (!isLoaded) return;
    const handleStorage = () => {
      const guncel = ayVerisiOku(anahtar);
      const guncelStr = JSON.stringify(guncel);
      if (sonKaydedilenRef.current !== guncelStr) {
        sonKaydedilenRef.current = guncelStr;
        setVeri(guncel);
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("hane-gider:updated", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("hane-gider:updated", handleStorage);
    };
  }, [anahtar, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const jsonStr = JSON.stringify(veri);
    if (sonKaydedilenRef.current === jsonStr) return;
    sonKaydedilenRef.current = jsonStr;
    ayVerisiYaz(anahtar, veri);
  }, [anahtar, veri, isLoaded]);

  // Hesaplamalar
  const calc = useMemo<GiderV2Calculations>(() => {
    const genel = ayGenelToplamlar(veri.krediKartlari);
    const haneOrtakPayi = ayHaneOrtakPayi(veri.krediKartlari);
    const ekstreIciBireysel = ayEkstreIciBireyselToplamlar(veri.krediKartlari);
    const ayriBireyselToplam = bireyselAyriHarcamaToplamlar(veri.bireyselAyriHarcamalar);
    const ayriGelirToplam = bireyselGelirToplamlar(veri.bireyselGelirKalemleri);

    const kisiselToplam = {
      mert: ekstreIciBireysel.mert + ayriBireyselToplam.mert,
      havsa: ekstreIciBireysel.havsa + ayriBireyselToplam.havsa,
    };
    const ortakPay = haneOrtakPayi;

    const mertGider = ortakPay.mert + kisiselToplam.mert;
    const havsaGider = ortakPay.havsa + kisiselToplam.havsa;
    const mertGelir = ayriGelirToplam.mert;
    const havsaGelir = ayriGelirToplam.havsa;
    const mertKalan = mertGelir - mertGider;
    const havsaKalan = havsaGelir - havsaGider;

    const evGideriToplami = ayToplamGirisGideri(veri);
    const evGelirToplami = ayToplamGelir(veri);
    const evKalan = evGelirToplami - evGideriToplami;

    const kayitToplamlari = toplumaDahilKartlar(veri.krediKartlari).reduce(
      (s, k) => s + Math.max(0, k.toplamEkstre),
      0
    );

    const ayriBireyselHarcamalarToplami = veri.bireyselAyriHarcamalar.reduce(
      (s, h) => s + Math.max(0, h.tutar),
      0
    );

    const herhangiAsim = toplumaDahilKartlar(veri.krediKartlari).some(
      (k) => tekKartHesabi(k).asim
    );

    const mahsuplasma = ayMahsuplasmaHesapla(
      veri.krediKartlari,
      veri.transferler ?? []
    );

    return {
      genel,
      ortakPay,
      kisiselToplam,
      ayriBireyselToplam,
      ayriGelirToplam,
      mertGider,
      havsaGider,
      mertGelir,
      havsaGelir,
      mertKalan,
      havsaKalan,
      evGideriToplami,
      evGelirToplami,
      evKalan,
      kayitToplamlari,
      ayriBireyselHarcamalarToplami,
      herhangiAsim,
      mahsuplasma,
    };
  }, [veri]);

  const filtrelenmisKartlar = useMemo(() => {
    const sirali = [...veri.krediKartlari].sort((a, b) => {
      const aBireysel = a.kimeAit === "mert" || a.kimeAit === "havsa";
      const bBireysel = b.kimeAit === "mert" || b.kimeAit === "havsa";
      if (aBireysel === bBireysel) return 0;
      return aBireysel ? 1 : -1;
    });

    if (filterTab === "ortak") {
      return sirali.filter((k) => (k.kimeAit ?? "ortak") === "ortak");
    }
    if (filterTab === "bireysel") {
      return sirali.filter((k) => k.kimeAit === "mert" || k.kimeAit === "havsa");
    }
    return sirali;
  }, [veri.krediKartlari, filterTab]);

  // Eylemler
  const handleKartKaydet = (kayit: {
    id?: string;
    ad: string;
    toplamEkstre: number;
    odenenKisi: "mert" | "havsa" | "ortak";
    kimeAit?: "ortak" | "mert" | "havsa";
    tumGiderToplamlarindaHaric?: boolean;
    kayitTipi?: "kart" | "harcama";
  }) => {
    if (kayit.id) {
      setVeri((v) => ({
        ...v,
        krediKartlari: v.krediKartlari.map((k) =>
          k.id === kayit.id
            ? {
                ...k,
                ad: kayit.ad,
                toplamEkstre: kayit.toplamEkstre,
                odenenKisi: kayit.odenenKisi,
                kimeAit: kayit.kimeAit ?? "ortak",
                tumGiderToplamlarindaHaric: kayit.tumGiderToplamlarindaHaric,
                kayitTipi: kayit.kayitTipi,
                bireyselKalemler:
                  kayit.kayitTipi === "harcama" ||
                  kayit.kimeAit === "mert" ||
                  kayit.kimeAit === "havsa"
                    ? []
                    : k.bireyselKalemler,
              }
            : k
        ),
      }));
      showToast("Kayıt güncellendi.");
    } else {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "k-" + Date.now();
      const yeni: KrediKartiEkstresi = {
        id,
        ad: kayit.ad,
        toplamEkstre: kayit.toplamEkstre,
        odenenKisi: kayit.odenenKisi,
        kimeAit: kayit.kimeAit ?? "ortak",
        tumGiderToplamlarindaHaric: kayit.tumGiderToplamlarindaHaric,
        kayitTipi: kayit.kayitTipi,
        bireyselKalemler: [],
      };
      setVeri((v) => ({
        ...v,
        krediKartlari: [yeni, ...v.krediKartlari],
      }));
      showToast(kayit.kayitTipi === "harcama" ? "Harcama eklendi." : "Kart eklendi.");
    }
  };

  const handleKartSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.filter((k) => k.id !== id),
    }));
    setConfirmDeleteKartId(null);
    showToast("Kayıt silindi.");
  };

  const handleBireyselEkle = (kartId: string, kalem: Omit<BireyselEkstreKalemi, "id">) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "b-" + Date.now();
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? { ...k, bireyselKalemler: [...k.bireyselKalemler, { ...kalem, id }] }
          : k
      ),
    }));
    showToast("Bireysel kalem eklendi.");
  };

  const handleBireyselSil = (kartId: string, kalemId: string) => {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: k.bireyselKalemler.filter((x) => x.id !== kalemId),
            }
          : k
      ),
    }));
    showToast("Bireysel kalem silindi.");
  };

  const handleBireyselGuncelle = (kartId: string, kalem: BireyselEkstreKalemi) => {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: k.bireyselKalemler.map((x) =>
                x.id === kalem.id ? kalem : x
              ),
            }
          : k
      ),
    }));
    showToast("Kalem güncellendi.");
  };

  const handleAyriHarcamaEkle = (h: Omit<BireyselAyriHarcama, "id">) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "h-" + Date.now();
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: [...v.bireyselAyriHarcamalar, { ...h, id }],
    }));
    showToast("Şahsi harcama eklendi.");
  };

  const handleAyriHarcamaGuncelle = (h: BireyselAyriHarcama) => {
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.map((x) =>
        x.id === h.id ? h : x
      ),
    }));
    showToast("Şahsi harcama güncellendi.");
  };

  const handleAyriHarcamaSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.filter((h) => h.id !== id),
    }));
    showToast("Şahsi harcama silindi.");
  };

  const handleGelirEkle = (g: Omit<BireyselGelirKalemi, "id">) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "g-" + Date.now();
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: [...v.bireyselGelirKalemleri, { ...g, id }],
    }));
    showToast("Gelir eklendi.");
  };

  const handleGelirGuncelle = (g: BireyselGelirKalemi) => {
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.map((x) =>
        x.id === g.id ? g : x
      ),
    }));
    showToast("Gelir güncellendi.");
  };

  const handleGelirSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.filter((g) => g.id !== id),
    }));
    showToast("Gelir silindi.");
  };

  const handleTransferKaydet = (t: {
    gonderen: KullaniciId;
    alan: KullaniciId;
    tutar: number;
    tarih?: string;
    aciklama?: string;
    bireyselGidereYansit?: boolean;
  }) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "tr-" + Date.now();
    const yeni: HaneTransferi = { id, ...t };
    setVeri((v) => ({
      ...v,
      transferler: [...(v.transferler ?? []), yeni],
    }));
    showToast("Havale / transfer kaydedildi.");
  };

  const handleTransferSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      transferler: (v.transferler ?? []).filter((t) => t.id !== id),
    }));
    showToast("Transfer silindi.");
  };

  const handleOncekiAyGiderleriKopyala = () => {
    const oncekiAnahtar = ayKaydir(anahtar, -1);
    const onceki = ayVerisiOku(oncekiAnahtar);
    const kartlar = onceki.krediKartlari ?? [];
    const harcamalar = onceki.bireyselAyriHarcamalar ?? [];

    if (kartlar.length === 0 && harcamalar.length === 0) {
      showToast(`${ayEtiketi(oncekiAnahtar)} ayında kopyalanacak gider yok.`);
      setCopyConfirmType(null);
      return;
    }

    const kopyaKartlar = structuredClone(kartlar).map((k) => ({
      ...k,
      id: "k-" + Math.random().toString(36).slice(2, 9),
      bireyselKalemler: (k.bireyselKalemler ?? []).map((bk) => ({
        ...bk,
        id: "bk-" + Math.random().toString(36).slice(2, 9),
      })),
    }));

    const kopyaHarcamalar = structuredClone(harcamalar).map((h) => ({
      ...h,
      id: "h-" + Math.random().toString(36).slice(2, 9),
    }));

    setVeri((v) => ({
      ...v,
      krediKartlari: kopyaKartlar,
      bireyselAyriHarcamalar: kopyaHarcamalar,
    }));
    setCopyConfirmType(null);
    showToast(`${ayEtiketi(oncekiAnahtar)} giderleri kopyalandı.`);
  };

  const handleOncekiAyGelirleriKopyala = () => {
    const oncekiAnahtar = ayKaydir(anahtar, -1);
    const onceki = ayVerisiOku(oncekiAnahtar);
    const gelirler = onceki.bireyselGelirKalemleri ?? [];

    if (gelirler.length === 0) {
      showToast(`${ayEtiketi(oncekiAnahtar)} ayında kopyalanacak gelir yok.`);
      setCopyConfirmType(null);
      return;
    }

    const kopyaGelirler = structuredClone(gelirler).map((g) => ({
      ...g,
      id: "g-" + Math.random().toString(36).slice(2, 9),
    }));

    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: kopyaGelirler,
    }));
    setCopyConfirmType(null);
    showToast(`${ayEtiketi(oncekiAnahtar)} gelirleri kopyalandı.`);
  };

  const handleBuAySifirla = () => {
    setVeri({
      krediKartlari: [],
      bireyselAyriHarcamalar: [],
      bireyselGelirKalemleri: [],
      transferler: [],
    });
    showToast("Bu ayın verileri sıfırlandı.");
  };

  const handleDisaAktar = () => {
    yedekDosyasiDisaAktar();
    showToast("Yedek indirildi.");
  };

  const handleIceAktarDosyaSecildi = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      try {
        const metin = String(okuyucu.result ?? "");
        const sonuc = yedekDosyasiniIceAktar(metin);
        if (!sonuc.basarili) {
          showToast(sonuc.hata ?? "Geçersiz yedek.");
          return;
        }
        setVeri(ayVerisiOku(anahtar));
        showToast(`${sonuc.aySayisi} ay yüklendi.`);
      } catch {
        showToast("Dosya okunamadı.");
      }
    };
    okuyucu.readAsText(dosya, "utf-8");
  };

  const handleInlineKalemSubmit = (e: React.FormEvent, kartId: string) => {
    e.preventDefault();
    const tutar = Number(kalemTutarStr.replace(",", "."));
    if (!kalemAciklama.trim() || !Number.isFinite(tutar) || tutar <= 0) return;

    handleBireyselEkle(kartId, {
      kullaniciId: kalemKisi,
      aciklama: kalemAciklama.trim(),
      tutar,
    });
    setKalemAciklama("");
    setKalemTutarStr("");
    setInlineKalemKartId(null);
  };

  if (!isLoaded) {
    return <div className="h-48 animate-pulse rounded-2xl bg-surface-raised border border-border" />;
  }

  const isCurrentMonth = anahtar === simdikiAyAnahtari();
  const { mahsuplasma } = calc;
  const transferSayisi = (veri.transferler ?? []).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMesaj && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-surface shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <span>✓</span>
          <span>{toastMesaj}</span>
        </div>
      )}

      <input
        ref={iceAktarInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleIceAktarDosyaSecildi}
      />

      {/* 1. KOMPAKT DÖNEM & HIZLI AKSİYON ÇUBUĞU */}
      <div className="ds-card p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sol: Ay Seçici */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center p-1 rounded-xl bg-surface-raised border border-border">
            <button
              type="button"
              onClick={() => handleAnahtarDegis(ayKaydir(anahtar, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              aria-label="Önceki ay"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <div className="px-3 py-1 text-xs sm:text-sm font-bold text-foreground min-w-[125px] text-center flex items-center justify-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              <span>{ayEtiketi(anahtar)}</span>
            </div>
            <button
              type="button"
              onClick={() => handleAnahtarDegis(ayKaydir(anahtar, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-foreground hover:bg-surface transition cursor-pointer"
              aria-label="Sonraki ay"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={() => handleAnahtarDegis(simdikiAyAnahtari())}
              className="accent-button h-8 px-2.5 text-xs"
            >
              Bu Ay
            </button>
          )}
        </div>

        {/* Sağ: Gelir/Şahsi Bütçe, Ayarlar ve Ekle */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={() => {
              setGelirDrawerSubTab("gelir");
              setIsGelirDrawerOpen(true);
            }}
            className="secondary-button h-9 px-3 text-xs font-semibold"
          >
            <span>💼</span>
            <span>Gelirler & Şahsi ({veri.bireyselGelirKalemleri.length + veri.bireyselAyriHarcamalar.length})</span>
          </button>

          {/* İşlemler Menüsü */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((v) => !v)}
              className="secondary-button h-9 px-2.5 text-xs"
              title="Diğer İşlemler"
            >
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden md:inline">İşlemler</span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 p-1.5 rounded-2xl bg-surface border border-border shadow-lg z-30 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCopyConfirmType("gider");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span>💳</span>
                  <span className="font-semibold">Önceki Aydan Giderleri Kopyala</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCopyConfirmType("gelir");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span>💵</span>
                  <span className="font-semibold">Önceki Aydan Gelirleri Kopyala</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsOzetModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span>📋</span>
                  <span className="font-semibold">WhatsApp / Pano Özeti</span>
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleDisaAktar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span>📤</span>
                  <span className="font-semibold">JSON Yedeği İndir</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    iceAktarInputRef.current?.click();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-surface-raised transition text-left cursor-pointer"
                >
                  <span>📥</span>
                  <span className="font-semibold">JSON Yedeği Yükle</span>
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsResetConfirmOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-danger hover:bg-danger-bg transition text-left cursor-pointer"
                >
                  <span>🗑️</span>
                  <span className="font-semibold">Bu Ayı Sıfırla</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingKart(null);
              setIsKartModalOpen(true);
            }}
            className="primary-button h-9 px-3.5 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>Kart / Harcama Ekle</span>
          </button>
        </div>
      </div>

      {/* 2. NET ÖZET BANNER & MAHSUPLAŞMA (TEK BAKIŞTA DURUM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sol 7 Kolon: Kişi ve Hane Özeti (Sade 3'lü Kutu) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Ev Toplam */}
          <div className="ds-card p-4 flex flex-col justify-between border-l-4 border-l-primary">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="font-bold uppercase tracking-wider text-primary">🏠 Ev Toplamı</span>
            </div>
            <div className="my-2">
              <div className="text-xl font-extrabold text-foreground tabular-nums">
                {para(calc.evGideriToplami)}
              </div>
              <span className="text-[11px] text-muted block">Toplam Harcama</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <span className="text-muted">Ortak Kişi Başı:</span>
              <span className="font-bold text-foreground tabular-nums">{para(calc.ortakPay.mert)}</span>
            </div>
          </div>

          {/* Mert */}
          <div className="ds-card p-4 flex flex-col justify-between border-l-4 border-l-sky-500">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">👤 Mert</span>
              {calc.mertGelir > 0 && (
                <span className="text-[11px] text-success font-bold tabular-nums">
                  Gelir: {para(calc.mertGelir)}
                </span>
              )}
            </div>
            <div className="my-2 space-y-1.5">
              <div>
                <div className="text-xl font-extrabold text-foreground tabular-nums leading-tight">
                  {para(calc.mertGider)}
                </div>
                <span className="text-[11px] text-muted block">Bu Ayki Toplam Gider</span>
              </div>

              {calc.mertGelir > 0 && (
                <div className="pt-1.5 border-t border-border/60 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Kalan:
                  </span>
                  <span
                    className={`text-base sm:text-lg font-extrabold tabular-nums ${
                      calc.mertKalan >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {para(calc.mertKalan)}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
              <span>Ortak: {para(calc.ortakPay.mert)}</span>
              <span>Şahsi: {para(calc.kisiselToplam.mert)}</span>
            </div>
          </div>

          {/* Havsa */}
          <div className="ds-card p-4 flex flex-col justify-between border-l-4 border-l-pink-500">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">👤 Havsa</span>
              {calc.havsaGelir > 0 && (
                <span className="text-[11px] text-success font-bold tabular-nums">
                  Gelir: {para(calc.havsaGelir)}
                </span>
              )}
            </div>
            <div className="my-2 space-y-1.5">
              <div>
                <div className="text-xl font-extrabold text-foreground tabular-nums leading-tight">
                  {para(calc.havsaGider)}
                </div>
                <span className="text-[11px] text-muted block">Bu Ayki Toplam Gider</span>
              </div>

              {calc.havsaGelir > 0 && (
                <div className="pt-1.5 border-t border-border/60 flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">
                    Kalan:
                  </span>
                  <span
                    className={`text-base sm:text-lg font-extrabold tabular-nums ${
                      calc.havsaKalan >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {para(calc.havsaKalan)}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted">
              <span>Ortak: {para(calc.ortakPay.havsa)}</span>
              <span>Şahsi: {para(calc.kisiselToplam.havsa)}</span>
            </div>
          </div>
        </div>

        {/* Sağ 5 Kolon: Net Mahsuplaşma (Kim Kime Ne Gönderecek?) */}
        <div className="lg:col-span-5 ds-card-lavender p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🤝</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Ay Sonu Hesaplaşma
              </span>
            </div>
            {mahsuplasma.tamamlandiMi ? (
              <span className="ds-badge ds-badge-success text-[10px]">✓ Dengede</span>
            ) : (
              <span className="ds-badge ds-badge-warning text-[10px]">Havale Bekliyor</span>
            )}
          </div>

          <div className="my-2.5 flex items-center justify-between gap-3">
            <div>
              {mahsuplasma.tamamlandiMi ? (
                <div className="text-sm font-bold text-foreground">
                  Kimsenin birbirine borcu yok 🎉
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-foreground-secondary">
                    {mahsuplasma.borcluKisi === "havsa" ? "Havsa ➔ Mert'e" : "Mert ➔ Havsa'ya"}
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold text-primary tabular-nums">
                    {para(mahsuplasma.transferTutari)}
                  </div>
                </>
              )}
              <div className="text-[11px] text-muted mt-0.5">
                Mert Ödedi: {para(mahsuplasma.mertOdedi)} • Havsa Ödedi: {para(mahsuplasma.havsaOdedi)}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="primary-button h-8 px-3 text-xs"
              >
                💸 Havale Kaydet
              </button>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowMathDrawer((v) => !v)}
                  className="text-[11px] font-semibold text-muted hover:text-foreground underline cursor-pointer"
                >
                  {showMathDrawer ? "Detayı Gizle" : "Nasıl Hesaplandı?"}
                </button>
                {transferSayisi > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTransfersDrawer((v) => !v)}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Havaleler ({transferSayisi})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Açılır Matematik Özeti */}
          {showMathDrawer && (
            <div className="mt-2 pt-2.5 border-t border-border-lavender text-[11px] text-foreground-secondary space-y-1 animate-in fade-in">
              <div className="flex justify-between">
                <span>Mert (Ödediği {para(mahsuplasma.mertOdedi)} − Payı {para(mahsuplasma.mertPayinaDusen)}):</span>
                <strong className="tabular-nums">{para(mahsuplasma.mertOdedi - mahsuplasma.mertPayinaDusen)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Havsa (Ödediği {para(mahsuplasma.havsaOdedi)} − Payı {para(mahsuplasma.havsaPayinaDusen)}):</span>
                <strong className="tabular-nums">{para(mahsuplasma.havsaOdedi - mahsuplasma.havsaPayinaDusen)}</strong>
              </div>
              {mahsuplasma.toplamTransferEdilen > 0 && (
                <div className="flex justify-between text-success">
                  <span>Yapılan Havaleler Toplamı:</span>
                  <strong className="tabular-nums">{para(mahsuplasma.toplamTransferEdilen)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Açılır Yapılan Havaleler Listesi */}
          {showTransfersDrawer && transferSayisi > 0 && (
            <div className="mt-2 pt-2.5 border-t border-border-lavender space-y-1.5 animate-in fade-in">
              {(veri.transferler ?? []).map((tr) => (
                <div
                  key={tr.id}
                  className="flex items-center justify-between text-[11px] bg-surface px-2.5 py-1.5 rounded-lg border border-border"
                >
                  <div>
                    <span className="font-bold">{KULLANICI_ETIKET[tr.gonderen]} ➔ {KULLANICI_ETIKET[tr.alan]}</span>
                    <span className="ml-2 font-bold text-success tabular-nums">{para(tr.tutar)}</span>
                    {tr.aciklama && <span className="text-muted ml-1.5">({tr.aciklama})</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTransferSil(tr.id)}
                    className="text-muted hover:text-danger font-bold px-1 cursor-pointer"
                    title="Transferi sil"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. KARTLAR & HARCAMALAR LİSTESİ (TEK MERKEZİ AKORDİYON LİSTE) */}
      <div className="space-y-3">
        {/* Liste Başlığı ve Filtre Sekmeleri */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Bu Ayki Kartlar & Harcamalar ({filtrelenmisKartlar.length})
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterTab("tum")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterTab === "tum"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Tümü ({veri.krediKartlari.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("ortak")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterTab === "ortak"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              👥 Ortak ({veri.krediKartlari.filter((k) => (k.kimeAit ?? "ortak") === "ortak").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("bireysel")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                filterTab === "bireysel"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              👤 Şahsi ({veri.krediKartlari.filter((k) => k.kimeAit === "mert" || k.kimeAit === "havsa").length})
            </button>
          </div>
        </div>

        {/* Kartlar Listesi */}
        {filtrelenmisKartlar.length === 0 ? (
          <div className="ds-card p-10 text-center space-y-3 border-dashed">
            <span className="text-3xl block">💳</span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Henüz Kart veya Harcama Yok</h4>
              <p className="text-xs text-muted max-w-md mx-auto">
                Bu ay için kredi kartı ekstresi, fatura veya kira kaydı ekleyerek otomatik paylaşım hesabını başlatın.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditingKart(null);
                  setIsKartModalOpen(true);
                }}
                className="primary-button h-9 px-4 text-xs"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                <span>Kart / Harcama Ekle</span>
              </button>
              <button
                type="button"
                onClick={() => setCopyConfirmType("gider")}
                className="secondary-button h-9 px-3.5 text-xs"
              >
                <span>🔄 Önceki Aydan Kopyala</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtrelenmisKartlar.map((kart) => {
              const h = tekKartHesabi(kart);
              const isHarcama = kart.kayitTipi === "harcama";
              const kimeAit = kart.kimeAit ?? "ortak";
              const isBireysel = kimeAit === "mert" || kimeAit === "havsa";
              const odeyen =
                kart.odenenKisi ??
                (kart.ad.toLowerCase().includes("havsa") ? "havsa" : "mert");
              const isExpanded = expandedKartId === kart.id;
              const isInlineAdd = inlineKalemKartId === kart.id;

              return (
                <div
                  key={kart.id}
                  className={`ds-card p-0 overflow-hidden transition-all ${
                    kart.tumGiderToplamlarindaHaric ? "opacity-65" : ""
                  }`}
                >
                  {/* Ana Satır (Her zaman görünür, tıklanınca detay açılır) */}
                  <div
                    onClick={() => setExpandedKartId(isExpanded ? null : kart.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-surface-raised/60 transition select-none"
                  >
                    {/* Sol: İkon, Başlık ve Rozetler */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-lg shrink-0">
                        {isHarcama ? "🧾" : "💳"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate">
                            {kart.ad}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              kimeAit === "mert"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                                : kimeAit === "havsa"
                                ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
                                : "bg-surface-lavender text-primary border-border-lavender"
                            }`}
                          >
                            {kimeAit === "mert"
                              ? "👤 Mert Şahsi"
                              : kimeAit === "havsa"
                              ? "👤 Havsa Şahsi"
                              : "👥 Ortak"}
                          </span>

                          <span className="text-[11px] text-muted">
                            Ödeyen: <strong className="text-foreground">{ODEYEN_ETIKET[odeyen]}</strong>
                          </span>

                          {!isBireysel && !isHarcama && kart.bireyselKalemler.length > 0 && (
                            <span className="ds-badge ds-badge-neutral text-[10px]">
                              🏷️ {kart.bireyselKalemler.length} şahsi kalem
                            </span>
                          )}

                          {h.asim && (
                            <span className="ds-badge ds-badge-danger text-[10px]">
                              ⚠️ Aşım
                            </span>
                          )}
                        </div>

                        {/* Alt Özet: Kişi Payları */}
                        <div className="flex items-center gap-3 text-[11px] text-muted mt-1">
                          {isBireysel ? (
                            <span>
                              Tamamı {kimeAit === "mert" ? "Mert" : "Havsa"}&apos;ya ait
                            </span>
                          ) : (
                            <>
                              <span>
                                Mert Payı: <strong className="text-sky-600 dark:text-sky-400 tabular-nums">{para(h.mertToplam)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                Havsa Payı: <strong className="text-pink-600 dark:text-pink-400 tabular-nums">{para(h.havsaToplam)}</strong>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Toplam Tutar ve Aksiyonlar */}
                    <div
                      className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-left sm:text-right">
                        <span className="text-base sm:text-lg font-extrabold text-foreground tabular-nums block">
                          {para(kart.toplamEkstre)}
                        </span>
                        <span className="text-[10px] text-muted block">
                          {isHarcama ? "Fatura / Harcama" : "Toplam Ekstre"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isBireysel && !isHarcama && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedKartId(kart.id);
                              setInlineKalemKartId(kart.id);
                            }}
                            className="secondary-button h-8 px-2.5 text-xs"
                            title="Bu kartın içinden şahsi harcama ayrıştır"
                          >
                            + Şahsi Ayır
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setEditingKart(kart);
                            setIsKartModalOpen(true);
                          }}
                          className="icon-button h-8 w-8"
                          title="Düzenle"
                        >
                          <EditIcon className="h-3.5 w-3.5" />
                        </button>

                        {confirmDeleteKartId === kart.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleKartSil(kart.id)}
                              className="danger-button h-8 px-2.5 text-xs"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKartId(null)}
                              className="secondary-button h-8 px-2 text-xs"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKartId(kart.id)}
                            className="icon-button h-8 w-8 hover:text-danger"
                            title="Sil"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedKartId(isExpanded ? null : kart.id)}
                          className="icon-button h-8 w-8"
                          title="Detayları Aç/Kapat"
                        >
                          <ChevronDownIcon
                            className={`h-4 w-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Açılır Detay Çekmecesi (Bireysel Kalemler ve Paylaşım Özeti) */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border bg-surface-raised/40 space-y-3 animate-in fade-in duration-150">
                      {/* Paylaşım Özeti Barı */}
                      {!isBireysel && (
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-surface border border-border text-xs">
                          <div>
                            <span className="text-[10px] text-muted block uppercase font-bold">Ortak Bölünen</span>
                            <span className="font-bold text-foreground tabular-nums">{para(h.ortakTaban)}</span>
                            <span className="text-[10px] text-muted ml-1">({para(h.ortakTaban / 2)} / kişi)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 block uppercase font-bold">Mert Toplam</span>
                            <span className="font-bold text-foreground tabular-nums">{para(h.mertToplam)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-pink-600 dark:text-pink-400 block uppercase font-bold">Havsa Toplam</span>
                            <span className="font-bold text-foreground tabular-nums">{para(h.havsaToplam)}</span>
                          </div>
                        </div>
                      )}

                      {/* Ekstre İçi Şahsi Kalemler */}
                      {!isBireysel && !isHarcama && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground-secondary">
                              🏷️ Bu Kartın İçindeki Şahsi Harcamalar ({kart.bireyselKalemler.length})
                            </span>
                            {!isInlineAdd && (
                              <button
                                type="button"
                                onClick={() => setInlineKalemKartId(kart.id)}
                                className="text-xs font-bold text-primary hover:underline cursor-pointer"
                              >
                                + Şahsi Kalem Ekle
                              </button>
                            )}
                          </div>

                          {kart.bireyselKalemler.length === 0 && !isInlineAdd ? (
                            <p className="text-xs text-muted italic">
                              Bu kartta ayrıştırılmış şahsi harcama yok, tamamı 50/50 ortak bölünüyor.
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {kart.bireyselKalemler.map((bk) => (
                                <div
                                  key={bk.id}
                                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-border text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                        bk.kullaniciId === "mert"
                                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                                          : "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
                                      }`}
                                    >
                                      {KULLANICI_ETIKET[bk.kullaniciId]}
                                    </span>
                                    <span className="font-medium text-foreground truncate">
                                      {bk.aciklama}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="font-bold text-foreground tabular-nums mr-1">
                                      {para(bk.tutar)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingBireyselKalem({
                                          kartId: kart.id,
                                          kartAdi: kart.ad,
                                          kalem: bk,
                                        })
                                      }
                                      className="icon-button h-6 w-6"
                                      title="Düzenle"
                                    >
                                      <EditIcon className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleBireyselSil(kart.id, bk.id)}
                                      className="icon-button h-6 w-6 hover:text-danger"
                                      title="Sil"
                                    >
                                      <CloseIcon className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Hızlı Şahsi Kalem Ekleme Formu */}
                          {isInlineAdd && (
                            <form
                              onSubmit={(e) => handleInlineKalemSubmit(e, kart.id)}
                              className="p-3 rounded-xl bg-surface border border-primary/40 space-y-2.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-primary">
                                  Kart İçinden Şahsi Harcama Ayır
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setInlineKalemKartId(null)}
                                  className="text-muted hover:text-foreground cursor-pointer"
                                >
                                  <CloseIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                <div className="sm:col-span-3">
                                  <select
                                    value={kalemKisi}
                                    onChange={(e) => setKalemKisi(e.target.value as KullaniciId)}
                                    className="field h-9 py-1 text-xs font-semibold"
                                  >
                                    <option value="mert">👤 Mert</option>
                                    <option value="havsa">👤 Havsa</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-5">
                                  <input
                                    type="text"
                                    required
                                    value={kalemAciklama}
                                    onChange={(e) => setKalemAciklama(e.target.value)}
                                    placeholder="Harcama adı (örn: Kıyafet, Oyun...)"
                                    className="field h-9 py-1 text-xs"
                                  />
                                </div>
                                <div className="sm:col-span-4 flex gap-1.5">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    required
                                    value={kalemTutarStr}
                                    onChange={(e) => setKalemTutarStr(e.target.value)}
                                    placeholder="Tutar (₺)"
                                    className="field h-9 py-1 text-xs font-bold tabular-nums flex-1"
                                  />
                                  <button
                                    type="submit"
                                    className="primary-button h-9 px-3 text-xs shrink-0"
                                  >
                                    Ekle
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GELİR & AYRI ŞAHSİ HARCAMALAR MODALI */}
      <GelirVeSahsiHarcamaModal
        isOpen={isGelirDrawerOpen}
        onClose={() => setIsGelirDrawerOpen(false)}
        initialTab={gelirDrawerSubTab}
        gelirler={veri.bireyselGelirKalemleri}
        harcamalar={veri.bireyselAyriHarcamalar}
        onGelirEkle={handleGelirEkle}
        onGelirDuzenle={(g) => setEditingGelir(g)}
        onGelirSil={handleGelirSil}
        onHarcamaEkle={handleAyriHarcamaEkle}
        onHarcamaDuzenle={(h) => setEditingAyriHarcama(h)}
        onHarcamaSil={handleAyriHarcamaSil}
      />

      {/* DİĞER MODALLAR */}
      <KartEkleDuzenleModal
        isOpen={isKartModalOpen}
        onClose={() => setIsKartModalOpen(false)}
        onSave={handleKartKaydet}
        initialData={editingKart}
      />

      <ParaTransferiModalV2
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleTransferKaydet}
        onerilenBorclu={calc.mahsuplasma.hamBorcluKisi}
        onerilenTutar={calc.mahsuplasma.transferTutari}
      />

      <OnayModal
        isOpen={copyConfirmType === "gider"}
        onClose={() => setCopyConfirmType(null)}
        onConfirm={handleOncekiAyGiderleriKopyala}
        title="Önceki Aydan Giderleri Kopyala"
        description={`${ayEtiketi(ayKaydir(anahtar, -1))} dönemine ait kartlar ve harcamalar bu aya aktarılacak.`}
        confirmText="Evet, Kopyala"
      />

      <OnayModal
        isOpen={copyConfirmType === "gelir"}
        onClose={() => setCopyConfirmType(null)}
        onConfirm={handleOncekiAyGelirleriKopyala}
        title="Önceki Aydan Gelirleri Kopyala"
        description={`${ayEtiketi(ayKaydir(anahtar, -1))} dönemine ait gelir kalemleri bu aya aktarılacak.`}
        confirmText="Evet, Kopyala"
      />

      <OnayModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleBuAySifirla}
        title="Bu Ayın Verilerini Sıfırla"
        description="Bu ay için girilmiş tüm kartlar, harcamalar, gelirler ve transferler silinecektir."
        confirmText="Evet, Sıfırla"
        isDanger
      />

      <OzetRaporModalV2
        isOpen={isOzetModalOpen}
        onClose={() => setIsOzetModalOpen(false)}
        ayEtiketiStr={ayEtiketi(anahtar)}
        veri={veri}
        calc={calc}
        onCopySuccess={() => showToast("📋 Rapor panoya kopyalandı!")}
      />

      <BireyselKayitModal
        isOpen={Boolean(editingBireyselKalem)}
        onClose={() => setEditingBireyselKalem(null)}
        title="Şahsi Kalemi Düzenle"
        subtitle={editingBireyselKalem ? `${editingBireyselKalem.kartAdi}` : undefined}
        icon="🏷️"
        initialData={editingBireyselKalem?.kalem}
        onSave={(data) => {
          if (editingBireyselKalem) {
            handleBireyselGuncelle(editingBireyselKalem.kartId, {
              id: editingBireyselKalem.kalem.id,
              ...data,
            });
          }
        }}
      />

      <BireyselKayitModal
        isOpen={Boolean(editingAyriHarcama)}
        onClose={() => setEditingAyriHarcama(null)}
        title="Şahsi Harcamayı Düzenle"
        icon="🛍️"
        initialData={editingAyriHarcama}
        onSave={(data) => {
          if (editingAyriHarcama) {
            handleAyriHarcamaGuncelle({ id: editingAyriHarcama.id, ...data });
          }
        }}
      />

      <BireyselKayitModal
        isOpen={Boolean(editingGelir)}
        onClose={() => setEditingGelir(null)}
        title="Gelir Kalemini Düzenle"
        icon="💼"
        initialData={editingGelir}
        onSave={(data) => {
          if (editingGelir) {
            handleGelirGuncelle({ id: editingGelir.id, ...data });
          }
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// GELİR & ŞAHSİ HARCAMALAR KOMPAKT MODALI
// ------------------------------------------------------------------

function GelirVeSahsiHarcamaModal({
  isOpen,
  onClose,
  initialTab,
  gelirler,
  harcamalar,
  onGelirEkle,
  onGelirDuzenle,
  onGelirSil,
  onHarcamaEkle,
  onHarcamaDuzenle,
  onHarcamaSil,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialTab: "gelir" | "harcama";
  gelirler: BireyselGelirKalemi[];
  harcamalar: BireyselAyriHarcama[];
  onGelirEkle: (g: Omit<BireyselGelirKalemi, "id">) => void;
  onGelirDuzenle: (g: BireyselGelirKalemi) => void;
  onGelirSil: (id: string) => void;
  onHarcamaEkle: (h: Omit<BireyselAyriHarcama, "id">) => void;
  onHarcamaDuzenle: (h: BireyselAyriHarcama) => void;
  onHarcamaSil: (id: string) => void;
}) {
  const [tab, setTab] = useState<"gelir" | "harcama">(initialTab);
  const [kisi, setKisi] = useState<KullaniciId>("mert");
  const [aciklama, setAciklama] = useState("");
  const [tutarStr, setTutarStr] = useState("");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(tutarStr.replace(",", "."));
    if (!aciklama.trim() || !Number.isFinite(tutar) || tutar <= 0) return;

    if (tab === "gelir") {
      onGelirEkle({ kullaniciId: kisi, aciklama: aciklama.trim(), tutar });
    } else {
      onHarcamaEkle({ kullaniciId: kisi, aciklama: aciklama.trim(), tutar });
    }
    setAciklama("");
    setTutarStr("");
  };

  const aktifListe = tab === "gelir" ? gelirler : harcamalar;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl bg-surface border border-border shadow-lg overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("gelir")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === "gelir"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              💼 Bireysel Gelirler ({gelirler.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("harcama")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === "harcama"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              🛍️ Kart Dışı Şahsi Giderler ({harcamalar.length})
            </button>
          </div>
          <button type="button" onClick={onClose} className="icon-button h-8 w-8">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <form onSubmit={handleSubmit} className="p-3 rounded-xl bg-surface-raised border border-border space-y-2.5">
            <span className="text-[11px] font-bold text-muted block">
              {tab === "gelir" ? "Yeni Gelir Ekle (Maaş, Prim vb.)" : "Ortak Hesaba Girmeyen Şahsi Harcama Ekle"}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-3">
                <select
                  value={kisi}
                  onChange={(e) => setKisi(e.target.value as KullaniciId)}
                  className="field h-9 py-1 text-xs font-semibold"
                >
                  <option value="mert">👤 Mert</option>
                  <option value="havsa">👤 Havsa</option>
                </select>
              </div>
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder={tab === "gelir" ? "Örn: Maaş" : "Örn: Nakit Alışveriş"}
                  className="field h-9 py-1 text-xs"
                />
              </div>
              <div className="sm:col-span-4 flex gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={tutarStr}
                  onChange={(e) => setTutarStr(e.target.value)}
                  placeholder="Tutar (₺)"
                  className="field h-9 py-1 text-xs font-bold tabular-nums flex-1"
                />
                <button type="submit" className="primary-button h-9 px-3 text-xs shrink-0">
                  Ekle
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-1.5">
            {aktifListe.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted border border-dashed border-border rounded-xl">
                Henüz kayıt bulunmuyor.
              </div>
            ) : (
              aktifListe.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-border text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        item.kullaniciId === "mert"
                          ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25"
                          : "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/25"
                      }`}
                    >
                      {KULLANICI_ETIKET[item.kullaniciId]}
                    </span>
                    <span className="font-semibold text-foreground truncate">{item.aciklama}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`font-bold tabular-nums mr-1 ${
                        tab === "gelir" ? "text-success" : "text-foreground"
                      }`}
                    >
                      {para(item.tutar)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        tab === "gelir" ? onGelirDuzenle(item) : onHarcamaDuzenle(item)
                      }
                      className="icon-button h-6 w-6"
                    >
                      <EditIcon className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        tab === "gelir" ? onGelirSil(item.id) : onHarcamaSil(item.id)
                      }
                      className="icon-button h-6 w-6 hover:text-danger"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

