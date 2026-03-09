import { getExchangeRates } from "@/lib/exchange";
import { apiOk } from "@/lib/api/response";
import { KRW_PER } from "@/lib/currency";

const FALLBACK: Record<string, number> = { KRW: 1 };
for (const [code, per] of Object.entries(KRW_PER)) {
  if (code !== "KRW") FALLBACK[code] = 1 / per;
}

/**
 * Frankfurter API 기반 실시간 환율 (엑심베이 DCC 12개국 + KRW)
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
