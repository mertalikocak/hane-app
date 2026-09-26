import type { AyHaneGiderVerisi, BireyselAyriHarcama, BireyselGelirKalemi } from '../domain/haneGiderTypes'

export const AY_STORAGE_ON_EK = 'hane-gider-ay:'

const ON_EK = AY_STORAGE_ON_EK

export function ayAnahtariOlustur(yil: number, ay: number): string {
  const a = String(ay + 1).padStart(2, '0')
  return `${yil}-${a}`
}

export function ayAnahtariParcala(anahtar: string): { yil: number; ay: number } {
  const [ys, ms] = anahtar.split('-')
  const yil = Number(ys)
  const ayBirKati = Number(ms)
  if (!Number.isFinite(yil) || !Number.isFinite(ayBirKati)) {
    const d = new Date()
    return { yil: d.getFullYear(), ay: d.getMonth() }
  }
  const ayIndex = Math.min(11, Math.max(0, ayBirKati - 1))
  return { yil, ay: ayIndex }
}

function ayriHarcamaListesiOku(o: Record<string, unknown>): BireyselAyriHarcama[] {
  if (Array.isArray(o.bireyselAyriHarcamalar)) {
    return o.bireyselAyriHarcamalar as BireyselAyriHarcama[]
  }
  if (Array.isArray(o.direktBireyselHarcamalar)) {
    return o.direktBireyselHarcamalar as BireyselAyriHarcama[]
  }
  return []
}

function gelirListesiOku(o: Record<string, unknown>): BireyselGelirKalemi[] {
  if (Array.isArray(o.bireyselGelirKalemleri)) {
    return o.bireyselGelirKalemleri as BireyselGelirKalemi[]
  }
  return []
}

const bosAyVerisi = (): AyHaneGiderVerisi => ({
  krediKartlari: [],
  bireyselAyriHarcamalar: [],
  bireyselGelirKalemleri: [],
})

/** localStorage ham JSON nesnesini ay verisine dönüştürür */
export function ayVerisiNesnedenParse(o: unknown): AyHaneGiderVerisi | null {
  if (!o || typeof o !== 'object' || !Array.isArray((o as Record<string, unknown>).krediKartlari)) {
    return null
  }
  const kayit = o as Record<string, unknown>
  return {
    krediKartlari: kayit.krediKartlari as AyHaneGiderVerisi['krediKartlari'],
    bireyselAyriHarcamalar: ayriHarcamaListesiOku(kayit),
    bireyselGelirKalemleri: gelirListesiOku(kayit),
  }
}

export function kayitliAyAnahtarlariniListele(): string[] {
  if (typeof window === 'undefined') return []
  const anahtarlar: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const tamAnahtar = localStorage.key(i)
    if (tamAnahtar?.startsWith(ON_EK)) {
      anahtarlar.push(tamAnahtar.slice(ON_EK.length))
    }
  }
  return anahtarlar.sort()
}

export function ayVerisiOku(anahtar: string): AyHaneGiderVerisi {
  if (typeof window === 'undefined') return bosAyVerisi()
  try {
    const ham = localStorage.getItem(ON_EK + anahtar)
    if (!ham) return bosAyVerisi()
    const o = JSON.parse(ham) as unknown
    return ayVerisiNesnedenParse(o) ?? bosAyVerisi()
  } catch {
    return bosAyVerisi()
  }
}

export function ayVerisiYaz(anahtar: string, veri: AyHaneGiderVerisi): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ON_EK + anahtar, JSON.stringify(veri))
  window.dispatchEvent(new CustomEvent("hane-gider:updated"));
}
