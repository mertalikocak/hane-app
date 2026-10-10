/** Uygulamadaki sabit iki kullanıcı */
export type KullaniciId = 'mert' | 'havsa'

/** Tek satırlık bireysel ekstre kalemi (yarıya bölünmez, tamamı ilgili kişiye yazılır) */
export interface BireyselEkstreKalemi {
  id: string
  kullaniciId: KullaniciId
  aciklama: string
  tutar: number
}

/** Ortak kayıt dışı, ekstre paylaşımına girmeyen bireysel harcama satırı */
export interface BireyselAyriHarcama {
  id: string
  kullaniciId: KullaniciId
  aciklama: string
  tutar: number
}

/** Kişiye yazılan gelir satırı (maaş, ikramiye vb.; gider hesaplarına girmez) */
export interface BireyselGelirKalemi {
  id: string
  kullaniciId: KullaniciId
  aciklama: string
  tutar: number
}

/** Bir kredi kartının ilgili ay için ekstre özeti */
export interface KrediKartiEkstresi {
  id: string
  ad: string
  /** Bankadan gelen toplam ekstre tutarı */
  toplamEkstre: number
  bireyselKalemler: BireyselEkstreKalemi[]
  /**
   * true ise bu kayıt üst özet, ev toplamı ve ortak kayıt toplamlarına katılmaz
   * (yalnızca bu kartın kendi ekranında görünür)
   */
  tumGiderToplamlarindaHaric?: boolean
  /** Ekstreyi bankaya kimin ödediği (Mahsuplaşma hesabı için: 'mert' | 'havsa' | 'ortak') */
  odenenKisi?: 'mert' | 'havsa' | 'ortak'
}

/** Tek bir ay için saklanan ortak kayıtlar ve ayrı bireysel harcamalar */
export interface AyHaneGiderVerisi {
  krediKartlari: KrediKartiEkstresi[]
  bireyselAyriHarcamalar: BireyselAyriHarcama[]
  bireyselGelirKalemleri: BireyselGelirKalemi[]
}
