import { apiError, apiOk } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { applyFailedOrCancelledPaymentSync } from "@/lib/repositories/payment-processing";

export const runtime = "nodejs";

type Body = {
  code?: string;
  message?: string;
};

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!token) return apiError(400, "BAD_REQUEST", "Booking token is required");

    const body: Body | null = await safeJson(req);

    const booking = await prisma.booking.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        status: true,
        payments: { orderBy: { createdAt: "asc" }, select: { id: true } },
      },
    });

    if (!booking) return apiError(404, "NOT_FOUND", "Booking not found");

    // 이미 확정/취소된 예약이면 그대로 둔다 (idempotent)
    if (booking.status !== "PENDING_PAYMENT") {
      return apiOk({ cancelled: false, status: booking.status });
    }

    const firstPayment = booking.payments[0];

    await applyFailedOrCancelledPaymentSync({
      bookingId: booking.id,
      paymentRowId: firstPayment?.id,
      paymentStatus: "CANCELLED",
      paymentId: token,
      storeId: null,
      pgTid: null,
      paymentRawJson: JSON.stringify({
        source: "redirect_failure",
        code: body?.code ?? null,
        message: body?.message ?? null,
      }),
    });

    return apiOk({ cancelled: true, status: "CANCELLED" });
  } catch (error) {
    console.error("[api/bookings/public/:token/payment-failed] failed", error);
    return apiError(500, "INTERNAL_ERROR", "Failed to cancel booking after payment failure");
  }
}

async function safeJson(req: Request): Promise<Body | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text) as Body;
  } catch {
    return null;
  }
}

