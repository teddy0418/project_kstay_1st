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
  hostProfileImageUrl: string;
  checkInTime: string;
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
