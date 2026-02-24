export type Category = {
  slug: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
};

export type Listing = {
  id: string;
  title: string;
  location: string;
  address: string;
  images: string[];
  pricePerNightKRW: number;
  rating: number;
  categories: string[];
  lat: number;
  lng: number;
  hostName: string;
  hostBio: string;
  hostBioI18n?: {
    ko?: string;
    ja?: string;
    zh?: string;
  };
  hostProfileImageUrl: string;
  checkInTime: string;
  /** 체크인 안내 (호스트가 작성, 게스트에게 노출) */
  checkInGuideMessage?: string | null;
  /** 이용 규칙·기타 안내 */
  houseRulesMessage?: string | null;
  /** Amenity keys (e.g. wifi, fitness). Shown on guest detail. */
  amenities?: string[];
};

export type BoardPost = {
  id: string;
  title: string;
  city: string;
  coverImage: string;
  excerpt: string;
  content: string;
  createdAt: string;
};

export type BookingStatus =
  | "PAID_PENDING_HOST"
  | "CONFIRMED"
  | "DECLINED_VOIDED"
  | "CANCELLED_REFUNDED";

export type Booking = {
  id: string;
  listingId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  currency: "USD" | "JPY" | "CNY";
  pg_tid?: string;
  settlement_id?: string;
  status: BookingStatus;
  createdAt: string;
};
