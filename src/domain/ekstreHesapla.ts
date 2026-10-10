import type {
  AyHaneGiderVerisi,
  BireyselAyriHarcama,
  BireyselEkstreKalemi,
  BireyselGelirKalemi,
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
  borcluKisi: 'mert' | 'havsa' | 'esit'
  alacakliKisi: 'mert' | 'havsa' | 'esit'
  transferTutari: number
  durumMetni: string
}

/**
 * Ay sonunda kimin kartından/cebinden ne kadar çıktığını ve payına düşenle farkını
 * hesaplayarak net mahsuplaşma (kim kime ne kadar gönderecek) sonucunu döner.
 */
export function ayMahsuplasmaHesapla(kartlar: KrediKartiEkstresi[]): MahsuplasmaSonucu {
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
  const transferTutari = Math.round(Math.abs(mertNet) * 100) / 100

  const paraStr = (val: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)

  if (transferTutari < 0.5) {
    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      borcluKisi: 'esit',
      alacakliKisi: 'esit',
      transferTutari: 0,
      durumMetni: 'Hesaplar tam dengede! Kimsenin birbirine borcu bulunmuyor.',
    }
  }

  if (mertNet > 0) {
    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      borcluKisi: 'havsa',
      alacakliKisi: 'mert',
      transferTutari,
      durumMetni: `Havsa ➔ Mert'e ${paraStr(transferTutari)} gönderecek`,
    }
  } else {
    return {
      mertOdedi,
      havsaOdedi,
      mertPayinaDusen,
      havsaPayinaDusen,
      borcluKisi: 'mert',
      alacakliKisi: 'havsa',
      transferTutari,
      durumMetni: `Mert ➔ Havsa'ya ${paraStr(transferTutari)} gönderecek`,
    }
  }
}

