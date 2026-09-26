"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react'
import type {
  AyHaneGiderVerisi,
  BireyselEkstreKalemi,
  BireyselAyriHarcama,
  BireyselGelirKalemi,
  KrediKartiEkstresi,
  KullaniciId,
} from '@/domain/haneGiderTypes'
import {
  ayGenelToplamlar,
  ayToplamGelir,
  ayToplamGirisGideri,
  bireyselAyriHarcamaToplamlar,
  bireyselGelirToplamlar,
  tekKartHesabi,
  toplumaDahilKartlar,
} from '@/domain/ekstreHesapla'
import {
  ayAnahtariOlustur,
  ayAnahtariParcala,
  ayVerisiOku,
  ayVerisiYaz,
} from '@/storage/ayDeposu'
import {
  yedekDosyasiDisaAktar,
  yedekDosyasiOnizle,
  yedekDosyasiniIceAktar,
} from '@/storage/yedekDeposu'
import './EvGiderleriSayfasi.css'

const AYLAR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const

const KULLANICI_ETIKET: Record<KullaniciId, string> = {
  mert: 'Mert',
  havsa: 'Havsa',
}

const para = (n: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2,
  }).format(n)

/** Form alanında göstermek için ondalık ayırıcılı tutar metni (gruplama yok) */
function tutarMetniInputIcin(tutar: number): string {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(tutar)
}

function simdikiAyAnahtari(): string {
  const d = new Date()
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth())
}

function ayEtiketi(anahtar: string): string {
  const { yil, ay } = ayAnahtariParcala(anahtar)
  return `${AYLAR[ay] ?? '—'} ${yil}`
}

function ayKaydir(anahtar: string, delta: number): string {
  const { yil, ay } = ayAnahtariParcala(anahtar)
  const d = new Date(yil, ay + delta, 1)
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth())
}

function yeniKart(): KrediKartiEkstresi {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'kart-' + Date.now(),
    ad: 'Yeni kayıt',
    toplamEkstre: 0,
    bireyselKalemler: [],
  }
}

export function EvGiderleriSayfasi() {
  const [anahtar, setAnahtar] = useState(simdikiAyAnahtari)
  const [veri, setVeri] = useState<AyHaneGiderVerisi>(() => ayVerisiOku(simdikiAyAnahtari()))
  const [ayriBireyselAciklama, setAyriBireyselAciklama] = useState('')
  const [ayriBireyselTutarStr, setAyriBireyselTutarStr] = useState('')
  const [ayriBireyselKisi, setAyriBireyselKisi] = useState<KullaniciId>('mert')
  const [ayriBireyselBolgeAcik, setAyriBireyselBolgeAcik] = useState(false)
  const oncekiAyriBireyselSayisi = useRef(0)

  const [ayriGelirAciklama, setAyriGelirAciklama] = useState('')
  const [ayriGelirTutarStr, setAyriGelirTutarStr] = useState('')
  const [ayriGelirKisi, setAyriGelirKisi] = useState<KullaniciId>('mert')
  const [ayriGelirBolgeAcik, setAyriGelirBolgeAcik] = useState(false)
  const oncekiAyriGelirSayisi = useRef(0)

  const [duzenlenenAyriHarcamaId, setDuzenlenenAyriHarcamaId] = useState<string | null>(null)
  const [duzenlenenGelirId, setDuzenlenenGelirId] = useState<string | null>(null)
  const iceAktarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const yeniAy = ayVerisiOku(anahtar)
    setVeri(yeniAy)
    setAyriBireyselBolgeAcik(false)
    setAyriGelirBolgeAcik(false)
    setDuzenlenenAyriHarcamaId(null)
    setDuzenlenenGelirId(null)
    oncekiAyriBireyselSayisi.current = yeniAy.bireyselAyriHarcamalar.length
    oncekiAyriGelirSayisi.current = yeniAy.bireyselGelirKalemleri.length
  }, [anahtar])

  useEffect(() => {
    ayVerisiYaz(anahtar, veri)
  }, [anahtar, veri])

  const genel = useMemo(() => ayGenelToplamlar(veri.krediKartlari), [veri.krediKartlari])

  const ayriBireyselToplam = useMemo(
    () => bireyselAyriHarcamaToplamlar(veri.bireyselAyriHarcamalar),
    [veri.bireyselAyriHarcamalar],
  )

  const ayriGelirToplam = useMemo(
    () => bireyselGelirToplamlar(veri.bireyselGelirKalemleri),
    [veri.bireyselGelirKalemleri],
  )

  const mertGider = genel.mert + ayriBireyselToplam.mert
  const havsaGider = genel.havsa + ayriBireyselToplam.havsa
  const mertGelir = ayriGelirToplam.mert
  const havsaGelir = ayriGelirToplam.havsa
  const mertKalan = mertGelir - mertGider
  const havsaKalan = havsaGelir - havsaGider

  const evGideriToplami = useMemo(() => ayToplamGirisGideri(veri), [veri])
  const evGelirToplami = useMemo(() => ayToplamGelir(veri), [veri])
  const evKalan = evGelirToplami - evGideriToplami

  const kayitToplamlari = useMemo(
    () =>
      toplumaDahilKartlar(veri.krediKartlari).reduce((s, k) => s + Math.max(0, k.toplamEkstre), 0),
    [veri.krediKartlari],
  )

  const ayriBireyselHarcamalarToplami = useMemo(
    () => veri.bireyselAyriHarcamalar.reduce((s, h) => s + Math.max(0, h.tutar), 0),
    [veri.bireyselAyriHarcamalar],
  )

  useEffect(() => {
    const len = veri.bireyselAyriHarcamalar.length
    if (oncekiAyriBireyselSayisi.current > 0 && len === 0) {
      setAyriBireyselBolgeAcik(false)
    }
    oncekiAyriBireyselSayisi.current = len
  }, [veri.bireyselAyriHarcamalar.length])

  useEffect(() => {
    const len = veri.bireyselGelirKalemleri.length
    if (oncekiAyriGelirSayisi.current > 0 && len === 0) {
      setAyriGelirBolgeAcik(false)
    }
    oncekiAyriGelirSayisi.current = len
  }, [veri.bireyselGelirKalemleri.length])

  const herhangiAsim = useMemo(
    () => toplumaDahilKartlar(veri.krediKartlari).some((k) => tekKartHesabi(k).asim),
    [veri.krediKartlari],
  )

  function kartGuncelle(id: string, guncel: Partial<KrediKartiEkstresi>) {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === id ? { ...k, ...guncel } : k,
      ),
    }))
  }

  function kartSil(id: string) {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.filter((k) => k.id !== id),
    }))
  }

  function kartEkle() {
    setVeri((v) => ({
      ...v,
      krediKartlari: [...v.krediKartlari, yeniKart()],
    }))
  }

  function bireyselEkle(kartId: string, kalem: Omit<BireyselEkstreKalemi, 'id'>) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b-' + Date.now()
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: [
                ...k.bireyselKalemler,
                { ...kalem, id },
              ],
            }
          : k,
      ),
    }))
  }

  function bireyselGuncelle(
    kartId: string,
    kalemId: string,
    guncel: Omit<BireyselEkstreKalemi, 'id'>,
  ) {
    setVeri((v) => ({
      ...v,
      krediKartlari: v.krediKartlari.map((k) =>
        k.id === kartId
          ? {
              ...k,
              bireyselKalemler: k.bireyselKalemler.map((x) =>
                x.id === kalemId ? { ...x, ...guncel } : x,
              ),
            }
          : k,
      ),
    }))
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
          : k,
      ),
    }))
  }

  function ayriBireyselHarcamaFormGonder(e: React.FormEvent) {
    e.preventDefault()
    const tutar = Number(ayriBireyselTutarStr.replace(',', '.'))
    if (!Number.isFinite(tutar) || tutar <= 0) return
    if (duzenlenenAyriHarcamaId) {
      setVeri((v) => ({
        ...v,
        bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.map((h) =>
          h.id === duzenlenenAyriHarcamaId
            ? {
                ...h,
                kullaniciId: ayriBireyselKisi,
                aciklama: ayriBireyselAciklama.trim() || 'Bireysel harcama',
                tutar,
              }
            : h,
        ),
      }))
      setDuzenlenenAyriHarcamaId(null)
    } else {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'h-' + Date.now()
      const yeni: BireyselAyriHarcama = {
        id,
        kullaniciId: ayriBireyselKisi,
        aciklama: ayriBireyselAciklama.trim() || 'Bireysel harcama',
        tutar,
      }
      setVeri((v) => ({
        ...v,
        bireyselAyriHarcamalar: [...v.bireyselAyriHarcamalar, yeni],
      }))
    }
    setAyriBireyselAciklama('')
    setAyriBireyselTutarStr('')
  }

  function ayriBireyselHarcamaDuzenle(h: BireyselAyriHarcama) {
    setDuzenlenenAyriHarcamaId(h.id)
    setDuzenlenenGelirId(null)
    setAyriBireyselKisi(h.kullaniciId)
    setAyriBireyselAciklama(h.aciklama)
    setAyriBireyselTutarStr(tutarMetniInputIcin(h.tutar))
  }

  function ayriBireyselDuzenleIptal() {
    setDuzenlenenAyriHarcamaId(null)
    setAyriBireyselAciklama('')
    setAyriBireyselTutarStr('')
  }

  function ayriBireyselHarcamaSil(id: string) {
    setDuzenlenenAyriHarcamaId((d) => {
      if (d === id) {
        setAyriBireyselAciklama('')
        setAyriBireyselTutarStr('')
        return null
      }
      return d
    })
    setVeri((v) => ({
      ...v,
      bireyselAyriHarcamalar: v.bireyselAyriHarcamalar.filter((h) => h.id !== id),
    }))
  }

  function ayriGelirFormGonder(e: React.FormEvent) {
    e.preventDefault()
    const tutar = Number(ayriGelirTutarStr.replace(',', '.'))
    if (!Number.isFinite(tutar) || tutar <= 0) return
    if (duzenlenenGelirId) {
      setVeri((v) => ({
        ...v,
        bireyselGelirKalemleri: v.bireyselGelirKalemleri.map((g) =>
          g.id === duzenlenenGelirId
            ? {
                ...g,
                kullaniciId: ayriGelirKisi,
                aciklama: ayriGelirAciklama.trim() || 'Gelir',
                tutar,
              }
            : g,
        ),
      }))
      setDuzenlenenGelirId(null)
    } else {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'g-' + Date.now()
      const yeni: BireyselGelirKalemi = {
        id,
        kullaniciId: ayriGelirKisi,
        aciklama: ayriGelirAciklama.trim() || 'Gelir',
        tutar,
      }
      setVeri((v) => ({
        ...v,
        bireyselGelirKalemleri: [...v.bireyselGelirKalemleri, yeni],
      }))
    }
    setAyriGelirAciklama('')
    setAyriGelirTutarStr('')
  }

  function ayriGelirDuzenle(g: BireyselGelirKalemi) {
    setDuzenlenenGelirId(g.id)
    setDuzenlenenAyriHarcamaId(null)
    setAyriGelirKisi(g.kullaniciId)
    setAyriGelirAciklama(g.aciklama)
    setAyriGelirTutarStr(tutarMetniInputIcin(g.tutar))
  }

  function ayriGelirDuzenleIptal() {
    setDuzenlenenGelirId(null)
    setAyriGelirAciklama('')
    setAyriGelirTutarStr('')
  }

  function ayriGelirSil(id: string) {
    setDuzenlenenGelirId((d) => {
      if (d === id) {
        setAyriGelirAciklama('')
        setAyriGelirTutarStr('')
        return null
      }
      return d
    })
    setVeri((v) => ({
      ...v,
      bireyselGelirKalemleri: v.bireyselGelirKalemleri.filter((g) => g.id !== id),
    }))
  }

  function oncekiAyBorcunuGetir() {
    if (
      !window.confirm(
        'Önceki ayın borcu mevcut aya getirilecektir. Onaylıyor musunuz?',
      )
    ) {
      return
    }
    const oncekiAnahtar = ayKaydir(anahtar, -1)
    const onceki = ayVerisiOku(oncekiAnahtar)
    const kopya: AyHaneGiderVerisi = structuredClone(onceki)
    setVeri(kopya)
  }

  function buAySifirla() {
    if (
      !window.confirm(
        'Bu ayın tüm kayıtları silinecektir. Emin misiniz?',
      )
    ) {
      return
    }
    setVeri({ krediKartlari: [], bireyselAyriHarcamalar: [], bireyselGelirKalemleri: [] })
    setAyriBireyselBolgeAcik(false)
    setAyriGelirBolgeAcik(false)
    setAyriBireyselAciklama('')
    setAyriBireyselTutarStr('')
    setAyriGelirAciklama('')
    setAyriGelirTutarStr('')
    setDuzenlenenAyriHarcamaId(null)
    setDuzenlenenGelirId(null)
  }

  function veriyiYenidenYukle() {
    const guncel = ayVerisiOku(anahtar)
    setVeri(guncel)
    setAyriBireyselBolgeAcik(false)
    setAyriGelirBolgeAcik(false)
    setDuzenlenenAyriHarcamaId(null)
    setDuzenlenenGelirId(null)
    setAyriBireyselAciklama('')
    setAyriBireyselTutarStr('')
    setAyriGelirAciklama('')
    setAyriGelirTutarStr('')
    oncekiAyriBireyselSayisi.current = guncel.bireyselAyriHarcamalar.length
    oncekiAyriGelirSayisi.current = guncel.bireyselGelirKalemleri.length
  }

  async function disaAktar() {
    const sonuc = await yedekDosyasiDisaAktar()
    if (!sonuc.basarili) {
      window.alert(sonuc.hata)
      return
    }
    if (sonuc.yontem === 'indir') {
      window.alert(`${sonuc.aySayisi} ay verisi indirildi.`)
    }
  }

  function iceAktarDosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0]
    e.target.value = ''
    if (!dosya) return

    const okuyucu = new FileReader()
    okuyucu.onload = () => {
      try {
        const icerik = JSON.parse(String(okuyucu.result)) as unknown
        const onizleme = yedekDosyasiOnizle(icerik)
        if (!onizleme.basarili) {
          window.alert(onizleme.hata)
          return
        }
        const onay = window.confirm(
          `${onizleme.aySayisi} ay verisi içe aktarılacak. Aynı ayların mevcut kayıtları güncellenecek. Devam edilsin mi?`,
        )
        if (!onay) return

        const sonuc = yedekDosyasiniIceAktar(icerik)
        if (!sonuc.basarili) {
          window.alert(sonuc.hata)
          return
        }
        veriyiYenidenYukle()
        window.alert(`${sonuc.aySayisi} ay verisi başarıyla içe aktarıldı.`)
      } catch {
        window.alert('Dosya okunamadı. Geçerli bir JSON yedek dosyası seçin.')
      }
    }
    okuyucu.readAsText(dosya, 'utf-8')
  }

  return (
    <div className="ev-gider">
      <header className="ev-gider__ust">
        <div className="ev-gider__ust-satir">
          <h1 className="ev-gider__baslik">💰 Ev Giderleri & Bütçe</h1>
          <button type="button" className="ev-gider__btn ev-gider__btn--tehlike" onClick={buAySifirla}>
            Sıfırla
          </button>
        </div>

        <div className="ev-gider__ay-panel">
          <div className="ev-gider__ay-panel-sol">
            <button
              type="button"
              className="ev-gider__btn ev-gider__btn--ince"
              onClick={oncekiAyBorcunuGetir}
              title="Önceki ayın tüm kayıtlarını bu aya kopyalar"
            >
              Önceki borcu getir
            </button>
          </div>
          <div className="ev-gider__ay-panel-orta">
            <button
              type="button"
              className="ev-gider__btn ev-gider__btn--ikon"
              onClick={() => setAnahtar((a) => ayKaydir(a, -1))}
              aria-label="Önceki ay"
            >
              ‹
            </button>
            <span className="ev-gider__ay-etiket">{ayEtiketi(anahtar)}</span>
            <button
              type="button"
              className="ev-gider__btn ev-gider__btn--ikon"
              onClick={() => setAnahtar((a) => ayKaydir(a, 1))}
              aria-label="Sonraki ay"
            >
              ›
            </button>
          </div>
          <div className="ev-gider__ay-panel-sag">
            <button
              type="button"
              className="ev-gider__btn ev-gider__btn--birincil"
              onClick={() => setAnahtar(simdikiAyAnahtari())}
            >
              Bu ay
            </button>
          </div>
        </div>

        <div className="ev-gider__yedek-satir">
          <button type="button" className="ev-gider__btn ev-gider__btn--ince" onClick={disaAktar}>
            Dışa aktar
          </button>
          <button
            type="button"
            className="ev-gider__btn ev-gider__btn--ince"
            onClick={() => iceAktarInputRef.current?.click()}
          >
            İçe aktar
          </button>
          <input
            ref={iceAktarInputRef}
            type="file"
            accept=".json,application/json"
            className="ev-gider__yedek-dosya-gizli"
            onChange={iceAktarDosyaSecildi}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </header>

      <div className="ev-gider__ozet ev-gider__ozet--ortali">
        <div className="ev-gider__ozet-kutu">
          <div className="ev-gider__ozet-isim">Mert (bu ay özeti)</div>
          <div className="ev-gider__ozet-denge">
            <div className="ev-gider__ozet-denge-satir">
              <span>Gelir</span>
              <span>{para(mertGelir)}</span>
            </div>
            <div className="ev-gider__ozet-denge-blok">
              <div className="ev-gider__ozet-denge-satir">
                <span>Gider</span>
                <span>{para(mertGider)}</span>
              </div>
              <div className="ev-gider__ozet-kisi-detay ev-gider__ozet-kisi-detay--gider-alti">
                <div className="ev-gider__ozet-kisi-detay-satir">
                  <span>Hane</span>
                  <span>{para(genel.mert)}</span>
                </div>
                <div className="ev-gider__ozet-kisi-detay-satir">
                  <span>Bireysel</span>
                  <span>{para(ayriBireyselToplam.mert)}</span>
                </div>
              </div>
            </div>
            <div
              className={
                mertKalan < -0.005
                  ? 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan ev-gider__ozet-denge-satir--eksi'
                  : 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan'
              }
            >
              <span>Kalan</span>
              <span>{para(mertKalan)}</span>
            </div>
          </div>
        </div>
        <div className="ev-gider__ozet-kutu">
          <div className="ev-gider__ozet-isim">Havsa (bu ay özeti)</div>
          <div className="ev-gider__ozet-denge">
            <div className="ev-gider__ozet-denge-satir">
              <span>Gelir</span>
              <span>{para(havsaGelir)}</span>
            </div>
            <div className="ev-gider__ozet-denge-blok">
              <div className="ev-gider__ozet-denge-satir">
                <span>Gider</span>
                <span>{para(havsaGider)}</span>
              </div>
              <div className="ev-gider__ozet-kisi-detay ev-gider__ozet-kisi-detay--gider-alti">
                <div className="ev-gider__ozet-kisi-detay-satir">
                  <span>Hane</span>
                  <span>{para(genel.havsa)}</span>
                </div>
                <div className="ev-gider__ozet-kisi-detay-satir">
                  <span>Bireysel</span>
                  <span>{para(ayriBireyselToplam.havsa)}</span>
                </div>
              </div>
            </div>
            <div
              className={
                havsaKalan < -0.005
                  ? 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan ev-gider__ozet-denge-satir--eksi'
                  : 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan'
              }
            >
              <span>Kalan</span>
              <span>{para(havsaKalan)}</span>
            </div>
          </div>
        </div>
        <div className="ev-gider__ozet-kutu ev-gider__ozet-kutu--ev">
          <div className="ev-gider__ozet-isim ev-gider__ozet-isim--ev-tek">Ev (bu ay özeti)</div>
          <div className="ev-gider__ozet-denge">
            <div className="ev-gider__ozet-denge-satir">
              <span>Gelir</span>
              <span>{para(evGelirToplami)}</span>
            </div>
            <div className="ev-gider__ozet-denge-blok">
              <div className="ev-gider__ozet-denge-satir">
                <span>Gider</span>
                <span>{para(evGideriToplami)}</span>
              </div>
              <div className="ev-gider__ozet-kirilim ev-gider__ozet-kirilim--gider-alti">
                <div className="ev-gider__ozet-kirilim-satir">
                  <span>Ortak kayıt toplamları</span>
                  <span>{para(kayitToplamlari)}</span>
                </div>
                <div className="ev-gider__ozet-kirilim-satir">
                  <span>Bireysel</span>
                  <span>{para(ayriBireyselHarcamalarToplami)}</span>
                </div>
              </div>
            </div>
            <div
              className={
                evKalan < -0.005
                  ? 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan ev-gider__ozet-denge-satir--eksi'
                  : 'ev-gider__ozet-denge-satir ev-gider__ozet-denge-satir--kalan'
              }
            >
              <span>Kalan</span>
              <span>{para(evKalan)}</span>
            </div>
          </div>
        </div>
      </div>

      {herhangiAsim ? (
        <div className="ev-gider__uyari" role="status">
          Uyarı: Bazı kayıtlarda bireysel kalemlerin toplamı, toplam tutarı aşıyor. Kontrol edin;
          hesaplamada toplam üst sınırı baz alınır.
        </div>
      ) : null}

      <div className="ev-gider__arac-satir">
        <button type="button" className="ev-gider__btn ev-gider__btn--birincil" onClick={kartEkle}>
          + Kredi kartı / harcama ekle
        </button>
      </div>

      {veri.krediKartlari.length === 0 ? (
        <p className="ev-gider__bos">
          Bu ay için henüz kayıt yok. Yukarıdan kredi kartı veya harcama (ör. kira) ekleyebilirsiniz.
        </p>
      ) : null}

      {veri.krediKartlari.map((kart) => (
        <KartPaneli
          key={kart.id}
          kart={kart}
          onAdDegis={(ad) => kartGuncelle(kart.id, { ad })}
          onToplamDegis={(toplamEkstre) => kartGuncelle(kart.id, { toplamEkstre })}
          onToplamlardanHaricDegis={(tumGiderToplamlarindaHaric) =>
            kartGuncelle(kart.id, { tumGiderToplamlarindaHaric })
          }
          onSil={() => kartSil(kart.id)}
          onBireyselEkle={(k) => bireyselEkle(kart.id, k)}
          onBireyselGuncelle={(kalemId, k) => bireyselGuncelle(kart.id, kalemId, k)}
          onBireyselSil={(kalemId) => bireyselSil(kart.id, kalemId)}
        />
      ))}

      {!ayriBireyselBolgeAcik ? (
        <div className="ev-gider__bireysel-kapali ev-gider__bireysel-ayri-ac-wrapper">
          <button
            type="button"
            className="ev-gider__btn ev-gider__btn--birincil"
            onClick={() => setAyriBireyselBolgeAcik(true)}
          >
            Bireysel — kredi kartı / harcama
            {veri.bireyselAyriHarcamalar.length > 0
              ? ` (${veri.bireyselAyriHarcamalar.length})`
              : ''}
          </button>
        </div>
      ) : (
        <section
          className="ev-gider__bireysel-ayri-bolum ev-gider__bireysel-ayri-bolum--ortak-alti"
          aria-labelledby="bireysel-ayri-baslik"
        >
          <h2 className="ev-gider__bireysel-ayri-baslik" id="bireysel-ayri-baslik">
            Bireysel — kredi kartı / harcama
          </h2>

          {veri.bireyselAyriHarcamalar.length === 0 ? (
            <p className="ev-gider__bos">Henüz bireysel harcama yok.</p>
          ) : (
            <table className="ev-gider__tablo">
              <thead>
                <tr>
                  <th>Kişi</th>
                  <th>Açıklama</th>
                  <th>Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {veri.bireyselAyriHarcamalar.map((h) => (
                  <tr key={h.id}>
                    <td>{KULLANICI_ETIKET[h.kullaniciId]}</td>
                    <td>{h.aciklama}</td>
                    <td>{para(h.tutar)}</td>
                    <td>
                      <div className="ev-gider__tablo-eylem">
                        <button
                          type="button"
                          className="ev-gider__btn ev-gider__btn--kalem"
                          onClick={() => ayriBireyselHarcamaDuzenle(h)}
                          aria-label="Harcamayı düzenle"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="ev-gider__btn"
                          onClick={() => ayriBireyselHarcamaSil(h.id)}
                          aria-label="Harcamayı sil"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form className="ev-gider__form-satir" onSubmit={ayriBireyselHarcamaFormGonder}>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-bireysel-kisi">Kişi</label>
              <select
                id="ayri-bireysel-kisi"
                value={ayriBireyselKisi}
                onChange={(e) => setAyriBireyselKisi(e.target.value as KullaniciId)}
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>
            </div>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-bireysel-ack">Açıklama</label>
              <input
                id="ayri-bireysel-ack"
                value={ayriBireyselAciklama}
                onChange={(e) => setAyriBireyselAciklama(e.target.value)}
                placeholder="Örn. Kişisel kart harcaması"
                autoComplete="off"
              />
            </div>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-bireysel-tutar">Tutar (₺)</label>
              <input
                id="ayri-bireysel-tutar"
                type="text"
                inputMode="decimal"
                value={ayriBireyselTutarStr}
                onChange={(e) => setAyriBireyselTutarStr(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="ev-gider__form-eylem-grup">
              <button type="submit" className="ev-gider__btn ev-gider__btn--birincil">
                {duzenlenenAyriHarcamaId ? 'Güncelle' : 'Harcamayı ekle'}
              </button>
              {duzenlenenAyriHarcamaId ? (
                <button
                  type="button"
                  className="ev-gider__btn"
                  onClick={ayriBireyselDuzenleIptal}
                >
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>

          <div className="ev-gider__bireysel-gizle">
            <button
              type="button"
              className="ev-gider__btn"
              onClick={() => {
                ayriBireyselDuzenleIptal()
                setAyriBireyselBolgeAcik(false)
              }}
            >
              Gizle
            </button>
          </div>
        </section>
      )}

      {!ayriGelirBolgeAcik ? (
        <div className="ev-gider__bireysel-kapali ev-gider__gelir-ac-wrapper">
          <button
            type="button"
            className="ev-gider__btn ev-gider__btn--birincil"
            onClick={() => setAyriGelirBolgeAcik(true)}
          >
            Bireysel gelir kalemleri
            {veri.bireyselGelirKalemleri.length > 0
              ? ` (${veri.bireyselGelirKalemleri.length})`
              : ''}
          </button>
        </div>
      ) : (
        <section
          className="ev-gider__bireysel-ayri-bolum ev-gider__gelir-bolum"
          aria-labelledby="bireysel-gelir-baslik"
        >
          <h2 className="ev-gider__bireysel-ayri-baslik" id="bireysel-gelir-baslik">
            Bireysel gelir kalemleri
          </h2>

          {veri.bireyselGelirKalemleri.length === 0 ? (
            <p className="ev-gider__bos">Henüz gelir kalemi yok.</p>
          ) : (
            <table className="ev-gider__tablo">
              <thead>
                <tr>
                  <th>Kişi</th>
                  <th>Açıklama</th>
                  <th>Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {veri.bireyselGelirKalemleri.map((g) => (
                  <tr key={g.id}>
                    <td>{KULLANICI_ETIKET[g.kullaniciId]}</td>
                    <td>{g.aciklama}</td>
                    <td>{para(g.tutar)}</td>
                    <td>
                      <div className="ev-gider__tablo-eylem">
                        <button
                          type="button"
                          className="ev-gider__btn ev-gider__btn--kalem"
                          onClick={() => ayriGelirDuzenle(g)}
                          aria-label="Geliri düzenle"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="ev-gider__btn"
                          onClick={() => ayriGelirSil(g.id)}
                          aria-label="Geliri sil"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form className="ev-gider__form-satir" onSubmit={ayriGelirFormGonder}>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-gelir-kisi">Kişi</label>
              <select
                id="ayri-gelir-kisi"
                value={ayriGelirKisi}
                onChange={(e) => setAyriGelirKisi(e.target.value as KullaniciId)}
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>
            </div>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-gelir-ack">Açıklama</label>
              <input
                id="ayri-gelir-ack"
                value={ayriGelirAciklama}
                onChange={(e) => setAyriGelirAciklama(e.target.value)}
                placeholder="Örn. Maaş, ikramiye"
                autoComplete="off"
              />
            </div>
            <div className="ev-gider__alan">
              <label htmlFor="ayri-gelir-tutar">Tutar (₺)</label>
              <input
                id="ayri-gelir-tutar"
                type="text"
                inputMode="decimal"
                value={ayriGelirTutarStr}
                onChange={(e) => setAyriGelirTutarStr(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="ev-gider__form-eylem-grup">
              <button type="submit" className="ev-gider__btn ev-gider__btn--birincil">
                {duzenlenenGelirId ? 'Güncelle' : 'Geliri ekle'}
              </button>
              {duzenlenenGelirId ? (
                <button type="button" className="ev-gider__btn" onClick={ayriGelirDuzenleIptal}>
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>

          <div className="ev-gider__bireysel-gizle">
            <button
              type="button"
              className="ev-gider__btn"
              onClick={() => {
                ayriGelirDuzenleIptal()
                setAyriGelirBolgeAcik(false)
              }}
            >
              Gizle
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function KartPaneli({
  kart,
  onAdDegis,
  onToplamDegis,
  onToplamlardanHaricDegis,
  onSil,
  onBireyselEkle,
  onBireyselGuncelle,
  onBireyselSil,
}: {
  kart: KrediKartiEkstresi
  onAdDegis: (ad: string) => void
  onToplamDegis: (t: number) => void
  onToplamlardanHaricDegis: (haric: boolean) => void
  onSil: () => void
  onBireyselEkle: (k: Omit<BireyselEkstreKalemi, 'id'>) => void
  onBireyselGuncelle: (kalemId: string, k: Omit<BireyselEkstreKalemi, 'id'>) => void
  onBireyselSil: (kalemId: string) => void
}) {
  const h = tekKartHesabi(kart)
  const [aciklama, setAciklama] = useState('')
  const [tutarStr, setTutarStr] = useState('')
  const [kullanici, setKullanici] = useState<KullaniciId>('mert')
  const [bireyselBolgeAcik, setBireyselBolgeAcik] = useState(false)
  const [duzenlenenKalemId, setDuzenlenenKalemId] = useState<string | null>(null)
  const oncekiKalemSayisi = useRef(0)

  function kalemFormunuTemizle() {
    setDuzenlenenKalemId(null)
    setAciklama('')
    setTutarStr('')
  }

  function kalemDuzenle(bk: BireyselEkstreKalemi) {
    setDuzenlenenKalemId(bk.id)
    setKullanici(bk.kullaniciId)
    setAciklama(bk.aciklama)
    setTutarStr(tutarMetniInputIcin(bk.tutar))
  }

  function kalemSil(kalemId: string) {
    if (duzenlenenKalemId === kalemId) {
      kalemFormunuTemizle()
    }
    onBireyselSil(kalemId)
  }

  useEffect(() => {
    const len = kart.bireyselKalemler.length
    if (oncekiKalemSayisi.current > 0 && len === 0) {
      setBireyselBolgeAcik(false)
    }
    oncekiKalemSayisi.current = len
  }, [kart.bireyselKalemler.length])

  function kalemiKaydet(e: React.FormEvent) {
    e.preventDefault()
    const tutar = Number(tutarStr.replace(',', '.'))
    if (!Number.isFinite(tutar) || tutar <= 0) return
    const kalem = {
      kullaniciId: kullanici,
      aciklama: aciklama.trim() || 'Bireysel kalem',
      tutar,
    }
    if (duzenlenenKalemId) {
      onBireyselGuncelle(duzenlenenKalemId, kalem)
    } else {
      onBireyselEkle(kalem)
    }
    kalemFormunuTemizle()
  }

  return (
    <section
      className={
        kart.tumGiderToplamlarindaHaric
          ? 'ev-gider__kart ev-gider__kart--toplamlar-disinda'
          : 'ev-gider__kart'
      }
      aria-labelledby={bireyselBolgeAcik ? `kart-baslik-${kart.id}` : undefined}
    >
      <div className="ev-gider__kart-ust">
        <div className="ev-gider__alan" style={{ flex: '2 1 200px' }}>
          <label htmlFor={`ad-${kart.id}`}>Kayıt adı</label>
          <input
            id={`ad-${kart.id}`}
            value={kart.ad}
            onChange={(e) => onAdDegis(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="ev-gider__alan" style={{ flex: '1 1 140px' }}>
          <label htmlFor={`toplam-${kart.id}`}>Toplam</label>
          <input
            id={`toplam-${kart.id}`}
            type="number"
            min={0}
            step={0.01}
            value={kart.toplamEkstre || ''}
            onChange={(e) => onToplamDegis(Number(e.target.value))}
          />
        </div>
        <button type="button" className="ev-gider__btn ev-gider__btn--tehlike" onClick={onSil}>
          Kaydı sil
        </button>
      </div>

      <div className="ev-gider__kart-haric-satir">
        <label className="ev-gider__kart-haric-etiket" htmlFor={`haric-${kart.id}`}>
          <input
            id={`haric-${kart.id}`}
            type="checkbox"
            checked={Boolean(kart.tumGiderToplamlarindaHaric)}
            onChange={(e) => onToplamlardanHaricDegis(e.target.checked)}
          />
          <span>Tüm giderlere dahil etme</span>
        </label>
      </div>

      {!bireyselBolgeAcik ? (
        <div className="ev-gider__bireysel-kapali">
          <button
            type="button"
            className="ev-gider__btn ev-gider__btn--birincil"
            onClick={() => setBireyselBolgeAcik(true)}
          >
            Bireysel ekstre kalemleri
            {kart.bireyselKalemler.length > 0
              ? ` (${kart.bireyselKalemler.length})`
              : ''}
          </button>
        </div>
      ) : (
        <>
          <h2 className="ev-gider__baslik ev-gider__bireysel-baslik" id={`kart-baslik-${kart.id}`}>
            Bireysel ekstre kalemleri
          </h2>

          {kart.bireyselKalemler.length === 0 ? (
            <p className="ev-gider__bos">Henüz bireysel kalem yok.</p>
          ) : (
            <table className="ev-gider__tablo">
              <thead>
                <tr>
                  <th>Kişi</th>
                  <th>Açıklama</th>
                  <th>Tutar</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {kart.bireyselKalemler.map((bk) => (
                  <tr key={bk.id}>
                    <td>{KULLANICI_ETIKET[bk.kullaniciId]}</td>
                    <td>{bk.aciklama}</td>
                    <td>{para(bk.tutar)}</td>
                    <td>
                      <div className="ev-gider__tablo-eylem">
                        <button
                          type="button"
                          className="ev-gider__btn ev-gider__btn--kalem"
                          onClick={() => kalemDuzenle(bk)}
                          aria-label="Kalemi düzenle"
                          title="Düzenle"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="ev-gider__btn"
                          onClick={() => kalemSil(bk.id)}
                          aria-label="Kalemi sil"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form className="ev-gider__form-satir" onSubmit={kalemiKaydet}>
            <div className="ev-gider__alan">
              <label htmlFor={`kis-${kart.id}`}>Kişi</label>
              <select
                id={`kis-${kart.id}`}
                value={kullanici}
                onChange={(e) => setKullanici(e.target.value as KullaniciId)}
              >
                <option value="mert">Mert</option>
                <option value="havsa">Havsa</option>
              </select>
            </div>
            <div className="ev-gider__alan">
              <label htmlFor={`ack-${kart.id}`}>Açıklama</label>
              <input
                id={`ack-${kart.id}`}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Örn. Kişisel alışveriş"
                autoComplete="off"
              />
            </div>
            <div className="ev-gider__alan">
              <label htmlFor={`tut-${kart.id}`}>Tutar (₺)</label>
              <input
                id={`tut-${kart.id}`}
                type="text"
                inputMode="decimal"
                value={tutarStr}
                onChange={(e) => setTutarStr(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="ev-gider__form-eylem-grup">
              <button type="submit" className="ev-gider__btn ev-gider__btn--birincil">
                {duzenlenenKalemId ? 'Güncelle' : 'Kalemi ekle'}
              </button>
              {duzenlenenKalemId ? (
                <button type="button" className="ev-gider__btn" onClick={kalemFormunuTemizle}>
                  Vazgeç
                </button>
              ) : null}
            </div>
          </form>

          <div className="ev-gider__bireysel-gizle">
            <button
              type="button"
              className="ev-gider__btn"
              onClick={() => {
                kalemFormunuTemizle()
                setBireyselBolgeAcik(false)
              }}
            >
              Gizle
            </button>
          </div>
        </>
      )}

      <div className="ev-gider__alt-ozet">
        <span>
          Ortak paya taban: <strong>{para(h.ortakTaban)}</strong> (her birine yarısı:{' '}
          <strong>{para(h.ortakTaban / 2)}</strong>)
        </span>
        <span>
          Bu kayıt — Mert: <strong>{para(h.mertToplam)}</strong>, Havsa:{' '}
          <strong>{para(h.havsaToplam)}</strong>
        </span>
      </div>
    </section>
  )
}
