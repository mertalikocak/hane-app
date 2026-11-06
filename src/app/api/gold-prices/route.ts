import { NextRequest, NextResponse } from "next/server";
import { GoldPriceService } from "@/services/goldPriceService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    const prices = await GoldPriceService.getGoldPrices(forceRefresh);

    return NextResponse.json(prices, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("API /api/gold-prices route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Altın fiyatları getirilirken beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    );
  }
}

