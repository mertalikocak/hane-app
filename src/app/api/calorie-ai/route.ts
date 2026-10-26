import { NextRequest, NextResponse } from "next/server";
import { AIFoodAnalysisResult, MealType } from "@/domain/calorieTypes";

const SYSTEM_INSTRUCTION = `Sen uzman bir diyetisyen ve beslenme analistisin.
Görevin: Kullanıcının Türkçe olarak girdiği yemek/öğün açıklamasını analiz etmek, içindeki besin maddelerini tek tek porsiyon, kalori ve makro (protein, karbonhidrat, yağ) değerlerine ayırmaktır.

Kurallar:
1. "suggestedMealType" değeri yalnızca şunlardan biri olabilir: "breakfast" | "lunch" | "dinner" | "snack". Metinde ipucu yoksa veya genel bir yemekse günün saatine veya yemeğin türüne göre en mantıklısını seç.
2. Her bir yiyecek için gramaj veya porsiyon belirtilmemişse Türk mutfağı standartlarına göre makul bir porsiyon kabul et (örn: 1 kase çorba ~200ml, 1 tabak pilav ~150g).
3. "calories", "protein", "carbs", "fat" sayısal tam sayı (veya 1 ondalıklı sayı) olmalıdır. Negatif olamaz.
4. Çıktı sadece ve sadece aşağıdaki JSON formatında olmalıdır, markdown backtick veya fazladan açıklama metni içermemelidir:
{
  "suggestedMealType": "breakfast" | "lunch" | "dinner" | "snack",
  "items": [
    {
      "name": "Yemek / Besin adı",
      "portion": "Örn: 1 porsiyon (150g) veya 2 dilim",
      "calories": 250,
      "protein": 22,
      "carbs": 5,
      "fat": 12
    }
  ],
  "totalCalories": 250,
  "totalProtein": 22,
  "totalCarbs": 5,
  "totalFat": 12,
  "note": "İsteğe bağlı tek cümlelik kısa not (en fazla 12 kelime)"
}`;

interface ModelCandidate {
  apiVersion: "v1beta" | "v1";
  modelName: string;
}

const CANDIDATE_MODELS: ModelCandidate[] = [
  { apiVersion: "v1beta", modelName: "gemini-3.6-flash" },
  { apiVersion: "v1beta", modelName: "gemini-3.5-flash-lite" },
  { apiVersion: "v1beta", modelName: "gemini-3.8-flash" },
  { apiVersion: "v1beta", modelName: "gemini-flash-latest" },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, apiKey: clientApiKey } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Lütfen analiz edilecek yemek metnini girin." },
        { status: 400 }
      );
    }

    const apiKey = (clientApiKey && clientApiKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API anahtarı bulunamadı. Lütfen sağ üstteki ayarlar simgesinden kendi ücretsiz Gemini API anahtarınızı girin veya .env.local dosyasına GEMINI_API_KEY ekleyin.",
          missingApiKey: true,
        },
        { status: 401 }
      );
    }

    const attemptErrors: string[] = [];
    let successfulResult: AIFoodAnalysisResult | null = null;
    let usedModel = "";

    const buildPayload = (includeThinking: boolean) => ({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_INSTRUCTION}\n\nKullanıcının yediği yemek açıklaması:\n"${text.trim()}"`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000,
        ...(includeThinking ? { thinkingConfig: { thinkingLevel: "minimal" } } : {}),
      },
    });

    const callCandidate = async (
      candidate: ModelCandidate,
      parentSignal?: AbortSignal
    ): Promise<{ result: AIFoodAnalysisResult; modelUsed: string }> => {
      const endpoint = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${apiKey}`;
      const timeoutSignal = AbortSignal.timeout(18000);
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

      const parsed = JSON.parse(cleanedJson) as AIFoodAnalysisResult;
      return { result: parsed, modelUsed: candidate.modelName };
    };

    const controller = new AbortController();
    const overallTimeout = setTimeout(() => controller.abort(), 35000);

    const safeRun = async (candidate: ModelCandidate) => {
      try {
        return await callCandidate(candidate, controller.signal);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        attemptErrors.push(msg);
        throw err;
      }
    };

    let raceResult: { result: AIFoodAnalysisResult; modelUsed: string } | null = null;

    try {
      // 1. Birincil modeli başlat (gemini-3.6-flash)
      const p1 = safeRun(CANDIDATE_MODELS[0]);

      // 2. Eğer birincil model 2.5 saniyede dönmezse ikincil modeli (gemini-3.5-flash-lite) paralel başlat
      let timer: NodeJS.Timeout | null = null;
      const p2 = new Promise<{ result: AIFoodAnalysisResult; modelUsed: string }>((resolve, reject) => {
        timer = setTimeout(() => {
          safeRun(CANDIDATE_MODELS[1]).then(resolve).catch(reject);
        }, 2500);
      });

      p1.then(() => {
        if (timer) clearTimeout(timer);
      }).catch(() => {});

      // İlk başarıyla dönen model kazanır
      raceResult = await Promise.any([p1, p2]);
    } catch {
      // İlk iki model de başarısız olduysa sırayla 3. ve 4. yedekleri dene
      for (let i = 2; i < CANDIDATE_MODELS.length; i++) {
        try {
          raceResult = await safeRun(CANDIDATE_MODELS[i]);
          break;
        } catch {
          // sonraki modele geç
        }
      }
    } finally {
      clearTimeout(overallTimeout);
      if (raceResult) {
        controller.abort();
      }
    }

    if (raceResult) {
      successfulResult = raceResult.result;
      usedModel = raceResult.modelUsed;
    }

    if (!successfulResult) {
      return NextResponse.json(
        {
          error: `Gemini API isteği tamamlanamadı:\n${attemptErrors.join("\n")}`,
        },
        { status: 500 }
      );
    }

    // Validations & sanitization
    const validMealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
    const suggestedMealType: MealType = validMealTypes.includes(successfulResult.suggestedMealType)
      ? successfulResult.suggestedMealType
      : "lunch";

    const items = Array.isArray(successfulResult.items)
      ? successfulResult.items.map((item) => ({
          name: String(item.name || "Bilinmeyen Yiyecek"),
          portion: String(item.portion || "1 porsiyon"),
          calories: Math.max(0, Math.round(Number(item.calories) || 0)),
          protein: Math.max(0, Math.round(Number(item.protein) || 0)),
          carbs: Math.max(0, Math.round(Number(item.carbs) || 0)),
          fat: Math.max(0, Math.round(Number(item.fat) || 0)),
        }))
      : [];

    const totalCalories =
      Number(successfulResult.totalCalories) ||
      items.reduce((sum, i) => sum + i.calories, 0);
    const totalProtein =
      Number(successfulResult.totalProtein) ||
      items.reduce((sum, i) => sum + i.protein, 0);
    const totalCarbs =
      Number(successfulResult.totalCarbs) ||
      items.reduce((sum, i) => sum + i.carbs, 0);
    const totalFat =
      Number(successfulResult.totalFat) ||
      items.reduce((sum, i) => sum + i.fat, 0);

    return NextResponse.json({
      success: true,
      modelUsed: usedModel,
      result: {
        suggestedMealType,
        items,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        note: successfulResult.note || "",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Sunucu hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
