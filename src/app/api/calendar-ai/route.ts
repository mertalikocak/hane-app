import { NextRequest, NextResponse } from "next/server";
import { AICalendarResponse, CalendarCategory, CalendarScope } from "@/domain/calendarTypes";

interface ModelCandidate {
  apiVersion: "v1beta" | "v1";
  modelName: string;
}

const CANDIDATE_MODELS: ModelCandidate[] = [
  { apiVersion: "v1beta", modelName: "gemini-3.5-flash-lite" },
  { apiVersion: "v1beta", modelName: "gemini-3.6-flash" },
  { apiVersion: "v1beta", modelName: "gemini-flash-latest" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      audio,
      todayDate,
      todayDayOfWeek,
      activeProfileName,
      activeProfileId,
      profiles,
      apiKey: clientApiKey,
    } = body;

    const hasAudio = Boolean(audio && typeof audio.data === "string" && audio.data.length > 0);
    const hasText = Boolean(typeof text === "string" && text.trim().length > 0);

    if (!hasAudio && !hasText) {
      return NextResponse.json(
        { error: "Lütfen takvime eklemek istediğiniz etkinlik metnini girin veya mikrofona konuşarak ses kaydedin." },
        { status: 400 }
      );
    }

    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API anahtarı bulunamadı. Lütfen ayarlar simgesinden ücretsiz Gemini API anahtarınızı girin.",
          missingApiKey: true,
        },
        { status: 401 }
      );
    }

    const effectiveDate = todayDate || new Date().toISOString().split("T")[0];
    const currentYear = effectiveDate.split("-")[0];
    const profilesList = Array.isArray(profiles) ? JSON.stringify(profiles) : "[]";

    const systemPrompt = `Sen Hane Calendar (Ortak & Kişisel Aile Takvimi) için uzman bir yapay zeka asistanısın.
Görevin: Kullanıcının Türkçe serbest metin veya sesle söylediği plan, randevu, nöbet, fatura, doğum günü vb. isteklerini analiz ederek takvim etkinliklerine dönüştürmektir.

REFERANS BİLGİLER:
- Bugünün Tarihi: ${effectiveDate} (${todayDayOfWeek || "Gün"})
- Mevcut Yıl: ${currentYear}
- Aktif Kullanıcı: ${activeProfileName || "Kullanıcı"} (ID: ${activeProfileId || "default"})
- Aile Profilleri: ${profilesList}

KULLANILABİLİR KATEGORİLER:
- "shift": Nöbet, gece nöbeti, vardiya, hastane nöbeti, acil nöbeti.
- "health": Doktor, randevu, diş hekimi, hastane, ilaç, tahlil, muayene, aşı.
- "birthday": Doğum günü, kutlama, yıl dönümü, tebrik, parti.
- "bill": Fatura, ödeme, kira, aidat, taksit, kredi kartı, borç son ödeme günü.
- "work": İş, ofis, toplantı, mülakat, sunum, proje, görüşme.
- "trip": Seyahat, tatil, gezi, uçak, otel, bilet, yolculuk.
- "family": Aile, ev işi, temizlik, veli toplantısı, okul, çocuk.
- "default": Genel diğer tüm etkinlikler veya hatırlatmalar.

ANALİZ VE DÖNÜŞTÜRME KURALLARI:
1. BİRDEN FAZLA GÜN VEYA ETKİNLİK:
   - Eğer kullanıcı birden fazla gün söylerse (örn: "Kasımda 10 12 15 günleri nöbet", "Salı ve perşembe spor"), her bir gün için AYRI BİR ETKİNLİK nesnesi üret.
2. TARİH HESAPLAMA:
   - Ay belirtilmişse (örn: "kasım"), yılı ${currentYear} olarak al (örn: ${currentYear}-11-10).
   - "Yarın", "haftaya salı", "önümüzdeki cuma" gibi ifadeleri referans tarihe (${effectiveDate}) göre tam YYYY-MM-DD olarak hesapla.
   - Tarih formatı MUTLAKA YYYY-MM-DD olmalıdır (örn: 2026-11-10).
3. TARİH ARALIĞI:
   - "1-5 kasım arası antalya tatili" gibi aralık belirtilmişse date: "2026-11-01", endDate: "2026-11-05" yapabilirsin.
4. SAAT BİLGİSİ:
   - Saat belirtilmişse (örn: "14:30'da", "akşam 8'de"), "time": "14:30" veya "20:00" yap ve "isAllDay": false yap.
   - Saat yoksa "time": null ve "isAllDay": true yap.
5. KİŞİ & KAPSAM (SCOPE):
   - Etkinlik aileyi ilgilendiriyorsa "scope": "common".
   - Bireysel ise (örn: nöbet, kişisel randevu) "scope": "personal" yap ve mümkünse targetProfileId ve targetProfileName'i ata.

ÇIKTI SADECE AŞAĞIDAKİ JSON FORMATINDA OLMALIDIR (Markdown backtick veya fazladan metin ekleme):
{
  "transcribedText": "Kullanıcının ses kaydında söylediği cümlenin tam Türkçe metni (ses kaydı gönderilmişse tam olarak ne dediğini yaz, yazılı istek ise girilen metni yaz)",
  "summary": "Kısa Türkçe özet (örn: Kasım ayı için 3 nöbet etkinliği oluşturuldu)",
  "events": [
    {
      "title": "Nöbet",
      "description": "Kasım nöbeti",
      "date": "YYYY-MM-DD",
      "endDate": null,
      "time": null,
      "endTime": null,
      "isAllDay": true,
      "category": "shift",
      "scope": "personal",
      "targetProfileId": "${activeProfileId || ""}",
      "targetProfileName": "${activeProfileName || ""}"
    }
  ]
}
`;

    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const parts: GeminiPart[] = [];

    if (hasAudio) {
      let promptInstruction = `${systemPrompt}\n\nKULLANICI BİR SES KAYDI GÖNDERDİ. LÜTFEN:
1. Ses kaydını dikkatle dinle ve kullanıcının ne söylediğini tam Türkçe metne dökerek "transcribedText" alanına yaz.
2. Söylenen tarihleri, nöbetleri, randevuları veya etkinlikleri analiz edip yukarıdaki JSON formatında takvim etkinlikleri oluştur.`;

      if (hasText) {
        promptInstruction += `\nKullanıcının ek notu/yazısı: "${text.trim()}"`;
      }

      parts.push({ text: promptInstruction });
      parts.push({
        inlineData: {
          mimeType: audio.mimeType || "audio/webm",
          data: audio.data,
        },
      });
    } else {
      parts.push({
        text: `${systemPrompt}\n\nKullanıcının Yazılı Takvim İsteği:\n"${(text || "").trim()}"`,
      });
    }

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    };

    const attemptErrors: string[] = [];
    let successfulResult: AICalendarResponse | null = null;
    let usedModel = "";

    const fetchTimeout = hasAudio ? 35000 : 25000;

    for (const candidate of CANDIDATE_MODELS) {
      const endpoint = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(fetchTimeout),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg =
            errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          attemptErrors.push(`[${candidate.modelName}]: ${errMsg}`);

          if (
            response.status === 401 ||
            (response.status === 403 && errMsg.toLowerCase().includes("api_key"))
          ) {
            break;
          }

          continue;
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          attemptErrors.push(`[${candidate.modelName}]: Boş yanıt döndü.`);
          continue;
        }

        let cleanedJson = candidateText.trim();
        if (cleanedJson.startsWith("```json")) {
          cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanedJson.startsWith("```")) {
          cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
        }

        successfulResult = JSON.parse(cleanedJson) as AICalendarResponse;
        usedModel = candidate.modelName;
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        attemptErrors.push(`[${candidate.modelName}]: ${msg}`);
      }
    }

    if (!successfulResult || !Array.isArray(successfulResult.events)) {
      return NextResponse.json(
        {
          error: `Yapay zeka takvim isteğini işleyemedi:\n${attemptErrors.join("\n")}`,
        },
        { status: 500 }
      );
    }

    // Sanitization & validation
    const validCategories: CalendarCategory[] = [
      "default",
      "birthday",
      "work",
      "health",
      "bill",
      "trip",
      "family",
      "shift",
    ];

    const sanitizedEvents = successfulResult.events
      .filter((e) => e && typeof e.title === "string" && e.title.trim())
      .map((e) => {
        const category: CalendarCategory = validCategories.includes(e.category)
          ? e.category
          : "default";
        const scope: CalendarScope = e.scope === "personal" ? "personal" : "common";

        return {
          title: String(e.title).trim(),
          description: e.description ? String(e.description).trim() : "",
          date: String(e.date || effectiveDate).trim(),
          endDate: e.endDate ? String(e.endDate).trim() : undefined,
          time: e.time ? String(e.time).trim() : undefined,
          endTime: e.endTime ? String(e.endTime).trim() : undefined,
          isAllDay: Boolean(e.isAllDay ?? (!e.time)),
          category,
          scope,
          targetProfileId: e.targetProfileId || (scope === "personal" ? activeProfileId : undefined),
          targetProfileName: e.targetProfileName || (scope === "personal" ? activeProfileName : undefined),
        };
      });

    if (sanitizedEvents.length === 0) {
      return NextResponse.json(
        { error: "Metinden herhangi bir takvim etkinliği veya tarih tespit edilemedi. Lütfen tarihi biraz daha belirterek tekrar deneyin." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      modelUsed: usedModel,
      result: {
        summary: successfulResult.summary || `${sanitizedEvents.length} adet etkinlik oluşturuldu.`,
        transcribedText: successfulResult.transcribedText || (hasText ? text.trim() : ""),
        events: sanitizedEvents,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası oluştu.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
