import { NextRequest, NextResponse } from "next/server";
import type { AssistantActionType, AssistantContextSnapshot, AssistantModule } from "@/domain/assistantTypes";

interface ModelCandidate {
  apiVersion: "v1beta" | "v1";
  modelName: string;
}

const CANDIDATE_MODELS: ModelCandidate[] = [
  { apiVersion: "v1beta", modelName: "gemini-3.5-flash-lite" },
  { apiVersion: "v1beta", modelName: "gemini-3.6-flash" },
  { apiVersion: "v1beta", modelName: "gemini-3.8-flash" },
  { apiVersion: "v1beta", modelName: "gemini-flash-latest" },
];

const VALID_MODULES: AssistantModule[] = [
  "gider",
  "taksit",
  "fit",
  "kalori",
  "shopping",
  "calendar",
  "wedding",
  "wishlist",
  "cleaning",
  "cardolist",
];

const VALID_ACTION_TYPES: AssistantActionType[] = [
  "gider_add_card_item",
  "gider_add_or_update_entry",
  "gider_add_personal_expense",
  "gider_add_income",
  "gider_add_transfer",
  "taksit_add",
  "fit_add_measurement",
  "kalori_add_food",
  "shopping_add_items",
  "calendar_add_events",
  "wedding_add_expense",
  "wedding_add_piggy",
  "wedding_add_participant",
  "wedding_add_taki",
  "wishlist_add_item",
  "cleaning_add_record",
  "cardolist_add_expense",
];

function buildSystemPrompt(context: AssistantContextSnapshot): string {
  return `Sen "Hane Asistan" adında, Mert ve Havsa'nın kullandığı "Hane App" ev ve yaşam yönetim uygulamasının tam yetkili yapay zeka asistanısın.
Kullanıcıyla doğal, samimi, kısa ve net Türkçe konuşursun. Hem uygulama verileri hakkında soruları yanıtlayabilirsin hem de kullanıcının isteği doğrultusunda tüm modüllerde kayıt oluşturacak/güncelleyecek "actions" dizisi üretebilirsin.

GÜNCEL UYGULAMA BAĞLAMI (CANLI VERİLER):
${JSON.stringify(context)}

DESTEKLENEN AKSİYON TİPLERİ VE PAYLOAD ŞEMALARI:
1. module: "gider", type: "gider_add_card_item"
   (Mevcut bir kredi kartına bireysel ekstre kalemi ekler; örn: "Garanti kartına Mert için 750 TL market ekle")
   payload: {
     "monthKey": "YYYY-MM (belirtilmediyse context.currentMonthKey)",
     "kartId": "Eşleşen kartın id'si (context.gider.cards içinden bul, yoksa boş bırak)",
     "kartAdi": "Kartın adı (örn: Garanti Bonus)",
     "kullaniciId": "mert" | "havsa",
     "aciklama": "Harcama açıklaması",
     "tutar": 750,
     "ekstreyeEkle": true | false (kullanıcı 'karta harcama ekle' dediyse genelde true yap ki toplamEkstre de tutar kadar artsın; 'ekstreden düş / bireysele ayır' dediyse false yap)
   }

2. module: "gider", type: "gider_add_or_update_entry"
   (Yeni tek seferlik harcama/fatura veya kredi kartı ekstresi ekler ya da mevcut kartın toplam ekstresini günceller)
   payload: {
     "monthKey": "YYYY-MM",
     "kartId": "Mevcut kart güncelleniyorsa id'si (opsiyonel)",
     "ad": "Kart veya harcama adı (örn: Doğalgaz Faturası, Kira, Yapı Kredi)",
     "toplamEkstre": 1500,
     "kayitTipi": "harcama" | "kart",
     "kimeAit": "ortak" | "mert" | "havsa",
     "odenenKisi": "mert" | "havsa" | "ortak",
     "mode": "create" | "set_total" | "add_to_total"
   }

3. module: "gider", type: "gider_add_personal_expense"
   (Kart dışı ayrı bireysel harcama ekler)
   payload: { "monthKey": "YYYY-MM", "kullaniciId": "mert" | "havsa", "aciklama": "...", "tutar": 500 }

4. module: "gider", type: "gider_add_income"
   (Gelir ekler: maaş, ikramiye vb.)
   payload: { "monthKey": "YYYY-MM", "kullaniciId": "mert" | "havsa", "aciklama": "Maaş", "tutar": 50000 }

5. module: "gider", type: "gider_add_transfer"
   (Mert ve Havsa arasında para transferi)
   payload: { "monthKey": "YYYY-MM", "gonderen": "mert" | "havsa", "alan": "mert" | "havsa", "tutar": 5000, "aciklama": "..." }

6. module: "taksit", type: "taksit_add"
   (Kredi kartına yeni taksitli alışveriş ekler)
   payload: {
     "kartId": "context.taksit.cards içinden eşleşen kart id'si (yoksa boş)",
     "kartAdi": "Kart adı",
     "urunAdi": "Ürün/harcama adı",
     "toplamTutar": 12000,
     "toplamTaksit": 6,
     "odenenTaksit": 0,
     "sahip": "mert" | "havsa" | "ortak",
     "kategori": "elektronik" | "ev_yasam" | "giyim" | "araba" | "saglik" | "tatil" | "diger",
     "notlar": "opsiyonel"
   }

7. module: "fit", type: "fit_add_measurement"
   (Vücut ölçümü ekler. Eğer boyun/bel gibi bir değer verilmemişse context.profiles içindeki o kişinin en son ölçümündeki değeri yedek olarak kullanabilirsin ya da sadece verilenleri gönder; kilo zorunludur)
   payload: {
     "profileId": "context.profiles içinden eşleşen profil id (belirtilmediyse context.activeProfile.id)",
     "profileName": "Profil adı",
     "date": "YYYY-MM-DD (belirtilmediyse context.todayDate)",
     "weight": 88.5,
     "neck": 39,
     "waist": 84,
     "hip": 95 (opsiyonel, özellikle kadınlar için),
     "bodyFat": null (kullanıcı özellikle yüzde verdiyse sayı yaz, vermediyse null bırak otomatik hesaplansın),
     "muscle": { "shoulder": null, "chest": null, "back": null, "rightArm": null, "leftArm": null, "rightThigh": null, "leftThigh": null, "rightCalf": null, "leftCalf": null }
   }

8. module: "kalori", type: "kalori_add_food"
   (Yemek / öğün kalori ve makro tahmini yaparak günlük kalori kaydına ekler. Türk mutfağı standartlarına göre makul kalori, protein, karbonhidrat, yağ hesapla)
   payload: {
     "profileId": "context.activeProfile.id veya belirtilen kişinin id'si",
     "date": "YYYY-MM-DD",
     "mealType": "breakfast" | "lunch" | "dinner" | "snack",
     "items": [
       { "name": "Tavuklu Pilav", "portion": "1 tabak (250g)", "calories": 420, "protein": 28, "carbs": 52, "fat": 10 }
     ]
   }

9. module: "shopping", type: "shopping_add_items"
   (Alışveriş listesine bir veya birden fazla ürün ekler)
   payload: {
     "items": [
       { "title": "Süt", "quantity": "2 litre", "category": "market" | "cleaning" | "personal" | "home" | "other", "note": "" }
     ]
   }

10. module: "calendar", type: "calendar_add_events"
    (Takvime bir veya birden fazla etkinlik/nöbet/randevu ekler)
    payload: {
      "events": [
        {
          "title": "Diş Doktoru",
          "description": "",
          "date": "YYYY-MM-DD",
          "endDate": null,
          "time": "15:00" | null,
          "isAllDay": false,
          "category": "default" | "birthday" | "work" | "health" | "bill" | "trip" | "family" | "shift",
          "scope": "common" | "personal",
          "targetProfileId": "",
          "targetProfileName": ""
        }
      ]
    }

11. module: "wedding", type: "wedding_add_expense"
    payload: { "baslik": "...", "kategori": "mekan" | "giyim" | "fotograf" | "davetiye" | "ceyiz" | "balayi" | "diger", "tutar": 10000, "tamamlandi": false, "sorumluKisi": "ortak" | "mert" | "havsa", "notlar": "" }

12. module: "wedding", type: "wedding_add_piggy"
    payload: { "assetType": "cash" | "gold", "ekleyenKisi": "mert" | "havsa" | "ortak" | "diger", "tutar": 5000, "goldType": "gram" | "ceyrek" | "yarim" | "tam", "miktar": 1, "birimAlisFiyati": 0, "tarih": "YYYY-MM-DD", "aciklama": "" }

13. module: "wedding", type: "wedding_add_participant"
    payload: { "isim": "Halamlar", "yetiskin": 4, "cocuk": 2, "taraf": "mert" | "havsa" }

14. module: "wedding", type: "wedding_add_taki"
    payload: { "etkinlik": "dugun" | "nisan" | "kina", "kimTakti": "Halam", "takiTuru": "altin" | "usd" | "eur" | "tl", "altinTuru": "gram" | "ceyrek" | "yarim" | "tam" | "ajda" | "diger", "adet": 1, "gramaj": null, "digerAltinAciklama": "", "tarihBirimFiyatTL": 0, "tarihToplamDegerTL": 0, "tarih": "YYYY-MM-DD" }

15. module: "wishlist", type: "wishlist_add_item"
    payload: { "title": "...", "description": "", "price": 0, "targetSection": "hane" | "<profileId>", "priority": "low" | "medium" | "high", "category": "home" | "tech" | "fashion" | "hobby" | "travel" | "gift" | "other" }

16. module: "cleaning", type: "cleaning_add_record"
    payload: { "roomId": "context.cleaning.rooms içinden eşleşen id (yoksa boş)", "roomName": "Salon", "date": "YYYY-MM-DD", "methods": ["vacuum", "mop", "robot", "dusting", "deep_clean", "sheets"], "note": "", "cleanedBy": "Mert" }

17. module: "cardolist", type: "cardolist_add_expense"
    payload: { "name": "Benzin / Bakım", "price": 1500, "completed": true }

KURALLAR:
- Kullanıcı yalnızca soru soruyorsa (örn: "bu ay kaç TL harcadık?", "Mert için bu ay kalan para nedir?", "kilom kaç?", "listede ne var?") "actions" boş dizi [] olsun ve "reply" içinde bağlamdaki gerçek verilerle net cevap ver.
- BÜTÇE / GİDER SORULARI İÇİN KESİN KURAL:
  * Kullanıcı "Mert'in kalan parası / gideri / geliri" dediğinde YALNIZCA "context.gider.mert" içindeki değerleri (mert.gelir, mert.toplamGider, mert.kalan, mert.ortakPay, mert.ekstreIciBireysel, mert.kartDisiBireysel) kullan; kesinlikle toplam hane kalanı (context.gider.hane.kalan) ile karıştırma!
  * Kullanıcı "Havsa'nın kalan parası / gideri / geliri" dediğinde YALNIZCA "context.gider.havsa" değerlerini kullan.
  * "Toplam hane / ev bütçesi" sorulduğunda "context.gider.hane" alanını, "mahsuplaşma / kim kime borçlu" sorulduğunda "context.gider.mahsuplasma" alanını kullan.
- KİLO / VÜCUT ANALİZİ KURALI:
  * Kullanıcı kilo gelişimi, yağ oranı trendi, bel ölçüsü değişimi veya geçmiş ölçümlerini sorduğunda "context.profiles" içindeki ilgili profilin "stats" (toplam ölçüm, başlangıç/son kilo, kilo değişimi, BMI, yağ oranı değişimi) ve "measurements" (tarih sırasıyla tüm son ölçümler) verilerini kullanarak somut sayılarla analiz yap.
- Kullanıcı tek bir mesajda birden fazla işlem isterse (örn: "Alışverişe süt ekle ve yarın 14:00'e toplantı yaz"), "actions" dizisinde birden fazla aksiyon döndürebilirsin!
- Eksik kritik bilgi varsa (örneğin tutar söylenmeden harcama ekle denmişse veya hangi kart olduğu çok belirsizse), uydurma yapma; "actions": [] döndür ve "reply" içinde nazikçe eksik bilgiyi sor.
- İsim eşleştirme: "benim", "ben" ifadeleri context.activeProfile kişisini ifade eder (yoksa "mert"). "Mert" veya "Havsa" ifadelerini context.profiles içindeki doğru id ile eşleştir.
- Her aksiyon için "summary" alanı kullanıcıya onay kartında gösterilecek net, anlaşılır Türkçe özet olmalıdır.
- ÇIKTI SADECE VE SADECE AŞAĞIDAKİ JSON FORMATINDA OLMALIDIR (markdown backtick ekleme):
{
  "transcribedText": "Ses kaydı gönderildiyse kullanıcının söylediğinin tam Türkçe dökümü, yazılı mesaj ise boş string",
  "reply": "Kullanıcıya gösterilecek samimi, kısa ve net Türkçe cevap",
  "actions": [
    {
      "type": "...",
      "module": "...",
      "summary": "...",
      "payload": {}
    }
  ]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      audio,
      history,
      context,
      apiKey: clientApiKey,
    } = body as {
      message?: string;
      audio?: { data: string; mimeType?: string };
      history?: { role: "user" | "assistant"; content: string }[];
      context: AssistantContextSnapshot;
      apiKey?: string;
    };

    const hasAudio = Boolean(audio && typeof audio.data === "string" && audio.data.length > 0);
    const hasText = Boolean(typeof message === "string" && message.trim().length > 0);

    if (!hasAudio && !hasText) {
      return NextResponse.json(
        { error: "Lütfen bir mesaj yazın veya ses kaydı gönderin." },
        { status: 400 }
      );
    }

    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API anahtarı bulunamadı. Sağ üstteki API Anahtarı butonundan ücretsiz Gemini API anahtarınızı girebilirsiniz.",
          missingApiKey: true,
        },
        { status: 401 }
      );
    }

    const systemPrompt = buildSystemPrompt(context);

    const trimmedHistory = Array.isArray(history) ? history.slice(-8) : [];
    const historyText =
      trimmedHistory.length > 0
        ? `\n\nSON KONUŞMA GEÇMİŞİ:\n${trimmedHistory
            .map((m) => `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`)
            .join("\n")}`
        : "";

    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const parts: GeminiPart[] = [];

    if (hasAudio && audio) {
      let promptText = `${systemPrompt}${historyText}\n\nKULLANICI SES KAYDI GÖNDERDİ:
1. Ses kaydını dikkatle dinle ve kullanıcının söylediğini tam Türkçe olarak "transcribedText" alanına yaz.
2. İsteği analiz ederek uygun "reply" ve varsa "actions" çıktısını JSON olarak üret.`;
      if (hasText && message) {
        promptText += `\nEk metin notu: "${message.trim()}"`;
      }
      parts.push({ text: promptText });
      parts.push({
        inlineData: {
          mimeType: audio.mimeType || "audio/webm",
          data: audio.data,
        },
      });
    } else {
      parts.push({
        text: `${systemPrompt}${historyText}\n\nKULLANICININ YENİ MESAJI:\n"${(message || "").trim()}"`,
      });
    }

    const buildPayload = (includeThinking: boolean) => ({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        ...(includeThinking ? { thinkingConfig: { thinkingLevel: "minimal" } } : {}),
      },
    });

    interface ParsedAssistantRaw {
      transcribedText?: string;
      reply?: string;
      actions?: {
        type?: string;
        module?: string;
        summary?: string;
        payload?: Record<string, unknown>;
      }[];
    }

    const callCandidate = async (
      candidate: ModelCandidate,
      parentSignal?: AbortSignal
    ): Promise<{ result: ParsedAssistantRaw; modelUsed: string }> => {
      const endpoint = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${apiKey}`;
      const timeoutMs = hasAudio ? 35000 : 22000;
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const signal = parentSignal ? AbortSignal.any([parentSignal, timeoutSignal]) : timeoutSignal;

      let response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(true)),
        signal,
      });

      if (response.status === 400) {
        const errClone = await response.clone().json().catch(() => ({}));
        const errMsg = errClone?.error?.message || "";
        if (
          errMsg.toLowerCase().includes("api_key") ||
          errMsg.toLowerCase().includes("api key")
        ) {
          throw new Error(`[${candidate.modelName}]: ${errMsg}`);
        }

        response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(false)),
          signal,
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg =
          errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`[${candidate.modelName}]: ${errMsg}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        throw new Error(`[${candidate.modelName}]: Yanıt metni boş döndü.`);
      }

      let cleanedJson = candidateText.trim();
      if (cleanedJson.startsWith("```json")) {
        cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanedJson.startsWith("```")) {
        cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanedJson) as ParsedAssistantRaw;
      return { result: parsed, modelUsed: candidate.modelName };
    };

    const attemptErrors: string[] = [];
    const controller = new AbortController();
    const overallTimeout = setTimeout(() => controller.abort(), hasAudio ? 45000 : 38000);

    let raceResult: { result: ParsedAssistantRaw; modelUsed: string } | null = null;

    try {
      // Free Tier kotasını korumak için paralel yarış yerine sırayla dene;
      // yalnızca 429 (kota/rate limit) veya hata durumunda sonraki modele geç.
      for (const candidate of CANDIDATE_MODELS) {
        try {
          raceResult = await callCandidate(candidate, controller.signal);
          break;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          attemptErrors.push(msg);
          if (msg.toLowerCase().includes("api_key") || msg.toLowerCase().includes("api key")) {
            break;
          }
        }
      }
    } finally {
      clearTimeout(overallTimeout);
    }

    if (!raceResult) {
      return NextResponse.json(
        {
          error: `Hane Asistan şu an yanıt veremedi:\n${attemptErrors.join("\n")}`,
        },
        { status: 500 }
      );
    }

    const raw = raceResult.result;
    const sanitizedActions = Array.isArray(raw.actions)
      ? raw.actions
          .filter(
            (a) =>
              a &&
              typeof a.type === "string" &&
              VALID_ACTION_TYPES.includes(a.type as AssistantActionType) &&
              typeof a.module === "string" &&
              VALID_MODULES.includes(a.module as AssistantModule)
          )
          .map((a) => ({
            type: a.type as AssistantActionType,
            module: a.module as AssistantModule,
            summary: String(a.summary || "İşlem hazırlandı").trim(),
            payload:
              a.payload && typeof a.payload === "object" && !Array.isArray(a.payload)
                ? a.payload
                : {},
          }))
      : [];

    return NextResponse.json({
      success: true,
      modelUsed: raceResult.modelUsed,
      reply:
        typeof raw.reply === "string" && raw.reply.trim()
          ? raw.reply.trim()
          : sanitizedActions.length > 0
          ? "İsteğinizi hazırladım, aşağıdan onaylayabilirsiniz."
          : "İsteğinizi aldım, başka nasıl yardımcı olabilirim?",
      transcribedText:
        typeof raw.transcribedText === "string" ? raw.transcribedText.trim() : "",
      actions: sanitizedActions,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası oluştu.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
