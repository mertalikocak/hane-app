"use client";

import type { AssistantContextSnapshot } from "@/domain/assistantTypes";
import { ayAnahtariOlustur, ayVerisiOku } from "@/storage/ayDeposu";
import {
  ayHaneOrtakPayi,
  ayEkstreIciBireyselToplamlar,
  bireyselAyriHarcamaToplamlar,
  bireyselGelirToplamlar,
  ayToplamGelir,
  ayToplamGirisGideri,
  ayMahsuplasmaHesapla,
  toplumaDahilKartlar,
} from "@/domain/ekstreHesapla";
import { getTaksitKartlari, getTaksitler } from "@/storage/taksitStorage";
import {
  getProfiles,
  getActiveProfileId,
  getMeasurementsByProfile,
} from "@/storage/bodyStorage";
import {
  getDailyRecord,
  calculateMacroSummary,
  calculateProfileCalories,
} from "@/storage/calorieStorage";
import { getCustomShoppingList } from "@/storage/shoppingStorage";
import { getCalendarEvents } from "@/storage/calendarStorage";
import { getWeddingData } from "@/storage/weddingStorage";
import { getWishlistItems } from "@/storage/wishlistStorage";
import { getRoomStatuses } from "@/storage/cleaningStorage";

export function buildAssistantContext(): AssistantContextSnapshot {
  const now = new Date();
  const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const todayDayOfWeek = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
  }).format(now);
  const currentMonthKey = ayAnahtariOlustur(now.getFullYear(), now.getMonth());

  // 1. Profiller & Hane Fit
  const rawProfiles = getProfiles();
  const activeProfileId = getActiveProfileId();
  const profiles = rawProfiles.map((p) => {
    const meas = getMeasurementsByProfile(p.id);
    const latest = meas[0];
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`.trim(),
      firstName: p.firstName,
      gender: p.gender,
      height: p.height,
      latestMeasurement: latest
        ? {
            date: latest.date,
            weight: latest.weight,
            neck: latest.neck,
            waist: latest.waist,
            hip: latest.hip,
            bodyFat: latest.bodyFat,
          }
        : undefined,
    };
  });

  const activeProfRaw = rawProfiles.find((p) => p.id === activeProfileId) || rawProfiles[0] || null;
  const activeProfile = activeProfRaw
    ? {
        id: activeProfRaw.id,
        name: `${activeProfRaw.firstName} ${activeProfRaw.lastName}`.trim(),
        firstName: activeProfRaw.firstName,
        gender: activeProfRaw.gender,
        height: activeProfRaw.height,
      }
    : null;

  // 2. Hane Gider (Bu Ay)
  const ayVeri = ayVerisiOku(currentMonthKey);
  const giderCards = ayVeri.krediKartlari.map((k) => ({
    id: k.id,
    ad: k.ad,
    toplamEkstre: Number(k.toplamEkstre) || 0,
    kimeAit: k.kimeAit || "ortak",
    odenenKisi: k.odenenKisi || "mert",
    kayitTipi: k.kayitTipi || "kart",
    bireyselKalemSayisi: Array.isArray(k.bireyselKalemler) ? k.bireyselKalemler.length : 0,
  }));

  const toplamEkstreTutari = toplumaDahilKartlar(ayVeri.krediKartlari).reduce(
    (s, c) => s + (Number(c.toplamEkstre) || 0),
    0
  );
  const ayriHarcamaToplam = (ayVeri.bireyselAyriHarcamalar || []).reduce(
    (s, h) => s + (Number(h.tutar) || 0),
    0
  );
  const gelirToplam = ayToplamGelir(ayVeri);
  const transferToplam = (ayVeri.transferler || []).reduce(
    (s, t) => s + (Number(t.tutar) || 0),
    0
  );

  const ortakPay = ayHaneOrtakPayi(ayVeri.krediKartlari);
  const ekstreIciBireysel = ayEkstreIciBireyselToplamlar(ayVeri.krediKartlari);
  const ayriBireysel = bireyselAyriHarcamaToplamlar(ayVeri.bireyselAyriHarcamalar || []);
  const gelirKisiler = bireyselGelirToplamlar(ayVeri.bireyselGelirKalemleri || []);

  const mertToplamGider = ortakPay.mert + ekstreIciBireysel.mert + ayriBireysel.mert;
  const havsaToplamGider = ortakPay.havsa + ekstreIciBireysel.havsa + ayriBireysel.havsa;
  const mertKalan = gelirKisiler.mert - mertToplamGider;
  const havsaKalan = gelirKisiler.havsa - havsaToplamGider;

  const haneToplamGider = ayToplamGirisGideri(ayVeri);
  const haneKalan = gelirToplam - haneToplamGider;
  const mahsuplasma = ayMahsuplasmaHesapla(ayVeri.krediKartlari, ayVeri.transferler || []);

  // 3. Taksitler
  const taksitKartlari = getTaksitKartlari().filter((k) => k.aktif !== false);
  const aktifTaksitler = getTaksitler().filter((t) => t.odenenTaksit < t.toplamTaksit);
  const aylikToplamTaksit = aktifTaksitler.reduce((s, t) => s + (Number(t.aylikTutar) || 0), 0);

  // 4. Hane Kalori (Bugün)
  const activeLatestWeight = activeProfRaw
    ? getMeasurementsByProfile(activeProfRaw.id)[0]?.weight
    : undefined;
  const calMeta = calculateProfileCalories(activeProfRaw, activeLatestWeight);
  const todayCalRecord = getDailyRecord(
    todayDate,
    activeProfRaw?.id || "default",
    calMeta.suggestedCalories
  );
  const macroSummary = calculateMacroSummary(todayCalRecord.items);

  // 5. Alışveriş Listesi
  const shoppingPending = getCustomShoppingList().filter((i) => !i.isCompleted);

  // 6. Takvim (Bugünden sonraki 14 gün)
  const twoWeeksLater = new Date(now);
  twoWeeksLater.setDate(now.getDate() + 14);
  const limitDate = `${twoWeeksLater.getFullYear()}-${String(
    twoWeeksLater.getMonth() + 1
  ).padStart(2, "0")}-${String(twoWeeksLater.getDate()).padStart(2, "0")}`;
  const upcomingEvents = getCalendarEvents()
    .filter((e) => e.date >= todayDate && e.date <= limitDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 15)
    .map((e) => ({
      title: e.title,
      date: e.date,
      time: e.time,
      category: e.category,
      scope: e.scope,
    }));

  // 7. Wedding
  const wed = getWeddingData();
  const toplamNakitKumbara = wed.kumbaraKatkilar
    .filter((k) => k.assetType !== "gold")
    .reduce((s, k) => s + (Number(k.tutar) || 0), 0);
  const bekleyenWed = wed.maddeler.filter((m) => !m.tamamlandi);
  const katilimciToplamKisi = (wed.katilimcilar || []).reduce(
    (s, p) => s + (Number(p.toplam) || 0),
    0
  );

  // 8. Wishlist
  const pendingWishes = getWishlistItems().filter((w) => !w.completed);

  // 9. Cleaning
  const roomStatuses = getRoomStatuses();

  // 10. CarDoList
  let carList: { name: string; price: number }[] = [];
  let carTotal = 0;
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("carExpenses");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          carTotal = parsed.reduce((s, x) => s + (Number(x?.price) || 0), 0);
          carList = parsed.slice(0, 8).map((x) => ({
            name: String(x?.name || ""),
            price: Number(x?.price) || 0,
          }));
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    todayDate,
    todayDayOfWeek,
    currentMonthKey,
    activeProfile,
    profiles,
    gider: {
      monthKey: currentMonthKey,
      cards: giderCards,
      toplamEkstreTutari,
      ayriHarcamaSayisi: (ayVeri.bireyselAyriHarcamalar || []).length,
      ayriHarcamaToplam,
      gelirToplam,
      transferToplam,
      mert: {
        gelir: gelirKisiler.mert,
        ortakPay: ortakPay.mert,
        ekstreIciBireysel: ekstreIciBireysel.mert,
        kartDisiBireysel: ayriBireysel.mert,
        toplamGider: mertToplamGider,
        kalan: mertKalan,
      },
      havsa: {
        gelir: gelirKisiler.havsa,
        ortakPay: ortakPay.havsa,
        ekstreIciBireysel: ekstreIciBireysel.havsa,
        kartDisiBireysel: ayriBireysel.havsa,
        toplamGider: havsaToplamGider,
        kalan: havsaKalan,
      },
      hane: {
        toplamGelir: gelirToplam,
        toplamGider: haneToplamGider,
        kalan: haneKalan,
      },
      mahsuplasma: {
        durumMetni: mahsuplasma.durumMetni,
        borcluKisi: mahsuplasma.borcluKisi,
        alacakliKisi: mahsuplasma.alacakliKisi,
        transferTutari: mahsuplasma.transferTutari,
        mertOdedi: mahsuplasma.mertOdedi,
        havsaOdedi: mahsuplasma.havsaOdedi,
      },
    },
    taksit: {
      cards: taksitKartlari.map((k) => ({
        id: k.id,
        ad: k.ad,
        banka: k.banka,
        kartSahibi: k.kartSahibi,
      })),
      aktifTaksitSayisi: aktifTaksitler.length,
      aylikToplamTaksit,
    },
    kalori: {
      date: todayDate,
      targetCalories: todayCalRecord.targetCalories,
      consumedCalories: macroSummary.calories,
      consumedProtein: macroSummary.protein,
      consumedCarbs: macroSummary.carbs,
      consumedFat: macroSummary.fat,
      items: todayCalRecord.items.slice(0, 12).map((i) => ({
        name: i.name,
        calories: i.calories,
        mealType: i.mealType,
      })),
    },
    shopping: {
      pendingCount: shoppingPending.length,
      pendingItems: shoppingPending.slice(0, 20).map((i) => ({
        title: i.title,
        quantity: i.quantity,
        category: i.category,
      })),
    },
    calendar: {
      upcomingEvents,
    },
    wedding: {
      toplamNakitKumbara,
      bekleyenGiderSayisi: bekleyenWed.length,
      bekleyenGiderToplam: bekleyenWed.reduce((s, m) => s + (Number(m.tutar) || 0), 0),
      katilimciToplamKisi,
      takiSayisi: (wed.takilar || []).length,
      etkinlikTarihleri: wed.takiEtkinlikTarihleri || {},
    },
    wishlist: {
      pendingCount: pendingWishes.length,
      items: pendingWishes.slice(0, 12).map((w) => ({
        title: w.title,
        price: w.price,
        targetSection: w.targetSection,
      })),
    },
    cleaning: {
      rooms: roomStatuses.map((rs) => ({
        id: rs.room.id,
        name: rs.room.name,
        lastDate: rs.lastRecord?.date,
      })),
    },
    cardolist: {
      recentExpenses: carList,
      totalAmount: carTotal,
    },
  };
}
