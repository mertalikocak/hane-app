import { GoldPricesResponse, GoldPricesMap, GoldType } from "@/domain/weddingTypes";

const HESAPLI_ALTIN_API_URL = "https://hesaplialtin.com/api/v1/public-prices";
const DEFAULT_API_KEY = "ha_644461da_0088fc5f30d967c893e6d1ea811d798d";
const CACHE_TTL_MS = 60 * 1000; // 60 saniye önbellek

interface CacheEntry {
  data: GoldPricesResponse;
  expiresAt: number;
}

let memoryCache: CacheEntry | null = null;
let lastSuccessfulPrices: GoldPricesResponse | null = null;
let inFlightPromise: Promise<GoldPricesResponse> | null = null;

// Acil durum veya ilk başlatma için varsayılan referans değerleri (API ilk çağrıda erişilemezse)
const FALLBACK_DEFAULT_PRICES: GoldPricesMap = {
  gram: {
    kod: "GRAM_ALTIN_TRY",
    etiket: "Gram Altın",
    alis: 6450,
    satis: 6520,
    degisim24s: 0,
    guncelleme: null,
  },
  ceyrek: {
    kod: "CEYREK_YENI_TRY",
    etiket: "Çeyrek Altın",
    alis: 10550,
    satis: 10650,
    degisim24s: 0,
    guncelleme: null,
  },
  yarim: {
    kod: "YARIM_YENI_TRY",
    etiket: "Yarım Altın",
    alis: 21100,
    satis: 21300,
    degisim24s: 0,
    guncelleme: null,
  },
  tam: {
    kod: "TAM_YENI_TRY",
    etiket: "Tam Altın",
    alis: 42200,
    satis: 42500,
    degisim24s: 0,
    guncelleme: null,
  },
};

export class GoldPriceService {
  /**
   * Hesaplı Altın API'sinden güncel altın fiyatlarını çeker veya önbellekten döner.
   */
  public static async getGoldPrices(forceRefresh = false): Promise<GoldPricesResponse> {
    const now = Date.now();

    // 1. Önbellek geçerli ise doğrudan dön
    if (!forceRefresh && memoryCache && memoryCache.expiresAt > now) {
      return memoryCache.data;
    }

    // 2. Halihazırda devam eden bir istek varsa mükerrer istek yapma
    if (inFlightPromise) {
      return inFlightPromise;
    }

    inFlightPromise = this.fetchFromApi()
      .then((result) => {
        memoryCache = {
          data: result,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        lastSuccessfulPrices = result;
        return result;
      })
      .catch((err) => {
        console.error("GoldPriceService API fetch error:", err);

        // API erişilemediğinde son başarılı fiyat verisini ve güncelleme zamanını kullan
        if (lastSuccessfulPrices) {
          const staleData: GoldPricesResponse = {
            ...lastSuccessfulPrices,
            isStale: true,
            errorMessage:
              "Güncel piyasa verisine erişilemedi. Son başarılı fiyatlar kullanılmaktadır.",
          };
          return staleData;
        }

        // Daha önce hiç başarılı fiyat alınamamışsa güvenli varsayılanları 'stale' olarak dön
        const fallbackData: GoldPricesResponse = {
          success: false,
          updatedAt: new Date().toISOString(),
          piyasa: "bilinmiyor",
          isStale: true,
          errorMessage:
            "Altın fiyat servisi şu anda yanıt vermiyor. Lütfen internet bağlantınızı ve API durumunu kontrol edin.",
          kalemler: FALLBACK_DEFAULT_PRICES,
        };
        return fallbackData;
      })
      .finally(() => {
        inFlightPromise = null;
      });

    return inFlightPromise;
  }

  private static async fetchFromApi(): Promise<GoldPricesResponse> {
    const apiKey = process.env.HESAPLI_ALTIN_API_KEY || DEFAULT_API_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 saniye timeout

    try {
      const response = await fetch(HESAPLI_ALTIN_API_URL, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          Accept: "application/json",
          "User-Agent": "HaneApp/1.0",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `Hesaplı Altın API hatası (Status ${response.status}): ${errorText.slice(0, 150)}`
        );
      }

      const json = await response.json();
      const kalemlerRaw = json.kalemler || {};

      const gramRaw = kalemlerRaw.GRAM_ALTIN_TRY;
      const ceyrekRaw = kalemlerRaw.CEYREK_YENI_TRY || kalemlerRaw.CEYREK_ESKI_TRY;
      const yarimRaw = kalemlerRaw.YARIM_YENI_TRY || kalemlerRaw.YARIM_ESKI_TRY;
      const tamRaw = kalemlerRaw.TAM_YENI_TRY || kalemlerRaw.TAM_ESKI_TRY;

      const kalemler: GoldPricesMap = {
        gram: {
          kod: "GRAM_ALTIN_TRY",
          etiket: gramRaw?.etiket || "Gram Altın",
          alis: Number(gramRaw?.alis) || FALLBACK_DEFAULT_PRICES.gram.alis,
          satis: Number(gramRaw?.satis) || FALLBACK_DEFAULT_PRICES.gram.satis,
          degisim24s: gramRaw?.degisim24s ?? null,
          guncelleme: gramRaw?.guncelleme || json.updatedAt || null,
        },
        ceyrek: {
          kod: "CEYREK_YENI_TRY",
          etiket: ceyrekRaw?.etiket || "Çeyrek Altın",
          alis: Number(ceyrekRaw?.alis) || FALLBACK_DEFAULT_PRICES.ceyrek.alis,
          satis: Number(ceyrekRaw?.satis) || FALLBACK_DEFAULT_PRICES.ceyrek.satis,
          degisim24s: ceyrekRaw?.degisim24s ?? null,
          guncelleme: ceyrekRaw?.guncelleme || json.updatedAt || null,
        },
        yarim: {
          kod: "YARIM_YENI_TRY",
          etiket: yarimRaw?.etiket || "Yarım Altın",
          alis: Number(yarimRaw?.alis) || FALLBACK_DEFAULT_PRICES.yarim.alis,
          satis: Number(yarimRaw?.satis) || FALLBACK_DEFAULT_PRICES.yarim.satis,
          degisim24s: yarimRaw?.degisim24s ?? null,
          guncelleme: yarimRaw?.guncelleme || json.updatedAt || null,
        },
        tam: {
          kod: "TAM_YENI_TRY",
          etiket: tamRaw?.etiket || "Tam Altın",
          alis: Number(tamRaw?.alis) || FALLBACK_DEFAULT_PRICES.tam.alis,
          satis: Number(tamRaw?.satis) || FALLBACK_DEFAULT_PRICES.tam.satis,
          degisim24s: tamRaw?.degisim24s ?? null,
          guncelleme: tamRaw?.guncelleme || json.updatedAt || null,
        },
      };

      const result: GoldPricesResponse = {
        success: true,
        updatedAt: json.updatedAt || new Date().toISOString(),
        piyasa: json.piyasa || "canli",
        isStale: false,
        kalemler,
      };

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

