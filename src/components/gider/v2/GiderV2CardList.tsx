"use client";

import React, { useState } from "react";
import { para, KULLANICI_ETIKET, ODEYEN_ETIKET } from "./constants";
import type {
  KrediKartiEkstresi,
  BireyselEkstreKalemi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import { tekKartHesabi } from "@/domain/ekstreHesapla";
import { PlusIcon, EditIcon, TrashIcon, CloseIcon } from "@/components/ui/Icons";

interface GiderV2CardListProps {
  kartlar: KrediKartiEkstresi[];
  onKartDuzenle: (kart: KrediKartiEkstresi) => void;
  onKartSil: (id: string) => void;
  onBireyselEkle: (kartId: string, kalem: Omit<BireyselEkstreKalemi, "id">) => void;
  onBireyselDuzenle: (kartId: string, kartAdi: string, kalem: BireyselEkstreKalemi) => void;
  onBireyselSil: (kartId: string, kalemId: string) => void;
  onYeniKartEkle: () => void;
}

export function GiderV2CardList({
  kartlar,
  onKartDuzenle,
  onKartSil,
  onBireyselEkle,
  onBireyselDuzenle,
  onBireyselSil,
  onYeniKartEkle,
}: GiderV2CardListProps) {
  const [activeAddKalemKartId, setActiveAddKalemKartId] = useState<string | null>(null);
  const [kalemAciklama, setKalemAciklama] = useState("");
  const [kalemTutarStr, setKalemTutarStr] = useState("");
  const [kalemKisi, setKalemKisi] = useState<KullaniciId>("mert");

  const handleKalemSubmit = (e: React.FormEvent, kartId: string) => {
    e.preventDefault();
    const tutar = Number(kalemTutarStr.replace(",", "."));
    if (!kalemAciklama.trim() || !Number.isFinite(tutar) || tutar <= 0) return;

    onBireyselEkle(kartId, {
      aciklama: kalemAciklama.trim(),
      tutar,
      kullaniciId: kalemKisi,
    });

    setKalemAciklama("");
    setKalemTutarStr("");
    setActiveAddKalemKartId(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Üst Başlık ve Yeni Ekle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>💳</span>
            <span>Kartlar & Harcamalar ({kartlar.length})</span>
          </h3>
          <p className="text-xs text-muted">
            Kredi kartı ekstreleri veya tek seferlik harcamalar (ortak veya şahsi bireysel).
          </p>
        </div>

        <button
          type="button"
          onClick={onYeniKartEkle}
          className="primary-button h-9 px-3.5 text-xs shrink-0"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Yeni Kart / Harcama Ekle</span>
        </button>
      </div>

      {/* Bilgilendirme Notu */}
      <div className="py-2.5 px-3.5 rounded-xl bg-surface-lavender border border-border-lavender text-xs text-foreground-secondary flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span>💡</span>
          <span>
            Ay sonu hesaplaşması ve kişilerin birbirine gönderdiği <strong>havale / borç transferi</strong> kayıtları üstteki <strong>&ldquo;Genel Bakış & Havale / Mahsuplaşma&rdquo;</strong> sekmesinde yer alır.
          </span>
        </span>
      </div>

      {kartlar.length === 0 ? (
        <div className="ds-card p-10 sm:p-12 text-center space-y-3">
          <span className="text-3xl block">💳</span>
          <h4 className="text-sm font-bold text-foreground">Bu Ay İçin Henüz Kayıt Eklenmemiş</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Yukarıdaki &ldquo;Yeni Kart / Harcama Ekle&rdquo; butonunu kullanarak kredi kartı ekstresi ya da fatura/kira/alışveriş gibi harcama ekleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onYeniKartEkle}
            className="primary-button h-9 px-4 text-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>İlk Kartı / Harcamayı Ekle</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {kartlar.map((kart) => {
            const h = tekKartHesabi(kart);
            const isHarcama = kart.kayitTipi === "harcama";
            const kimeAit = kart.kimeAit ?? "ortak";
            const isBireysel = kimeAit === "mert" || kimeAit === "havsa";
            const odeyen =
              kart.odenenKisi ??
              (kart.ad.toLowerCase().includes("havsa")
                ? "havsa"
                : kart.ad.toLowerCase().includes("mert")
                ? "mert"
                : "mert");

            const isInlineAddOpen = activeAddKalemKartId === kart.id;

            return (
              <div
                key={kart.id}
                className={`p-5 rounded-2xl border transition shadow-xs space-y-4 self-start ${
                  kart.tumGiderToplamlarindaHaric
                    ? "bg-surface-raised/60 border-border opacity-75"
                    : "bg-surface border-border hover:border-border-lavender"
                }`}
              >
                {/* Kart Üst Bilgisi */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border flex items-center justify-center text-lg shrink-0">
                        {isHarcama ? "🧾" : "💳"}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {kart.ad}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {/* Kapsam Rozeti */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              kimeAit === "mert"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : kimeAit === "havsa"
                                ? "bg-pink-50 text-pink-700 border-pink-200"
                                : "bg-surface-lavender text-primary border-border-lavender"
                            }`}
                          >
                            {kimeAit === "mert"
                              ? "👤 Bireysel (Mert)"
                              : kimeAit === "havsa"
                              ? "👤 Bireysel (Havsa)"
                              : "👥 Hane Ortak"}
                          </span>

                          {/* Ödeyen Rozeti */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              odeyen === "mert"
                                ? "bg-sky-50 text-sky-700 border-sky-200"
                                : "bg-pink-50 text-pink-700 border-pink-200"
                            }`}
                          >
                            Ödeyen: {ODEYEN_ETIKET[odeyen]}
                          </span>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-raised text-muted border border-border">
                            {isHarcama ? "Harcama" : "Kredi Kartı"}
                          </span>

                          {kart.tumGiderToplamlarindaHaric && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-raised text-muted border border-border">
                              Toplamlardan Hariç
                            </span>
                          )}

                          {h.asim && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-danger-soft text-danger border border-danger/25">
                              ⚠️ Aşım Var
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Kart / Harcama Aksiyonları */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onKartDuzenle(kart)}
                        className="icon-button w-8 h-8"
                        title={isHarcama ? "Harcamayı düzenle" : "Kartı düzenle"}
                      >
                        <EditIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onKartSil(kart.id)}
                        className="icon-button w-8 h-8 hover:text-danger hover:border-danger/30 hover:bg-danger-soft"
                        title={isHarcama ? "Harcamayı sil" : "Kartı sil"}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Toplam Tutar / Ekstre */}
                  <div className="p-3.5 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                        {isHarcama ? "Toplam Tutar" : "Toplam Ekstre"}
                      </span>
                      <span className="text-xl font-extrabold text-foreground font-mono">
                        {para(kart.toplamEkstre)}
                      </span>
                    </div>

                    <div className="text-right text-xs">
                      <span className="text-muted block text-[10px] uppercase font-bold">
                        {isBireysel
                          ? "Hane Ortak Payı"
                          : isHarcama
                          ? "Kişi Başı Ortak Pay"
                          : "Kişi Başı Ortak Taban"}
                      </span>
                      <span className="font-bold text-primary font-mono">
                        {isBireysel
                          ? "0,00 ₺ (Bireysel)"
                          : para(isHarcama ? kart.toplamEkstre / 2 : h.ortakTaban / 2)}
                      </span>
                    </div>
                  </div>

                  {/* Pay Dağılım Kartları */}
                  {isBireysel ? (
                    <div>
                      {kimeAit === "mert" ? (
                        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-sky-700 uppercase">
                            Mert&apos;in Bireysel Payı (%100)
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {para(h.mertToplam)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-pink-700 uppercase">
                            Havsa&apos;nın Bireysel Payı (%100)
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            {para(h.havsaToplam)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                        <span className="text-[10px] font-bold text-sky-700 uppercase block">
                          Mert&apos;in Payı
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {para(h.mertToplam)}
                        </span>
                        {!isHarcama && h.mertBireysel > 0 && (
                          <span className="text-[10px] text-muted block mt-0.5">
                            (Bireysel Kalem: {para(h.mertBireysel)})
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-200">
                        <span className="text-[10px] font-bold text-pink-700 uppercase block">
                          Havsa&apos;nın Payı
                        </span>
                        <span className="font-bold text-foreground font-mono">
                          {para(h.havsaToplam)}
                        </span>
                        {!isHarcama && h.havsaBireysel > 0 && (
                          <span className="text-[10px] text-muted block mt-0.5">
                            (Bireysel Kalem: {para(h.havsaBireysel)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bireysel Ekstre Kalemleri veya Bireysel Kart Bilgisi */}
                  {isBireysel ? (
                    <div className="pt-2 border-t border-border text-[11px] text-muted flex items-center justify-between">
                      <span>
                        Tamamen {kimeAit === "mert" ? "Mert'in" : "Havsa'nın"} şahsi bireysel harcamasıdır. Ortak havuza girmez.
                      </span>
                      <span className="font-bold text-foreground font-mono shrink-0 ml-2">
                        {para(kart.toplamEkstre)}
                      </span>
                    </div>
                  ) : isHarcama ? (
                    <div className="pt-2 border-t border-border text-[11px] text-muted flex items-center justify-between">
                      <span>Ortak harcama doğrudan yarı yarıya bölünür.</span>
                      <span className="font-bold text-foreground font-mono">
                        {para(kart.toplamEkstre / 2)} / kişi
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground-secondary flex items-center gap-1.5">
                          <span>🏷️</span>
                          <span>Bu Karttaki Bireysel Kalemler ({kart.bireyselKalemler.length})</span>
                        </span>

                        {!isInlineAddOpen && (
                          <button
                            type="button"
                            onClick={() => setActiveAddKalemKartId(kart.id)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>+ Bireysel Kalem Ekle</span>
                          </button>
                        )}
                      </div>

                      {kart.bireyselKalemler.length > 0 && (
                        <div className="space-y-1.5">
                          {kart.bireyselKalemler.map((bk) => (
                            <div
                              key={bk.id}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-raised border border-border text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                                    bk.kullaniciId === "mert"
                                      ? "bg-sky-50 text-sky-700 border-sky-200"
                                      : "bg-pink-50 text-pink-700 border-pink-200"
                                  }`}
                                >
                                  {KULLANICI_ETIKET[bk.kullaniciId]}
                                </span>
                                <span className="font-semibold text-foreground truncate">
                                  {bk.aciklama}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono font-bold text-foreground mr-1">
                                  {para(bk.tutar)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onBireyselDuzenle(kart.id, kart.ad, bk)}
                                  className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-foreground transition cursor-pointer"
                                  title="Kalemi düzenle"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onBireyselSil(kart.id, bk.id)}
                                  className="w-6 h-6 rounded-md bg-surface border border-border flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft transition cursor-pointer"
                                  title="Kalemi sil"
                                >
                                  <CloseIcon className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Hızlı Bireysel Kalem Ekleme Formu */}
                      {isInlineAddOpen && (
                        <form
                          onSubmit={(e) => handleKalemSubmit(e, kart.id)}
                          className="p-3 rounded-xl bg-surface-lavender border border-border-lavender space-y-2.5 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary">
                              Bireysel Kalem Ayrıştır
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveAddKalemKartId(null)}
                              className="text-xs text-muted hover:text-foreground cursor-pointer"
                            >
                              <CloseIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4">
                              <select
                                value={kalemKisi}
                                onChange={(e) => setKalemKisi(e.target.value as KullaniciId)}
                                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs font-semibold text-foreground"
                              >
                                <option value="mert">Kişi: Mert</option>
                                <option value="havsa">Kişi: Havsa</option>
                              </select>
                            </div>
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={kalemAciklama}
                                onChange={(e) => setKalemAciklama(e.target.value)}
                                placeholder="Örn: Mert Pantolon"
                                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs text-foreground font-semibold"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={kalemTutarStr}
                                onChange={(e) => setKalemTutarStr(e.target.value)}
                                placeholder="Tutar (₺)"
                                className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border text-xs text-foreground font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveAddKalemKartId(null)}
                              className="secondary-button h-8 px-3 text-xs"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="submit"
                              className="primary-button h-8 px-3.5 text-xs"
                            >
                              Kalemi Ekle
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
