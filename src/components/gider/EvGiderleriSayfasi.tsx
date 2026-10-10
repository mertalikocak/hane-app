"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  AyHaneGiderVerisi,
  BireyselEkstreKalemi,
  BireyselAyriHarcama,
  BireyselGelirKalemi,
  HaneTransferi,
  KrediKartiEkstresi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import {
  ayGenelToplamlar,
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
  yedekDosyasiOnizle,
  yedekDosyasiniIceAktar,
} from "@/storage/yedekDeposu";

const AYLAR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const KULLANICI_ETIKET: Record<KullaniciId, string> = {
  mert: "Mert",
  havsa: "Havsa",
};

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(n);

/** Form alanında göstermek için ondalık ayırıcılı tutar metni */
function tutarMetniInputIcin(tutar: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(tutar);
}

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

function yeniKart(): KrediKartiEkstresi {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "kart-" + Date.now(),
    ad: "Yeni Harcama / Kart",
    toplamEkstre: 0,
    bireyselKalemler: [],
    odenenKisi: "mert",
  };
}

export function EvGiderleriSayfasi() {
  const [anahtar, setAnahtar] = useState(simdikiAyAnahtari);
  const [veri, setVeri] = useState<AyHaneGiderVerisi>(() => ayVerisiOku(simdikiAyAnahtari()));

  // Ayrı Bireysel Harcama Form State
  const [ayriBireyselAciklama, setAyriBireyselAciklama] = useState("");
  const [ayriBireyselTutarStr, setAyriBireyselTutarStr] = useState("");
  const [ayriBireyselKisi, setAyriBireyselKisi] = useState<KullaniciId>("mert");
  const [ayriBireyselBolgeAcik, setAyriBireyselBolgeAcik] = useState(false);
  const [duzenlenenAyriHarcamaId, setDuzenlenenAyriHarcamaId] = useState<string | null>(null);

  // Ayrı Gelir Form State
  const [ayriGelirAciklama, setAyriGelirAciklama] = useState("");
  const [ayriGelirTutarStr, setAyriGelirTutarStr] = useState("");
  const [ayriGelirKisi, setAyriGelirKisi] = useState<KullaniciId>("mert");
  const [ayriGelirBolgeAcik, setAyriGelirBolgeAcik] = useState(false);
  const [duzenlenenGelirId, setDuzenlenenGelirId] = useState<string | null>(null);

  // Bildirim Toast State
  const [toastMesaj, setToastMesaj] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 💸 Para Transferi Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferGonderen, setTransferGonderen] = useState<KullaniciId>("havsa");
  const [transferAlan, setTransferAlan] = useState<KullaniciId>("mert");
  const [transferTutarStr, setTransferTutarStr] = useState("");
  const [transferTarih, setTransferTarih] = useState("");
  const [transferAciklama, setTransferAciklama] = useState("");
  const [bireyselGidereYansit, setBireyselGidereYansit] = useState(false);

  const iceAktarInputRef = useRef<HTMLInputElement>(null);

  const showToast = (mesaj: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMesaj(mesaj);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMesaj(null);
    }, 3500);
  };

  useEffect(() => {
    const yeniAy = ayVerisiOku(anahtar);
    setVeri(yeniAy);
    setAyriBireyselBolgeAcik(false);
    setAyriGelirBolgeAcik(false);
    setDuzenlenenAyriHarcamaId(null);
    setDuzenlenenGelirId(null);
  }, [anahtar]);

  useEffect(() => {
    ayVerisiYaz(anahtar, veri);
  }, [anahtar, veri]);

  // Dinamik Hesaplamalar
  const genel = useMemo(() => ayGenelToplamlar(veri.krediKartlari), [veri.krediKartlari]);

  const ayriBireyselToplam = useMemo(
    () => bireyselAyriHarcamaToplamlar(veri.bireyselAyriHarcamalar),
    [veri.bireyselAyriHarcamalar]
  );

  const ayriGelirToplam = useMemo(
    () => bireyselGelirToplamlar(veri.bireyselGelirKalemleri),
    [veri.bireyselGelirKalemleri]
  );

  const mertGider = genel.mert + ayriBireyselToplam.mert;
  const havsaGider = genel.havsa + ayriBireyselToplam.havsa;
  const mertGelir = ayriGelirToplam.mert;
  const havsaGelir = ayriGelirToplam.havsa;
  const mertKalan = mertGelir - mertGider;
  const havsaKalan = havsaGelir - havsaGider;

  const evGideriToplami = useMemo(() => ayToplamGirisGideri(veri), [veri]);
  const evGelirToplami = useMemo(() => ayToplamGelir(veri), [veri]);
  const evKalan = evGelirToplami - evGideriToplami;

  const kayitToplamlari = useMemo(
    () =>
      toplumaDahilKartlar(veri.krediKartlari).reduce(
        (s, k) => s + Math.max(0, k.toplamEkstre),
        0
      ),
    [veri.krediKartlari]
  );

  const ayriBireyselHarcamalarToplami = useMemo(
    () => veri.bireyselAyriHarcamalar.reduce((s, h) => s + Math.max(0, h.tutar), 0),
    [veri.bireyselAyriHarcamalar]
  );

  const herhangiAsim = useMemo(
    () => toplumaDahilKartlar(veri.krediKartlari).some((k) => tekKartHesabi(k).asim),
    [veri.krediKartlari]
  );

  // 🤝 Net Mahsuplaşma (Takas) Hesaplaması (Transferler dahil)
  const mahsuplasma = useMemo(
    () => ayMahsuplasmaHesapla(veri.krediKartlari, veri.transferler ?? []),
    [veri.krediKartlari, veri.transferler]
  );

  // Kart Eylemleri
  function kartGuncelle(id: string, guncel: Partial<KrediKartiEkstresi>) {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === id ? { ...k, ...guncel } : k
      ),
    }));
  }

  function kartSil(id: string) {
    if (window.confirm("Bu kart / harcama kaydını silmek istediğinize emin misiniz?")) {
      setVeri((v) => ({
        ...v,
        krediKartlari: v.krediKartlari.filter((k) => k.id !== id),
      }));
      showToast("Kayıt başarıyla silindi.");
    }
  }

  function kartEkle() {
    setVeri((v) => ({
      ...v,
      krediKartlari: [yeniKart(), ...v.krediKartlari],
    }));
    showToast("Yeni kayıt eklendi.");
  }

  function bireyselEkle(kartId: string, kalem: Omit<BireyselEkstreKalemi, "id">) {
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
  }

  function bireyselGuncelle(
    kartId: string,
    kalemId: string,
    guncel: Omit<BireyselEkstreKalemi, "id">
  ) {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: k.bireyselKalemler.map((x) =>
                x.id === kalemId ? { ...x, ...guncel } : x
              ),
            }
          : k
      ),
    }));
  }

  function bireyselSil(kartId: string, kalemId: string) {
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
  }

  // Ayrı Bireysel Harcama Eylemleri
  function ayriBireyselHarcamaFormGonder(e: React.FormEvent) {
    e.preventDefault();
    const tutar = Number(ayriBireyselTutarStr.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) return;

    if (duzenlenenAyriHarcamaId) {
      setVeri((v) => ({
        ...v,
        bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.map((h) =>
          h.id === duzenlenenAyriHarcamaId
            ? {
                ...h,
                kullaniciId: ayriBireyselKisi,
                aciklama: ayriBireyselAciklama.trim() || "Bireysel harcama",
                tutar,
              }
            : h
        ),
      }));
      setDuzenlenenAyriHarcamaId(null);
      showToast("Bireysel harcama güncellendi.");
    } else {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "h-" + Date.now();
      const yeni: BireyselAyriHarcama = {
        id,
        kullaniciId: ayriBireyselKisi,
        aciklama: ayriBireyselAciklama.trim() || "Bireysel harcama",
        tutar,
      };
      setVeri((v) => ({
        ...v,
        bireyselAyriHarcamalar: [...v.bireyselAyriHarcamalar, yeni],
      }));
      showToast("Bireysel harcama eklendi.");
    }
    setAyriBireyselAciklama("");
    setAyriBireyselTutarStr("");
  }

  function ayriBireyselHarcamaDuzenle(h: BireyselAyriHarcama) {
    setDuzenlenenAyriHarcamaId(h.id);
    setAyriBireyselKisi(h.kullaniciId);
    setAyriBireyselAciklama(h.aciklama);
    setAyriBireyselTutarStr(tutarMetniInputIcin(h.tutar));
    setAyriBireyselBolgeAcik(true);
  }

  function ayriBireyselHarcamaSil(id: string) {
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.filter((h) => h.id !== id),
    }));
    if (duzenlenenAyriHarcamaId === id) {
      setDuzenlenenAyriHarcamaId(null);
      setAyriBireyselAciklama("");
      setAyriBireyselTutarStr("");
    }
    showToast("Harcama silindi.");
  }

  // Ayrı Gelir Eylemleri
  function ayriGelirFormGonder(e: React.FormEvent) {
    e.preventDefault();
    const tutar = Number(ayriGelirTutarStr.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) return;

    if (duzenlenenGelirId) {
      setVeri((v) => ({
        ...v,
        bireyselGelirKalemleri: v.bireyselGelirKalemleri.map((g) =>
          g.id === duzenlenenGelirId
            ? {
                ...g,
                kullaniciId: ayriGelirKisi,
                aciklama: ayriGelirAciklama.trim() || "Gelir",
                tutar,
              }
            : g
        ),
      }));
      setDuzenlenenGelirId(null);
      showToast("Gelir kalemi güncellendi.");
    } else {
      const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "g-" + Date.now();
      const yeni: BireyselGelirKalemi = {
        id,
        kullaniciId: ayriGelirKisi,
        aciklama: ayriGelirAciklama.trim() || "Gelir",
        tutar,
      };
      setVeri((v) => ({
        ...v,
        bireyselGelirKalemleri: [...v.bireyselGelirKalemleri, yeni],
      }));
      showToast("Gelir kalemi eklendi.");
    }
    setAyriGelirAciklama("");
    setAyriGelirTutarStr("");
  }

  function ayriGelirDuzenle(g: BireyselGelirKalemi) {
    setDuzenlenenGelirId(g.id);
    setAyriGelirKisi(g.kullaniciId);
    setAyriGelirAciklama(g.aciklama);
    setAyriGelirTutarStr(tutarMetniInputIcin(g.tutar));
    setAyriGelirBolgeAcik(true);
  }

  function ayriGelirSil(id: string) {
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.filter((g) => g.id !== id),
    }));
    if (duzenlenenGelirId === id) {
      setDuzenlenenGelirId(null);
      setAyriGelirAciklama("");
      setAyriGelirTutarStr("");
    }
    showToast("Gelir silindi.");
  }

  // Geçmiş / Veri Yönetimi
  function oncekiAyBorcunuGetir() {
    if (
      !window.confirm(
        "Önceki ayın tüm kayıtları bu aya kopyalanacaktır. Mevcut verilerin üzerine yazılacak, onaylıyor musunuz?"
      )
    ) {
      return;
    }
    const oncekiAnahtar = ayKaydir(anahtar, -1);
    const onceki = ayVerisiOku(oncekiAnahtar);
    const kopya: AyHaneGiderVerisi = structuredClone(onceki);
    setVeri(kopya);
    showToast("Önceki ayın kayıtları başarıyla bu aya aktarıldı.");
  }

  function buAySifirla() {
    if (!window.confirm("Bu ayın tüm kayıtları silinecektir. Emin misiniz?")) {
      return;
    }
    setVeri({ krediKartlari: [], bireyselAyriHarcamalar: [], bireyselGelirKalemleri: [], transferler: [] });
    setAyriBireyselBolgeAcik(false);
    setAyriGelirBolgeAcik(false);
    showToast("Bu ayın tüm verileri sıfırlandı.");
  }

  const handleOpenTransferModal = () => {
    if (mahsuplasma.borcluKisi === "havsa") {
      setTransferGonderen("havsa");
      setTransferAlan("mert");
      setTransferTutarStr(tutarMetniInputIcin(mahsuplasma.transferTutari));
    } else if (mahsuplasma.borcluKisi === "mert") {
      setTransferGonderen("mert");
      setTransferAlan("havsa");
      setTransferTutarStr(tutarMetniInputIcin(mahsuplasma.transferTutari));
    } else {
      setTransferGonderen("havsa");
      setTransferAlan("mert");
      setTransferTutarStr("");
    }
    setTransferTarih(new Date().toISOString().split("T")[0]);
    setTransferAciklama("Nakit avans / borç ödemesi");
    setBireyselGidereYansit(false);
    setIsTransferModalOpen(true);
  };

  const handleTransferKaydet = (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = Number(transferTutarStr.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) {
      showToast("Lütfen geçerli bir tutar girin.");
      return;
    }
    if (transferGonderen === transferAlan) {
      showToast("Gönderen ile alıcı aynı kişi olamaz.");
      return;
    }

    const transferId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "tr-" + Date.now();
    let bireyselHarcamaId: string | undefined = undefined;

    let yeniBireyseller = [...veri.bireyselAyriHarcamalar];
    if (bireyselGidereYansit) {
      bireyselHarcamaId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "h-" + Date.now();
      const aciklamaMetni = transferAciklama.trim()
        ? `[Nakit/Borç] ${transferAciklama.trim()}`
        : `${KULLANICI_ETIKET[transferGonderen]}'dan alınan nakit/avans`;
      yeniBireyseller = [
        ...yeniBireyseller,
        {
          id: bireyselHarcamaId,
          kullaniciId: transferAlan,
          aciklama: aciklamaMetni,
          tutar,
        },
      ];
    }

    const yeni: HaneTransferi = {
      id: transferId,
      gonderen: transferGonderen,
      alan: transferAlan,
      tutar,
      tarih: transferTarih || undefined,
      aciklama: transferAciklama.trim() || undefined,
      bireyselGidereYansit,
      bireyselHarcamaId,
    };

    setVeri((v) => ({
      ...v,
      transferler: [...(v.transferler ?? []), yeni],
      bireyselAyriHarcamalar: yeniBireyseller,
    }));
    setIsTransferModalOpen(false);
    showToast(
      bireyselGidereYansit
        ? `💸 Transfer kaydedildi ve ${KULLANICI_ETIKET[transferAlan]}'in bütçesine gider yazıldı!`
        : "💸 Para transferi kaydedildi ve mahsuplaşma tutarından düşüldü!"
    );
  };

  const handleTransferSil = (id: string) => {
    const silinecek = (veri.transferler ?? []).find((t) => t.id === id);
    setVeri((v) => ({
      ...v,
      transferler: (v.transferler ?? []).filter((t) => t.id !== id),
      bireyselAyriHarcamalar: silinecek?.bireyselHarcamaId
        ? v.bireyselAyriHarcamalar.filter((h) => h.id !== silinecek.bireyselHarcamaId)
        : v.bireyselAyriHarcamalar,
    }));
    showToast("Transfer kaydı silindi.");
  };

  async function disaAktar() {
    const sonuc = await yedekDosyasiDisaAktar();
    if (!sonuc.basarili) {
      showToast(sonuc.hata ?? "Dışa aktarma hatası");
      return;
    }
    if (sonuc.yontem === "indir") {
      showToast(`${sonuc.aySayisi} ay verisi başarıyla indirildi.`);
    }
  }

  function iceAktarDosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;

    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      try {
        const icerik = JSON.parse(String(okuyucu.result)) as unknown;
        const onizleme = yedekDosyasiOnizle(icerik);
        if (!onizleme.basarili) {
          showToast(onizleme.hata ?? "Dosya uyumsuz.");
          return;
        }
        const onay = window.confirm(
          `${onizleme.aySayisi} ay verisi içe aktarılacak. Aynı ayların mevcut kayıtları güncellenecek. Devam edilsin mi?`
        );
        if (!onay) return;

        const sonuc = yedekDosyasiniIceAktar(icerik);
        if (!sonuc.basarili) {
          showToast(sonuc.hata ?? "İçe aktarılamadı.");
          return;
        }
        const guncel = ayVerisiOku(anahtar);
        setVeri(guncel);
        showToast(`${sonuc.aySayisi} ay verisi başarıyla yüklendi.`);
      } catch {
        showToast("Dosya okunamadı. Geçerli bir JSON yedek dosyası seçin.");
      }
    };
    okuyucu.readAsText(dosya, "utf-8");
  }

  const kopyalaIbanVeyaHesap = () => {
    navigator.clipboard?.writeText(
      `Hane Gider Hesabı (${ayEtiketi(anahtar)}): ${mahsuplasma.durumMetni}`
    );
    showToast("📋 Hesaplaşma özeti panoya kopyalandı!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Bildirim */}
      {toastMesaj && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-foreground text-background shadow-xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>✨</span>
          <span>{toastMesaj}</span>
        </div>
      )}

      {/* 📅 Modern Kontrol Çubuğu (Ay Seçici & Hızlı Aksiyonlar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-surface border border-border/80 shadow-xs">
        {/* Ay Gezgini */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-surface-raised border border-border/70">
            <button
              type="button"
              onClick={() => setAnahtar((a) => ayKaydir(a, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
              title="Önceki ay"
            >
              ‹
            </button>
            <span className="px-3 text-xs sm:text-sm font-extrabold text-foreground min-w-[110px] text-center">
              📅 {ayEtiketi(anahtar)}
            </span>
            <button
              type="button"
              onClick={() => setAnahtar((a) => ayKaydir(a, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black text-muted hover:text-foreground hover:bg-surface transition cursor-pointer"
              title="Sonraki ay"
            >
              ›
            </button>
          </div>

          {anahtar !== simdikiAyAnahtari() && (
            <button
              type="button"
              onClick={() => setAnahtar(simdikiAyAnahtari())}
              className="px-3 py-2 rounded-2xl bg-primary/10 border border-primary/30 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
            >
              Bu Ay
            </button>
          )}
        </div>

        {/* Eylem Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={oncekiAyBorcunuGetir}
            className="secondary-button h-9 px-3 text-xs font-bold text-muted hover:text-foreground"
            title="Önceki ayın tüm kayıtlarını bu aya kopyalar"
          >
            <span>🔄</span> Önceki Borcu Getir
          </button>

          <button
            type="button"
            onClick={disaAktar}
            className="secondary-button h-9 px-2.5 text-xs font-bold text-muted hover:text-foreground"
            title="Tüm verileri JSON olarak indir"
          >
            <span>📤</span> Dışa Aktar
          </button>

          <button
            type="button"
            onClick={() => iceAktarInputRef.current?.click()}
            className="secondary-button h-9 px-2.5 text-xs font-bold text-muted hover:text-foreground"
            title="JSON yedeğini yükle"
          >
            <span>📥</span> İçe Aktar
          </button>

          <input
            ref={iceAktarInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={iceAktarDosyaSecildi}
          />

          <button
            type="button"
            onClick={buAySifirla}
            className="h-9 px-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
            title="Bu ayın kayıtlarını temizle"
          >
            <span>🗑️</span> Sıfırla
          </button>

          <button
            type="button"
            onClick={kartEkle}
            className="primary-button h-9 px-3.5 text-xs font-bold shadow-xs"
          >
            <span>➕</span> Yeni Kart / Harcama Ekle
          </button>
        </div>
      </div>

      {/* 📊 Üst KPI Özet Kartları (Mert, Havsa & Ev Dengesi) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Mert (Bu Ay) */}
        <div className="p-5 rounded-3xl bg-surface border border-sky-500/30 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <div>
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400">
                Mert (Bu Ay Dengesi)
              </span>
              <span className="text-base">👤</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {para(mertKalan)}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  mertKalan >= 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {mertKalan >= 0 ? "Kalan" : "Ekside"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Gelir:</span>
              <span className="font-bold text-emerald-400">{para(mertGelir)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Gider (Toplam):</span>
              <span className="font-bold text-rose-400">{para(mertGider)}</span>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between pl-2 border-l-2 border-sky-500/40">
              <span>Hane: {para(genel.mert)}</span>
              <span>Bireysel: {para(ayriBireyselToplam.mert)}</span>
            </div>
          </div>
        </div>

        {/* Havsa (Bu Ay) */}
        <div className="p-5 rounded-3xl bg-surface border border-pink-500/30 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
          <div>
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-400">
                Havsa (Bu Ay Dengesi)
              </span>
              <span className="text-base">👤</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {para(havsaKalan)}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  havsaKalan >= 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {havsaKalan >= 0 ? "Kalan" : "Ekside"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Gelir:</span>
              <span className="font-bold text-emerald-400">{para(havsaGelir)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Gider (Toplam):</span>
              <span className="font-bold text-rose-400">{para(havsaGider)}</span>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between pl-2 border-l-2 border-pink-500/40">
              <span>Hane: {para(genel.havsa)}</span>
              <span>Bireysel: {para(ayriBireyselToplam.havsa)}</span>
            </div>
          </div>
        </div>

        {/* Ev (Bu Ay Genel) */}
        <div className="p-5 rounded-3xl bg-surface border border-purple-500/30 shadow-xs relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div>
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">
                Ev Ortak Havuzu
              </span>
              <span className="text-base">🏠</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-foreground">
                {para(evKalan)}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  evKalan >= 0
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                Net Bakiye
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">Toplam Giriş Gideri:</span>
              <span className="font-bold text-rose-400">{para(evGideriToplami)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Ortak Kayıtlar Toplamı:</span>
              <span className="font-bold text-foreground">{para(kayitToplamlari)}</span>
            </div>
            <div className="text-[11px] text-muted flex items-center justify-between pl-2 border-l-2 border-purple-500/40">
              <span>Ayrı Bireysel: {para(ayriBireyselHarcamalarToplami)}</span>
              <span>Toplam Gelir: {para(evGelirToplami)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🤝 MADDE 2: AY SONU NET MAHSUPLAŞMA (KİM KİME NE ÖDEYECEK?) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/30 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤝</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-foreground">
                Ay Sonu Net Mahsuplaşma (Hesaplaşma)
              </h3>
              <p className="text-xs text-muted">
                Ortak harcamalar ve kart ödemeleri dengelenerek tek bir transfer tutarı çıkarılır.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-bold px-3 py-1 rounded-full bg-surface border border-border/80 text-foreground">
            ⚡ Otomatik Hesaplama
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-surface/70 border border-border/60 backdrop-blur-xs items-center">
          {/* Mert'in Harcama Payı */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-black text-sm shrink-0">
              M
            </div>
            <div className="text-xs">
              <span className="font-black text-foreground block">Mert</span>
              <span className="text-muted block">
                Cebinden Çıkan: <strong className="text-foreground">{para(mahsuplasma.mertOdedi)}</strong>
              </span>
              <span className="text-muted block">
                Payına Düşen: <strong className="text-sky-400">{para(mahsuplasma.mertPayinaDusen)}</strong>
              </span>
            </div>
          </div>

          {/* Transfer Durumu & Tutar Rozeti */}
          <div className="text-center py-2 px-3 rounded-xl bg-surface-raised border border-border/60">
            {mahsuplasma.transferTutari === 0 ? (
              <div>
                <span className="text-sm font-black text-emerald-400 block">
                  🎉 Hesaplar Tam Dengede!
                </span>
                <span className="text-[11px] text-muted">Kimsenin birbirine borcu bulunmuyor.</span>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-0.5">
                  Gereken Tek Havale
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-400 tracking-tight">
                  {mahsuplasma.durumMetni}
                </div>
                <span className="text-[10px] text-muted block mt-0.5">
                  Bu transfer yapıldığında ortak hesap 0 TL ile tamamen kapanır.
                </span>
              </div>
            )}
          </div>

          {/* Havsa'nın Harcama Payı */}
          <div className="flex items-center gap-3 md:justify-end">
            <div className="text-xs md:text-right">
              <span className="font-black text-foreground block">Havsa</span>
              <span className="text-muted block">
                Cebinden Çıkan: <strong className="text-foreground">{para(mahsuplasma.havsaOdedi)}</strong>
              </span>
              <span className="text-muted block">
                Payına Düşen: <strong className="text-pink-400">{para(mahsuplasma.havsaPayinaDusen)}</strong>
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-400 flex items-center justify-center font-black text-sm shrink-0">
              H
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-muted">
          <div className="space-y-1.5 max-w-xl">
            <p>
              💡 <strong>Ödeyen Belirleme:</strong> Kartların bankaya kim tarafından ödendiğini aşağıdaki kart başlıklarındaki{" "}
              <strong>[👤 Mert / 👤 Havsa]</strong> seçicisiyle belirleyebilirsiniz.
            </p>
            <p className="text-muted/90 leading-relaxed">
              📌 <strong>Harcama vs. Para Transferi:</strong> Eğer iki kişinin birlikte yaptığı ortak bir harcamaysa{" "}
              <em>"Ortak Harcama"</em> olarak girmelisiniz (Ödeyen kişi kimse o seçilir). Fakat birinin bireysel harcamasını diğeri karşılıyorsa veya elden nakit borç/avans verildiyse{" "}
              <em>"Para Transferi Yap"</em> butonundan girip ay sonu atılacak paradan düşebilirsiniz.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleOpenTransferModal}
              className="primary-button py-1.5 px-3 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>💸</span> Para Transferi Yap
            </button>
            <button
              type="button"
              onClick={kopyalaIbanVeyaHesap}
              className="secondary-button py-1.5 px-3 text-xs font-bold text-foreground cursor-pointer"
            >
              📋 Özeti Kopyala
            </button>
          </div>
        </div>

        {/* 💸 Yapılan Transferler Listesi */}
        {(veri.transferler ?? []).length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-purple-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-foreground flex items-center gap-1.5">
                <span>💸</span> Yapılan Transferler ({veri.transferler!.length})
              </span>
              <span className="font-bold text-emerald-400 text-[11px]">
                Toplam Aktarılan: {para(mahsuplasma.toplamTransferEdilen)}
              </span>
            </div>
            <div className="space-y-1.5">
              {veri.transferler!.map((tr) => (
                <div
                  key={tr.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface/80 border border-border/70 text-xs backdrop-blur-xs"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                        tr.gonderen === "mert"
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {KULLANICI_ETIKET[tr.gonderen]}
                    </span>
                    <span className="text-muted text-[11px]">➔</span>
                    <span
                      className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                        tr.alan === "mert"
                          ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                          : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                      }`}
                    >
                      {KULLANICI_ETIKET[tr.alan]}
                    </span>
                    <span className="font-black text-emerald-400 font-mono">
                      {para(tr.tutar)}
                    </span>
                    {tr.tarih && (
                      <span className="text-[10px] text-muted">({tr.tarih})</span>
                    )}
                    {tr.aciklama && (
                      <span className="text-[11px] text-muted italic">
                        "{tr.aciklama}"
                      </span>
                    )}
                    {tr.bireyselGidereYansit && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {KULLANICI_ETIKET[tr.alan]}'e Gider Yazıldı
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTransferSil(tr.id)}
                    className="p-1 text-muted hover:text-rose-400 cursor-pointer font-bold transition"
                    title="Transferi sil"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Uyarı: Aşım Durumu */}
      {herhangiAsim && (
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-500 font-bold">
          <span className="text-xl">⚠️</span>
          <span>
            Uyarı: Bazı kayıtlarda bireysel kalemlerin toplamı, kartın toplam tutarını aşıyor.
            Hesaplamada toplam ekstre tutarı üst sınır olarak baz alınmaktadır.
          </span>
        </div>
      )}

      {/* 💳 Kredi Kartları ve Harcama Kayıtları Bölümü */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-foreground flex items-center gap-2">
            <span>💳</span> Kredi Kartları ve Ortak Harcamalar ({veri.krediKartlari.length})
          </h2>
          <button
            type="button"
            onClick={kartEkle}
            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>➕</span> Yeni Kart / Harcama Ekle
          </button>
        </div>

        {veri.krediKartlari.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border border-dashed border-border/80 bg-surface/50 space-y-2">
            <span className="text-3xl block">💳</span>
            <h4 className="text-sm font-bold text-foreground">Bu Ay İçin Kayıt Yok</h4>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Yukarıdaki "Kayıt Ekle" butonuyla kredi kartı ekstresi veya kira/aidat gibi harcama ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          veri.krediKartlari.map((kart) => (
            <ModernKartPaneli
              key={kart.id}
              kart={kart}
              onAdDegis={(ad) => kartGuncelle(kart.id, { ad })}
              onToplamDegis={(toplamEkstre) => kartGuncelle(kart.id, { toplamEkstre })}
              onOdeyenDegis={(odenenKisi) => kartGuncelle(kart.id, { odenenKisi })}
              onToplamlardanHaricDegis={(tumGiderToplamlarindaHaric) =>
                kartGuncelle(kart.id, { tumGiderToplamlarindaHaric })
              }
              onSil={() => kartSil(kart.id)}
              onBireyselEkle={(k) => bireyselEkle(kart.id, k)}
              onBireyselGuncelle={(kalemId, k) => bireyselGuncelle(kart.id, kalemId, k)}
              onBireyselSil={(kalemId) => bireyselSil(kart.id, kalemId)}
            />
          ))
        )}
      </div>

      {/* 🛍️ Bireysel Ayrı Harcamalar (Ortak Olmayan Harcamalar) */}
      <div className="p-5 rounded-3xl bg-surface border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛍️</span>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Ortak Dışı Bireysel Harcamalar ({veri.bireyselAyriHarcamalar.length})
              </h3>
              <p className="text-xs text-muted">
                Ortak ekstre paylaşımına girmeyen, tamamen kişinin kendine ait harcamaları.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAyriBireyselBolgeAcik((v) => !v)}
            className="secondary-button text-xs font-bold px-3 py-1.5"
          >
            {ayriBireyselBolgeAcik ? "▲ Gizle" : "▼ Listele & Ekle"}
          </button>
        </div>

        {ayriBireyselBolgeAcik && (
          <div className="space-y-4 pt-2 border-t border-border/60 animate-in fade-in duration-150">
            {veri.bireyselAyriHarcamalar.length > 0 && (
              <div className="space-y-2">
                {veri.bireyselAyriHarcamalar.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-raised border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                          h.kullaniciId === "mert"
                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                        }`}
                      >
                        {KULLANICI_ETIKET[h.kullaniciId]}
                      </span>
                      <span className="font-bold text-foreground">{h.aciklama}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-foreground">{para(h.tutar)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => ayriBireyselHarcamaDuzenle(h)}
                          className="p-1 text-muted hover:text-foreground cursor-pointer"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => ayriBireyselHarcamaSil(h.id)}
                          className="p-1 text-rose-500 hover:text-rose-400 cursor-pointer"
                          title="Sil"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ayrı Harcama Ekleme / Düzenleme Formu */}
            <form
              onSubmit={ayriBireyselHarcamaFormGonder}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-surface-raised border border-border/70"
            >
              <div>
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Kişi
                </label>
                <select
                  value={ayriBireyselKisi}
                  onChange={(e) => setAyriBireyselKisi(e.target.value as KullaniciId)}
                  className="w-full h-9 rounded-xl bg-surface border border-border px-2 text-xs font-bold text-foreground"
                >
                  <option value="mert">Mert</option>
                  <option value="havsa">Havsa</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={ayriBireyselAciklama}
                  onChange={(e) => setAyriBireyselAciklama(e.target.value)}
                  placeholder="Örn. Kişisel kıyafet alışverişi"
                  className="w-full h-9 rounded-xl bg-surface border border-border px-3 text-xs font-semibold text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Tutar (₺)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ayriBireyselTutarStr}
                    onChange={(e) => setAyriBireyselTutarStr(e.target.value)}
                    placeholder="0"
                    className="w-full h-9 rounded-xl bg-surface border border-border px-3 text-xs font-bold text-foreground font-mono"
                  />
                  <button type="submit" className="primary-button h-9 px-3 text-xs font-bold shrink-0">
                    {duzenlenenAyriHarcamaId ? "Kaydet" : "Ekle"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 💼 Bireysel Gelir Kalemleri */}
      <div className="p-5 rounded-3xl bg-surface border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <div>
              <h3 className="text-sm font-black text-foreground">
                Bireysel Gelir Kalemleri ({veri.bireyselGelirKalemleri.length})
              </h3>
              <p className="text-xs text-muted">
                Maaş, prim, ek kazanç vb. kişisel gelir girişleri (gider hesaplarını etkilemez).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAyriGelirBolgeAcik((v) => !v)}
            className="secondary-button text-xs font-bold px-3 py-1.5"
          >
            {ayriGelirBolgeAcik ? "▲ Gizle" : "▼ Listele & Ekle"}
          </button>
        </div>

        {ayriGelirBolgeAcik && (
          <div className="space-y-4 pt-2 border-t border-border/60 animate-in fade-in duration-150">
            {veri.bireyselGelirKalemleri.length > 0 && (
              <div className="space-y-2">
                {veri.bireyselGelirKalemleri.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-surface-raised border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded-full ${
                          g.kullaniciId === "mert"
                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                        }`}
                      >
                        {KULLANICI_ETIKET[g.kullaniciId]}
                      </span>
                      <span className="font-bold text-foreground">{g.aciklama}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-400">{para(g.tutar)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => ayriGelirDuzenle(g)}
                          className="p-1 text-muted hover:text-foreground cursor-pointer"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => ayriGelirSil(g.id)}
                          className="p-1 text-rose-500 hover:text-rose-400 cursor-pointer"
                          title="Sil"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gelir Ekleme Formu */}
            <form
              onSubmit={ayriGelirFormGonder}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-surface-raised border border-border/70"
            >
              <div>
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Kişi
                </label>
                <select
                  value={ayriGelirKisi}
                  onChange={(e) => setAyriGelirKisi(e.target.value as KullaniciId)}
                  className="w-full h-9 rounded-xl bg-surface border border-border px-2 text-xs font-bold text-foreground"
                >
                  <option value="mert">Mert</option>
                  <option value="havsa">Havsa</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Açıklama
                </label>
                <input
                  type="text"
                  value={ayriGelirAciklama}
                  onChange={(e) => setAyriGelirAciklama(e.target.value)}
                  placeholder="Örn. Maaş, ikramiye"
                  className="w-full h-9 rounded-xl bg-surface border border-border px-3 text-xs font-semibold text-foreground"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                  Tutar (₺)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ayriGelirTutarStr}
                    onChange={(e) => setAyriGelirTutarStr(e.target.value)}
                    placeholder="0"
                    className="w-full h-9 rounded-xl bg-surface border border-border px-3 text-xs font-bold text-foreground font-mono"
                  />
                  <button type="submit" className="primary-button h-9 px-3 text-xs font-bold shrink-0">
                    {duzenlenenGelirId ? "Kaydet" : "Ekle"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 💸 Para Transferi Modalı */}
      <ParaTransferiModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        gonderen={transferGonderen}
        alan={transferAlan}
        tutarStr={transferTutarStr}
        tarih={transferTarih}
        aciklama={transferAciklama}
        bireyselGidereYansit={bireyselGidereYansit}
        onGonderenChange={setTransferGonderen}
        onAlanChange={setTransferAlan}
        onTutarChange={setTransferTutarStr}
        onTarihChange={setTransferTarih}
        onAciklamaChange={setTransferAciklama}
        onBireyselGidereYansitChange={setBireyselGidereYansit}
        onSubmit={handleTransferKaydet}
        onerilenTutar={mahsuplasma.transferTutari}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// MODERN KART PANELİ (KREDİ KARTI / HARCAMA BİLEŞENİ)
// ------------------------------------------------------------------

function ModernKartPaneli({
  kart,
  onAdDegis,
  onToplamDegis,
  onOdeyenDegis,
  onToplamlardanHaricDegis,
  onSil,
  onBireyselEkle,
  onBireyselGuncelle,
  onBireyselSil,
}: {
  kart: KrediKartiEkstresi;
  onAdDegis: (ad: string) => void;
  onToplamDegis: (t: number) => void;
  onOdeyenDegis: (odeyen: "mert" | "havsa" | "ortak") => void;
  onToplamlardanHaricDegis: (haric: boolean) => void;
  onSil: () => void;
  onBireyselEkle: (k: Omit<BireyselEkstreKalemi, "id">) => void;
  onBireyselGuncelle: (kalemId: string, k: Omit<BireyselEkstreKalemi, "id">) => void;
  onBireyselSil: (kalemId: string) => void;
}) {
  const h = tekKartHesabi(kart);
  const [bireyselAcik, setBireyselAcik] = useState(kart.bireyselKalemler.length > 0);
  const [kalemAciklama, setKalemAciklama] = useState("");
  const [kalemTutarStr, setKalemTutarStr] = useState("");
  const [kalemKisi, setKalemKisi] = useState<KullaniciId>("mert");
  const [duzenlenenKalemId, setDuzenlenenKalemId] = useState<string | null>(null);

  const seciliOdeyen =
    kart.odenenKisi ??
    (kart.ad.toLowerCase().includes("havsa")
      ? "havsa"
      : kart.ad.toLowerCase().includes("mert")
      ? "mert"
      : "mert");

  function kalemFormunuTemizle() {
    setDuzenlenenKalemId(null);
    setKalemAciklama("");
    setKalemTutarStr("");
  }

  function kalemKaydet(e: React.FormEvent) {
    e.preventDefault();
    const tutar = Number(kalemTutarStr.replace(",", "."));
    if (!Number.isFinite(tutar) || tutar <= 0) return;

    const yeni = {
      kullaniciId: kalemKisi,
      aciklama: kalemAciklama.trim() || "Bireysel kalem",
      tutar,
    };

    if (duzenlenenKalemId) {
      onBireyselGuncelle(duzenlenenKalemId, yeni);
    } else {
      onBireyselEkle(yeni);
    }
    kalemFormunuTemizle();
  }

  function kalemDuzenle(bk: BireyselEkstreKalemi) {
    setDuzenlenenKalemId(bk.id);
    setKalemKisi(bk.kullaniciId);
    setKalemAciklama(bk.aciklama);
    setKalemTutarStr(tutarMetniInputIcin(bk.tutar));
    setBireyselAcik(true);
  }

  return (
    <div
      className={`p-5 rounded-3xl border transition shadow-xs space-y-4 ${
        kart.tumGiderToplamlarindaHaric
          ? "bg-surface/50 border-border/50 opacity-70"
          : "bg-surface border-border/80"
      }`}
    >
      {/* Kart Üst Bar (Başlık, Tutar, Ödeyen ve İşlemler) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Kart Başlığı ve Toplam Tutar Girişi */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-border/70 flex items-center justify-center text-lg shrink-0">
            💳
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block">Kayıt Adı</label>
              <input
                type="text"
                value={kart.ad}
                onChange={(e) => onAdDegis(e.target.value)}
                placeholder="Örn. Garanti Bonus"
                className="w-full h-8 px-2.5 rounded-xl bg-surface-raised border border-border/70 text-xs font-bold text-foreground focus:border-primary/50 transition"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase block">Toplam Tutar (₺)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={kart.toplamEkstre || ""}
                onChange={(e) => onToplamDegis(Number(e.target.value))}
                placeholder="0.00"
                className="w-full h-8 px-2.5 rounded-xl bg-surface-raised border border-border/70 text-xs font-extrabold text-foreground font-mono focus:border-primary/50 transition"
              />
            </div>
          </div>
        </div>

        {/* Ödeyen Seçici & Aksiyonlar */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* Ekstreyi Ödeyen Kişi Seçici (Madde 2 - Mahsuplaşma İçin) */}
          <div className="flex items-center p-0.5 rounded-xl bg-surface-raised border border-border/70 text-[11px] font-bold">
            <span className="text-muted text-[10px] px-2 font-semibold">Ödeyen:</span>
            <button
              type="button"
              onClick={() => onOdeyenDegis("mert")}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                seciliOdeyen === "mert"
                  ? "bg-sky-500/20 text-sky-400 font-extrabold shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Mert
            </button>
            <button
              type="button"
              onClick={() => onOdeyenDegis("havsa")}
              className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                seciliOdeyen === "havsa"
                  ? "bg-pink-500/20 text-pink-400 font-extrabold shadow-xs"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Havsa
            </button>
          </div>

          {/* Dahil Etme Checkbox */}
          <label
            className="flex items-center gap-1.5 text-[11px] font-semibold text-muted hover:text-foreground cursor-pointer px-2 py-1 rounded-xl bg-surface-raised/70 border border-border/60"
            title="İşaretlenirse genel hesaplamalara katılmaz"
          >
            <input
              type="checkbox"
              checked={Boolean(kart.tumGiderToplamlarindaHaric)}
              onChange={(e) => onToplamlardanHaricDegis(e.target.checked)}
              className="accent-primary rounded-sm"
            />
            <span>Hariç Tut</span>
          </label>

          {/* Sil Butonu */}
          <button
            type="button"
            onClick={onSil}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            title="Kaydı sil"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Kart Alt Paylaşım Özeti */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-surface-raised/70 border border-border/60 text-xs">
        <div>
          <span className="text-muted block text-[10px] uppercase font-bold">Ortak Taban</span>
          <span className="font-extrabold text-foreground">
            {para(h.ortakTaban)}{" "}
            <span className="text-muted font-normal text-[11px]">
              (yarı pay: {para(h.ortakTaban / 2)})
            </span>
          </span>
        </div>
        <div>
          <span className="text-muted block text-[10px] uppercase font-bold">Mert'in Payı</span>
          <span className="font-extrabold text-sky-400">{para(h.mertToplam)}</span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-muted block text-[10px] uppercase font-bold">Havsa'nın Payı</span>
          <span className="font-extrabold text-pink-400">{para(h.havsaToplam)}</span>
        </div>
      </div>

      {/* Bireysel Ekstre Kalemleri Bölümü */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setBireyselAcik((v) => !v)}
            className="text-xs font-bold text-muted hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <span>🏷️</span>
            <span>Bireysel Kalemler ({kart.bireyselKalemler.length})</span>
            <span className="text-[10px]">{bireyselAcik ? "▲" : "▼"}</span>
          </button>
          <span className="text-[11px] text-muted">
            {kart.bireyselKalemler.length === 0
              ? "Tamamı ortak paylaşılır"
              : `Bireysel Toplam: ${para(h.mertBireysel + h.havsaBireysel)}`}
          </span>
        </div>

        {bireyselAcik && (
          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-border/60 animate-in fade-in duration-150">
            {/* Kalemler Listesi */}
            {kart.bireyselKalemler.length > 0 && (
              <div className="space-y-1.5">
                {kart.bireyselKalemler.map((bk) => (
                  <div
                    key={bk.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          bk.kullaniciId === "mert"
                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                        }`}
                      >
                        {KULLANICI_ETIKET[bk.kullaniciId]}
                      </span>
                      <span className="font-semibold text-foreground">{bk.aciklama}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground font-mono">
                        {para(bk.tutar)}
                      </span>
                      <button
                        type="button"
                        onClick={() => kalemDuzenle(bk)}
                        className="p-1 text-muted hover:text-foreground cursor-pointer"
                        title="Düzenle"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onBireyselSil(bk.id)}
                        className="p-1 text-rose-500 hover:text-rose-400 cursor-pointer"
                        title="Sil"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hızlı Kalem Ekleme Formu */}
            <form onSubmit={kalemKaydet} className="flex items-center gap-2 flex-wrap">
              <select
                value={kalemKisi}
                onChange={(e) => setKalemKisi(e.target.value as KullaniciId)}
                className="h-8 rounded-xl bg-surface-raised border border-border px-2 text-xs font-bold text-foreground"
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>

              <input
                type="text"
                value={kalemAciklama}
                onChange={(e) => setKalemAciklama(e.target.value)}
                placeholder="Kişisel harcama açıklaması"
                className="flex-1 min-w-[140px] h-8 rounded-xl bg-surface-raised border border-border px-2.5 text-xs font-semibold text-foreground"
              />

              <input
                type="text"
                inputMode="decimal"
                value={kalemTutarStr}
                onChange={(e) => setKalemTutarStr(e.target.value)}
                placeholder="Tutar (₺)"
                className="w-24 h-8 rounded-xl bg-surface-raised border border-border px-2.5 text-xs font-bold text-foreground font-mono"
              />

              <button
                type="submit"
                className="primary-button h-8 px-3 text-xs font-bold shrink-0"
              >
                {duzenlenenKalemId ? "Kaydet" : "+ Kalem Ekle"}
              </button>

              {duzenlenenKalemId && (
                <button
                  type="button"
                  onClick={kalemFormunuTemizle}
                  className="secondary-button h-8 px-2.5 text-xs font-bold shrink-0"
                >
                  Vazgeç
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// PARA TRANSFERİ MODAL BİLEŞENİ
// ------------------------------------------------------------------

function ParaTransferiModal({
  isOpen,
  onClose,
  gonderen,
  alan,
  tutarStr,
  tarih,
  aciklama,
  bireyselGidereYansit,
  onGonderenChange,
  onAlanChange,
  onTutarChange,
  onTarihChange,
  onAciklamaChange,
  onBireyselGidereYansitChange,
  onSubmit,
  onerilenTutar,
}: {
  isOpen: boolean;
  onClose: () => void;
  gonderen: KullaniciId;
  alan: KullaniciId;
  tutarStr: string;
  tarih: string;
  aciklama: string;
  bireyselGidereYansit: boolean;
  onGonderenChange: (val: KullaniciId) => void;
  onAlanChange: (val: KullaniciId) => void;
  onTutarChange: (val: string) => void;
  onTarihChange: (val: string) => void;
  onAciklamaChange: (val: string) => void;
  onBireyselGidereYansitChange: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onerilenTutar?: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border/80 shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <h3 className="text-base font-black text-foreground">Para Transferi Kaydet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-muted">
          İki kişi arasındaki para transferini kaydedin; mahsuplaşma kartındaki alacak/borç tutarı otomatik olarak düşecektir.
        </p>

        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* Gönderen ve Alan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-muted uppercase block mb-1">
                Gönderen (Ödeyen)
              </label>
              <select
                value={gonderen}
                onChange={(e) => onGonderenChange(e.target.value as KullaniciId)}
                className="w-full h-10 rounded-xl bg-surface-raised border border-border px-3 text-xs font-bold text-foreground"
              >
                <option value="havsa">Havsa</option>
                <option value="mert">Mert</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-muted uppercase block mb-1">
                Alan (Tahsil Eden)
              </label>
              <select
                value={alan}
                onChange={(e) => onAlanChange(e.target.value as KullaniciId)}
                className="w-full h-10 rounded-xl bg-surface-raised border border-border px-3 text-xs font-bold text-foreground"
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>
            </div>
          </div>

          {/* Tutar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-muted uppercase">
                Transfer Tutarı (₺)
              </label>
              {onerilenTutar !== undefined && onerilenTutar > 0 && (
                <button
                  type="button"
                  onClick={() => onTutarChange(tutarMetniInputIcin(onerilenTutar))}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Kalanın Tamamı: {para(onerilenTutar)}
                </button>
              )}
            </div>
            <input
              type="text"
              inputMode="decimal"
              required
              value={tutarStr}
              onChange={(e) => onTutarChange(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 rounded-xl bg-surface-raised border border-border px-3 text-sm font-extrabold text-foreground font-mono focus:border-primary/50 transition"
            />
          </div>

          {/* Tarih */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase block mb-1">
              Transfer Tarihi
            </label>
            <input
              type="date"
              value={tarih}
              onChange={(e) => onTarihChange(e.target.value)}
              className="w-full h-10 rounded-xl bg-surface-raised border border-border px-3 text-xs font-semibold text-foreground"
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="text-[11px] font-bold text-muted uppercase block mb-1">
              Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              value={aciklama}
              onChange={(e) => onAciklamaChange(e.target.value)}
              placeholder="Örn. Nakit avans, borç"
              className="w-full h-10 rounded-xl bg-surface-raised border border-border px-3 text-xs font-semibold text-foreground"
            />
          </div>

          {/* 🎯 Bireysel Gidere Yansıt Checkbox */}
          <div className="p-3 rounded-2xl bg-surface-raised/70 border border-border/70">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={bireyselGidereYansit}
                onChange={(e) => onBireyselGidereYansitChange(e.target.checked)}
                className="mt-0.5 accent-primary rounded-sm w-4 h-4 cursor-pointer shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Bu tutarı {KULLANICI_ETIKET[alan]} için bireysel harcama (gider) olarak da ekle
                </span>
                <span className="text-[11px] text-muted block mt-0.5 leading-relaxed">
                  Elden nakit borç/avans alındığında seçin: Mahsuplaşmadan düşerken, aynı zamanda {KULLANICI_ETIKET[alan]}'in aylık bütçesine eksi (-) yazar.
                </span>
              </div>
            </label>
          </div>

          {/* Butonlar */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="secondary-button h-10 px-4 text-xs font-bold cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="primary-button h-10 px-5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>💸</span> Transferi Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

