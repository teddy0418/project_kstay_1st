import { prisma } from "@/lib/db";
import { getOrCreateServerUser } from "@/lib/auth/server";
import { apiError, apiOk } from "@/lib/api/response";

type Body = {
  title?: string;
  city?: string;
  area?: string;
  address?: string;
  basePriceKrw?: number;
  checkInTime?: string;
  checkOutTime?: string;
};

export async function POST(req: Request) {
  const user = await getOrCreateServerUser();
  if (!user) {
    return apiError(401, "UNAUTHORIZED", "Login required");
  }

  const body = (await req.json()) as Body;
  const title = String(body.title ?? "").trim();
  const city = String(body.city ?? "").trim();
  const area = String(body.area ?? "").trim();
  const address = String(body.address ?? "").trim();
  const basePriceKrw = Number(body.basePriceKrw ?? 0);

  if (title.length < 2 || city.length < 2 || area.length < 1 || address.length < 5 || basePriceKrw <= 0) {
    return apiError(400, "BAD_REQUEST", "Invalid listing input");
  }

  await prisma.hostProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName: user.name },
    update: { displayName: user.name },
  });

  if (user.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "HOST" },
    });
  }

  const listing = await prisma.listing.create({
    data: {
      hostId: user.id,
      title,
      city,
      area,
      address,
      location: `${city} · ${area}`,
      basePriceKrw,
      status: "PENDING",
      checkInTime: body.checkInTime || "15:00",
      images: {
        create: [
          {
            url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
            sortOrder: 0,
          },
        ],
      },
    },
    select: { id: true, status: true },
  });

  return apiOk(listing, 201);
}
