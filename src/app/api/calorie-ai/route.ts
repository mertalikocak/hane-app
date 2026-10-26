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
  "note": "İsteğe bağlı kısa beslenme tavsiyesi veya açıklama"
}`;

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

    const requestPayload = {
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
        temperature: 0.2,
      },
    };

    for (const candidate of CANDIDATE_MODELS) {
      const endpoint = `https://generativelanguage.googleapis.com/${candidate.apiVersion}/models/${candidate.modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
          signal: AbortSignal.timeout(28000),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg =
            errData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          attemptErrors.push(`[${candidate.modelName}]: ${errMsg}`);

          // Eğer API anahtarı geçersizse döngüyü hemen kır
          if (
            response.status === 401 ||
            (response.status === 403 && errMsg.toLowerCase().includes("api_key"))
          ) {
            break;
          }

          // Model desteklenmiyorsa sıradaki modele geç
          continue;
        }

        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          attemptErrors.push(`[${candidate.modelName}]: Yanıt metni boş döndü.`);
          continue;
        }

        let cleanedJson = candidateText.trim();
        if (cleanedJson.startsWith("```json")) {
          cleanedJson = cleanedJson.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanedJson.startsWith("```")) {
          cleanedJson = cleanedJson.replace(/^```/, "").replace(/```$/, "").trim();
        }

        successfulResult = JSON.parse(cleanedJson) as AIFoodAnalysisResult;
        usedModel = candidate.modelName;
        break;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        attemptErrors.push(`[${candidate.modelName}]: ${msg}`);
      }
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
