const PORTONE_API_BASE = "https://api.portone.io";

export type CancelPaymentResult =
  | { ok: true; cancellation: { id: string; totalAmount: number; cancelledAt: string } }
  | { ok: false; reason: string };

/**
 * PortOne V2 결제 취소 (전액 환불).
 * POST /payments/{paymentId}/cancel
 */
export async function cancelPortonePayment(
  paymentId: string,
  reason: string
): Promise<CancelPaymentResult> {
  const apiSecret = String(process.env.PORTONE_API_SECRET ?? "").trim();
  if (!apiSecret) {
    return { ok: false, reason: "PORTONE_API_SECRET is missing" };
  }

  try {
    const res = await fetch(
      `${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `PortOne ${apiSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
        cache: "no-store",
      }
    );

    const text = await res.text();

    if (!res.ok) {
      console.error("[portone/cancel] API error", { status: res.status, body: text });
      return { ok: false, reason: `PortOne cancel API returned ${res.status}` };
    }

    let parsed: { cancellation?: { id?: string; totalAmount?: number; cancelledAt?: string } } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, reason: "Failed to parse PortOne cancel response" };
    }

    return {
      ok: true,
      cancellation: {
        id: parsed.cancellation?.id ?? paymentId,
        totalAmount: parsed.cancellation?.totalAmount ?? 0,
        cancelledAt: parsed.cancellation?.cancelledAt ?? new Date().toISOString(),
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[portone/cancel] fetch failed", msg);
    return { ok: false, reason: msg };
  }
}
