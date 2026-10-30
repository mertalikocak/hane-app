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
    borcluKisi,
    transferTutari,
    toplamTransferEdilen,
    durumMetni,
    tamamlandiMi,
  } = mahsuplasma;

  const mertNetBakiye = mertOdedi - mertPayinaDusen;
  const havsaNetBakiye = havsaOdedi - havsaPayinaDusen;

  return (
    <div className="ds-card p-5 sm:p-6 relative overflow-hidden">
      {/* Üst Çizgi Efekti */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

      {/* Başlık ve Durum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-lavender border border-border-lavender text-primary flex items-center justify-center text-lg shrink-0">
            🤝
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Ay Sonu Net Mahsuplaşma & Hesap Kapatma
            </h2>
            <p className="text-xs text-muted">
              Ortak harcamalar ve kart ödemeleri dengelenerek tek bir net transfer tutarı üretilir.
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto flex items-center gap-2">
          {tamamlandiMi ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-success-soft text-success border border-success/25">
              <span className="w-2 h-2 rounded-full bg-success" />
              Hesaplar Tam Kapandı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-warning-soft text-warning border border-warning/25">
              <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
              Tek Havale Bekleniyor
            </span>
          )}
        </div>
      </div>

      {/* Görsel Transfer Akışı (Mert <--- Tutar ---> Havsa) */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-surface-raised border border-border items-center">
        {/* Sol: Mert (2 Kolon) */}
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold text-base shrink-0">
            M
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-foreground">Mert&apos;in Kartları</span>
            </div>
            <span className="text-muted block text-[11px]">
              Cebinden Çıkan:{" "}
              <strong className="text-foreground font-mono font-bold">{para(mertOdedi)}</strong>
            </span>
            <span className="text-muted block text-[11px]">
              Payına Düşen:{" "}
              <strong className="text-sky-700 font-mono font-bold">{para(mertPayinaDusen)}</strong>
            </span>
            <span className="text-[11px] font-bold block">
              {mertNetBakiye >= 0 ? (
                <span className="text-success">+{para(mertNetBakiye)} (Alacaklı)</span>
              ) : (
                <span className="text-danger">{para(mertNetBakiye)} (Borçlu)</span>
              )}
            </span>
          </div>
        </div>

        {/* Orta: Transfer Kapsülü (3 Kolon) */}
        <div className="md:col-span-3 text-center py-3.5 px-4 rounded-xl bg-surface border border-border-lavender shadow-2xs flex flex-col items-center justify-center">
          {tamamlandiMi ? (
            <div className="space-y-1">
              <span className="text-xs font-bold text-success uppercase tracking-wider block">
                ✓ Hesaplar Tam Dengede
              </span>
              <div className="text-base sm:text-lg font-extrabold text-foreground">
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
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                <span>{borcluKisi === "havsa" ? "Havsa ➔ Mert" : "Mert ➔ Havsa"}</span>
                <span>• Havale Tutarı</span>
              </div>

              <div className="text-xl sm:text-2xl font-extrabold text-primary font-mono tracking-tight bg-surface-lavender border border-border-lavender py-1.5 px-3.5 rounded-xl inline-block">
                {para(transferTutari)}
              </div>

              <div className="text-xs text-foreground-secondary">
                {durumMetni}
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Havsa (2 Kolon) */}
        <div className="md:col-span-2 flex items-center gap-3 md:justify-end">
          <div className="text-xs md:text-right space-y-0.5 order-2 md:order-1">
            <div className="flex items-center gap-1.5 md:justify-end">
              <span className="font-bold text-sm text-foreground">Havsa&apos;nın Kartları</span>
            </div>
            <span className="text-muted block text-[11px]">
              Cebinden Çıkan:{" "}
              <strong className="text-foreground font-mono font-bold">{para(havsaOdedi)}</strong>
            </span>
            <span className="text-muted block text-[11px]">
              Payına Düşen:{" "}
              <strong className="text-pink-700 font-mono font-bold">{para(havsaPayinaDusen)}</strong>
            </span>
            <span className="text-[11px] font-bold block">
              {havsaNetBakiye >= 0 ? (
                <span className="text-success">+{para(havsaNetBakiye)} (Alacaklı)</span>
              ) : (
                <span className="text-danger">{para(havsaNetBakiye)} (Borçlu)</span>
              )}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-pink-50 border border-pink-200 text-pink-700 flex items-center justify-center font-bold text-base shrink-0 order-1 md:order-2">
            H
          </div>
        </div>
      </div>

      {/* Hızlı Butonlar & Matematiksel İnceleme Butonu */}
      <div className="mt-4 pt-3.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <button
          type="button"
          onClick={() => setShowMathExplainer((v) => !v)}
          className="text-xs font-semibold text-foreground-secondary hover:text-primary flex items-center gap-1.5 cursor-pointer self-start transition"
        >
          <span>🔍</span>
          <span>{showMathExplainer ? "Hesap Detayını Gizle" : "Bu Rakam Nasıl Çıktı? (Matematiksel Şeffaflık)"}</span>
          <span className="text-[10px]">{showMathExplainer ? "▲" : "▼"}</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onTransferModalAc}
            className="primary-button h-9 px-3.5 text-xs"
          >
            <span>💸</span>
            <span>Para Transferi / Borç Öde</span>
          </button>

          <button
            type="button"
            onClick={onKopyala}
            className="secondary-button h-9 px-3 text-xs"
            title="Hesaplaşma özetini panoya kopyala"
          >
            <span>📋</span>
            <span>Özeti Kopyala</span>
          </button>
        </div>
      </div>

      {/* ŞEFFAF MATEMATİKSEL İNCELEME ÇEKMECESİ */}
      {showMathExplainer && (
        <div className="mt-4 p-4 rounded-xl bg-surface-lavender border border-border-lavender text-xs space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-border-lavender pb-2">
            <span className="font-bold text-foreground flex items-center gap-2">
              <span>🧮</span> Adım Adım Hesaplama Tablosu
            </span>
            <span className="text-[11px] text-muted">Kişi başı adil paylaşım prensibi</span>
          </div>

          <div className="space-y-2 text-foreground-secondary leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface border border-border">
              <div>
                <strong className="text-foreground block mb-1">1. Cebinden Çıkan Ödemeler:</strong>
                <p>• Mert&apos;in kartından / hesabından ödenen: <span className="font-bold text-foreground font-mono">{para(mertOdedi)}</span></p>
                <p>• Havsa&apos;nın kartından / hesabından ödenen: <span className="font-bold text-foreground font-mono">{para(havsaOdedi)}</span></p>
                <p>• Toplam Ortak & Kart Yükü: <span className="font-bold text-primary font-mono">{para(mertOdedi + havsaOdedi)}</span></p>
              </div>

              <div>
                <strong className="text-foreground block mb-1">2. Kimin Ne Kadar Tükettiği (Payı):</strong>
                <p>• Mert&apos;in Payı (Ortak/2 + Kendi Bireyseli): <span className="font-bold text-sky-700 font-mono">{para(mertPayinaDusen)}</span></p>
                <p>• Havsa&apos;nın Payı (Ortak/2 + Kendi Bireyseli): <span className="font-bold text-pink-700 font-mono">{para(havsaPayinaDusen)}</span></p>
                <p className="text-[11px] text-muted mt-1">
                  (Ortak harcamalar 50/50 yarıya bölünür; ekstre içi bireysel harcamalar doğrudan ilgili kişiye yazılır)
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface border border-border space-y-1">
              <strong className="text-foreground block">3. Net Mahsuplaşma Formülü:</strong>
              <p>
                Fark = (Mert&apos;in Ödediği - Mert&apos;in Payı) = {para(mertOdedi)} - {para(mertPayinaDusen)} ={" "}
                <strong className="text-foreground font-mono">
                  {mertNetBakiye >= 0 ? `+${para(mertNetBakiye)} (Mert Alacaklı)` : `${para(mertNetBakiye)} (Mert Borçlu)`}
                </strong>
              </p>
              {toplamTransferEdilen > 0 && (
                <p className="text-success font-medium">
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
      <div className="mt-4 pt-3.5 border-t border-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <span>💸</span> Bu Ay Yapılan Havale / Transferler ({transferler.length})
          </span>
          <div className="flex items-center gap-2">
            {toplamTransferEdilen > 0 && (
              <span className="font-bold text-success text-[11px]">
                Toplam Ödenen: {para(toplamTransferEdilen)}
              </span>
            )}
            <button
              type="button"
              onClick={onTransferModalAc}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>+ Havale Ekle</span>
            </button>
          </div>
        </div>

        {transferler.length === 0 ? (
          <div className="py-3 px-4 rounded-xl bg-surface-raised border border-dashed border-border text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Bu ay için henüz kayıtlı bir havale/borç transferi yok.</span>
            <button
              type="button"
              onClick={onTransferModalAc}
              className="accent-button h-8 px-3 text-xs shrink-0"
            >
              <span>💸 Havale / Transfer Kaydet</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {transferler.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-raised border border-border text-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                      tr.gonderen === "mert"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-pink-50 text-pink-700 border-pink-200"
                    }`}
                  >
                    {KULLANICI_ETIKET[tr.gonderen]}
                  </span>
                  <span className="text-muted text-[11px]">➔</span>
                  <span
                    className={`font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                      tr.alan === "mert"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-pink-50 text-pink-700 border-pink-200"
                    }`}
                  >
                    {KULLANICI_ETIKET[tr.alan]}
                  </span>
                  <span className="font-bold text-success font-mono">
                    {para(tr.tutar)}
                  </span>
                  {tr.tarih && (
                    <span className="text-[10px] text-muted">({tr.tarih})</span>
                  )}
                  {tr.aciklama && (
                    <span className="text-[11px] text-muted italic">
                      &ldquo;{tr.aciklama}&rdquo;
                    </span>
                  )}
                  {tr.bireyselGidereYansit && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-warning-soft text-warning border border-warning/25">
                      {KULLANICI_ETIKET[tr.alan]}&apos;e Gider Yazıldı
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onTransferSil(tr.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger-soft transition cursor-pointer font-bold"
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
