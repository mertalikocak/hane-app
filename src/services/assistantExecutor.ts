"use client";

import type { AssistantAction } from "@/domain/assistantTypes";
import type { KullaniciId } from "@/domain/haneGiderTypes";
import type { TaksitKategori, TaksitSahibi } from "@/domain/taksitTypes";
import type { MealType } from "@/domain/calorieTypes";
import type { ShoppingCategory } from "@/domain/shoppingTypes";
import type { CalendarCategory, CalendarScope } from "@/domain/calendarTypes";
import type {
  WeddingItemCategory,
  WeddingKisi,
  GoldType,
  WeddingParticipantSide,
  WeddingTakiEventType,
  WeddingTakiAssetType,
  WeddingTakiGoldSubType,
} from "@/domain/weddingTypes";
import type { WishlistCategory, WishlistPriority } from "@/domain/wishlistTypes";
import type { CleaningMethodId } from "@/domain/cleaningTypes";

import { ayAnahtariOlustur, ayVerisiOku, ayVerisiYaz } from "@/storage/ayDeposu";
import { getTaksitKartlari, addTaksit } from "@/storage/taksitStorage";
import {
  getProfiles,
  getActiveProfileId,
  getMeasurementsByProfile,
  saveMeasurement,
} from "@/storage/bodyStorage";
import { calculateBodyFat } from "@/domain/bodyCalculations";
import { addFoodItemToDate, calculateProfileCalories } from "@/storage/calorieStorage";
import { addCustomShoppingItem } from "@/storage/shoppingStorage";
import { saveCalendarEvent } from "@/storage/calendarStorage";
import {
  addWeddingItem,
  addPiggyContribution,
  addWeddingParticipant,
  addWeddingTaki,
} from "@/storage/weddingStorage";
import { saveWishlistItem } from "@/storage/wishlistStorage";
import {
  getCleaningRooms,
  addCleaningRoom,
  saveCleaningRecord,
} from "@/storage/cleaningStorage";
import { queueLocalChangePush } from "@/lib/firebase/syncService";

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  targetHref: string;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function currentMonthKey(): string {
  const d = new Date();
  return ayAnahtariOlustur(d.getFullYear(), d.getMonth());
}

function toKullaniciId(val: unknown): KullaniciId {
  const s = String(val || "").toLowerCase();
  if (s.includes("havsa")) return "havsa";
  return "mert";
}

function toPositiveNum(val: unknown, fallback = 0): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function resolveProfile(profileId?: unknown, profileName?: unknown) {
  const profiles = getProfiles();
  if (typeof profileId === "string" && profileId.trim()) {
    const byId = profiles.find((p) => p.id === profileId.trim());
    if (byId) return byId;
  }
  if (typeof profileName === "string" && profileName.trim()) {
    const q = profileName.trim().toLowerCase();
    const byName = profiles.find(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    );
    if (byName) return byName;
  }
  const activeId = getActiveProfileId();
  return profiles.find((p) => p.id === activeId) || profiles[0] || null;
}

export function executeAssistantAction(action: AssistantAction): ActionExecutionResult {
  const p = action.payload || {};

  try {
    switch (action.type) {
      case "gider_add_card_item": {
        const monthKey =
          typeof p.monthKey === "string" && /^\d{4}-\d{2}$/.test(p.monthKey)
            ? p.monthKey
            : currentMonthKey();
        const veri = ayVerisiOku(monthKey);
        const tutar = toPositiveNum(p.tutar, 0);
        if (tutar <= 0) {
          return {
            success: false,
            message: "Harcama tutarı 0'dan büyük olmalıdır.",
            targetHref: "/gider",
          };
        }
        const aciklama = String(p.aciklama || "Harcama").trim();
        const kullaniciId = toKullaniciId(p.kullaniciId);
        const ekstreyeEkle = p.ekstreyeEkle !== false;

        const kartAdiAranan = String(p.kartAdi || "").trim().toLowerCase();
        let kartIdx = -1;
        if (typeof p.kartId === "string" && p.kartId) {
          kartIdx = veri.krediKartlari.findIndex((k) => k.id === p.kartId);
        }
        if (kartIdx === -1 && kartAdiAranan) {
          kartIdx = veri.krediKartlari.findIndex(
            (k) =>
              k.ad.toLowerCase().includes(kartAdiAranan) ||
              kartAdiAranan.includes(k.ad.toLowerCase())
          );
        }

        const yeniKalem = {
          id: makeId("kalem"),
          kullaniciId,
          aciklama,
          tutar,
        };

        let hedefKartAdi = String(p.kartAdi || "Kredi Kartı").trim();

        if (kartIdx !== -1) {
          const mevcut = veri.krediKartlari[kartIdx];
          hedefKartAdi = mevcut.ad;
          veri.krediKartlari[kartIdx] = {
            ...mevcut,
            toplamEkstre: ekstreyeEkle
              ? (Number(mevcut.toplamEkstre) || 0) + tutar
              : Number(mevcut.toplamEkstre) || 0,
            bireyselKalemler: [...(mevcut.bireyselKalemler || []), yeniKalem],
          };
        } else {
          veri.krediKartlari.push({
            id: makeId("kart"),
            ad: hedefKartAdi,
            toplamEkstre: tutar,
            bireyselKalemler: [yeniKalem],
            kimeAit: "ortak",
            odenenKisi: kullaniciId,
            kayitTipi: "kart",
          });
        }

        ayVerisiYaz(monthKey, veri);
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${hedefKartAdi}" kartına ${tutar.toLocaleString("tr-TR")} ₺ (${aciklama}) eklendi.`,
          targetHref: "/gider",
        };
      }

      case "gider_add_or_update_entry": {
        const monthKey =
          typeof p.monthKey === "string" && /^\d{4}-\d{2}$/.test(p.monthKey)
            ? p.monthKey
            : currentMonthKey();
        const veri = ayVerisiOku(monthKey);
        const ad = String(p.ad || "Harcama").trim();
        const tutar = toPositiveNum(p.toplamEkstre, 0);
        if (tutar <= 0) {
          return { success: false, message: "Tutar 0'dan büyük olmalıdır.", targetHref: "/gider" };
        }
        const kayitTipi: "kart" | "harcama" = p.kayitTipi === "kart" ? "kart" : "harcama";
        const kimeAit: "ortak" | "mert" | "havsa" =
          p.kimeAit === "mert" || p.kimeAit === "havsa" ? p.kimeAit : "ortak";
        const odenenKisi: "ortak" | "mert" | "havsa" =
          p.odenenKisi === "havsa" || p.odenenKisi === "ortak" ? p.odenenKisi : "mert";
        const mode = String(p.mode || "create");

        let idx = -1;
        if (typeof p.kartId === "string" && p.kartId) {
          idx = veri.krediKartlari.findIndex((k) => k.id === p.kartId);
        } else if (mode !== "create") {
          idx = veri.krediKartlari.findIndex(
            (k) => k.ad.toLowerCase() === ad.toLowerCase()
          );
        }

        if (idx !== -1 && (mode === "set_total" || mode === "add_to_total")) {
          const mevcut = veri.krediKartlari[idx];
          const yeniToplam =
            mode === "add_to_total"
              ? (Number(mevcut.toplamEkstre) || 0) + tutar
              : tutar;
          veri.krediKartlari[idx] = { ...mevcut, toplamEkstre: yeniToplam };
          ayVerisiYaz(monthKey, veri);
          queueLocalChangePush(false);
          return {
            success: true,
            message: `"${mevcut.ad}" toplam ekstresi ${yeniToplam.toLocaleString("tr-TR")} ₺ olarak güncellendi.`,
            targetHref: "/gider",
          };
        }

        veri.krediKartlari.push({
          id: makeId("kart"),
          ad,
          toplamEkstre: tutar,
          bireyselKalemler: [],
          kayitTipi,
          kimeAit,
          odenenKisi,
        });
        ayVerisiYaz(monthKey, veri);
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${ad}" (${tutar.toLocaleString("tr-TR")} ₺) ${monthKey} giderlerine eklendi.`,
          targetHref: "/gider",
        };
      }

      case "gider_add_personal_expense": {
        const monthKey =
          typeof p.monthKey === "string" && /^\d{4}-\d{2}$/.test(p.monthKey)
            ? p.monthKey
            : currentMonthKey();
        const veri = ayVerisiOku(monthKey);
        const tutar = toPositiveNum(p.tutar, 0);
        if (tutar <= 0) {
          return { success: false, message: "Tutar 0'dan büyük olmalıdır.", targetHref: "/gider" };
        }
        const kullaniciId = toKullaniciId(p.kullaniciId);
        const aciklama = String(p.aciklama || "Bireysel Harcama").trim();
        veri.bireyselAyriHarcamalar.push({
          id: makeId("ayri"),
          kullaniciId,
          aciklama,
          tutar,
        });
        ayVerisiYaz(monthKey, veri);
        queueLocalChangePush(false);
        return {
          success: true,
          message: `${kullaniciId === "mert" ? "Mert" : "Havsa"} bireysel harcamalarına "${aciklama}" (${tutar.toLocaleString("tr-TR")} ₺) eklendi.`,
          targetHref: "/gider",
        };
      }

      case "gider_add_income": {
        const monthKey =
          typeof p.monthKey === "string" && /^\d{4}-\d{2}$/.test(p.monthKey)
            ? p.monthKey
            : currentMonthKey();
        const veri = ayVerisiOku(monthKey);
        const tutar = toPositiveNum(p.tutar, 0);
        if (tutar <= 0) {
          return {
            success: false,
            message: "Gelir tutarı 0'dan büyük olmalıdır.",
            targetHref: "/gider",
          };
        }
        const kullaniciId = toKullaniciId(p.kullaniciId);
        const aciklama = String(p.aciklama || "Gelir").trim();
        veri.bireyselGelirKalemleri.push({
          id: makeId("gelir"),
          kullaniciId,
          aciklama,
          tutar,
        });
        ayVerisiYaz(monthKey, veri);
        queueLocalChangePush(false);
        return {
          success: true,
          message: `${kullaniciId === "mert" ? "Mert" : "Havsa"} gelirlerine "${aciklama}" (${tutar.toLocaleString("tr-TR")} ₺) eklendi.`,
          targetHref: "/gider",
        };
      }

      case "gider_add_transfer": {
        const monthKey =
          typeof p.monthKey === "string" && /^\d{4}-\d{2}$/.test(p.monthKey)
            ? p.monthKey
            : currentMonthKey();
        const veri = ayVerisiOku(monthKey);
        const tutar = toPositiveNum(p.tutar, 0);
        if (tutar <= 0) {
          return {
            success: false,
            message: "Transfer tutarı 0'dan büyük olmalıdır.",
            targetHref: "/gider",
          };
        }
        const gonderen = toKullaniciId(p.gonderen);
        const alan: KullaniciId = gonderen === "mert" ? "havsa" : "mert";
        const aciklama = String(p.aciklama || "Transfer").trim();
        veri.transferler = [
          ...(veri.transferler || []),
          {
            id: makeId("trf"),
            gonderen,
            alan,
            tutar,
            tarih: todayStr(),
            aciklama,
          },
        ];
        ayVerisiYaz(monthKey, veri);
        queueLocalChangePush(false);
        return {
          success: true,
          message: `${gonderen === "mert" ? "Mert → Havsa" : "Havsa → Mert"} ${tutar.toLocaleString("tr-TR")} ₺ transfer kaydedildi.`,
          targetHref: "/gider",
        };
      }

      case "taksit_add": {
        const kartlar = getTaksitKartlari();
        const arananAd = String(p.kartAdi || "").trim().toLowerCase();
        const kart =
          (typeof p.kartId === "string" && kartlar.find((k) => k.id === p.kartId)) ||
          (arananAd
            ? kartlar.find(
                (k) =>
                  k.ad.toLowerCase().includes(arananAd) ||
                  arananAd.includes(k.ad.toLowerCase())
              )
            : undefined) ||
          kartlar[0];

        if (!kart) {
          return {
            success: false,
            message: "Taksit eklenecek aktif kredi kartı bulunamadı.",
            targetHref: "/gider?tab=taksit",
          };
        }

        const toplamTutar = toPositiveNum(p.toplamTutar, 0);
        const toplamTaksit = Math.max(1, Math.round(toPositiveNum(p.toplamTaksit, 1)));
        const odenenTaksit = Math.min(toplamTaksit, Math.round(toPositiveNum(p.odenenTaksit, 0)));
        const sahip: TaksitSahibi =
          p.sahip === "mert" || p.sahip === "havsa" ? p.sahip : "ortak";
        const validKats: TaksitKategori[] = [
          "elektronik",
          "ev_yasam",
          "giyim",
          "araba",
          "saglik",
          "tatil",
          "diger",
        ];
        const kategori: TaksitKategori = validKats.includes(p.kategori as TaksitKategori)
          ? (p.kategori as TaksitKategori)
          : "diger";

        const added = addTaksit({
          kartId: kart.id,
          urunAdi: String(p.urunAdi || "Taksitli Harcama").trim(),
          toplamTutar,
          toplamTaksit,
          odenenTaksit,
          sahip,
          kategori,
          baslangicTarihi: todayStr(),
          notlar: p.notlar ? String(p.notlar).trim() : undefined,
        });
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${added.urunAdi}" (${toplamTaksit} taksit, aylık ${added.aylikTutar.toLocaleString("tr-TR")} ₺) ${kart.ad} kartına eklendi.`,
          targetHref: "/gider?tab=taksit",
        };
      }

      case "fit_add_measurement": {
        const profile = resolveProfile(p.profileId, p.profileName);
        if (!profile) {
          return {
            success: false,
            message: "Ölçüm eklenecek Hane Fit profili bulunamadı. Önce bir profil oluşturun.",
            targetHref: "/fit/profiles/new",
          };
        }

        const prevLatest = getMeasurementsByProfile(profile.id)[0];
        const weight = toPositiveNum(p.weight, 0);
        if (weight <= 0) {
          return {
            success: false,
            message: "Kilo değeri 0'dan büyük olmalıdır.",
            targetHref: "/fit/dashboard",
          };
        }

        const neck = toPositiveNum(p.neck, prevLatest?.neck || 0);
        const waist = toPositiveNum(p.waist, prevLatest?.waist || 0);
        const hipRaw =
          p.hip !== undefined && p.hip !== null ? toPositiveNum(p.hip, 0) : prevLatest?.hip;
        const hip = hipRaw && hipRaw > 0 ? hipRaw : undefined;

        const manualBodyFat =
          p.bodyFat !== undefined && p.bodyFat !== null && Number(p.bodyFat) > 0
            ? Number(p.bodyFat)
            : undefined;
        const computedBodyFat =
          manualBodyFat ??
          (calculateBodyFat({
            gender: profile.gender,
            height: profile.height,
            neck: neck > 0 ? neck : undefined,
            waist: waist > 0 ? waist : undefined,
            hip,
          }) ??
            undefined);

        const date =
          typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date)
            ? p.date
            : todayStr();

        const rawMuscle =
          p.muscle && typeof p.muscle === "object"
            ? (p.muscle as Record<string, unknown>)
            : null;
        const muscleFields = [
          "shoulder",
          "chest",
          "back",
          "rightArm",
          "leftArm",
          "rightThigh",
          "leftThigh",
          "rightCalf",
          "leftCalf",
        ] as const;

        const cleanedMuscle: Record<string, number> = {};
        if (rawMuscle) {
          for (const key of muscleFields) {
            const v = Number(rawMuscle[key]);
            if (Number.isFinite(v) && v > 0) {
              cleanedMuscle[key] = v;
            }
          }
        }

        saveMeasurement(
          {
            profileId: profile.id,
            date,
            weight,
            neck,
            waist,
            hip,
            bodyFat: computedBodyFat,
          },
          Object.keys(cleanedMuscle).length > 0 ? cleanedMuscle : undefined
        );

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("fit_measurements_updated"));
          window.dispatchEvent(new Event("storage"));
        }
        queueLocalChangePush(false);

        return {
          success: true,
          message: `${profile.firstName} için ${date} ölçümü kaydedildi (${weight} kg${
            waist > 0 ? `, bel ${waist} cm` : ""
          }${computedBodyFat ? `, yağ %${computedBodyFat}` : ""}).`,
          targetHref: "/fit/dashboard",
        };
      }

      case "kalori_add_food": {
        const profile = resolveProfile(p.profileId, p.profileName);
        const profileId = profile?.id || "default";
        const latestWeight = profile
          ? getMeasurementsByProfile(profile.id)[0]?.weight
          : undefined;
        const calMeta = calculateProfileCalories(profile, latestWeight);

        const date =
          typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date)
            ? p.date
            : todayStr();
        const validMeals: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
        const mealType: MealType = validMeals.includes(p.mealType as MealType)
          ? (p.mealType as MealType)
          : "lunch";

        const rawItems = Array.isArray(p.items) ? p.items : [];
        if (rawItems.length === 0) {
          return {
            success: false,
            message: "Eklenecek yemek öğesi bulunamadı.",
            targetHref: "/kalori",
          };
        }

        let totalKcal = 0;
        for (const item of rawItems) {
          const obj = item as Record<string, unknown>;
          const kcal = Math.round(toPositiveNum(obj.calories, 0));
          totalKcal += kcal;
          addFoodItemToDate(
            date,
            profileId,
            {
              name: String(obj.name || "Yiyecek").trim(),
              portion: String(obj.portion || "1 porsiyon").trim(),
              calories: kcal,
              protein: Math.round(toPositiveNum(obj.protein, 0)),
              carbs: Math.round(toPositiveNum(obj.carbs, 0)),
              fat: Math.round(toPositiveNum(obj.fat, 0)),
              mealType,
              source: "ai",
            },
            calMeta.suggestedCalories
          );
        }
        queueLocalChangePush(false);
        return {
          success: true,
          message: `${rawItems.length} besin (${totalKcal} kcal) ${profile?.firstName || "aktif profil"} kalori günlüğüne eklendi.`,
          targetHref: "/kalori",
        };
      }

      case "shopping_add_items": {
        const rawItems = Array.isArray(p.items) ? p.items : [];
        if (rawItems.length === 0) {
          return {
            success: false,
            message: "Eklenecek ürün bulunamadı.",
            targetHref: "/shopping",
          };
        }
        const validCats: ShoppingCategory[] = ["market", "cleaning", "personal", "home", "other"];
        let addedCount = 0;
        for (const item of rawItems) {
          const obj = item as Record<string, unknown>;
          const title = String(obj.title || "").trim();
          if (!title) continue;
          const category: ShoppingCategory = validCats.includes(obj.category as ShoppingCategory)
            ? (obj.category as ShoppingCategory)
            : "market";
          addCustomShoppingItem({
            title,
            quantity: obj.quantity ? String(obj.quantity).trim() : undefined,
            category,
            note: obj.note ? String(obj.note).trim() : undefined,
          });
          addedCount++;
        }
        return {
          success: addedCount > 0,
          message:
            addedCount > 0
              ? `${addedCount} ürün Hane Shopping listesine eklendi.`
              : "Geçerli ürün adı bulunamadı.",
          targetHref: "/shopping",
        };
      }

      case "calendar_add_events": {
        const rawEvents = Array.isArray(p.events) ? p.events : [];
        if (rawEvents.length === 0) {
          return {
            success: false,
            message: "Eklenecek etkinlik bulunamadı.",
            targetHref: "/calendar",
          };
        }
        const activeProf = resolveProfile();
        const validCats: CalendarCategory[] = [
          "default",
          "birthday",
          "work",
          "health",
          "bill",
          "trip",
          "family",
          "shift",
        ];
        let count = 0;
        for (const ev of rawEvents) {
          const obj = ev as Record<string, unknown>;
          const title = String(obj.title || "").trim();
          if (!title) continue;
          const date =
            typeof obj.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.date)
              ? obj.date
              : todayStr();
          const category: CalendarCategory = validCats.includes(obj.category as CalendarCategory)
            ? (obj.category as CalendarCategory)
            : "default";
          const scope: CalendarScope = obj.scope === "personal" ? "personal" : "common";
          const time = typeof obj.time === "string" && obj.time.trim() ? obj.time.trim() : undefined;

          saveCalendarEvent({
            title,
            description: obj.description ? String(obj.description).trim() : undefined,
            date,
            endDate:
              typeof obj.endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(obj.endDate)
                ? obj.endDate
                : undefined,
            time,
            isAllDay: obj.isAllDay !== undefined ? Boolean(obj.isAllDay) : !time,
            category,
            scope,
            targetProfileId:
              scope === "personal"
                ? String(obj.targetProfileId || activeProf?.id || "")
                : undefined,
            targetProfileName:
              scope === "personal"
                ? String(obj.targetProfileName || activeProf?.firstName || "")
                : undefined,
            createdByProfileId: activeProf?.id || "default",
            createdByName: activeProf?.firstName || "Asistan",
          });
          count++;
        }
        queueLocalChangePush(false);
        return {
          success: count > 0,
          message: `${count} etkinlik Hane Calendar'a eklendi.`,
          targetHref: "/calendar",
        };
      }

      case "wedding_add_expense": {
        const validCats: WeddingItemCategory[] = [
          "mekan",
          "giyim",
          "fotograf",
          "davetiye",
          "ceyiz",
          "balayi",
          "diger",
        ];
        const kategori: WeddingItemCategory = validCats.includes(
          p.kategori as WeddingItemCategory
        )
          ? (p.kategori as WeddingItemCategory)
          : "diger";
        const sorumluKisi: "mert" | "havsa" | "ortak" =
          p.sorumluKisi === "mert" || p.sorumluKisi === "havsa" ? p.sorumluKisi : "ortak";
        const added = addWeddingItem({
          baslik: String(p.baslik || "Düğün Gideri").trim(),
          kategori,
          tutar: toPositiveNum(p.tutar, 0),
          tamamlandi: Boolean(p.tamamlandi),
          sorumluKisi,
          notlar: p.notlar ? String(p.notlar).trim() : undefined,
        });
        return {
          success: true,
          message: `"${added.baslik}" (${added.tutar.toLocaleString("tr-TR")} ₺) Hane Wedding listesine eklendi.`,
          targetHref: "/wedding",
        };
      }

      case "wedding_add_piggy": {
        const isGold = p.assetType === "gold";
        const validKisi: WeddingKisi[] = ["mert", "havsa", "ortak", "diger"];
        const ekleyenKisi: WeddingKisi = validKisi.includes(p.ekleyenKisi as WeddingKisi)
          ? (p.ekleyenKisi as WeddingKisi)
          : "ortak";
        const validGold: GoldType[] = ["gram", "ceyrek", "yarim", "tam"];
        const goldType: GoldType = validGold.includes(p.goldType as GoldType)
          ? (p.goldType as GoldType)
          : "gram";
        const miktar = isGold ? toPositiveNum(p.miktar, 1) : undefined;
        const birimAlisFiyati = isGold ? toPositiveNum(p.birimAlisFiyati, 0) : undefined;
        const tutar = isGold
          ? toPositiveNum(p.tutar, (miktar || 1) * (birimAlisFiyati || 0))
          : toPositiveNum(p.tutar, 0);

        addPiggyContribution({
          assetType: isGold ? "gold" : "cash",
          ekleyenKisi,
          tutar,
          tarih:
            typeof p.tarih === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.tarih)
              ? p.tarih
              : todayStr(),
          aciklama: p.aciklama ? String(p.aciklama).trim() : undefined,
          goldType: isGold ? goldType : undefined,
          miktar,
          birimAlisFiyati,
          toplamAlisMaliyeti: isGold ? tutar : undefined,
        });
        return {
          success: true,
          message: `Düğün kumbarasına ${
            isGold ? `${miktar} ${goldType} altın` : `${tutar.toLocaleString("tr-TR")} ₺`
          } eklendi.`,
          targetHref: "/wedding",
        };
      }

      case "wedding_add_participant": {
        const taraf: WeddingParticipantSide = p.taraf === "havsa" ? "havsa" : "mert";
        const yetiskin = Math.max(0, Math.round(toPositiveNum(p.yetiskin, 1)));
        const cocuk = Math.max(0, Math.round(toPositiveNum(p.cocuk, 0)));
        const isim = String(p.isim || "Misafir").trim();
        addWeddingParticipant({ isim, yetiskin, cocuk, taraf });
        return {
          success: true,
          message: `"${isim}" (${yetiskin + cocuk} kişi, ${
            taraf === "mert" ? "Mert" : "Havsa"
          } tarafı) katılımcılara eklendi.`,
          targetHref: "/wedding",
        };
      }

      case "wedding_add_taki": {
        const etkinlik: WeddingTakiEventType =
          p.etkinlik === "nisan" || p.etkinlik === "kina" ? p.etkinlik : "dugun";
        const takiTuru: WeddingTakiAssetType =
          p.takiTuru === "usd" || p.takiTuru === "eur" || p.takiTuru === "tl"
            ? p.takiTuru
            : "altin";
        const validSub: WeddingTakiGoldSubType[] = [
          "gram",
          "ceyrek",
          "yarim",
          "tam",
          "ajda",
          "diger",
        ];
        const altinTuru: WeddingTakiGoldSubType | undefined =
          takiTuru === "altin"
            ? validSub.includes(p.altinTuru as WeddingTakiGoldSubType)
              ? (p.altinTuru as WeddingTakiGoldSubType)
              : "ceyrek"
            : undefined;
        const adet = toPositiveNum(p.adet, 1);
        const gramaj = altinTuru === "ajda" ? toPositiveNum(p.gramaj, 10) : undefined;
        const tarihBirimFiyatTL = toPositiveNum(p.tarihBirimFiyatTL, 0);
        const tarihToplamDegerTL =
          toPositiveNum(p.tarihToplamDegerTL, 0) ||
          (takiTuru === "tl"
            ? adet
            : altinTuru === "ajda"
            ? adet * (gramaj || 10) * tarihBirimFiyatTL
            : adet * tarihBirimFiyatTL);

        addWeddingTaki({
          etkinlik,
          kimTakti: String(p.kimTakti || "Misafir").trim(),
          takiTuru,
          altinTuru,
          digerAltinAciklama: p.digerAltinAciklama
            ? String(p.digerAltinAciklama).trim()
            : undefined,
          adet,
          gramaj,
          tarihBirimFiyatTL: takiTuru === "tl" ? 1 : tarihBirimFiyatTL,
          tarihToplamDegerTL,
          tarih:
            typeof p.tarih === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.tarih)
              ? p.tarih
              : todayStr(),
        });
        return {
          success: true,
          message: `"${String(p.kimTakti || "Misafir")}" takı kaydı (${etkinlik}) eklendi.`,
          targetHref: "/wedding",
        };
      }

      case "wishlist_add_item": {
        const activeProf = resolveProfile();
        const validCats: WishlistCategory[] = [
          "home",
          "tech",
          "fashion",
          "hobby",
          "travel",
          "gift",
          "other",
        ];
        const validPrio: WishlistPriority[] = ["low", "medium", "high"];
        const category: WishlistCategory = validCats.includes(p.category as WishlistCategory)
          ? (p.category as WishlistCategory)
          : "other";
        const priority: WishlistPriority = validPrio.includes(p.priority as WishlistPriority)
          ? (p.priority as WishlistPriority)
          : "medium";
        const targetSection =
          typeof p.targetSection === "string" && p.targetSection.trim()
            ? p.targetSection.trim()
            : "hane";
        const price = toPositiveNum(p.price, 0);

        const saved = saveWishlistItem({
          title: String(p.title || "İstek").trim(),
          description: p.description ? String(p.description).trim() : undefined,
          price: price > 0 ? price : undefined,
          targetSection,
          completed: false,
          priority,
          category,
          createdByProfileId: activeProf?.id,
          createdByName: activeProf?.firstName,
        });
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${saved.title}" Hane Wish List'e eklendi.`,
          targetHref: "/wishlist",
        };
      }

      case "cleaning_add_record": {
        const rooms = getCleaningRooms();
        const targetName = String(p.roomName || "Genel").trim();
        let room =
          (typeof p.roomId === "string" && rooms.find((r) => r.id === p.roomId)) ||
          rooms.find((r) => r.name.toLowerCase() === targetName.toLowerCase()) ||
          rooms.find((r) => r.name.toLowerCase().includes(targetName.toLowerCase()));

        if (!room) {
          room = addCleaningRoom({
            name: targetName,
            icon: "🧹",
            targetDaysInterval: 3,
          });
        }

        const validMethods: CleaningMethodId[] = [
          "vacuum",
          "mop",
          "robot",
          "dusting",
          "deep_clean",
          "sheets",
        ];
        const methods: CleaningMethodId[] = Array.isArray(p.methods)
          ? (p.methods.filter((m) =>
              validMethods.includes(m as CleaningMethodId)
            ) as CleaningMethodId[])
          : ["vacuum"];
        const finalMethods: CleaningMethodId[] =
          methods.length > 0 ? methods : ["vacuum"];

        const date =
          typeof p.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.date)
            ? p.date
            : todayStr();

        saveCleaningRecord({
          roomId: room.id,
          roomName: room.name,
          date,
          methods: finalMethods,
          note: p.note ? String(p.note).trim() : undefined,
          cleanedBy: p.cleanedBy
            ? String(p.cleanedBy).trim()
            : resolveProfile()?.firstName || "Mert",
        });
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${room.name}" için ${date} temizlik kaydı eklendi.`,
          targetHref: "/cleaning",
        };
      }

      case "cardolist_add_expense": {
        const name = String(p.name || "Araç Masrafı").trim();
        const price = toPositiveNum(p.price, 0);
        if (price <= 0) {
          return {
            success: false,
            message: "Araç masraf tutarı 0'dan büyük olmalıdır.",
            targetHref: "/cardolist",
          };
        }
        const raw = localStorage.getItem("carExpenses");
        const list = raw ? JSON.parse(raw) : [];
        const newExp = {
          id: Date.now(),
          name,
          price,
          completed: p.completed !== false,
          createdAt: new Date().toISOString(),
        };
        list.unshift(newExp);
        localStorage.setItem("carExpenses", JSON.stringify(list));
        window.dispatchEvent(new CustomEvent("cardo:expenses-updated"));
        window.dispatchEvent(new Event("storage"));
        queueLocalChangePush(false);
        return {
          success: true,
          message: `"${name}" (${price.toLocaleString("tr-TR")} ₺) Hane Car giderlerine eklendi.`,
          targetHref: "/cardolist",
        };
      }

      default:
        return {
          success: false,
          message: `Bilinmeyen işlem tipi: ${action.type}`,
          targetHref: "/",
        };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "İşlem uygulanırken hata oluştu.",
      targetHref: "/",
    };
  }
}
