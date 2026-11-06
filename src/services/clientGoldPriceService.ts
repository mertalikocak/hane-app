import { useState, useEffect, useCallback } from "react";
import { GoldPricesResponse, GoldPricesMap } from "@/domain/weddingTypes";

const LOCAL_STORAGE_CACHE_KEY = "hane_cached_gold_prices";

export const DEFAULT_FALLBACK_GOLD_PRICES: GoldPricesMap = {
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

export function getCachedGoldPrices(): GoldPricesResponse | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCachedGoldPrices(data: GoldPricesResponse): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Altın fiyatları önbellek kaydetme hatası:", err);
  }
}

export async function fetchGoldPrices(forceRefresh = false): Promise<GoldPricesResponse> {
  const url = forceRefresh ? "/api/gold-prices?refresh=true" : "/api/gold-prices";
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Fiyat servisi yanıt vermedi (${res.status})`);
  }
  const data: GoldPricesResponse = await res.json();
  if (data && data.kalemler) {
    saveCachedGoldPrices(data);
  }
  return data;
}

export function useGoldPrices() {
  const [prices, setPrices] = useState<GoldPricesResponse | null>(() => getCachedGoldPrices());
  const [isLoading, setIsLoading] = useState<boolean>(!prices);
  const [error, setError] = useState<string | null>(null);

  const loadPrices = useCallback(async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGoldPrices(force);
      setPrices(data);
      if (data.errorMessage) {
        setError(data.errorMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Altın fiyatları alınamadı";
      setError(msg);
      // Yerel önbellekteki veriyi koru
      const cached = getCachedGoldPrices();
      if (cached) {
        setPrices({
          ...cached,
          isStale: true,
          errorMessage: msg,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices(false);
  }, [loadPrices]);

  return {
    prices,
    isLoading,
    error,
    refresh: () => loadPrices(true),
  };
}

