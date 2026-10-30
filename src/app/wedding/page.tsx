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
import { PageHeader } from "@/components/ui/PageHeader";
import {
  WeddingIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
} from "@/components/ui/Icons";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetDefault, setConfirmResetDefault] = useState(false);

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
    return data.maddeler
      .filter((madde) => {
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
      })
      .sort((a, b) => {
        // Ödenenler (tamamlandı) aşağıya düşsün
        if (!a.tamamlandi && b.tamamlandi) return -1;
        if (a.tamamlandi && !b.tamamlandi) return 1;
        if (a.tamamlandi && b.tamamlandi && a.tamamlanmaTarihi && b.tamamlanmaTarihi) {
          return b.tamamlanmaTarihi.localeCompare(a.tamamlanmaTarihi);
        }
        return 0;
      });
  }, [data.maddeler, seciliKategori, seciliDurum, aramaMetni]);

  const handleToggle = (id: string) => {
    toggleWeddingItem(id);
    refreshData();
  };

  const handleConfirmDeleteItem = (id: string) => {
    deleteWeddingItem(id);
    setConfirmDeleteId(null);
    refreshData();
  };

  const handleEditItem = (item: WeddingItem) => {
    setSelectedItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleYeniItem = () => {
    setSelectedItemToEdit(null);
    setIsItemModalOpen(true);
  };

  const handleConfirmVarsayilanYukle = () => {
    const varsayilan = bosWeddingVerisi();
    varsayilan.kumbaraKatkilar = data.kumbaraKatkilar; // Mevcut kumbara kalsın
    saveWeddingData(varsayilan);
    setConfirmResetDefault(false);
    refreshData();
  };

  if (!isLoaded) {
    return (
      <div className="py-20 text-center text-muted text-sm animate-pulse">
        Düğün bütçesi ve kumbara yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Hane Wedding"
        subtitle="Ortak birikim kumbarası oluşturun, düğün harcamalarını planlayın ve tamamlandıkça kumbaradan düşün."
        icon={<WeddingIcon size={20} />}
        badge={
          <span className="ds-badge ds-badge-primary">
            Düğün Bütçesi & Kumbara
          </span>
        }
        actions={
          <div
            onClick={() => setIsKumbaraOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsKumbaraOpen(true);
              }
            }}
            className="ds-card-lavender flex items-center gap-3 p-2 sm:px-3 sm:py-2 cursor-pointer hover:border-primary/50 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-accent border border-border-lavender flex items-center justify-center text-lg">
              🪙
            </div>
            <div className="text-left pr-1">
              <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span>Düğün Kumbarası</span>
              </div>
              <div className="text-sm font-bold text-foreground tabular-nums">
                {para(stats.kalanKumbara)} <span className="text-[10px] text-muted font-normal">kalan</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsKumbaraOpen(true);
              }}
              className="primary-button py-1.5 px-3 text-xs h-8 min-h-0"
            >
              <PlusIcon size={13} />
              <span className="hidden sm:inline">Para Ekle</span>
            </button>
          </div>
        }
      />

      {/* ÜSTTEKİ ÖZET ALANI */}
      <WeddingOzetKartlari stats={stats} onOpenKumbaraModal={() => setIsKumbaraOpen(true)} />

      {/* Düğün İhtiyaçları & Alınacaklar Başlığı & Filtreler */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>📋</span> Düğün Alınacak & Yapılacaklar Listesi
              <span className="ds-badge ds-badge-neutral text-xs tabular-nums">
                {stats.tamamlananSayisi}/{stats.toplamMaddeSayisi} Tamamlandı
              </span>
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Satın aldıkça veya kaparosunu ödedikçe tikleyin, tutar otomatik olarak kumbaradan düşecektir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleYeniItem}
              className="primary-button py-2 px-4 text-xs"
            >
              <PlusIcon size={15} />
              <span>Yeni Kalem Ekle</span>
            </button>
          </div>
        </div>

        {/* Filtre ve Arama Çubuğu */}
        <div className="ds-card flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3">
          {/* Arama Input */}
          <div className="relative flex-1 max-w-sm">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Listede harcama ara..."
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="field h-9 pl-8 pr-3 text-xs"
            />
          </div>

          {/* Durum Filtreleri */}
          <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border self-start lg:self-center">
            <button
              type="button"
              onClick={() => setSeciliDurum("tum")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                seciliDurum === "tum"
                  ? "bg-surface text-foreground shadow-2xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Tümü ({data.maddeler.length})
            </button>
            <button
              type="button"
              onClick={() => setSeciliDurum("bekleyen")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                seciliDurum === "bekleyen"
                  ? "bg-surface text-primary shadow-2xs border border-border"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Alınacaklar ({data.maddeler.length - stats.tamamlananSayisi})
            </button>
            <button
              type="button"
              onClick={() => setSeciliDurum("tamamlanan")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                seciliDurum === "tamamlanan"
                  ? "bg-surface text-emerald-700 shadow-2xs border border-border"
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
                ? "bg-primary text-white border-primary"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 tabular-nums ${
                  seciliKategori === katId
                    ? "bg-accent/70 border-primary text-primary"
                    : "bg-surface border-border text-muted hover:text-foreground"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Kalem Listesi */}
        {filtrelenmisMaddeler.length === 0 ? (
          <div className="ds-card border-dashed p-12 text-center space-y-3">
            <span className="text-4xl block">🕊️</span>
            <h3 className="text-base font-bold text-foreground">Harcama kalemi bulunamadı</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Seçili filtrelerde bir madde bulunmuyor. Yeni bir harcama ekleyebilir veya temel şablonu yükleyebilirsiniz.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleYeniItem}
                className="primary-button py-2 px-4 text-xs"
              >
                <PlusIcon size={15} /> Yeni Kalem Ekle
              </button>
              {data.maddeler.length === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmVarsayilanYukle}
                  className="secondary-button py-2 px-4 text-xs"
                >
                  📋 Örnek Listeyi Yükle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtrelenmisMaddeler.map((item, index) => {
              const katMeta = KATEGORI_ETIKETLERI[item.kategori] || {
                label: "Diğer",
                icon: "✨",
              };
              const isFirstCompleted =
                seciliDurum === "tum" &&
                item.tamamlandi &&
                (index === 0 || !filtrelenmisMaddeler[index - 1].tamamlandi);

              return (
                <div key={item.id} className="space-y-2">
                  {isFirstCompleted && (
                    <div className="pt-4 pb-1.5 flex items-center gap-3">
                      <div className="h-px bg-border flex-1" />
                      <span className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised border border-border tabular-nums">
                        <span className="text-emerald-700 font-bold">✓</span> Ödenen / Kumbaradan Düşenler ({stats.tamamlananSayisi})
                      </span>
                      <div className="h-px bg-border flex-1" />
                    </div>
                  )}
                  <div
                    className={`ds-card flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 transition-all gap-3 ${
                      item.tamamlandi
                        ? "bg-surface-raised/60 opacity-75"
                        : "hover:border-border-strong"
                    }`}
                  >
                    {/* Sol Kısım: Checkbox ve Başlık */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                          item.tamamlandi
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-border-strong hover:border-primary bg-surface-raised text-transparent"
                        }`}
                        title={item.tamamlandi ? "Alındı (Geri al)" : "Alındı olarak işaretle"}
                      >
                        <CheckIcon size={13} />
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
                          <span className="ds-badge ds-badge-neutral text-[10px]">
                            <span>{katMeta.icon}</span>
                            <span>{katMeta.label}</span>
                          </span>

                          {/* Sorumlu Rozeti */}
                          {item.sorumluKisi && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                                item.sorumluKisi === "mert"
                                  ? "bg-sky-500/10 border-sky-500/25 text-sky-700"
                                  : item.sorumluKisi === "havsa"
                                  ? "bg-pink-500/10 border-pink-500/25 text-pink-700"
                                  : "bg-accent/70 border-border-lavender text-primary"
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
                            <span className="ds-badge ds-badge-success text-[10px]">
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
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <div className="text-right tabular-nums">
                        <div
                          className={`text-sm sm:text-base font-bold ${
                            item.tamamlandi ? "text-emerald-700 line-through opacity-80" : "text-foreground"
                          }`}
                        >
                          {para(item.tutar)}
                        </div>
                        <div className="text-[10px] text-muted">
                          {item.tamamlandi ? "Kumbaradan düşüldü" : "Ödenmeyi bekliyor"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmDeleteItem(item.id)}
                              className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 text-xs h-7 min-h-0"
                            >
                              Sil
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="secondary-button px-2.5 py-1 text-xs h-7 min-h-0"
                            >
                              İptal
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="icon-button h-8 w-8"
                              title="Düzenle"
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="icon-button h-8 w-8 text-muted hover:text-rose-600"
                              title="Sil"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alt Bilgi & Şablon Sıfırlama */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span>
          💡 İpucu: Yeni aldığınız şeyleri işaretledikçe kumbaranızdaki kalan bakiye canlı olarak güncellenir.
        </span>
        {confirmResetDefault ? (
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold">Örnek listeyle sıfırlansın mı?</span>
            <button
              type="button"
              onClick={handleConfirmVarsayilanYukle}
              className="danger-button bg-rose-600 text-white hover:bg-rose-700 px-2.5 py-1 text-xs h-7 min-h-0"
            >
              Evet, Sıfırla
            </button>
            <button
              type="button"
              onClick={() => setConfirmResetDefault(false)}
              className="secondary-button px-2.5 py-1 text-xs h-7 min-h-0"
            >
              İptal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmResetDefault(true)}
            className="text-muted hover:text-foreground underline decoration-dotted cursor-pointer"
          >
            Örnek listeyi sıfırla / yeniden yükle
          </button>
        )}
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
