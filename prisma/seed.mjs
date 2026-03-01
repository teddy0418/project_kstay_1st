import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding.");
}
if (connectionString.startsWith("file:")) {
  throw new Error("DATABASE_URL must be PostgreSQL (postgresql://...), not SQLite file URL.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { id: "demo-admin" },
    update: { role: "ADMIN", name: "Admin" },
    create: {
      id: "demo-admin",
      role: "ADMIN",
      name: "Admin",
      email: "admin@kstay.dev",
    },
  });

  const host = await prisma.user.upsert({
    where: { id: "demo-host" },
    update: { role: "HOST", name: "Host" },
    create: {
      id: "demo-host",
      role: "HOST",
      name: "Host",
      email: "host@kstay.dev",
    },
  });

  await prisma.hostProfile.upsert({
    where: { userId: host.id },
    update: { displayName: "Demo Host" },
    create: { userId: host.id, displayName: "Demo Host" },
  });

  const listing = await prisma.listing.upsert({
    where: { id: "seed-seoul-jongno" },
    update: {
      title: "Demo Seoul Stay",
      city: "Seoul",
      area: "Jongno",
      address: "Jongno-gu, Seoul, Korea",
      location: "Seoul · Jongno",
      basePriceKrw: 120000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
    create: {
      id: "seed-seoul-jongno",
      hostId: host.id,
      title: "Demo Seoul Stay",
      city: "Seoul",
      area: "Jongno",
      address: "Jongno-gu, Seoul, Korea",
      location: "Seoul · Jongno",
      basePriceKrw: 120000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const existing = await prisma.listingImage.count({ where: { listingId: listing.id } });
  if (existing === 0) {
    await prisma.listingImage.createMany({
      data: [
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80",
          sortOrder: 0,
        },
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
          sortOrder: 1,
        },
      ],
    });
  }

  // 결제 테스트용 예시 숙소 (결제창까지 확인용)
  const paymentTestListing = await prisma.listing.upsert({
    where: { id: "payment-test-listing" },
    update: {
      title: "결제 테스트용 예시 숙소",
      titleKo: "결제 테스트용 예시 숙소",
      city: "Seoul",
      area: "Gangnam",
      address: "Gangnam-gu, Seoul, Korea",
      location: "Seoul · Gangnam",
      basePriceKrw: 50000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
    create: {
      id: "payment-test-listing",
      hostId: host.id,
      title: "결제 테스트용 예시 숙소",
      titleKo: "결제 테스트용 예시 숙소",
      city: "Seoul",
      area: "Gangnam",
      address: "Gangnam-gu, Seoul, Korea",
      location: "Seoul · Gangnam",
      basePriceKrw: 50000,
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const paymentTestImages = await prisma.listingImage.count({ where: { listingId: paymentTestListing.id } });
  if (paymentTestImages === 0) {
    await prisma.listingImage.createMany({
      data: [
        { listingId: paymentTestListing.id, url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80", sortOrder: 0 },
        { listingId: paymentTestListing.id, url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80", sortOrder: 1 },
      ],
    });
  }

  // Admin 계정(official.kstay@gmail.com) 체크인 완료 예시 예약 (프로필 Your trips / 리뷰 쓰기 확인용)
  const adminForTrip = await prisma.user.findFirst({
    where: { email: "official.kstay@gmail.com" },
  });
  const guestUser = adminForTrip ?? admin;

  const pastCheckOut = new Date();
  pastCheckOut.setDate(pastCheckOut.getDate() - 3);
  pastCheckOut.setHours(0, 0, 0, 0);
  const pastCheckIn = new Date(pastCheckOut);
  pastCheckIn.setDate(pastCheckIn.getDate() - 2);
  const cancelDeadline = new Date(pastCheckIn);
  cancelDeadline.setDate(cancelDeadline.getDate() - 7);

  const existingAdminBooking = await prisma.booking.findFirst({
    where: { guestUserId: guestUser.id, status: "CONFIRMED", listingId: listing.id },
  });
  if (!existingAdminBooking) {
    const adminBooking = await prisma.booking.create({
      data: {
        publicToken: `seed-admin-past-${Date.now()}`,
        listingId: listing.id,
        guestUserId: guestUser.id,
        guestEmail: guestUser.email ?? "official.kstay@gmail.com",
        guestName: guestUser.name ?? "Admin",
        checkIn: pastCheckIn,
        checkOut: pastCheckOut,
        nights: 2,
        totalUsd: 20,
        totalKrw: 240000,
        status: "CONFIRMED",
        confirmedAt: new Date(),
        cancellationDeadlineKst: cancelDeadline,
      },
    });
    console.log("Admin 예시 예약 생성 (체크아웃 완료)", { bookingId: adminBooking.id, guestEmail: guestUser.email });
  }

  // 게스트 게시판 예시 글 (없을 때만 생성, 4개)
  const boardCount = await prisma.boardPost.count();
  if (boardCount === 0) {
    await prisma.boardPost.createMany({
      data: [
        {
          cover: "https://images.unsplash.com/photo-1548940740-204726a19be3?auto=format&fit=crop&w=1400&q=60",
          title: { en: "5 must-try foods in Busan", ko: "부산에서 꼭 먹어야 할 음식 5가지", ja: "釜山で絶対食べたいグルメ5選", zh: "釜山必吃美食 5 选" },
          excerpt: { en: "Quick guide for first-time visitors.", ko: "처음 방문한 외국인도 쉽게 따라 하는 맛집 가이드.", ja: "初めての方でも安心なグルメガイド。", zh: "第一次来釜山也能轻松跟着吃的指南。" },
          content: { en: "If you're visiting Busan, start with seafood near Jagalchi Market, then try milmyeon (wheat noodles), pork soup (dwaeji-gukbap), hotteok, and fresh sashimi.", ko: "부산에 왔다면 자갈치시장 근처 해산물부터 시작해서, 밀면·돼지국밥·씨앗호떡·회까지 코스로 즐겨보세요.", ja: "釜山ならジャガルチ市場周辺の海鮮、ミルミョン、デジクッパ、ホットク、刺身がおすすめです。", zh: "来釜山可以从札嘎其市场附近的海鲜开始，再尝尝小麦面、猪肉汤饭、糖饼和生鱼片。" },
          sortOrder: 0,
        },
        {
          cover: "https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=60",
          title: { en: "How to use Kakao T like a local", ko: "카카오T를 현지인처럼 쓰는 방법", ja: "カカオTをローカルのように使うコツ", zh: "像当地人一样使用 Kakao T 的方法" },
          excerpt: { en: "Taxi tips + translation shortcuts.", ko: "택시 팁 + 번역 꿀팁까지 한 번에!", ja: "タクシーのコツ＋翻訳ショートカット。", zh: "打车技巧 + 翻译小窍门。" },
          content: { en: "Use Kakao T for reliable taxis. Save your destination in Korean and show it to the driver. For late-night rides, confirm the pickup point before requesting.", ko: "카카오T로 택시를 부르면 가장 안정적입니다. 목적지를 한글로 저장해두고 기사님께 보여주면 실수가 줄어요. 심야에는 탑승 위치를 먼저 확인하고 호출하세요.", ja: "カカオTでタクシー手配が最も確実です。行き先は韓国語で保存して運転手に見せると安心。深夜は乗車地点を確認してから呼びましょう。", zh: "使用 Kakao T 叫车更可靠。把目的地保存为韩文并给司机看。深夜出行前先确认上车点再叫车。" },
          sortOrder: 1,
        },
        {
          cover: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=60",
          title: { en: "Check-in tips: what to bring and when to arrive", ko: "체크인 꿀팁 — 준비물과 도착 시간", ja: "チェックインのコツ：持参品と到着時間", zh: "入住小贴士：要带什么、几点到" },
          excerpt: { en: "Smooth check-in with your host.", ko: "호스트와 수월한 체크인을 위한 준비사항.", ja: "ホストとのスムーズなチェックインのポイント。", zh: "和房东顺利入住的小准备。" },
          content: { en: "Confirm check-in time with your host in advance. Have your ID and booking confirmation ready. If you will be late, message the host. Most stays have key lockboxes or door codes—ask before arrival.", ko: "체크인 시간을 미리 호스트와 확인하세요. 신분증과 예약 확인서를 준비하고, 늦어지면 연락하는 게 좋아요. 대부분 키 보관함이나 도어코드를 사용하니 도착 전에 안내를 받으세요.", ja: "チェックイン時間は事前にホストと確認。身分証と予約確認を用意し、遅れる場合は連絡を。鍵ボックスやドアコードが多いので、到着前に案内をもらいましょう。", zh: "提前和房东确认入住时间，准备好证件和订单。会晚到时发消息说明。很多住宿用钥匙盒或门锁密码，出发前问清楚。" },
          sortOrder: 2,
        },
        {
          cover: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1400&q=60",
          title: { en: "Best neighborhoods in Seoul for first-timers", ko: "서울 처음 와도 좋은 동네 추천", ja: "初めてのソウルにおすすめのエリア", zh: "首尔适合初访者的街区推荐" },
          excerpt: { en: "Where to stay and what to do by area.", ko: "지역별 숙소·할 거리 가이드.", ja: "エリア別の宿と過ごし方。", zh: "按区域推荐住宿和玩法。" },
          content: { en: "Hongdae for nightlife and young vibe, Myeongdong for shopping and food, Jongno for palaces and tradition, Gangnam for business and upscale dining. Pick by your style.", ko: "밤문화와 젊은 분위기는 홍대, 쇼핑·맛집은 명동, 궁궐과 전통은 종로, 비즈니스·고급 식당은 강남. 성향에 맞춰 고르면 됩니다.", ja: "ナイトライフは弘大、ショッピング・グルメは明洞、宮殿・伝統は鍾路、ビジネス・高級料理は江南。好みで選んで。", zh: "夜生活和年轻氛围选弘大，购物美食选明洞，宫殿传统选钟路，商务和高档餐厅选江南。按喜好选就行。" },
          sortOrder: 3,
        },
      ],
    });
    console.log("Board posts created (4 sample posts)");
  }

  console.log("Seed complete", {
    admin: admin.id,
    host: host.id,
    listing: listing.id,
    paymentTestListing: paymentTestListing.id,
    paymentTestUrl: `/listings/${paymentTestListing.id}?start=2026-03-01&end=2026-03-03&guests=1`,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
