import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getServerSessionUser, requireAdminUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

const approvalItemSelect = {
  id: true,
  title: true,
  city: true,
  area: true,
  address: true,
  basePriceKrw: true,
  status: true,
  approvedAt: true,
  createdAt: true,
  host: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const satisfies Prisma.ListingSelect;

type ApprovalItem = Prisma.ListingGetPayload<{
  select: typeof approvalItemSelect;
}>;

export async function GET() {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) return apiError(401, "UNAUTHORIZED", "Login required");

  const admin = await requireAdminUser();
  if (!admin) return apiError(403, "FORBIDDEN", "Admin access required");

  const items: ApprovalItem[] = await prisma.listing.findMany({
    where: { status: "PENDING" },
    select: approvalItemSelect,
    orderBy: { createdAt: "asc" },
  });

  return apiOk(
    items.map((item) => ({
      id: item.id,
      title: item.title,
      city: item.city,
      area: item.area,
      address: item.address,
      basePriceKrw: item.basePriceKrw,
      status: item.status,
      createdAt: item.createdAt,
      host: item.host,
    }))
  );
}
