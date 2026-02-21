import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/exchange";

/**
 * Frankfurter API 기반 실시간 환율
 * 클라이언트에서 KRW→선택 통화 변환 시 호출
 */
export async function GET() {
  try {
    const rates = await getExchangeRates();
    return NextResponse.json(rates);
  } catch {
    return NextResponse.json(
      { KRW: 1, USD: 0.00074, JPY: 0.11, CNY: 0.0054 },
      { status: 200 }
    );
  }
}
