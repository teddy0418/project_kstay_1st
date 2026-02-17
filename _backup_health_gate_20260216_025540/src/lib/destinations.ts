export type Destination = {
  slug: string;
  label: string;
  value: string;
};

export const DESTINATIONS: Destination[] = [
  { slug: "jeju", label: "Jeju", value: "Jeju" },
  { slug: "seoul", label: "Seoul", value: "Seoul" },
  { slug: "busan", label: "Busan", value: "Busan" },
  { slug: "gangneung", label: "Gangneung", value: "Gangneung" },
  { slug: "incheon", label: "Incheon", value: "Incheon" },
  { slug: "gyeongju", label: "Gyeongju", value: "Gyeongju" },
  { slug: "haeundae", label: "Haeundae", value: "Haeundae" },
  { slug: "gapyeong", label: "Gapyeong", value: "Gapyeong" },
  { slug: "yeosu", label: "Yeosu", value: "Yeosu" },
  { slug: "sokcho", label: "Sokcho", value: "Sokcho" },
];

export function destinationImageCandidates(slug: string) {
  return [
    `/destinations/${slug}.jpg`,
    `/destinations/${slug}.jpeg`,
    `/destinations/${slug}.png`,
    `/destinations/${slug}.webp`,
    `/destinations/${slug}.JPG`,
    `/destinations/${slug}.JPEG`,
    `/destinations/${slug}.PNG`,
    `/destinations/${slug}.WEBP`,
    `/destinations/${slug}.svg`,
  ];
}
