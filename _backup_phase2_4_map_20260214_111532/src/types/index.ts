export type Listing = {
  id: string;
  title: string;
  location: string;       // e.g. "Seoul 쨌 Seongsu"
  startDate: string;      // "YYYY-MM-DD"
  endDate: string;        // "YYYY-MM-DD"
  pricePerNightKRW: number;
  rating: number;         // e.g. 4.89
  imageUrl: string;
  categories: string[];   // slugs
};

export type Category = {
  slug: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; // LucideIcon (kept simple for now)
};
