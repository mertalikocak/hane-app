"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

import { AYLAR, para } from "./constants";
import type { GiderV2Calculations, GiderV2ViewMode } from "./types";
import { GiderV2Header } from "./GiderV2Header";
import { GiderV2KpiCards } from "./GiderV2KpiCards";
import { GiderV2MahsuplasmaCard } from "./GiderV2MahsuplasmaCard";
import { GiderV2LedgerTable } from "./GiderV2LedgerTable";
import { GiderV2CardList } from "./GiderV2CardList";
import { GiderV2BireyselGelirSection } from "./GiderV2BireyselGelirSection";
import {
  KartEkleDuzenleModal,
  ParaTransferiModalV2,
  OnayModal,
  OzetRaporModalV2,
  BireyselKayitModal,
} from "./GiderV2Modals";

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

export function EvGiderleriSayfasiV2() {
  const [anahtar, setAnahtar] = useState(simdikiAyAnahtari);
  const [veri, setVeri] = useState<AyHaneGiderVerisi>({
    krediKartlari: [],
    bireyselAyriHarcamalar: [],
    bireyselGelirKalemleri: [],
    transferler: [],
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<GiderV2ViewMode>("ozet");

  // Bildirim Toast State
  const [toastMesaj, setToastMesaj] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modallar State
  const [isKartModalOpen, setIsKartModalOpen] = useState(false);
  const [editingKart, setEditingKart] = useState<KrediKartiEkstresi | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [copyConfirmType, setCopyConfirmType] = useState<"gider" | "gelir" | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isOzetModalOpen, setIsOzetModalOpen] = useState(false);

  // Bireysel Kayıt Düzenleme State'leri
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
    }, 3500);
  }, []);

  // Sayfa ilk yüklendiğinde o ayın gerçek verisini localStorage'dan oku
  useEffect(() => {
    const baslangicVerisi = ayVerisiOku(anahtar);
    sonKaydedilenRef.current = JSON.stringify(baslangicVerisi);
    setVeri(baslangicVerisi);
    setIsLoaded(true);
  }, []);

  // Ay değiştiğinde atomik olarak yeni ayın verisini oku
  const handleAnahtarDegis = useCallback((yeniAnahtar: string) => {
    const yeniAyVerisi = ayVerisiOku(yeniAnahtar);
    sonKaydedilenRef.current = JSON.stringify(yeniAyVerisi);
    setAnahtar(yeniAnahtar);
    setVeri(yeniAyVerisi);
  }, []);

  // Farklı sekmede veya taksit senkronizasyonunda veri değişirse senkronize et
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

  // Sadece kullanıcı bir şey değiştirdiğinde ve yükleme tamamlandıktan sonra localStorage'a kaydet
  useEffect(() => {
    if (!isLoaded) return;
    const jsonStr = JSON.stringify(veri);
    if (sonKaydedilenRef.current === jsonStr) return;
    sonKaydedilenRef.current = jsonStr;
    ayVerisiYaz(anahtar, veri);
  }, [anahtar, veri, isLoaded]);

  // Dinamik Hesaplamalar (Şeffaf Bütçe Motoru)
  const calc = useMemo<GiderV2Calculations>(() => {
    const genel = ayGenelToplamlar(veri.krediKartlari);
    const haneOrtakPayi = ayHaneOrtakPayi(veri.krediKartlari);
    const ekstreIciBireysel = ayEkstreIciBireyselToplamlar(veri.krediKartlari);
    const ayriBireyselToplam = bireyselAyriHarcamaToplamlar(veri.bireyselAyriHarcamalar);
    const ayriGelirToplam = bireyselGelirToplamlar(veri.bireyselGelirKalemleri);

    // Kişisel Giderler = Bireysel kartlar + Ekstre içi bireysel kalemler + Ayrı bireysel harcamalar
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

  // Denetim Kalem Sayısı (Tablodaki toplam satır sayısı)
  const denetimKalemSayisi = useMemo(() => {
    let count = 0;
    for (const k of veri.krediKartlari) {
      count++; // Kart tabanı
      count += k.bireyselKalemler.length; // Bireysel satırlar
    }
    count += veri.bireyselAyriHarcamalar.length;
    count += (veri.transferler ?? []).length;
    return count;
  }, [veri]);

  // ------------------------------------------------------------------
  // KART EYLEMLERİ
  // ------------------------------------------------------------------

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
                bireyselKalemler: (kayit.kayitTipi === "harcama" || kayit.kimeAit === "mert" || kayit.kimeAit === "havsa") ? [] : k.bireyselKalemler,
              }
            : k
        ),
      }));
      showToast("Kayıt başarıyla güncellendi.");
    } else {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "k-" + Date.now();
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
      showToast(kayit.kayitTipi === "harcama" ? "Yeni harcama eklendi." : "Yeni kart eklendi.");
    }
  };

  const handleKartSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.filter((k) => k.id !== id),
    }));
    showToast("Kart kaydı silindi.");
  };

  const handleBireyselEkle = (
    kartId: string,
    kalem: Omit<BireyselEkstreKalemi, "id">
  ) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "b-" + Date.now();
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: [...k.bireyselKalemler, { ...kalem, id }],
            }
          : k
      ),
    }));
    showToast("Bireysel kalem ayrıştırıldı.");
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

  const handleBireyselGuncelle = (
    kartId: string,
    kalem: BireyselEkstreKalemi
  ) => {
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
    showToast("Bireysel kalem güncellendi.");
  };

  // ------------------------------------------------------------------
  // AYRI BİREYSEL HARCAMA EYLEMLERİ
  // ------------------------------------------------------------------

  const handleAyriHarcamaEkle = (h: Omit<BireyselAyriHarcama, "id">) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "h-" + Date.now();
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: [...v.bireyselAyriHarcamalar, { ...h, id }],
    }));
    showToast("Bireysel harcama eklendi.");
  };

  const handleAyriHarcamaGuncelle = (h: BireyselAyriHarcama) => {
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.map((x) =>
        x.id === h.id ? h : x
      ),
    }));
    showToast("Bireysel harcama güncellendi.");
  };

  const handleAyriHarcamaSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.filter((h) => h.id !== id),
    }));
    showToast("Harcama silindi.");
  };

  // ------------------------------------------------------------------
  // BİREYSEL GELİR EYLEMLERİ
  // ------------------------------------------------------------------

  const handleGelirEkle = (g: Omit<BireyselGelirKalemi, "id">) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "g-" + Date.now();
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: [...v.bireyselGelirKalemleri, { ...g, id }],
    }));
    showToast("Gelir kalemi eklendi.");
  };

  const handleGelirGuncelle = (g: BireyselGelirKalemi) => {
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.map((x) =>
        x.id === g.id ? g : x
      ),
    }));
    showToast("Gelir kalemi güncellendi.");
  };

  const handleGelirSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.filter((g) => g.id !== id),
    }));
    showToast("Gelir silindi.");
  };

  // ------------------------------------------------------------------
  // TRANSFER EYLEMLERİ
  // ------------------------------------------------------------------

  const handleTransferKaydet = (t: {
    gonderen: KullaniciId;
    alan: KullaniciId;
    tutar: number;
    tarih?: string;
    aciklama?: string;
    bireyselGidereYansit?: boolean;
  }) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "tr-" + Date.now();
    const yeni: HaneTransferi = {
      id,
      ...t,
    };
    setVeri((v) => ({
      ...v,
      transferler: [...(v.transferler ?? []), yeni],
    }));
    showToast("Para transferi başarıyla kaydedildi.");
  };

  const handleTransferSil = (id: string) => {
    setVeri((v) => ({
      ...v,
      transferler: (v.transferler ?? []).filter((t) => t.id !== id),
    }));
    showToast("Transfer kaydı silindi.");
  };

  // ------------------------------------------------------------------
  // GEÇMİŞ VE YEDEK YÖNETİMİ
  // ------------------------------------------------------------------

  const handleOncekiAyGiderleriKopyala = () => {
    const oncekiAnahtar = ayKaydir(anahtar, -1);
    const onceki = ayVerisiOku(oncekiAnahtar);
    const kartlar = onceki.krediKartlari ?? [];
    const harcamalar = onceki.bireyselAyriHarcamalar ?? [];

    if (kartlar.length === 0 && harcamalar.length === 0) {
      showToast(`${ayEtiketi(oncekiAnahtar)} döneminde kopyalanacak gider kaydı bulunamadı.`);
      setCopyConfirmType(null);
      return;
    }

    const kopyaKartlar = structuredClone(kartlar).map((k) => ({
      ...k,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "k-" + Math.random().toString(36).slice(2, 9),
      bireyselKalemler: (k.bireyselKalemler ?? []).map((bk) => ({
        ...bk,
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "bk-" + Math.random().toString(36).slice(2, 9),
      })),
    }));

    const kopyaHarcamalar = structuredClone(harcamalar).map((h) => ({
      ...h,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "h-" + Math.random().toString(36).slice(2, 9),
    }));

    setVeri((v) => ({
      ...v,
      krediKartlari: kopyaKartlar,
      bireyselAyriHarcamalar: kopyaHarcamalar,
    }));
    setCopyConfirmType(null);
    showToast(`${ayEtiketi(oncekiAnahtar)} giderleri (kartlar ve harcamalar) bu aya aktarıldı.`);
  };

  const handleOncekiAyGelirleriKopyala = () => {
    const oncekiAnahtar = ayKaydir(anahtar, -1);
    const onceki = ayVerisiOku(oncekiAnahtar);
    const gelirler = onceki.bireyselGelirKalemleri ?? [];

    if (gelirler.length === 0) {
      showToast(`${ayEtiketi(oncekiAnahtar)} döneminde kopyalanacak gelir kaydı bulunamadı.`);
      setCopyConfirmType(null);
      return;
    }

    const kopyaGelirler = structuredClone(gelirler).map((g) => ({
      ...g,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "g-" + Math.random().toString(36).slice(2, 9),
    }));

    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: kopyaGelirler,
    }));
    setCopyConfirmType(null);
    showToast(`${ayEtiketi(oncekiAnahtar)} gelir kalemleri bu aya aktarıldı.`);
  };

  const handleBuAySifirla = () => {
    setVeri({
      krediKartlari: [],
      bireyselAyriHarcamalar: [],
      bireyselGelirKalemleri: [],
      transferler: [],
    });
    showToast("Bu ayın tüm verileri sıfırlandı.");
  };

  const handleDisaAktar = () => {
    yedekDosyasiDisaAktar();
    showToast("Yedek JSON dosyası indirildi.");
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
          showToast(sonuc.hata ?? "Geçersiz yedek dosyası.");
          return;
        }
        setVeri(ayVerisiOku(anahtar));
        showToast(`${sonuc.aySayisi} ay verisi başarıyla yüklendi.`);
      } catch {
        showToast("Dosya okunamadı. Geçerli bir JSON yedek dosyası seçin.");
      }
    };
    okuyucu.readAsText(dosya, "utf-8");
  };

  const handleKopyalaOzet = () => {
    navigator.clipboard?.writeText(
      `Hane Gider Hesabı (${ayEtiketi(anahtar)}): ${calc.mahsuplasma.durumMetni}`
    );
    showToast("📋 Hesaplaşma özeti panoya kopyalandı!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Bildirim */}
      {toastMesaj && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-foreground text-surface shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>✓</span>
          <span>{toastMesaj}</span>
        </div>
      )}

      {/* Gizli Dosya Girişi */}
      <input
        ref={iceAktarInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleIceAktarDosyaSecildi}
      />

      {/* Başlık, Dönem Seçici ve Görünüm Sekmeleri */}
      <GiderV2Header
        anahtar={anahtar}
        onAnahtarDegis={handleAnahtarDegis}
        activeView={activeView}
        onViewChange={setActiveView}
        onYeniKayitClick={() => {
          setEditingKart(null);
          setIsKartModalOpen(true);
        }}
        onOncekiAyGiderleriKopyala={() => setCopyConfirmType("gider")}
        onOncekiAyGelirleriKopyala={() => setCopyConfirmType("gelir")}
        onSifirla={() => setIsResetConfirmOpen(true)}
        onOzetModalAc={() => setIsOzetModalOpen(true)}
        onDisaAktar={handleDisaAktar}
        onIceAktarClick={() => iceAktarInputRef.current?.click()}
        kartSayisi={veri.krediKartlari.length}
        denetimKalemSayisi={denetimKalemSayisi}
        bireyselSayisi={veri.bireyselAyriHarcamalar.length + veri.bireyselGelirKalemleri.length}
      />

      {/* 3 Adet Şeffaf KPI Kartı (Mert, Havsa, Ev) - Her sekmede daima görünür */}
      <GiderV2KpiCards calc={calc} />

      {/* ------------------------------------------------------------- */}
      {/* GÖRÜNÜM 1: GENEL BAKIŞ & MAHSUPLAŞMA                          */}
      {/* ------------------------------------------------------------- */}
      {activeView === "ozet" && (
        <div className="space-y-6">
          {/* Akıllı Mahsuplaşma & Hesaplaşma Kartı */}
          <GiderV2MahsuplasmaCard
            mahsuplasma={calc.mahsuplasma}
            transferler={veri.transferler ?? []}
            onTransferModalAc={() => setIsTransferModalOpen(true)}
            onTransferSil={handleTransferSil}
            onKopyala={handleKopyalaOzet}
          />

          {/* Hızlı İnceleme Önizlemesi (Mini Kartlar & Denetime Yönlendirme) */}
          <div className="ds-card p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <span>💳</span>
                  <span>Öne Çıkan Kartlar & Harcamalar ({veri.krediKartlari.length})</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  En son eklenen harcamalarınız. Tüm detayları tablo halinde görmek için Denetim sekmesine geçebilirsiniz.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveView("denetim")}
                  className="accent-button h-9 px-3 text-xs"
                >
                  🔍 Tümünü Tabloda Denetle
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("kartlar")}
                  className="secondary-button h-9 px-3 text-xs"
                >
                  Kartları Yönet →
                </button>
              </div>
            </div>

            {veri.krediKartlari.length === 0 ? (
              <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-xl bg-surface-raised/50">
                Bu ay için henüz kredi kartı veya fatura kaydı bulunmuyor.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {veri.krediKartlari.slice(0, 6).map((k) => {
                  const h = tekKartHesabi(k);
                  const odeyen = k.odenenKisi ?? "mert";
                  return (
                    <div
                      key={k.id}
                      className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2 hover:border-border-lavender transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-foreground truncate">
                          {k.ad}
                        </span>
                        <span className="font-mono font-bold text-xs text-foreground shrink-0">
                          {para(k.toplamEkstre)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted pt-1.5 border-t border-border">
                        <span>Ödeyen: <strong className="text-foreground">{odeyen === "mert" ? "Mert" : "Havsa"}</strong></span>
                        {k.kimeAit === "mert" ? (
                          <span className="text-sky-700 font-semibold">👤 Bireysel (Mert)</span>
                        ) : k.kimeAit === "havsa" ? (
                          <span className="text-pink-700 font-semibold">👤 Bireysel (Havsa)</span>
                        ) : (
                          <span>Ortak: <strong className="text-primary">{para(h.ortakTaban / 2)}</strong></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GÖRÜNÜM 2: KARTLAR & HARCAMALAR LİSTESİ                        */}
      {/* ------------------------------------------------------------- */}
      {activeView === "kartlar" && (
        <GiderV2CardList
          kartlar={veri.krediKartlari}
          onKartDuzenle={(k) => {
            setEditingKart(k);
            setIsKartModalOpen(true);
          }}
          onKartSil={handleKartSil}
          onBireyselEkle={handleBireyselEkle}
          onBireyselDuzenle={(kartId, kartAdi, bk) => {
            setEditingBireyselKalem({ kartId, kartAdi, kalem: bk });
          }}
          onBireyselSil={handleBireyselSil}
          onYeniKartEkle={() => {
            setEditingKart(null);
            setIsKartModalOpen(true);
          }}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* GÖRÜNÜM 3: HESAP İNCELEME & DENETİM TABLOSU                   */}
      {/* ------------------------------------------------------------- */}
      {activeView === "denetim" && (
        <GiderV2LedgerTable
          veri={veri}
          onKartDuzenle={(k) => {
            setEditingKart(k);
            setIsKartModalOpen(true);
          }}
          onKartSil={handleKartSil}
          onBireyselKalemDuzenle={(kartId, kartAdi, bk) => {
            setEditingBireyselKalem({ kartId, kartAdi, kalem: bk });
          }}
          onBireyselKalemSil={handleBireyselSil}
          onAyriHarcamaDuzenle={(h) => {
            setEditingAyriHarcama(h);
          }}
          onAyriHarcamaSil={handleAyriHarcamaSil}
          onTransferSil={handleTransferSil}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* GÖRÜNÜM 4: BİREYSEL HARCAMA & GELİRLER                         */}
      {/* ------------------------------------------------------------- */}
      {activeView === "bireysel_gelir" && (
        <GiderV2BireyselGelirSection
          harcamalar={veri.bireyselAyriHarcamalar}
          gelirler={veri.bireyselGelirKalemleri}
          onHarcamaEkle={handleAyriHarcamaEkle}
          onHarcamaDuzenle={(h) => {
            setEditingAyriHarcama(h);
          }}
          onHarcamaSil={handleAyriHarcamaSil}
          onGelirEkle={handleGelirEkle}
          onGelirDuzenle={(g) => {
            setEditingGelir(g);
          }}
          onGelirSil={handleGelirSil}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* TÜM MODALLAR                                                   */}
      {/* ------------------------------------------------------------- */}

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
        description={`${ayEtiketi(ayKaydir(anahtar, -1))} dönemine ait kartlar ve harcamalar bu aya aktarılacak. Mevcut gelirleriniz ve transfer kayıtlarınız korunacaktır.`}
        confirmText="Evet, Giderleri Kopyala"
      />

      <OnayModal
        isOpen={copyConfirmType === "gelir"}
        onClose={() => setCopyConfirmType(null)}
        onConfirm={handleOncekiAyGelirleriKopyala}
        title="Önceki Aydan Gelirleri Kopyala"
        description={`${ayEtiketi(ayKaydir(anahtar, -1))} dönemine ait bireysel gelir kalemleri (maaş, ek gelir vb.) bu aya aktarılacak. Mevcut kartlarınız, harcamalarınız ve transfer kayıtlarınız korunacaktır.`}
        confirmText="Evet, Gelirleri Kopyala"
      />

      <OnayModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleBuAySifirla}
        title="Bu Ayın Verilerini Sıfırla"
        description="Bu ay için girilmiş tüm kartlar, harcamalar, gelirler ve transferler kalıcı olarak silinecektir."
        confirmText="Evet, Tümünü Sıfırla"
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
        title="Bireysel Kalemi Düzenle"
        subtitle={
          editingBireyselKalem
            ? `${editingBireyselKalem.kartAdi} kartına ait bireysel kalem`
            : undefined
        }
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
        title="Bireysel Harcamayı Düzenle"
        subtitle="Ortak paylaşıma girmeyen şahsi harcama"
        icon="🛍️"
        initialData={editingAyriHarcama}
        onSave={(data) => {
          if (editingAyriHarcama) {
            handleAyriHarcamaGuncelle({
              id: editingAyriHarcama.id,
              ...data,
            });
          }
        }}
      />

      <BireyselKayitModal
        isOpen={Boolean(editingGelir)}
        onClose={() => setEditingGelir(null)}
        title="Bireysel Gelir Kalemini Düzenle"
        subtitle="Maaş, prim veya şahsi gelir kalemi"
        icon="💼"
        initialData={editingGelir}
        onSave={(data) => {
          if (editingGelir) {
            handleGelirGuncelle({
              id: editingGelir.id,
              ...data,
            });
          }
        }}
      />
    </div>
  );
}
