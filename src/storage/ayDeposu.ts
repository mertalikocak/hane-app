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

// ------------------------------------------------------------------
// TAKSİT AKTARIM & GERİ ALMA (UNDO / ROLLBACK) MOTORU
// ------------------------------------------------------------------

export const TAKSIT_YEDEK_ON_EK = 'hane-gider-taksit-yedek:'

/**
 * Aktarım yapmadan önce o ayın verisini yedekler.
 */
export function ayVerisiTaksitYedegiKaydet(anahtar: string): void {
  if (typeof window === 'undefined') return
  const mevcut = localStorage.getItem(ON_EK + anahtar)
  if (mevcut) {
    localStorage.setItem(TAKSIT_YEDEK_ON_EK + anahtar, mevcut)
  }
}

/**
 * Bu ay için geri alınabilir bir taksit aktarım yedeği var mı kontrol eder.
 */
export function ayVerisiTaksitYedegiVarMi(anahtar: string): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(TAKSIT_YEDEK_ON_EK + anahtar)
}

/**
 * Son yapılan taksit aktarımını geri alıp önceki duruma döndürür.
 */
export function ayVerisiTaksitYedegindenGeriAl(anahtar: string): boolean {
  if (typeof window === 'undefined') return false
  const yedek = localStorage.getItem(TAKSIT_YEDEK_ON_EK + anahtar)
  if (!yedek) return false
  localStorage.setItem(ON_EK + anahtar, yedek)
  localStorage.removeItem(TAKSIT_YEDEK_ON_EK + anahtar)
  window.dispatchEvent(new CustomEvent("hane-gider:updated"))
  return true
}

/**
 * Taksit sayfasındaki taksitleri Ev Giderleri sekmesindeki ilgili aya aktarır.
 */
export function taksitleriAyaAktar(
  anahtar: string,
  kartlar: import('../domain/taksitTypes').TaksitKarti[],
  taksitler: import('../domain/taksitTypes').TaksitKalemi[],
  mod: 'birlestir' | 'ayri_kart' = 'birlestir'
): { aktarilanKartSayisi: number; toplamTutar: number } {
  // 1. Önce güvenlik için mevcut durumun yedeğini al
  ayVerisiTaksitYedegiKaydet(anahtar)

  const mevcutAy = ayVerisiOku(anahtar)
  const aktifKartlar = kartlar.filter((k) => k.aktif !== false)
  const yeniKrediKartlari = [...mevcutAy.krediKartlari]
  let toplamTutar = 0
  let aktarilanKartSayisi = 0

  for (const kart of aktifKartlar) {
    const buKartaAitTaksitler = taksitler.filter(
      (t) => t.kartId === kart.id && t.odenenTaksit < t.toplamTaksit
    )
    if (buKartaAitTaksitler.length === 0) continue

    const kartAylikToplam = buKartaAitTaksitler.reduce((s, t) => s + t.aylikTutar, 0)
    toplamTutar += kartAylikToplam
    aktarilanKartSayisi++

    // Bireysel kalemler (Mert ve Havsa taksitleri)
    const bireyselKalemler = buKartaAitTaksitler
      .filter((t) => t.sahip === 'mert' || t.sahip === 'havsa')
      .map((t) => ({
        id: `taksit-sync-${t.id}`,
        kullaniciId: t.sahip as import('../domain/haneGiderTypes').KullaniciId,
        aciklama: `[Taksit] ${t.urunAdi} (${t.odenenTaksit + 1}/${t.toplamTaksit})`,
        tutar: t.aylikTutar,
      }))

    if (mod === 'ayri_kart') {
      // Ayrı kart olarak ekle (örn: "Garanti Bonus (Taksitler)")
      const kartAdi = `${kart.ad} (Taksitler)`
      const mevcutIndex = yeniKrediKartlari.findIndex((k) => k.ad === kartAdi)
      const yeniKartItem = {
        id: mevcutIndex !== -1 ? yeniKrediKartlari[mevcutIndex].id : `kart-sync-${kart.id}`,
        ad: kartAdi,
        toplamEkstre: kartAylikToplam,
        bireyselKalemler,
      }

      if (mevcutIndex !== -1) {
        yeniKrediKartlari[mevcutIndex] = yeniKartItem
      } else {
        yeniKrediKartlari.push(yeniKartItem)
      }
    } else {
      // Birleştir modu: Aynı isimdeki mevcut kartı bul veya yeni oluştur
      const mevcutIndex = yeniKrediKartlari.findIndex(
        (k) => k.ad.trim().toLowerCase() === kart.ad.trim().toLowerCase()
      )

      if (mevcutIndex !== -1) {
        const eskiKart = yeniKrediKartlari[mevcutIndex]
        // Önceki taksit kalemlerini temizle, diğer manuel kalemleri koru
        const taksitHariciBireyseller = eskiKart.bireyselKalemler.filter(
          (b) => !b.id.startsWith('taksit-sync-') && !b.aciklama.startsWith('[Taksit]')
        )

        // Toplam ekstre: en azından bu ayki taksit toplamı kadar olsun
        const yeniToplamEkstre = Math.max(kartAylikToplam, eskiKart.toplamEkstre)

        yeniKrediKartlari[mevcutIndex] = {
          ...eskiKart,
          toplamEkstre: yeniToplamEkstre,
          bireyselKalemler: [...taksitHariciBireyseller, ...bireyselKalemler],
        }
      } else {
        yeniKrediKartlari.push({
          id: `kart-sync-${kart.id}`,
          ad: kart.ad,
          toplamEkstre: kartAylikToplam,
          bireyselKalemler,
        })
      }
    }
  }

  // Veriyi kaydet ve değişiklik bildirimi gönder
  ayVerisiYaz(anahtar, {
    ...mevcutAy,
    krediKartlari: yeniKrediKartlari,
  })

  return { aktarilanKartSayisi, toplamTutar }
}
