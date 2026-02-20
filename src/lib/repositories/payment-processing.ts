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
      listing: { select: { title: true } },
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

export async function applyPaidPaymentSync(input: {
  bookingId: string;
  currentConfirmedAt: Date | null;
  paymentRowId?: string;
  paymentId: string;
  storeId: string | null;
  pgTid: string | null;
  paymentRawJson: string;
}) {
  return prisma.$transaction(async (tx: TransactionClient) => {
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
