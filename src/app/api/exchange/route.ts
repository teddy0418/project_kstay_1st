import { getExchangeRates } from "@/lib/exchange";
import { apiOk } from "@/lib/api/response";

const FALLBACK = { KRW: 1, USD: 0.00074, JPY: 0.11, CNY: 0.0054 };

/**
 * Frankfurter API 기반 실시간 환율
 * 클라이언트에서 KRW→선택 통화 변환 시 호출
 */
export async function GET() {
  try {
    const rates = await getExchangeRates();
    return apiOk(rates);
  } catch {
    return apiOk(FALLBACK);
  }
}
