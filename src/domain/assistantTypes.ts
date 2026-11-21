export type AssistantModule =
  | "gider"
  | "taksit"
  | "fit"
  | "kalori"
  | "shopping"
  | "calendar"
  | "wedding"
  | "wishlist"
  | "cleaning"
  | "cardolist";

export type AssistantActionType =
  | "gider_add_card_item"
  | "gider_add_or_update_entry"
  | "gider_add_personal_expense"
  | "gider_add_income"
  | "gider_add_transfer"
  | "taksit_add"
  | "fit_add_measurement"
  | "kalori_add_food"
  | "shopping_add_items"
  | "calendar_add_events"
  | "wedding_add_expense"
  | "wedding_add_piggy"
  | "wedding_add_participant"
  | "wedding_add_taki"
  | "wishlist_add_item"
  | "cleaning_add_record"
  | "cardolist_add_expense";

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  module: AssistantModule;
  summary: string;
  payload: Record<string, unknown>;
  status?: "pending" | "applied" | "cancelled" | "error";
  resultMessage?: string;
  targetHref?: string;
}

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  actions?: AssistantAction[];
  modelUsed?: string;
  isVoice?: boolean;
  error?: string;
}

export interface AssistantContextSnapshot {
  todayDate: string;
  todayDayOfWeek: string;
  currentMonthKey: string;
  activeProfile: {
    id: string;
    name: string;
    firstName: string;
    gender: "male" | "female";
    height: number;
  } | null;
  profiles: {
    id: string;
    name: string;
    firstName: string;
    gender: "male" | "female";
    height: number;
    latestMeasurement?: {
      date: string;
      weight: number;
      neck: number;
      waist: number;
      hip?: number;
      bodyFat?: number;
    };
    stats?: {
      totalMeasurements: number;
      startWeight?: number;
      latestWeight?: number;
      weightChange?: number;
      startBodyFat?: number;
      latestBodyFat?: number;
      bodyFatChange?: number;
      latestBMI?: number;
    };
    measurements: {
      date: string;
      weight: number;
      waist: number;
      neck: number;
      hip?: number;
      bodyFat?: number;
    }[];
  }[];
  gider: {
    monthKey: string;
    cards: {
      id: string;
      ad: string;
      toplamEkstre: number;
      kimeAit: string;
      odenenKisi: string;
      kayitTipi: string;
      bireyselKalemSayisi: number;
    }[];
    toplamEkstreTutari: number;
    ayriHarcamaSayisi: number;
    ayriHarcamaToplam: number;
    gelirToplam: number;
    transferToplam: number;
    mert: {
      gelir: number;
      ortakPay: number;
      ekstreIciBireysel: number;
      kartDisiBireysel: number;
      toplamGider: number;
      kalan: number;
    };
    havsa: {
      gelir: number;
      ortakPay: number;
      ekstreIciBireysel: number;
      kartDisiBireysel: number;
      toplamGider: number;
      kalan: number;
    };
    hane: {
      toplamGelir: number;
      toplamGider: number;
      kalan: number;
    };
    mahsuplasma: {
      durumMetni: string;
      borcluKisi: "mert" | "havsa" | "esit";
      alacakliKisi: "mert" | "havsa" | "esit";
      transferTutari: number;
      mertOdedi: number;
      havsaOdedi: number;
    };
  };
  taksit: {
    cards: {
      id: string;
      ad: string;
      banka?: string;
      kartSahibi: string;
    }[];
    aktifTaksitSayisi: number;
    aylikToplamTaksit: number;
  };
  kalori: {
    date: string;
    targetCalories: number;
    consumedCalories: number;
    consumedProtein: number;
    consumedCarbs: number;
    consumedFat: number;
    items: { name: string; calories: number; mealType: string }[];
  };
  shopping: {
    pendingCount: number;
    pendingItems: { title: string; quantity?: string; category?: string }[];
  };
  calendar: {
    upcomingEvents: {
      title: string;
      date: string;
      time?: string;
      category: string;
      scope: string;
    }[];
  };
  wedding: {
    toplamNakitKumbara: number;
    bekleyenGiderSayisi: number;
    bekleyenGiderToplam: number;
    katilimciToplamKisi: number;
    takiSayisi: number;
    etkinlikTarihleri: { nisan?: string; kina?: string; dugun?: string };
  };
  wishlist: {
    pendingCount: number;
    items: { title: string; price?: number; targetSection: string }[];
  };
  cleaning: {
    rooms: { id: string; name: string; lastDate?: string }[];
  };
  cardolist: {
    recentExpenses: { name: string; price: number }[];
    totalAmount: number;
  };
}

export interface AssistantApiResponse {
  success: boolean;
  modelUsed?: string;
  reply: string;
  transcribedText?: string;
  actions: Omit<AssistantAction, "id" | "status">[];
  error?: string;
  missingApiKey?: boolean;
}
