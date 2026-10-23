"use client";

import React, { useState } from "react";
import { para, KULLANICI_ETIKET } from "./constants";
import type { MahsuplasmaSonucu } from "@/domain/ekstreHesapla";
import type { HaneTransferi } from "@/domain/haneGiderTypes";

interface GiderV2MahsuplasmaCardProps {
  mahsuplasma: MahsuplasmaSonucu;
  transferler: HaneTransferi[];
  onTransferModalAc: () => void;
  onTransferSil: (id: string) => void;
  onKopyala: () => void;
}

export function GiderV2MahsuplasmaCard({
  mahsuplasma,
  transferler,
  onTransferModalAc,
  onTransferSil,
  onKopyala,
}: GiderV2MahsuplasmaCardProps) {
  const [showMathExplainer, setShowMathExplainer] = useState(false);

  const {
    mertOdedi,
    havsaOdedi,
    mertPayinaDusen,
    havsaPayinaDusen,
    hamTransferTutari,
    hamBorcluKisi,
    borcluKisi,
    transferTutari,
    toplamTransferEdilen,
    durumMetni,
    tamamlandiMi,
  } = mahsuplasma;

  const mertNetBakiye = mertOdedi - mertPayinaDusen;
  const havsaNetBakiye = havsaOdedi - havsaPayinaDusen;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-surface via-surface to-surface-raised border border-purple-500/30 shadow-xs relative overflow-hidden">
      {/* Üst Çizgi Efekti */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500" />

      {/* Başlık ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl shrink-0">
            🤝
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Ay Sonu Net Mahsuplaşma & Hesap Kapatma</span>
            </h2>
            <p className="text-xs text-muted">
              Ortak harcamalar ve kart ödemeleri dengelenerek tek bir net transfer tutarı üretilir.
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto flex items-center gap-2">
          {tamamlandiMi ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hesaplar Tam Kapandı 🎉
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Tek Havale Bekleniyor
            </span>
          )}
        </div>
      </div>

      {/* Görsel Transfer Akışı (Mert <--- Tutar ---> Havsa) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl bg-surface-raised/70 border border-border/80 backdrop-blur-xs items-center">
        {/* Sol: Mert (2 Kolon) */}
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border-2 border-sky-500/40 text-sky-400 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
            M
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-foreground">Mert'in Kartları</span>
            </div>
            <span className="text-muted block text-[11px]">
              Cebinden Çıkan:{" "}
              <strong className="text-foreground font-mono font-bold">{para(mertOdedi)}</strong>
            </span>
            <span className="text-muted block text-[11px]">
              Payına Düşen:{" "}
              <strong className="text-sky-400 font-mono font-bold">{para(mertPayinaDusen)}</strong>
            </span>
            <span className="text-[10px] font-extrabold block">
              {mertNetBakiye >= 0 ? (
                <span className="text-emerald-400">+{para(mertNetBakiye)} (Alacaklı)</span>
              ) : (
                <span className="text-rose-400">{para(mertNetBakiye)} (Borçlu)</span>
              )}
            </span>
          </div>
        </div>

        {/* Orta: Transfer Kapsülü (3 Kolon) */}
        <div className="md:col-span-3 text-center py-3 px-4 rounded-2xl bg-surface border border-purple-500/25 shadow-xs flex flex-col items-center justify-center">
          {tamamlandiMi ? (
            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                ✅ Hesaplar Tam Dengede
              </span>
              <div className="text-base sm:text-lg font-black text-foreground">
                0,00 ₺ Kalan
              </div>
              <span className="text-[11px] text-muted block">
                {toplamTransferEdilen > 0
                  ? `Toplam ${para(toplamTransferEdilen)} ödendi ve borç kapandı.`
                  : "Kimsenin kimseye ortak borcu bulunmuyor."}
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <span>{borcluKisi === "havsa" ? "Havsa ➔ Mert" : "Mert ➔ Havsa"}</span>
                <span>💳 Havale Tutarı</span>
              </div>

              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-3 rounded-xl inline-block">
                {para(transferTutari)}
              </div>

              <div className="text-[11px] text-muted">
                {durumMetni}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Havsa (2 Kolon) */}
        <div className="md:col-span-2 flex items-center gap-3 md:justify-end">
          <div className="text-xs md:text-right space-y-0.5 order-2 md:order-1">
            <div className="flex items-center gap-1.5 md:justify-end">
              <span className="font-black text-sm text-foreground">Havsa'nın Kartları</span>
            </div>
            <span className="text-muted block text-[11px]">
              Cebinden Çıkan:{" "}
              <strong className="text-foreground font-mono font-bold">{para(havsaOdedi)}</strong>
            </span>
            <span className="text-muted block text-[11px]">
              Payına Düşen:{" "}
              <strong className="text-pink-400 font-mono font-bold">{para(havsaPayinaDusen)}</strong>
            </span>
            <span className="text-[10px] font-extrabold block">
              {havsaNetBakiye >= 0 ? (
                <span className="text-emerald-400">+{para(havsaNetBakiye)} (Alacaklı)</span>
              ) : (
                <span className="text-rose-400">{para(havsaNetBakiye)} (Borçlu)</span>
              )}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border-2 border-pink-500/40 text-pink-400 flex items-center justify-center font-black text-lg shrink-0 shadow-xs order-1 md:order-2">
            H
          </div>
        </div>
      </div>

      {/* Hızlı Butonlar & Matematiksel İnceleme Butonu */}
      <div className="mt-4 pt-3.5 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={() => setShowMathExplainer((v) => !v)}
          className="text-xs font-bold text-muted hover:text-purple-400 flex items-center gap-1.5 cursor-pointer self-start transition"
        >
          <span>🔍</span>
          <span>{showMathExplainer ? "Hesap Detayını Gizle" : "Bu Rakam Nasıl Çıktı? (Matematiksel Şeffaflık)"}</span>
          <span className="text-[10px]">{showMathExplainer ? "▲" : "▼"}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onTransferModalAc}
            className="primary-button h-9 px-3.5 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>💸</span>
            <span>Para Transferi / Borç Öde</span>
          </button>

          <button
            type="button"
            onClick={onKopyala}
            className="secondary-button h-9 px-3 text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
            title="Hesaplaşma özetini panoya kopyala"
          >
            <span>📋</span>
            <span>Özeti Kopyala</span>
          </button>
        </div>
      </div>

      {/* ŞEFFAF MATEMATİKSEL İNCELEME ÇEKMECESİ */}
      {showMathExplainer && (
        <div className="mt-4 p-4 rounded-2xl bg-surface/90 border border-purple-500/30 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <span className="font-black text-foreground flex items-center gap-2">
              <span>🧮</span> Adım Adım Hesaplama Tablosu
            </span>
            <span className="text-[11px] text-muted">Kişi başı adil paylaşım prensibi</span>
          </div>

          <div className="space-y-2 text-muted leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface-raised/70">
              <div>
                <strong className="text-foreground block mb-1">1. Cebinden Çıkan Ödemeler:</strong>
                <p>• Mert'in kartından / hesabından ödenen: <span className="font-bold text-foreground font-mono">{para(mertOdedi)}</span></p>
                <p>• Havsa'nın kartından / hesabından ödenen: <span className="font-bold text-foreground font-mono">{para(havsaOdedi)}</span></p>
                <p>• Toplam Ortak & Kart Yükü: <span className="font-bold text-purple-400 font-mono">{para(mertOdedi + havsaOdedi)}</span></p>
              </div>

              <div>
                <strong className="text-foreground block mb-1">2. Kimin Ne Kadar Tükettiği (Payı):</strong>
                <p>• Mert'in Payı (Ortak/2 + Kendi Bireyseli): <span className="font-bold text-sky-400 font-mono">{para(mertPayinaDusen)}</span></p>
                <p>• Havsa'nın Payı (Ortak/2 + Kendi Bireyseli): <span className="font-bold text-pink-400 font-mono">{para(havsaPayinaDusen)}</span></p>
                <p className="text-[11px] text-muted/80 mt-1">
                  (Ortak harcamalar 50/50 yarıya bölünür; ekstre içi bireysel harcamalar doğrudan ilgili kişiye yazılır)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-raised/70 space-y-1">
              <strong className="text-foreground block">3. Net Mahsuplaşma Formülü:</strong>
              <p>
                Fark = (Mert'in Ödediği - Mert'in Payı) = {para(mertOdedi)} - {para(mertPayinaDusen)} ={" "}
                <strong className="text-foreground font-mono">
                  {mertNetBakiye >= 0 ? `+${para(mertNetBakiye)} (Mert Alacaklı)` : `${para(mertNetBakiye)} (Mert Borçlu)`}
                </strong>
              </p>
              {toplamTransferEdilen > 0 && (
                <p className="text-emerald-400">
                  - Yapılan Transferler: {para(toplamTransferEdilen)} ödendi. Kalan net: <strong>{para(transferTutari)}</strong>
                </p>
              )}
              <p className="text-[11px] text-foreground font-semibold pt-1">
                👉 <strong>Sonuç:</strong> {durumMetni}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* YAPILAN HAVALE & PARA TRANSFERLERİ */}
      <div className="mt-4 pt-3.5 border-t border-border/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-black text-foreground flex items-center gap-1.5">
            <span>💸</span> Bu Ay Yapılan Havale / Transferler ({transferler.length})
          </span>
          <div className="flex items-center gap-2">
            {toplamTransferEdilen > 0 && (
              <span className="font-bold text-emerald-400 text-[11px]">
                Toplam Ödenen: {para(toplamTransferEdilen)}
              </span>
            )}
            <button
              type="button"
              onClick={onTransferModalAc}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>➕</span>
              <span>Havale Ekle</span>
            </button>
          </div>
        </div>

        {transferler.length === 0 ? (
          <div className="py-3 px-4 rounded-2xl bg-surface-raised/40 border border-dashed border-border/70 text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>Bu ay için henüz kayıtlı bir havale/borç transferi yok.</span>
            </span>
            <button
              type="button"
              onClick={onTransferModalAc}
              className="primary-button h-7 px-3 text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>💸</span>
              <span>Havale / Transfer Kaydet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transferler.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface border border-border/70 text-xs shadow-2xs"
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
                  onClick={() => onTransferSil(tr.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer font-bold"
                  title="Transfer kaydını sil"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
