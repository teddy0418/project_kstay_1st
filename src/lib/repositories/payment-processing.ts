import { prisma } from "@/lib/db";

type TransactionClient = Parameters<typeof prisma.$transaction>[0] extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

export async function findBookingForMockConfirm(token: string) {
  return prisma.booking.findUnique({
    where: { publicToken: token },
    include: {
      listing: {
        select: { title: true },
      },
      payments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function confirmMockBookingById(bookingId: string) {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
      include: {
        listing: {
          select: { title: true },
        },
      },
    });

    const firstPayment = await tx.payment.findFirst({
      where: { bookingId: booking.id },
      orderBy: { createdAt: "asc" },
    });

    if (firstPayment) {
      await tx.payment.update({
        where: { id: firstPayment.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return booking;
  });
}

export async function markBookingConfirmationEmailSentIfNeeded(bookingId: string) {
  await prisma.booking.updateMany({
    where: {
      id: bookingId,
      confirmationEmailSentAt: null,
    },
    data: {
      confirmationEmailSentAt: new Date(),
    },
  });
}

export async function findBookingForConfirmationEmailById(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          title: true,
          checkInTime: true,
          checkOutTime: true,
          checkInGuideMessage: true,
          houseRulesMessage: true,
          address: true,
          roadAddress: true,
          detailedAddress: true,
          city: true,
          area: true,
          stateProvince: true,
          cityDistrict: true,
          zipCode: true,
        },
      },
    },
  });
}

export async function createPortoneWebhookEvent(input: {
  webhookId: string;
  webhookTimestamp: string;
  webhookSignature: string;
  payloadRaw: string;
  parsedType: string | null;
  paymentId: string | null;
}) {
  return prisma.paymentWebhookEvent.create({
    data: {
      provider: "PORTONE",
      webhookId: input.webhookId,
      webhookTimestamp: input.webhookTimestamp,
      webhookSignature: input.webhookSignature,
      payloadRaw: input.payloadRaw,
      parsedType: input.parsedType,
      paymentId: input.paymentId,
    },
  });
}

export async function findBookingForPaymentSync(paymentId: string) {
  return prisma.booking.findUnique({
    where: { publicToken: paymentId },
    include: {
      listing: { select: { title: true } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
}

/** 결제 완료 반영. PENDING_PAYMENT인 경우만 CONFIRMED로 변경. 이미 CANCELLED(만료 등)면 null 반환. */
export async function applyPaidPaymentSync(input: {
  bookingId: string;
  currentConfirmedAt: Date | null;
  paymentRowId?: string;
  paymentId: string;
  storeId: string | null;
  pgTid: string | null;
  paymentRawJson: string;
}): Promise<Awaited<ReturnType<typeof prisma.booking.findUnique>> & { status: string } | null> {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const existing = await tx.booking.findUnique({
      where: { id: input.bookingId },
      select: { status: true },
    });
    if (!existing || existing.status !== "PENDING_PAYMENT") {
      return null;
    }

    const updatedBooking = await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        status: "CONFIRMED",
        confirmedAt: input.currentConfirmedAt ?? new Date(),
      },
      include: {
        listing: { select: { title: true } },
      },
    });

    if (input.paymentRowId) {
      await tx.payment.update({
        where: { id: input.paymentRowId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          providerPaymentId: input.paymentId,
          storeId: input.storeId,
          pgTid: input.pgTid,
          rawJson: input.paymentRawJson,
        },
      });
    }

    return updatedBooking;
  });
}

export async function applyFailedOrCancelledPaymentSync(input: {
  bookingId: string;
  paymentRowId?: string;
  paymentStatus: "FAILED" | "CANCELLED";
  paymentId: string;
  storeId: string | null;
  pgTid: string | null;
  paymentRawJson: string;
}) {
  await prisma.$transaction(async (tx: TransactionClient) => {
    await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    if (input.paymentRowId) {
      await tx.payment.update({
        where: { id: input.paymentRowId },
        data: {
          status: input.paymentStatus,
          providerPaymentId: input.paymentId,
          storeId: input.storeId,
          pgTid: input.pgTid,
          rawJson: input.paymentRawJson,
        },
      });
    }
  });
}

export async function applyInitiatedPaymentSync(input: {
  paymentRowId: string;
  paymentId: string;
  storeId: string | null;
  pgTid: string | null;
  paymentRawJson: string;
}) {
  await prisma.payment.update({
    where: { id: input.paymentRowId },
    data: {
      status: "INITIATED",
      providerPaymentId: input.paymentId,
      storeId: input.storeId,
      pgTid: input.pgTid,
      rawJson: input.paymentRawJson,
    },
  });
}
