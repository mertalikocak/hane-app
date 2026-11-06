/**
 * Universal Backup & Restore service for all Hane App modules.
 * Modules covered:
 * 1. Ev Giderleri (hane_gider_ay_...)
 * 2. CarDoList (carExpenses, ...)
 * 3. Hane Dinner (meals, plans, shopping, ...)
 * 4. Hane Fit (hane_fit_profiles, hane_fit_measurements, hane_fit_muscle_measurements, ...)
 */

export interface HaneModulOzet {
  giderAySayisi: number;
  carDoGiderSayisi: number;
  dinnerYemekSayisi: number;
  dinnerPlanSayisi: number;
  calendarEtkinlikSayisi?: number;
  wishlistSayisi?: number;
  cleaningKayitSayisi?: number;
  weddingMaddeSayisi?: number;
  shoppingItemSayisi?: number;
  fitProfilSayisi: number;
  fitOlcumSayisi: number;
  kaloriKayitSayisi?: number;
  bulguSayisi?: number;
  toplamAnahtarSayisi: number;
}

export interface TumHaneYedekPaketi {
  uygulama: "hane-app";
  surum: 1;
  olusturmaTarihi: string;
  ozet: HaneModulOzet;
  veriler: Record<string, string>;
}

export interface IceAktarmaOnizleme {
  gecerli: boolean;
  hata?: string;
  ozet?: HaneModulOzet;
  hamVeriler?: Record<string, string>;
}

/**
 * Cihaza özel anahtarlar. Bu anahtarlar cihazlar arasında eşitlenmez;
 * böylece telefonda ayrı, PC'de ayrı aktif profil seçili kalabilir.
 */
export const DEVICE_LOCAL_KEYS = new Set<string>([
  "hane_fit_active_profile_id",
  "hane_profile_selected_at",
]);

export function tumHaneVerileriniTopla(excludeDeviceLocalKeys = true): TumHaneYedekPaketi {
  const veriler: Record<string, string> = {};
  if (typeof window === "undefined" || !window.localStorage) {
    return {
      uygulama: "hane-app",
      surum: 1,
      olusturmaTarihi: new Date().toISOString(),
      ozet: {
        giderAySayisi: 0,
        carDoGiderSayisi: 0,
        dinnerYemekSayisi: 0,
        dinnerPlanSayisi: 0,
        fitProfilSayisi: 0,
        fitOlcumSayisi: 0,
        toplamAnahtarSayisi: 0,
      },
      veriler: {},
    };
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (excludeDeviceLocalKeys && DEVICE_LOCAL_KEYS.has(key)) {
      continue;
    }
    const val = localStorage.getItem(key);
    if (val !== null) {
      veriler[key] = val;
    }
  }

  const ozet = verileriAnalizEt(veriler);

  return {
    uygulama: "hane-app",
    surum: 1,
    olusturmaTarihi: new Date().toISOString(),
    ozet,
    veriler,
  };
}

export function verileriAnalizEt(veriler: Record<string, string>): HaneModulOzet {
  let giderAySayisi = 0;
  let carDoGiderSayisi = 0;
  let dinnerYemekSayisi = 0;
  let dinnerPlanSayisi = 0;
  let calendarEtkinlikSayisi = 0;
  let wishlistSayisi = 0;
  let cleaningKayitSayisi = 0;
  let weddingMaddeSayisi = 0;
  let shoppingItemSayisi = 0;
  let fitProfilSayisi = 0;
  let fitOlcumSayisi = 0;
  let kaloriKayitSayisi = 0;
  let bulguSayisi = 0;

  for (const [key, raw] of Object.entries(veriler)) {
    try {
      if (key.startsWith("hane_gider_ay_")) {
        giderAySayisi++;
      } else if (key === "carExpenses" || key.startsWith("cardolist_")) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) carDoGiderSayisi += parsed.length;
      } else if (key === "meals") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) dinnerYemekSayisi += parsed.length;
      } else if (key === "plans") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) dinnerPlanSayisi += parsed.length;
      } else if (key === "hane_calendar_events") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) calendarEtkinlikSayisi += parsed.length;
      } else if (key === "hane_wishlist_items") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) wishlistSayisi += parsed.length;
      } else if (key === "hane_cleaning_records") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) cleaningKayitSayisi = (cleaningKayitSayisi || 0) + parsed.length;
      } else if (key === "hane_wedding_data") {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.maddeler)) {
          weddingMaddeSayisi += parsed.maddeler.length;
        }
      } else if (key === "hane-shopping:custom_items") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) shoppingItemSayisi += parsed.length;
      } else if (key === "hane_fit_profiles") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) fitProfilSayisi += parsed.length;
      } else if (key === "hane_fit_measurements") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) fitOlcumSayisi += parsed.length;
      } else if (key === "hane_calorie_daily_records") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          kaloriKayitSayisi += parsed.reduce(
            (sum: number, r: { items?: unknown[] }) =>
              sum + (Array.isArray(r.items) ? r.items.length : 0),
            0
          );
        }
      } else if (key === "hane_bulgu_bildirimleri") {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) bulguSayisi += parsed.length;
      }
    } catch {
      // ignore parse failures for summary count
    }
  }

  return {
    giderAySayisi,
    carDoGiderSayisi,
    dinnerYemekSayisi,
    dinnerPlanSayisi,
    calendarEtkinlikSayisi,
    wishlistSayisi,
    cleaningKayitSayisi,
    weddingMaddeSayisi,
    shoppingItemSayisi,
    fitProfilSayisi,
    fitOlcumSayisi,
    kaloriKayitSayisi,
    bulguSayisi,
    toplamAnahtarSayisi: Object.keys(veriler).length,
  };
}

export function yedekDosyasiniDogrula(girdi: unknown): IceAktarmaOnizleme {
  if (!girdi) {
    return { gecerli: false, hata: "Boş veya geçersiz veri." };
  }

  let veriObj: Record<string, unknown> = {};

  if (typeof girdi === "string") {
    try {
      veriObj = JSON.parse(girdi.trim());
    } catch {
      return { gecerli: false, hata: "JSON formatı geçersiz." };
    }
  } else if (typeof girdi === "object") {
    veriObj = girdi as Record<string, unknown>;
  } else {
    return { gecerli: false, hata: "Geçersiz veri biçimi." };
  }

  // Format 1: Standart TumHaneYedekPaketi ({ uygulama: 'hane-app', veriler: { ... } })
  if (
    veriObj.veriler &&
    typeof veriObj.veriler === "object" &&
    !Array.isArray(veriObj.veriler)
  ) {
    const rawMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(veriObj.veriler)) {
      if (typeof v === "string") {
        rawMap[k] = v;
      } else {
        rawMap[k] = JSON.stringify(v);
      }
    }
    const ozet = verileriAnalizEt(rawMap);
    return { gecerli: true, ozet, hamVeriler: rawMap };
  }

  // Format 2: Doğrudan localStorage dump ({ "carExpenses": "...", "meals": "..." })
  const rawMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(veriObj)) {
    if (typeof v === "string") {
      rawMap[k] = v;
    } else {
      rawMap[k] = JSON.stringify(v);
    }
  }

  if (Object.keys(rawMap).length === 0) {
    return { gecerli: false, hata: "Dosya içerisinde aktarılacak kayıt bulunamadı." };
  }

  const ozet = verileriAnalizEt(rawMap);
  return { gecerli: true, ozet, hamVeriler: rawMap };
}

export function tumHaneVerileriniIceAktar(
  hamVeriler: Record<string, string>,
  preserveDeviceLocal = true
): {
  basarili: boolean;
  eklenenSayisi: number;
  hata?: string;
} {
  if (typeof window === "undefined" || !window.localStorage) {
    return { basarili: false, eklenenSayisi: 0, hata: "Tarayıcı hafızasına ulaşılamadı." };
  }

  try {
    const existingActiveProfileId = localStorage.getItem("hane_fit_active_profile_id");

    for (const [key, value] of Object.entries(hamVeriler)) {
      if (preserveDeviceLocal && DEVICE_LOCAL_KEYS.has(key)) {
        // Cihazda zaten aktif bir profil varsa, dışarıdan gelen profil ile ezme!
        if (key === "hane_fit_active_profile_id" && existingActiveProfileId) {
          continue;
        }
        // Oturum süresi / timestamp anahtarını ezme
        if (key === "hane_profile_selected_at") {
          continue;
        }
      }

      // Alışveriş listesi öğelerini güvenli birleştir (local'e yeni eklenen öğelerin kaybolmaması için)
      if (key === "hane-shopping:custom_items") {
        try {
          const localRaw = localStorage.getItem("hane-shopping:custom_items");
          const localItems = localRaw ? JSON.parse(localRaw) : [];
          const remoteItems = JSON.parse(value);

          if (Array.isArray(localItems) && Array.isArray(remoteItems)) {
            const remoteMap = new Map<string, Record<string, unknown>>();
            for (const item of remoteItems as Record<string, unknown>[]) {
              if (item && typeof item.id === "string") {
                remoteMap.set(item.id, item);
              }
            }
            const mergedList: unknown[] = [];
            const seenIds = new Set<string>();

            // Önce local öğeleri koru, eğer local'de alındı olarak işaretlendiyse o durumu kaybetme
            for (const loc of localItems as Record<string, unknown>[]) {
              if (loc && typeof loc.id === "string") {
                seenIds.add(loc.id);
                const rem = remoteMap.get(loc.id);
                mergedList.push(rem ? { ...rem, ...loc, isCompleted: loc.isCompleted ?? rem.isCompleted } : loc);
              }
            }

            // Remote'tan gelen diğer yeni öğeleri ekle
            for (const rem of remoteItems as Record<string, unknown>[]) {
              if (rem && typeof rem.id === "string" && !seenIds.has(rem.id)) {
                seenIds.add(rem.id);
                mergedList.push(rem);
              }
            }

            localStorage.setItem(key, JSON.stringify(mergedList));
            continue;
          }
        } catch {
          // parse hatası olursa doğrudan yaz
        }
      }

      // Yemek malzemeleri alışveriş durumunu güvenli birleştir
      if (key === "hane-dinner:shopping") {
        try {
          const localRaw = localStorage.getItem("hane-dinner:shopping");
          const localData = localRaw ? JSON.parse(localRaw) : {};
          const remoteData = JSON.parse(value);

          if (typeof localData === "object" && typeof remoteData === "object" && localData !== null && remoteData !== null) {
            const merged: Record<string, unknown[]> = { ...remoteData };
            for (const [wKey, locItems] of Object.entries(localData)) {
              if (Array.isArray(locItems)) {
                const remItems = (Array.isArray(merged[wKey]) ? merged[wKey] : []) as Record<string, unknown>[];
                const remMap = new Map<string, Record<string, unknown>>();
                for (const item of remItems) {
                  if (item && typeof item.key === "string") {
                    remMap.set(item.key, item);
                  }
                }
                const mergedWeek: unknown[] = [];
                const seenKeys = new Set<string>();

                for (const loc of locItems as Record<string, unknown>[]) {
                  if (loc && typeof loc.key === "string") {
                    seenKeys.add(loc.key);
                    const rem = remMap.get(loc.key);
                    mergedWeek.push(rem ? { ...rem, ...loc, isCompleted: loc.isCompleted || rem.isCompleted } : loc);
                  }
                }

                for (const rem of remItems) {
                  if (rem && typeof rem.key === "string" && !seenKeys.has(rem.key)) {
                    seenKeys.add(rem.key);
                    mergedWeek.push(rem);
                  }
                }
                merged[wKey] = mergedWeek;
              }
            }
            localStorage.setItem(key, JSON.stringify(merged));
            continue;
          }
        } catch {
          // fallback
        }
      }

      // Temizlenen yemek malzemeleri anahtarlarını birleştir
      if (key === "hane-shopping:cleared_food_keys") {
        try {
          const localRaw = localStorage.getItem("hane-shopping:cleared_food_keys");
          const localKeys: string[] = localRaw ? JSON.parse(localRaw) : [];
          const remoteKeys: string[] = JSON.parse(value);
          const union = Array.from(new Set([...(Array.isArray(localKeys) ? localKeys : []), ...(Array.isArray(remoteKeys) ? remoteKeys : [])]));
          localStorage.setItem(key, JSON.stringify(union));
          continue;
        } catch {
          // fallback
        }
      }

      localStorage.setItem(key, value);
    }

    // Trigger all change events
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("fit_profiles_updated"));
    window.dispatchEvent(new Event("fit_measurements_updated"));
    window.dispatchEvent(new Event("fit_profile_changed"));
    window.dispatchEvent(new Event("calendar_events_updated"));
    window.dispatchEvent(new Event("wishlist_items_updated"));
    window.dispatchEvent(new Event("hane_calorie_updated"));
    window.dispatchEvent(new CustomEvent("hane:bulgular-changed"));
    window.dispatchEvent(new CustomEvent("hane-shopping:updated"));
    window.dispatchEvent(new CustomEvent("hane-dinner:storage"));
    window.dispatchEvent(new Event("wedding_data_updated"));

    return { basarili: true, eklenenSayisi: Object.keys(hamVeriler).length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { basarili: false, eklenenSayisi: 0, hata: msg };
  }
}

export function tumHaneYedekDosyasiIndir(): { basarili: boolean; dosyaAdi: string } {
  const paket = tumHaneVerileriniTopla();
  const json = JSON.stringify(paket, null, 2);
  const tarih = new Date().toISOString().slice(0, 10);
  const dosyaAdi = `hane-app-tam-yedek-${tarih}.json`;

  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);

  return { basarili: true, dosyaAdi };
}
