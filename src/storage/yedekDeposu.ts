import type { AyHaneGiderVerisi } from '../domain/haneGiderTypes'
import {
  AY_STORAGE_ON_EK,
  ayVerisiNesnedenParse,
  ayVerisiYaz,
  kayitliAyAnahtarlariniListele,
} from './ayDeposu'

const YEDEK_SURUM = 1

export interface HaneGiderYedekDosyasi {
  surum: typeof YEDEK_SURUM
  disaAktarmaTarihi: string
  aylar: Record<string, AyHaneGiderVerisi>
}

export type YedekIceAktarSonuc =
  | { basarili: true; aySayisi: number }
  | { basarili: false; hata: string }

export type YedekDisaAktarSonuc =
  | { basarili: true; aySayisi: number; yontem: 'indir' | 'paylas' }
  | { basarili: false; hata: string; aySayisi: number }

function ayAnahtariGecerliMi(anahtar: string): boolean {
  return /^\d{4}-\d{2}$/.test(anahtar)
}

/** Tüm kayıtlı ay verilerini yedek dosyası biçiminde döndürür */
export function tumAylariDisaAktar(): HaneGiderYedekDosyasi {
  const aylar: Record<string, AyHaneGiderVerisi> = {}
  for (const anahtar of kayitliAyAnahtarlariniListele()) {
    const ham = localStorage.getItem(AY_STORAGE_ON_EK + anahtar)
    if (!ham) continue
    try {
      const veri = ayVerisiNesnedenParse(JSON.parse(ham) as unknown)
      if (veri) aylar[anahtar] = veri
    } catch {
      /* geçersiz ay atlanır */
    }
  }
  return {
    surum: YEDEK_SURUM,
    disaAktarmaTarihi: new Date().toISOString(),
    aylar,
  }
}

function yedektenAylariAyikla(dosya: unknown): Record<string, AyHaneGiderVerisi> | null {
  if (!dosya || typeof dosya !== 'object') return null

  const o = dosya as Record<string, unknown>

  if (o.aylar && typeof o.aylar === 'object' && !Array.isArray(o.aylar)) {
    const aylar: Record<string, AyHaneGiderVerisi> = {}
    for (const [anahtar, ham] of Object.entries(o.aylar as Record<string, unknown>)) {
      if (!ayAnahtariGecerliMi(anahtar)) continue
      const veri = ayVerisiNesnedenParse(ham)
      if (veri) aylar[anahtar] = veri
    }
    return Object.keys(aylar).length > 0 ? aylar : null
  }

  const duz: Record<string, AyHaneGiderVerisi> = {}
  for (const [tamAnahtar, ham] of Object.entries(o)) {
    if (!tamAnahtar.startsWith(AY_STORAGE_ON_EK)) continue
    const anahtar = tamAnahtar.slice(AY_STORAGE_ON_EK.length)
    if (!ayAnahtariGecerliMi(anahtar)) continue
    let nesne: unknown = ham
    if (typeof ham === 'string') {
      try {
        nesne = JSON.parse(ham)
      } catch {
        continue
      }
    }
    const veri = ayVerisiNesnedenParse(nesne)
    if (veri) duz[anahtar] = veri
  }
  return Object.keys(duz).length > 0 ? duz : null
}

/** Yedek dosyasını doğrular; içe aktarılacak ay sayısını döndürür */
export function yedekDosyasiOnizle(dosya: unknown): YedekIceAktarSonuc {
  const aylar = yedektenAylariAyikla(dosya)
  if (!aylar) {
    return { basarili: false, hata: 'Geçersiz yedek dosyası. Ay verisi bulunamadı.' }
  }
  return { basarili: true, aySayisi: Object.keys(aylar).length }
}

/** Yedek dosyasındaki ayları localStorage'a yazar (aynı ay varsa üzerine yazar) */
export function yedekDosyasiniIceAktar(dosya: unknown): YedekIceAktarSonuc {
  const aylar = yedektenAylariAyikla(dosya)
  if (!aylar) {
    return { basarili: false, hata: 'Geçersiz yedek dosyası. Ay verisi bulunamadı.' }
  }
  for (const [anahtar, veri] of Object.entries(aylar)) {
    ayVerisiYaz(anahtar, veri)
  }
  return { basarili: true, aySayisi: Object.keys(aylar).length }
}

function yedekDosyaAdi(): string {
  const tarih = new Date().toISOString().slice(0, 10)
  return `hane-gider-yedek-${tarih}.json`
}

function webIndir(json: string, dosyaAdi: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const baglanti = document.createElement('a')
  baglanti.href = url
  baglanti.download = dosyaAdi
  baglanti.click()
  URL.revokeObjectURL(url)
}

/** Yedek JSON dosyasını dışa aktarır */
export async function yedekDosyasiDisaAktar(): Promise<YedekDisaAktarSonuc> {
  const yedek = tumAylariDisaAktar()
  const aySayisi = Object.keys(yedek.aylar).length
  if (aySayisi === 0) {
    return { basarili: false, hata: 'Dışa aktarılacak ay verisi yok.', aySayisi: 0 }
  }

  const json = JSON.stringify(yedek, null, 2)
  const dosyaAdi = yedekDosyaAdi()

  try {
    webIndir(json, dosyaAdi)
    return { basarili: true, aySayisi, yontem: 'indir' }
  } catch (err) {
    const mesaj = err instanceof Error ? err.message : String(err)
    return { basarili: false, hata: `Dışa aktarma başarısız: ${mesaj}`, aySayisi }
  }
}
