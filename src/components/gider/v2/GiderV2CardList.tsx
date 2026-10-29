"use client";

import React, { useState } from "react";
import { para, KULLANICI_ETIKET, ODEYEN_ETIKET } from "./constants";
import type {
  KrediKartiEkstresi,
  BireyselEkstreKalemi,
  KullaniciId,
} from "@/domain/haneGiderTypes";
import { tekKartHesabi } from "@/domain/ekstreHesapla";

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
  // Inline kalem ekleme durumu
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-foreground tracking-tight flex items-center gap-2">
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
          className="primary-button h-9 px-3.5 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>Yeni Kart / Harcama Ekle</span>
        </button>
      </div>

      {/* Bilgilendirme Notu */}
      <div className="py-2.5 px-3.5 rounded-2xl bg-surface-raised/40 border border-border/60 text-xs text-muted flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span>💡</span>
          <span>Ay sonu hesaplaşması ve kişilerin birbirine gönderdiği <strong>havale / borç transferi</strong> kayıtları üstteki <strong>"Genel Bakış & Havale / Mahsuplaşma"</strong> sekmesinde yer alır.</span>
        </span>
      </div>

      {kartlar.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border/80 bg-surface/60 space-y-3">
          <span className="text-4xl block">💳</span>
          <h4 className="text-sm font-bold text-foreground">Bu Ay İçin Henüz Kayıt Eklenmemiş</h4>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Hemen yukarıdaki "Yeni Kart / Harcama Ekle" butonunu kullanarak kredi kartı ekstresi ya da fatura/kira/alışveriş gibi harcama ekleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onYeniKartEkle}
            className="primary-button h-9 px-4 text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>➕</span>
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
                className={`p-5 rounded-3xl border transition shadow-xs space-y-4 self-start ${
                  kart.tumGiderToplamlarindaHaric
                    ? "bg-surface/40 border-border/50 opacity-75"
                    : "bg-surface border-border/80 hover:border-border"
                }`}
              >
                {/* Kart Üst Bilgisi */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-lg shrink-0">
                        {isHarcama ? "🧾" : "💳"}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-foreground">
                          {kart.ad}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {/* Kapsam Rozeti */}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              kimeAit === "mert"
                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                : kimeAit === "havsa"
                                ? "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                                : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
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
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              odeyen === "mert"
                                ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                                : "bg-pink-500/15 text-pink-400 border border-pink-500/30"
                            }`}
                          >
                            Ödeyen: {ODEYEN_ETIKET[odeyen]}
                          </span>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-raised text-muted border border-border">
                            {isHarcama ? "🧾 Harcama" : "💳 Kredi Kartı"}
                          </span>

                          {kart.tumGiderToplamlarindaHaric && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-raised text-muted border border-border">
                              Toplamlardan Hariç
                            </span>
                          )}

                          {h.asim && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              ⚠️ Aşım Var
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sağ: Kart / Harcama Aksiyonları */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onKartDuzenle(kart)}
                        className="w-8 h-8 rounded-xl bg-surface-raised border border-border text-muted hover:text-foreground hover:bg-surface flex items-center justify-center text-xs cursor-pointer transition"
                        title={isHarcama ? "Harcamayı düzenle" : "Kartı düzenle"}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onKartSil(kart.id)}
                        className="w-8 h-8 rounded-xl bg-surface-raised border border-border text-muted hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center text-xs cursor-pointer transition"
                        title={isHarcama ? "Harcamayı sil" : "Kartı sil"}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Toplam Tutar / Ekstre */}
                  <div className="p-3.5 rounded-2xl bg-surface-raised/60 border border-border/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
                        {isHarcama ? "Toplam Tutar" : "Toplam Ekstre"}
                      </span>
                      <span className="text-xl font-black text-foreground font-mono">
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
                      <span className="font-bold text-purple-400 font-mono">
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
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-sky-400 uppercase">
                            Mert'in Bireysel Payı (%100)
                          </span>
                          <span className="font-extrabold text-foreground font-mono">
                            {para(h.mertToplam)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-pink-400 uppercase">
                            Havsa'nın Bireysel Payı (%100)
                          </span>
                          <span className="font-extrabold text-foreground font-mono">
                            {para(h.havsaToplam)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/20">
                        <span className="text-[10px] font-bold text-sky-400 uppercase block">
                          Mert'in Payı
                        </span>
                        <span className="font-extrabold text-foreground font-mono">
                          {para(h.mertToplam)}
                        </span>
                        {!isHarcama && h.mertBireysel > 0 && (
                          <span className="text-[10px] text-muted block mt-0.5">
                            (Bireysel Kalem: {para(h.mertBireysel)})
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/20">
                        <span className="text-[10px] font-bold text-pink-400 uppercase block">
                          Havsa'nın Payı
                        </span>
                        <span className="font-extrabold text-foreground font-mono">
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
                    <div className="pt-2 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>ℹ️</span>
                        <span>
                          Tamamen {kimeAit === "mert" ? "Mert'in" : "Havsa'nın"} şahsi bireysel harcamasıdır. Ortak havuza girmez.
                        </span>
                      </span>
                      <span className="font-bold text-foreground font-mono shrink-0">
                        {para(kart.toplamEkstre)} (Bireysel)
                      </span>
                    </div>
                  ) : isHarcama ? (
                    <div className="pt-2 border-t border-border/50 text-[11px] text-muted flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>ℹ️</span>
                        <span>Ortak harcama doğrudan yarı yarıya bölünür.</span>
                      </span>
                      <span className="font-bold text-foreground font-mono">
                        {para(kart.toplamEkstre / 2)} / kişi
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 border-t border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted flex items-center gap-1.5">
                          <span>🏷️</span>
                          <span>Bu Karttaki Bireysel Kalemler ({kart.bireyselKalemler.length})</span>
                        </span>

                        {!isInlineAddOpen && (
                          <button
                            type="button"
                            onClick={() => setActiveAddKalemKartId(kart.id)}
                            className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <span>➕</span>
                            <span>Bireysel Kalem Ekle</span>
                          </button>
                        )}
                      </div>

                      {kart.bireyselKalemler.length > 0 && (
                        <div className="space-y-1.5">
                          {kart.bireyselKalemler.map((bk) => (
                            <div
                              key={bk.id}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-raised border border-border/60 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                    bk.kullaniciId === "mert"
                                      ? "bg-sky-500/15 text-sky-400"
                                      : "bg-pink-500/15 text-pink-400"
                                  }`}
                                >
                                  {KULLANICI_ETIKET[bk.kullaniciId]}
                                </span>
                                <span className="font-semibold text-foreground">
                                  {bk.aciklama}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-foreground mr-1">
                                  {para(bk.tutar)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onBireyselDuzenle(kart.id, kart.ad, bk)}
                                  className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-raised transition cursor-pointer text-xs"
                                  title="Kalemi düzenle"
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onBireyselSil(kart.id, bk.id)}
                                  className="w-6 h-6 rounded-lg bg-surface border border-border/60 flex items-center justify-center text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer text-xs"
                                  title="Kalemi sil"
                                >
                                  ✕
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
                          className="p-3 rounded-2xl bg-surface-raised border border-primary/30 space-y-2 animate-in fade-in duration-150"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-foreground">
                              Bireysel Kalem Ayrıştır
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveAddKalemKartId(null)}
                              className="text-xs text-muted hover:text-foreground"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4">
                              <select
                                value={kalemKisi}
                                onChange={(e) => setKalemKisi(e.target.value as KullaniciId)}
                                className="w-full h-8 px-2 rounded-lg bg-surface border border-border text-xs font-bold text-foreground"
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
                                className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-foreground font-semibold"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={kalemTutarStr}
                                onChange={(e) => setKalemTutarStr(e.target.value)}
                                placeholder="Tutar (₺)"
                                className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-foreground font-mono font-bold"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveAddKalemKartId(null)}
                              className="secondary-button h-7 px-2.5 text-xs font-bold text-muted"
                            >
                              Vazgeç
                            </button>
                            <button
                              type="submit"
                              className="primary-button h-7 px-3 text-xs font-bold"
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
