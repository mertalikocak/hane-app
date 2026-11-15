"use client";

import { useState, useMemo } from "react";
import {
  WeddingParticipant,
  WeddingParticipantSide,
} from "@/domain/weddingTypes";
import {
  addWeddingParticipant,
  updateWeddingParticipant,
  deleteWeddingParticipant,
} from "@/storage/weddingStorage";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  CloseIcon,
} from "@/components/ui/Icons";

interface WeddingParticipantsViewProps {
  katilimcilar: WeddingParticipant[];
  onDataChange: () => void;
}

export function WeddingParticipantsView({
  katilimcilar,
  onDataChange,
}: WeddingParticipantsViewProps) {
  const [subTab, setSubTab] = useState<"tahmini" | "kesin">("tahmini");

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isim, setIsim] = useState("");
  const [yetiskinStr, setYetiskinStr] = useState("2");
  const [cocukStr, setCocukStr] = useState("0");
  const [taraf, setTaraf] = useState<WeddingParticipantSide>("mert");
  const [formHata, setFormHata] = useState<string | null>(null);

  // Filter state
  const [tarafFiltresi, setTarafFiltresi] = useState<"tum" | WeddingParticipantSide>("tum");
  const [arama, setArama] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Summary calculations
  const ozet = useMemo(() => {
    let toplamKisi = 0;
    let toplamYetiskin = 0;
    let toplamCocuk = 0;
    let mertToplam = 0;
    let mertYetiskin = 0;
    let mertCocuk = 0;
    let mertGrup = 0;
    let havsaToplam = 0;
    let havsaYetiskin = 0;
    let havsaCocuk = 0;
    let havsaGrup = 0;

    for (const k of katilimcilar) {
      const y = Number(k.yetiskin) || 0;
      const c = Number(k.cocuk) || 0;
      const t = y + c;
      toplamKisi += t;
      toplamYetiskin += y;
      toplamCocuk += c;

      if (k.taraf === "mert") {
        mertToplam += t;
        mertYetiskin += y;
        mertCocuk += c;
        mertGrup += 1;
      } else {
        havsaToplam += t;
        havsaYetiskin += y;
        havsaCocuk += c;
        havsaGrup += 1;
      }
    }

    return {
      toplamKisi,
      toplamYetiskin,
      toplamCocuk,
      grupSayisi: katilimcilar.length,
      mertToplam,
      mertYetiskin,
      mertCocuk,
      mertGrup,
      havsaToplam,
      havsaYetiskin,
      havsaCocuk,
      havsaGrup,
    };
  }, [katilimcilar]);

  const filtrelenmisKatilimcilar = useMemo(() => {
    const q = arama.trim().toLowerCase();
    return katilimcilar.filter((k) => {
      if (tarafFiltresi !== "tum" && k.taraf !== tarafFiltresi) return false;
      if (q && !k.isim.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [katilimcilar, tarafFiltresi, arama]);

  const parsedYetiskin = Math.max(0, Math.round(Number(yetiskinStr) || 0));
  const parsedCocuk = Math.max(0, Math.round(Number(cocukStr) || 0));
  const formToplam = parsedYetiskin + parsedCocuk;

  const resetForm = () => {
    setEditingId(null);
    setIsim("");
    setYetiskinStr("2");
    setCocukStr("0");
    setTaraf("mert");
    setFormHata(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormHata(null);

    const temizIsim = isim.trim();
    if (!temizIsim) {
      setFormHata("Lütfen katılımcı veya aile adı girin (örn: Halamlar).");
      return;
    }

    if (formToplam <= 0) {
      setFormHata("Yetişkin veya çocuk sayısı en az 1 olmalıdır.");
      return;
    }

    if (editingId) {
      updateWeddingParticipant(editingId, {
        isim: temizIsim,
        yetiskin: parsedYetiskin,
        cocuk: parsedCocuk,
        taraf,
      });
    } else {
      addWeddingParticipant({
        isim: temizIsim,
        yetiskin: parsedYetiskin,
        cocuk: parsedCocuk,
        taraf,
      });
    }

    onDataChange();
    resetForm();
  };

  const handleEdit = (item: WeddingParticipant) => {
    setEditingId(item.id);
    setIsim(item.isim);
    setYetiskinStr(String(item.yetiskin));
    setCocukStr(String(item.cocuk));
    setTaraf(item.taraf);
    setFormHata(null);
    setConfirmDeleteId(null);
  };

  const handleConfirmDelete = (id: string) => {
    deleteWeddingParticipant(id);
    setConfirmDeleteId(null);
    if (editingId === id) {
      resetForm();
    }
    onDataChange();
  };

  return (
    <div className="space-y-6">
      {/* Alt Sekmeler: Tahmini Katılımcı / Kesin Katılımcı */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setSubTab("tahmini")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === "tahmini"
                ? "bg-surface text-foreground shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>📋</span>
            <span>Tahmini Katılımcı</span>
            <span className="ds-badge ds-badge-primary text-[10px] tabular-nums px-1.5 py-0">
              {ozet.toplamKisi} Kişi
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("kesin")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              subTab === "kesin"
                ? "bg-surface text-foreground shadow-2xs border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            <span>✉️</span>
            <span>Kesin Katılımcı</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 border border-amber-500/25 font-semibold">
              Yakında
            </span>
          </button>
        </div>
      </div>

      {subTab === "kesin" ? (
        <div className="ds-card border-dashed p-10 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-3xl mx-auto">
            🚧
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
              Yapım Aşamasında
            </span>
            <h3 className="text-lg font-bold text-foreground">
              Kesin Katılımcı (LCV) Sistemi Hazırlanıyor
            </h3>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Davetiye veritabanı bağlantısı kurulduğunda, dijital davetiye üzerinden katılım onayı
              veren kesin misafirleriniz, masa düzeni ve özel notları burada otomatik olarak
              listelenecektir.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* En Üst Özet Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Toplam Tahmini Katılımcı */}
            <div className="ds-card-lavender p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  Toplam Tahmini Katılımcı
                </span>
                <span className="text-xl">👥</span>
              </div>
              <div className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                {ozet.toplamKisi}{" "}
                <span className="text-sm font-semibold text-muted">Kişi</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted tabular-nums">
                <span className="px-2 py-0.5 rounded-md bg-surface/80 border border-border-lavender font-semibold text-foreground">
                  {ozet.toplamYetiskin} Yetişkin
                </span>
                <span className="px-2 py-0.5 rounded-md bg-surface/80 border border-border-lavender font-semibold text-foreground">
                  {ozet.toplamCocuk} Çocuk
                </span>
                <span className="text-[11px]">• {ozet.grupSayisi} Aile/Grup</span>
              </div>
            </div>

            {/* Mert Tarafı */}
            <div className="ds-card p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                  Mert Tarafı
                </span>
                <span className="text-lg">🤵</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tabular-nums">
                {ozet.mertToplam}{" "}
                <span className="text-xs font-semibold text-muted">Kişi</span>
              </div>
              <div className="text-xs text-muted tabular-nums">
                {ozet.mertYetiskin} Yetişkin • {ozet.mertCocuk} Çocuk ({ozet.mertGrup} grup)
              </div>
            </div>

            {/* Havsa Tarafı */}
            <div className="ds-card p-4 sm:p-5 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-pink-700 uppercase tracking-wider">
                  Havsa Tarafı
                </span>
                <span className="text-lg">👰</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground tabular-nums">
                {ozet.havsaToplam}{" "}
                <span className="text-xs font-semibold text-muted">Kişi</span>
              </div>
              <div className="text-xs text-muted tabular-nums">
                {ozet.havsaYetiskin} Yetişkin • {ozet.havsaCocuk} Çocuk ({ozet.havsaGrup} grup)
              </div>
            </div>
          </div>

          {/* Katılımcı Ekle / Düzenle Formu */}
          <form onSubmit={handleSubmit} className="ds-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{editingId ? "✏️" : "➕"}</span>
                <span>{editingId ? "Katılımcıyı Düzenle" : "Katılımcı Ekle"}</span>
              </h3>
              <span className="ds-badge ds-badge-primary text-xs tabular-nums">
                Toplam: {formToplam} Kişi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              {/* İsim */}
              <div className="lg:col-span-4 space-y-1">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                  İsim / Aile Grubu
                </label>
                <input
                  type="text"
                  placeholder="Örn: Halamlar"
                  value={isim}
                  onChange={(e) => setIsim(e.target.value)}
                  className="field h-10 px-3 text-sm"
                />
              </div>

              {/* Yetişkin */}
              <div className="lg:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                  Yetişkin (Kişi)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={yetiskinStr}
                  onChange={(e) => setYetiskinStr(e.target.value)}
                  className="field h-10 px-3 text-sm tabular-nums"
                />
              </div>

              {/* Çocuk */}
              <div className="lg:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                  Çocuk (Kişi)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={cocukStr}
                  onChange={(e) => setCocukStr(e.target.value)}
                  className="field h-10 px-3 text-sm tabular-nums"
                />
              </div>

              {/* Kimin Tarafı */}
              <div className="lg:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wide">
                  Kimin Tarafı
                </label>
                <div className="grid grid-cols-2 gap-1.5 h-10">
                  <button
                    type="button"
                    onClick={() => setTaraf("mert")}
                    className={`rounded-xl border text-xs font-bold transition cursor-pointer ${
                      taraf === "mert"
                        ? "bg-sky-500/15 border-sky-500 text-sky-800"
                        : "bg-surface-raised border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Mert
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaraf("havsa")}
                    className={`rounded-xl border text-xs font-bold transition cursor-pointer ${
                      taraf === "havsa"
                        ? "bg-pink-500/15 border-pink-500 text-pink-800"
                        : "bg-surface-raised border-border text-muted hover:text-foreground"
                    }`}
                  >
                    Havsa
                  </button>
                </div>
              </div>

              {/* Ekle / Güncelle Butonu */}
              <div className="lg:col-span-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="primary-button h-10 px-4 text-xs font-bold w-full justify-center"
                >
                  <PlusIcon size={14} />
                  <span>{editingId ? "Güncelle" : "Ekle"}</span>
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="secondary-button h-10 px-3 text-xs shrink-0"
                    title="Düzenlemeyi İptal Et"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
            </div>

            {formHata && (
              <p className="text-xs text-rose-600 font-semibold">{formHata}</p>
            )}
          </form>

          {/* Filtre & Liste */}
          <div className="space-y-3">
            <div className="ds-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
              <div className="relative flex-1 max-w-sm">
                <SearchIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Katılımcı veya aile ara..."
                  value={arama}
                  onChange={(e) => setArama(e.target.value)}
                  className="field h-9 pl-8 pr-3 text-xs"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setTarafFiltresi("tum")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                    tarafFiltresi === "tum"
                      ? "bg-surface text-foreground shadow-2xs border border-border"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Tümü ({katilimcilar.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTarafFiltresi("mert")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                    tarafFiltresi === "mert"
                      ? "bg-surface text-sky-700 shadow-2xs border border-border"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Mert ({ozet.mertGrup})
                </button>
                <button
                  type="button"
                  onClick={() => setTarafFiltresi("havsa")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer tabular-nums ${
                    tarafFiltresi === "havsa"
                      ? "bg-surface text-pink-700 shadow-2xs border border-border"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Havsa ({ozet.havsaGrup})
                </button>
              </div>
            </div>

            {filtrelenmisKatilimcilar.length === 0 ? (
              <div className="ds-card border-dashed p-10 text-center space-y-2">
                <span className="text-3xl block">📝</span>
                <h4 className="text-sm font-bold text-foreground">
                  Henüz tahmini katılımcı eklenmedi
                </h4>
                <p className="text-xs text-muted">
                  Yukarıdaki formdan davetli aile/kişi gruplarını ekleyerek toplam katılımcı sayısını hesaplayabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtrelenmisKatilimcilar.map((item) => (
                  <div
                    key={item.id}
                    className="ds-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 hover:border-border-strong transition"
                  >
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="text-sm font-bold text-foreground truncate">
                        {item.isim}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${
                          item.taraf === "mert"
                            ? "bg-sky-500/10 border-sky-500/25 text-sky-700"
                            : "bg-pink-500/10 border-pink-500/25 text-pink-700"
                        }`}
                      >
                        {item.taraf === "mert" ? "👤 Mert Tarafı" : "👩 Havsa Tarafı"}
                      </span>
                      <span className="text-xs text-muted tabular-nums">
                        {item.yetiskin} Yetişkin • {item.cocuk} Çocuk
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                      <span className="ds-badge ds-badge-primary text-xs font-bold tabular-nums px-2.5 py-1">
                        Toplam: {item.toplam} Kişi
                      </span>

                      <div className="flex items-center gap-1">
                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(item.id)}
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
                              onClick={() => handleEdit(item)}
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

