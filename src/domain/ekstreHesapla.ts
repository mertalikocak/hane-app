import type {
  AyHaneGiderVerisi,
  BireyselAyriHarcama,
  BireyselEkstreKalemi,
  BireyselGelirKalemi,
  HaneTransferi,
  KrediKartiEkstresi,
  KullaniciId,
} from './haneGiderTypes'

/** Üst özet ve ev toplamına dahil edilecek ortak kayıtlar */
export function toplumaDahilKartlar(kartlar: KrediKartiEkstresi[]): KrediKartiEkstresi[] {
  return kartlar.filter((k) => !k.tumGiderToplamlarindaHaric)
}

function bireyselToplam(
  kalemler: BireyselEkstreKalemi[],
  kullaniciId: KullaniciId,
): number {
  return kalemler
    .filter((k) => k.kullaniciId === kullaniciId)
    .reduce((t, k) => t + Math.max(0, k.tutar), 0)
}

/** Bir kart için ortak pay ve kişi başı net borç */
export function tekKartHesabi(kart: KrediKartiEkstresi) {
  const toplam = Math.max(0, kart.toplamEkstre)
  const mertBireysel = bireyselToplam(kart.bireyselKalemler, 'mert')
  const havsaBireysel = bireyselToplam(kart.bireyselKalemler, 'havsa')
  const bireyselToplami = mertBireysel + havsaBireysel
  const ortakTaban = Math.max(0, toplam - bireyselToplami)
  const asim = bireyselToplami > toplam + 0.0001

  return {
    toplam,
    mertBireysel,
    havsaBireysel,
    ortakTaban,
    mertToplam: mertBireysel + ortakTaban / 2,
    havsaToplam: havsaBireysel + ortakTaban / 2,
    asim,
  }
}

export function ayGenelToplamlar(kartlar: KrediKartiEkstresi[]) {
  return toplumaDahilKartlar(kartlar).reduce(
    (acc, kart) => {
      const h = tekKartHesabi(kart)
      return {
        mert: acc.mert + h.mertToplam,
        havsa: acc.havsa + h.havsaToplam,
      }
    },
    { mert: 0, havsa: 0 },
  )
}

/** Ortak kayıtta yalnızca yarı yarıya bölünen tutar (ekstre içi bireysel kalemler düşüldükten sonra kalanın yarısı) */
export function ayHaneOrtakPayi(kartlar: KrediKartiEkstresi[]) {
  return toplumaDahilKartlar(kartlar).reduce(
    (acc, kart) => {
      const h = tekKartHesabi(kart)
      return {
        mert: acc.mert + h.ortakTaban / 2,
        havsa: acc.havsa + h.ortakTaban / 2,
      }
    },
    { mert: 0, havsa: 0 },
  )
}

/** Ortak kayıt ekstrelerindeki bireysel satırların kişi bazlı toplamı */
export function ayEkstreIciBireyselToplamlar(kartlar: KrediKartiEkstresi[]) {
  return toplumaDahilKartlar(kartlar).reduce(
    (acc, kart) => {
      const h = tekKartHesabi(kart)
      return {
        mert: acc.mert + h.mertBireysel,
        havsa: acc.havsa + h.havsaBireysel,
      }
    },
    { mert: 0, havsa: 0 },
  )
}

function kisiBazliPozitifTutarToplamlar(
  liste: { kullaniciId: KullaniciId; tutar: number }[],
): { mert: number; havsa: number } {
  return liste.reduce(
    (acc, h) => {
      const t = Math.max(0, h.tutar)
      if (h.kullaniciId === 'mert') return { mert: acc.mert + t, havsa: acc.havsa }
      return { mert: acc.mert, havsa: acc.havsa + t }
    },
    { mert: 0, havsa: 0 },
  )
}

/** Ortak kayıt dışı bireysel harcamaların kişi bazlı toplamı */
export function bireyselAyriHarcamaToplamlar(liste: BireyselAyriHarcama[]) {
  return kisiBazliPozitifTutarToplamlar(liste)
}

/** Bireysel gelir kalemlerinin kişi bazlı toplamı */
export function bireyselGelirToplamlar(liste: BireyselGelirKalemi[]) {
  return kisiBazliPozitifTutarToplamlar(liste ?? [])
}

/** Bu ayki tüm bireysel gelir tutarı */
export function ayToplamGelir(veri: AyHaneGiderVerisi): number {
  const liste = veri.bireyselGelirKalemleri ?? []
  return liste.reduce((s, g) => s + Math.max(0, g.tutar), 0)
}

/** Bu ay girilen kayıt toplamları + ayrı bireysel harcamalar (hane gideri giriş toplamı) */
export function ayToplamGirisGideri(veri: AyHaneGiderVerisi): number {
  const kartTop = toplumaDahilKartlar(veri.krediKartlari).reduce(
    (s, k) => s + Math.max(0, k.toplamEkstre),
    0,
  )
  const ayriTop = veri.bireyselAyriHarcamalar.reduce((s, h) => s + Math.max(0, h.tutar), 0)
  return kartTop + ayriTop
}

export interface MahsuplasmaSonucu {
  mertOdedi: number
  havsaOdedi: number
  mertPayinaDusen: number
  havsaPayinaDusen: number
  hamTransferTutari: number
  hamBorcluKisi: 'mert' | 'havsa' | 'esit'
  borcluKisi: 'mert' | 'havsa' | 'esit'
  alacakliKisi: 'mert' | 'havsa' | 'esit'
  transferTutari: number
  toplamTransferEdilen: number
  toplamHavsaToMert: number
  toplamMertToHavsa: number
  durumMetni: string
  tamamlandiMi: boolean
}

/**
 * Ay sonunda kimin kartından/cebinden ne kadar çıktığını, payına düşenle farkını ve
 * yapılan transferleri hesaplayarak güncel net mahsuplaşma sonucunu döner.
 */
export function ayMahsuplasmaHesapla(
  kartlar: KrediKartiEkstresi[],
  transferler: HaneTransferi[] = []
): MahsuplasmaSonucu {
  const dahilKartlar = toplumaDahilKartlar(kartlar)

  let mertOdedi = 0
  let havsaOdedi = 0
  let mertPayinaDusen = 0
  let havsaPayinaDusen = 0

  for (const kart of dahilKartlar) {
    const h = tekKartHesabi(kart)
    mertPayinaDusen += h.mertToplam
    havsaPayinaDusen += h.havsaToplam

    const odeyen = kart.odenenKisi ?? (
      kart.ad.toLowerCase().includes('havsa')
        ? 'havsa'
        : kart.ad.toLowerCase().includes('mert')
        ? 'mert'
        : 'mert'
    )

    if (odeyen === 'mert') {
      mertOdedi += h.toplam
    } else if (odeyen === 'havsa') {
      havsaOdedi += h.toplam
    }
  }

  const mertNet = mertOdedi - mertPayinaDusen
  const hamTransferTutari = Math.round(Math.abs(mertNet) * 100) / 100
  const hamBorcluKisi: 'mert' | 'havsa' | 'esit' =
    hamTransferTutari < 0.5 ? 'esit' : (mertNet > 0 ? 'havsa' : 'mert')

  // Yapılan transferlerin hesaplanması:
  // Havsa Mert'e transfer yaparsa Havsa'nın borcu azalır (Mert'in net alacağı -tutar).
  // Mert Havsa'ya transfer yaparsa Mert'in borcu azalır (Mert'in net alacağı +tutar).
  let toplamHavsaToMert = 0
  let toplamMertToHavsa = 0

  for (const t of transferler) {
    const tutar = Math.max(0, t.tutar)
    if (t.gonderen === 'havsa' && t.alan === 'mert') {
      toplamHavsaToMert += tutar
    } else if (t.gonderen === 'mert' && t.alan === 'havsa') {
      toplamMertToHavsa += tutar
    }
  }

  const toplamTransferEdilen = toplamHavsaToMert + toplamMertToHavsa
  const kalanMertNet = mertNet - toplamHavsaToMert + toplamMertToHavsa
  const kalanTransferTutari = Math.round(Math.abs(kalanMertNet) * 100) / 100

  const paraStr = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)

  // Durum değerlendirmesi
  if (kalanTransferTutari < 0.5) {
    const durumMetni =
      hamTransferTutari >= 0.5 && toplamTransferEdilen >= 0.5
        ? `Hesaplar Tam Kapandı! 🎉 (${paraStr(toplamTransferEdilen)} ödendi)`
        : 'Hesaplar tam dengede! Kimsenin birbirine borcu bulunmuyor.'

    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      hamTransferTutari,
      hamBorcluKisi,
      borcluKisi: 'esit',
      alacakliKisi: 'esit',
      transferTutari: 0,
      toplamTransferEdilen,
      toplamHavsaToMert,
      toplamMertToHavsa,
      durumMetni,
      tamamlandiMi: true,
    }
  }

  if (kalanMertNet > 0) {
    const ekNot = toplamTransferEdilen > 0 ? ` (${paraStr(toplamTransferEdilen)} ödendi)` : ''
    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      hamTransferTutari,
      hamBorcluKisi,
      borcluKisi: 'havsa',
      alacakliKisi: 'mert',
      transferTutari: kalanTransferTutari,
      toplamTransferEdilen,
      toplamHavsaToMert,
      toplamMertToHavsa,
      durumMetni: `Havsa ➔ Mert'e ${paraStr(kalanTransferTutari)} gönderecek${ekNot}`,
      tamamlandiMi: false,
    }
  } else {
    const ekNot = toplamTransferEdilen > 0 ? ` (${paraStr(toplamTransferEdilen)} ödendi)` : ''
    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      hamTransferTutari,
      hamBorcluKisi,
      borcluKisi: 'mert',
      alacakliKisi: 'havsa',
      transferTutari: kalanTransferTutari,
      toplamTransferEdilen,
      toplamHavsaToMert,
      toplamMertToHavsa,
      durumMetni: `Mert ➔ Havsa'ya ${paraStr(kalanTransferTutari)} gönderecek${ekNot}`,
      tamamlandiMi: false,
    }
  }
}


