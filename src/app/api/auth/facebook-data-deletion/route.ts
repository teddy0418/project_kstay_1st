import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  return Buffer.from(padded, "base64");
}

async function parseSignedRequest(signedRequest: string): Promise<{ user_id: string } | null> {
  if (!APP_SECRET) return null;
  const parts = signedRequest.split(".", 2);
  if (parts.length !== 2) return null;
  const [encodedSig, payload] = parts;
  try {
    const payloadBuf = base64UrlDecode(payload);
    const payloadStr = payloadBuf.toString("utf8");
    const data = JSON.parse(payloadStr) as { user_id?: string };
    if (!data || typeof data.user_id !== "string") return null;

    const sigBuf = base64UrlDecode(encodedSig);
    const crypto = await import("crypto");
    const expectedSig = crypto.createHmac("sha256", APP_SECRET).update(payload).digest();
    if (sigBuf.length !== expectedSig.length || !crypto.timingSafeEqual(sigBuf, expectedSig)) {
      return null;
    }
    return { user_id: data.user_id };
  } catch {
    return null;
  }
}

/**
 * GET: URL 검증용. Facebook 대시보드에서 URL 유효성 검사 시 사용.
 * POST: Facebook Data Deletion Callback (Meta 요구사항).
 */
export async function GET() {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Data Deletion</title></head><body><p>This URL is the Facebook Data Deletion Callback endpoint. User deletion requests are processed via POST. For more information, see our <a href="/privacy">Privacy Policy</a>.</p></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/**
 * Facebook Data Deletion Callback (Meta requirement for Facebook Login).
 * Register this URL in App Dashboard: Settings → Advanced → Data Deletion Request URL.
 * POST body: form field signed_request (signature.payload, base64url).
 */
export async function POST(request: NextRequest) {
  if (!APP_SECRET) {
    return NextResponse.json(
      { error: "Facebook data deletion not configured" },
      { status: 503 }
    );
  }

  let signedRequest: string;
  try {
    const formData = await request.formData();
    const raw = formData.get("signed_request");
    signedRequest = typeof raw === "string" ? raw : "";
  } catch {
    signedRequest = "";
  }

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const parsed = await parseSignedRequest(signedRequest);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const facebookUserId = parsed.user_id;
  const emailLookup = `facebook_${facebookUserId}@facebook.user`;

  const user = await prisma.user.findUnique({
    where: { email: emailLookup },
    select: { id: true, email: true, listings: { select: { id: true } } },
  });

  const confirmationCode = `KSTAY-${Date.now().toString(36).toUpperCase()}-${facebookUserId.slice(-6)}`;
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "https://kstay.com";
  const statusUrl = baseUrl.startsWith("http") ? `${baseUrl}/privacy` : `https://${baseUrl}/privacy`;

  if (!user) {
    return NextResponse.json(
      { url: statusUrl, confirmation_code: confirmationCode },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const hasListings = user.listings.length > 0;

  if (hasListings) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: "Deleted User",
        email: `deleted_${user.id}@deleted.kstay`,
        image: null,
        phone: null,
        nationality: null,
        displayName: null,
        profilePhotoUrl: null,
        profileCompletedAt: null,
      },
    });
  } else {
    await prisma.user.delete({
      where: { id: user.id },
    });
  }

  return NextResponse.json(
    { url: statusUrl, confirmation_code: confirmationCode },
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
