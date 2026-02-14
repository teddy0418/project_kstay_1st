import type { Category, Listing } from "@/types";
import {
  Flame,
  Building2,
  Home,
  Landmark,
  Waves,
  Mountain,
  Trees,
  Sparkles,
  Castle,
  Plane,
} from "lucide-react";

export const categories: Category[] = [
  { slug: "trending", label: "Trending", icon: Flame },
  { slug: "apartments", label: "Apartments", icon: Building2 },
  { slug: "homes", label: "Homes", icon: Home },
  { slug: "hanok", label: "Hanok", icon: Landmark },
  { slug: "ocean", label: "Ocean view", icon: Waves },
  { slug: "mountain", label: "Mountain view", icon: Mountain },
  { slug: "nature", label: "Nature", icon: Trees },
  { slug: "premium", label: "Premium", icon: Sparkles },
  { slug: "unique", label: "Unique stays", icon: Castle },
  { slug: "airport", label: "Near airport", icon: Plane },
];

export const listings: Listing[] = [
  {
    id: "seoul-seongsu-studio",
    location: "Seoul 쨌 Seongsu",
    title: "Cozy studio near Seoul Forest (3 min walk)",
    startDate: "2026-02-18",
    endDate: "2026-02-23",
    pricePerNightKRW: 98000,
    rating: 4.89,
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80",
    categories: ["trending", "apartments"],
  },
  {
    id: "seoul-hongdae-loft",
    location: "Seoul 쨌 Hongdae",
    title: "Modern loft steps from Hongdae nightlife",
    startDate: "2026-02-20",
    endDate: "2026-02-25",
    pricePerNightKRW: 115000,
    rating: 4.76,
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    categories: ["trending", "apartments"],
  },
  {
    id: "seoul-bukchon-hanok",
    location: "Seoul 쨌 Bukchon",
    title: "Quiet Bukchon hanok with a private courtyard",
    startDate: "2026-03-02",
    endDate: "2026-03-07",
    pricePerNightKRW: 210000,
    rating: 4.93,
    imageUrl:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80",
    categories: ["hanok", "premium"],
  },
  {
    id: "busan-haeundae-ocean",
    location: "Busan 쨌 Haeundae",
    title: "Panoramic ocean view ??sunrise from bed",
    startDate: "2026-02-28",
    endDate: "2026-03-04",
    pricePerNightKRW: 145000,
    rating: 4.81,
    imageUrl:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80",
    categories: ["ocean", "trending"],
  },
  {
    id: "jeju-aewol-stonehouse",
    location: "Jeju 쨌 Aewol",
    title: "Jeju stone house with warm wood interior",
    startDate: "2026-03-10",
    endDate: "2026-03-14",
    pricePerNightKRW: 175000,
    rating: 4.88,
    imageUrl:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80",
    categories: ["nature", "unique", "premium"],
  },
  {
    id: "gangneung-cozy-home",
    location: "Gangneung 쨌 Gyeongpo",
    title: "Cozy home near the beach (5 min walk)",
    startDate: "2026-02-22",
    endDate: "2026-02-26",
    pricePerNightKRW: 109000,
    rating: 4.72,
    imageUrl:
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80",
    categories: ["ocean", "homes"],
  },
  {
    id: "seoul-namsan-suite",
    location: "Seoul 쨌 Namsan",
    title: "Premium suite with Namsan view",
    startDate: "2026-03-01",
    endDate: "2026-03-05",
    pricePerNightKRW: 260000,
    rating: 4.95,
    imageUrl:
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1600&q=80",
    categories: ["premium", "mountain"],
  },
  {
    id: "incheon-airport-stay",
    location: "Incheon 쨌 Near airport",
    title: "Perfect for transit ??easy airport access",
    startDate: "2026-02-19",
    endDate: "2026-02-21",
    pricePerNightKRW: 89000,
    rating: 4.67,
    imageUrl:
      "https://images.unsplash.com/photo-1502005097973-6a7082348e28?auto=format&fit=crop&w=1600&q=80",
    categories: ["airport", "apartments"],
  },
];
