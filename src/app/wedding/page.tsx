"use client";

import { useEffect, useState, useMemo } from "react";
import {
  WeddingData,
  WeddingItem,
  WeddingItemCategory,
  WeddingStats,
} from "@/domain/weddingTypes";
import {
  getWeddingData,
  getWeddingStats,
  toggleWeddingItem,
  deleteWeddingItem,
  bosWeddingVerisi,
  saveWeddingData,
  WEDDING_EVENT_NAME,
} from "@/storage/weddingStorage";
import { KumbaraModal } from "@/components/wedding/KumbaraModal";
import { WeddingItemModal } from "@/components/wedding/WeddingItemModal";
import { WeddingOzetKartlari } from "@/components/wedding/WeddingOzetKartlari";

const para = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);

const KATEGORI_ETIKETLERI: Record<WeddingItemCategory, { label: string; icon: string }> = {
  mekan: { label: "Mekan & Organizasyon", icon: "🏛️" },
  giyim: { label: "Gelinlik & Damatlık", icon: "👗" },
  fotograf: { label: "Fotoğraf & Video", icon: "📷" },
  davetiye: { label: "Davetiye & Şeker", icon: "💌" },
  ceyiz: { label: "Ev & Çeyiz", icon: "🛋️" },
  balayi: { label: "Balayı & Seyahat", icon: "✈️" },
  diger: { label: "Diğer Masraflar", icon: "✨" },
};

export default function WeddingPage() {
  const [data, setData] = useState<WeddingData>(() => bosWeddingVerisi());
  const [isLoaded, setIsLoaded] = useState(false);

  // Modallar
  const [isKumbaraOpen, setIsKumbaraOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<WeddingItem | null>(null);

  // Filtreler
  const [seciliKategori, setSeciliKategori] = useState<string>("tum");
  const [seciliDurum, setSeciliDurum] = useState<"tum" | "bekleyen" | "tamamlanan">("tum");
  const [aramaMetni, setAramaMetni] = useState("");

  const refreshData = () => {
    const guncel = getWeddingData();
    setData(guncel);
  };

  useEffect(() => {
    refreshData();
    setIsLoaded(true);

    const handleUpdate = () => refreshData();
    window.addEventListener(WEDDING_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(WEDDING_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const stats: WeddingStats = useMemo(() => {
    return getWeddingStats(data);
  }, [data]);

  const filtrelenmisMaddeler = useMemo(() => {
    return data.maddeler.filter((madde) => {
      if (seciliKategori !== "tum" && madde.kategori !== seciliKategori) return false;
      if (seciliDurum === "bekleyen" && madde.tamamlandi) return false;
      if (seciliDurum === "tamamlanan" && !madde.tamamlandi) return false;
      if (aramaMetni.trim()) {
        const query = aramaMetni.toLowerCase();
        const baslikMatch = madde.baslik.toLowerCase().includes(query);
        const notlarMatch = madde.notlar?.toLowerCase().includes(query);
        if (!baslikMatch && !notlarMatch) return false;
      }
      return true;
    });
  }, [data.maddeler, seciliKategori, seciliDurum, aramaMetni]);

  const handleToggle = (id: string) => {
    toggleWeddingItem(id);
    refreshData();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Bu düğün kalemini silmek istediğinize emin misiniz?")) {
      deleteWeddingItem(id);
      refreshData();
    }
  };

  const handleEditItem = (item: WeddingItem) => {
    setSelectedItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleYeniItem = () => {
    setSelectedItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleVarsayilanYukle = () => {
    if (confirm("Tüm listeyi varsayılan temel düğün hazırlık listesiyle sıfırlamak istiyor musunuz?")) {
      const varsayilan = bosWeddingVerisi();
      varsayilan.kumbaraKatkilar = data.kumbaraKatkilar; // Mevcut kumbara kalsın
      saveWeddingData(varsayilan);
      refreshData();
    }
  };

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-muted text-sm animate-pulse">
        Düğün bütçesi ve kumbara yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Üst Başlık & Sağ Üst Kumbara Butonu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">💍</span>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Hane Wedding</h1>
            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-500 dark:text-rose-400">
              Düğün Bütçesi & Kumbara
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Ortak birikim kumbarası oluşturun, düğün harcamalarını planlayın ve tamamlandıkça kumbaradan düşün.
          </p>
        </div>

        {/* SAĞ ÜST KUMBARA WIDGET'I (Kullanıcının talep ettiği yer) */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div
            onClick={() => setIsKumbaraOpen(true)}
            role="button"
            tabIndex={0}
            className="flex items-center gap-3 p-2 sm:px-3 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-surface-raised border border-amber-500/30 hover:border-amber-500/60 shadow-xs hover:shadow-md transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-2xs">
              🪙
            </div>
            <div className="text-left pr-1">
              <div className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span>Düğün Kumbarası</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="text-sm font-black text-foreground">
                {para(stats.kalanKumbara)} <span className="text-[10px] text-muted font-normal">kalan</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsKumbaraOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Para Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* ÜSTTEKİ ÖZET ALANI (Yukarıdaki Özet) */}
      <WeddingOzetKartlari stats={stats} onOpenKumbaraModal={() => setIsKumbaraOpen(true)} />

      {/* Düğün İhtiyaçları & Alınacaklar Başlığı & Filtreler */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <span>📋</span> Düğün Alınacak & Yapılacaklar Listesi
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted font-bold">
                {stats.tamamlananSayisi}/{stats.toplamMaddeSayisi} Tamamlandı
              </span>
            </h2>
            <p className="text-xs text-muted">
              Satın aldıkça veya kaparosunu ödedikçe tikleyin, tutar otomatik olarak kumbaradan düşecektir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleYeniItem}
              className="primary-button py-2 px-4 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>➕</span> Yeni Kalem Ekle
            </button>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border/80">
          {/* Arama Input */}
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Listede harcama ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-surface-raised border border-border/80 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:border-rose-500 transition"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">
              🔍
            </span>
          </div>

          {/* Durum Filtreleri */}
          <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border/70 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSeciliDurum("tum")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                seciliDurum === "tum"
                  ? "bg-surface text-foreground shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Tümü ({data.maddeler.length})
            </button>
            <button
              type="button"
              onClick={() => setSeciliDurum("bekleyen")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                seciliDurum === "bekleyen"
                  ? "bg-surface text-rose-500 dark:text-rose-400 shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Alınacaklar ({data.maddeler.length - stats.tamamlananSayisi})
            </button>
            <button
              type="button"
              onClick={() => setSeciliDurum("tamamlanan")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                seciliDurum === "tamamlanan"
                  ? "bg-surface text-emerald-500 dark:text-emerald-400 shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Alınanlar ({stats.tamamlananSayisi})
            </button>
          </div>
        </div>

        {/* Kategori Hapları */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSeciliKategori("tum")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
              seciliKategori === "tum"
                ? "bg-foreground text-background border-foreground"
                : "bg-surface border-border text-muted hover:text-foreground"
            }`}
          >
            Tüm Kategoriler
          </button>
          {Object.entries(KATEGORI_ETIKETLERI).map(([katId, meta]) => {
            const count = data.maddeler.filter((m) => m.kategori === katId).length;
            return (
              <button
                key={katId}
                type="button"
                onClick={() => setSeciliKategori(katId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                  seciliKategori === katId
                    ? "bg-rose-500/15 border-rose-500 text-rose-500 dark:text-rose-400"
                    : "bg-surface border-border text-muted hover:text-foreground"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Kalem Listesi */}
        {filtrelenmisMaddeler.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-surface border border-border/70 space-y-3">
            <span className="text-4xl">🕊️</span>
            <h3 className="text-base font-bold text-foreground">Harcama kalemi bulunamadı</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Seçili filtrelerde bir madde bulunmuyor. Yeni bir harcama ekleyebilir veya temel şablonu yükleyebilirsiniz.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleYeniItem}
                className="primary-button py-2 px-4 text-xs font-bold"
              >
                ➕ Yeni Kalem Ekle
              </button>
              {data.maddeler.length === 0 && (
                <button
                  type="button"
                  onClick={handleVarsayilanYukle}
                  className="secondary-button py-2 px-4 text-xs font-bold"
                >
                  📋 Örnek Listeyi Yükle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrelenmisMaddeler.map((item) => {
              const katMeta = KATEGORI_ETIKETLERI[item.kategori] || {
                label: "Diğer",
                icon: "✨",
              };

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all gap-3 ${
                    item.tamamlandi
                      ? "bg-surface-raised/40 border-border/50 opacity-80"
                      : "bg-surface border-border/80 hover:border-rose-500/40 shadow-2xs"
                  }`}
                >
                  {/* Sol Kısım: Checkbox ve Başlık */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                        item.tamamlandi
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-border/80 hover:border-emerald-500/60 bg-surface-raised"
                      }`}
                      title={item.tamamlandi ? "Alındı (Geri al)" : "Alındı olarak işaretle"}
                    >
                      {item.tamamlandi && <span className="text-xs font-black">✓</span>}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            item.tamamlandi ? "line-through text-muted" : "text-foreground"
                          }`}
                        >
                          {item.baslik}
                        </span>

                        {/* Kategori Rozeti */}
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-raised border border-border/60 text-muted flex items-center gap-1">
                          <span>{katMeta.icon}</span>
                          <span>{katMeta.label}</span>
                        </span>

                        {/* Sorumlu Rozeti */}
                        {item.sorumluKisi && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                              item.sorumluKisi === "mert"
                                ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                                : item.sorumluKisi === "havsa"
                                ? "bg-pink-500/10 border-pink-500/20 text-pink-400"
                                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            }`}
                          >
                            {item.sorumluKisi === "mert"
                              ? "👤 Mert"
                              : item.sorumluKisi === "havsa"
                              ? "👩 Havsa"
                              : "👥 Ortak"}
                          </span>
                        )}

                        {item.tamamlandi && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold">
                            ✓ Alındı / Ödendi
                          </span>
                        )}
                      </div>

                      {item.notlar && (
                        <p className="text-xs text-muted leading-tight">{item.notlar}</p>
                      )}
                    </div>
                  </div>

                  {/* Sağ Kısım: Ücret & Aksiyonlar */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-black ${
                          item.tamamlandi ? "text-emerald-500 line-through opacity-80" : "text-foreground"
                        }`}
                      >
                        {para(item.tutar)}
                      </div>
                      <div className="text-[10px] text-muted">
                        {item.tamamlandi ? "Kumbaradan düşüldü" : "Ödenmeyi bekliyor"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditItem(item)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised cursor-pointer transition text-xs"
                        title="Düzenle"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition text-xs"
                        title="Sil"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alt Bilgi & Şablon Sıfırlama */}
      <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span>
          💡 İpucu: Yeni aldığınız şeyleri işaretledikçe kumbaranızdaki kalan bakiye canlı olarak güncellenir.
        </span>
        <button
          type="button"
          onClick={handleVarsayilanYukle}
          className="text-muted hover:text-foreground underline decoration-dotted cursor-pointer"
        >
          Örnek listeyi sıfırla / yeniden yükle
        </button>
      </div>

      {/* Modallar */}
      <KumbaraModal
        isOpen={isKumbaraOpen}
        onClose={() => setIsKumbaraOpen(false)}
        katkilar={data.kumbaraKatkilar}
        onDataChange={refreshData}
      />

      <WeddingItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setSelectedItemToEdit(null);
        }}
        itemToEdit={selectedItemToEdit}
        onDataChange={refreshData}
      />
    </div>
  );
}
