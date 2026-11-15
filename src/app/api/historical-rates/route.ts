import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TROY_OUNCE_IN_GRAMS = 31.1034768;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = (searchParams.get("date") || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { success: false, error: "Geçersiz tarih formatı (YYYY-MM-DD bekleniyor)." },
      { status: 400 }
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  if (dateParam >= todayStr) {
    return NextResponse.json({
      success: true,
      isHistorical: false,
      date: dateParam,
      rates: null,
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    // 1. Öncelik: jsDelivr currency-api (USD, EUR ve XAU/Gram Altın dahil)
    const cdnUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateParam}/v1/currencies/try.json`;
    const res = await fetch(cdnUrl, {
      signal: controller.signal,
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const json = await res.json();
      const tryRates = json?.try || {};
      const usdPerTry = Number(tryRates.usd);
      const eurPerTry = Number(tryRates.eur);
      const xauPerTry = Number(tryRates.xau);

      const usd = usdPerTry > 0 ? Number((1 / usdPerTry).toFixed(2)) : 0;
      const eur = eurPerTry > 0 ? Number((1 / eurPerTry).toFixed(2)) : 0;
      const gram =
        xauPerTry > 0 ? Number(((1 / xauPerTry) / TROY_OUNCE_IN_GRAMS).toFixed(2)) : 0;

      if (usd > 0 || eur > 0 || gram > 0) {
        return NextResponse.json(
          {
            success: true,
            isHistorical: true,
            date: json.date || dateParam,
            rates: { usd, eur, gram },
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
            },
          }
        );
      }
    }

    // 2. Yedek: Frankfurter (USD ve EUR döviz kurları için)
    const fxRes = await fetch(
      `https://api.frankfurter.app/${dateParam}?to=TRY,USD`,
      { signal: controller.signal }
    );
    if (fxRes.ok) {
      const fxJson = await fxRes.json();
      const eur = Number(fxJson?.rates?.TRY) || 0;
      const eurToUsd = Number(fxJson?.rates?.USD) || 0;
      const usd = eur > 0 && eurToUsd > 0 ? Number((eur / eurToUsd).toFixed(2)) : 0;

      if (usd > 0 || eur > 0) {
        return NextResponse.json(
          {
            success: true,
            isHistorical: true,
            date: fxJson.date || dateParam,
            rates: { usd, eur, gram: 0 },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        isHistorical: false,
        date: dateParam,
        error: "Seçili tarih için geçmiş kur verisi bulunamadı.",
      },
      { status: 404 }
    );
  } catch (err) {
    console.error("Historical rates API error:", err);
    return NextResponse.json(
      {
        success: false,
        isHistorical: false,
        date: dateParam,
        error: "Geçmiş kurlar getirilirken zaman aşımı veya ağ hatası oluştu.",
      },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

