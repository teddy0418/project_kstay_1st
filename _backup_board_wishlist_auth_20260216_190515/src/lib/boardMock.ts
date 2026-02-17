import type { BoardPost } from "@/types";

export const boardPosts: BoardPost[] = [
  {
    id: "1",
    title: "Best street food near Gwangjang Market",
    city: "Seoul",
    coverImage: "https://images.unsplash.com/photo-1548940740-204726a19be3?auto=format&fit=crop&w=1400&q=60",
    excerpt: "A quick list of must-try bites and how to order like a local.",
    content:
      "If you're visiting Gwangjang Market, start with bindaetteok (mung bean pancake) and mayak gimbap.\n\nTip: Go early to avoid long lines, and bring cash for faster checkout.\n\nNearest subway: Jongno 5(o)-ga Station (Line 1).",
    createdAt: "2026-02-01",
  },
  {
    id: "2",
    title: "Jeju: One-day itinerary without a car",
    city: "Jeju",
    coverImage: "https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=60",
    excerpt: "Bus routes + café stops that still feel like Jeju.",
    content:
      "Start from Jeju City Terminal and take bus to Hamdeok Beach.\n\nThen head to a coastal café and finish at Dongmun Market for dinner.\n\nPro tip: Use KakaoMap to check bus arrival times in real-time.",
    createdAt: "2026-02-02",
  },
  {
    id: "3",
    title: "Busan: Haeundae sunset photo spots",
    city: "Busan",
    coverImage: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=60",
    excerpt: "Three spots that look great even on cloudy days.",
    content:
      "1) Haeundae Beach main strip.\n2) Dongbaekseom trail.\n3) Mipo railway walk.\n\nTry arriving 40 minutes before sunset to get good light.",
    createdAt: "2026-02-04",
  },
  {
    id: "4",
    title: "Gangneung café crawl: 4 stops",
    city: "Gangneung",
    coverImage: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1400&q=60",
    excerpt: "A relaxed route for coffee lovers by the sea.",
    content:
      "Gangneung is a café city. Pair your stay with a short café crawl.\n\nStop 1: Beachfront espresso.\nStop 2: Bakery + drip.\nStop 3: Roastery tour.\nStop 4: Sunset latte.",
    createdAt: "2026-02-06",
  },
];

export function getBoardPost(id: string) {
  return boardPosts.find((p) => p.id === id);
}
