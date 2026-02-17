import Link from "next/link";
import Image from "next/image";
import Container from "@/components/layout/Container";

const destinations = [
  {
    label: "Seoul",
    where: "Seoul",
    img: "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Busan",
    where: "Busan",
    img: "https://images.unsplash.com/photo-1601621915196-2621bfb0cd0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Jeju",
    where: "Jeju",
    img: "https://images.unsplash.com/photo-1592938849121-3fbd00485b5b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Gyeongju",
    where: "Gyeongju",
    img: "https://images.unsplash.com/photo-1604908812705-4de8ce3f6b12?auto=format&fit=crop&w=1200&q=80",
  },
  {
    label: "Gangneung",
    where: "Gangneung",
    img: "https://images.unsplash.com/photo-1598514982847-85f3fa5dbe0d?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function PopularDestinations() {
  return (
    <section className="border-b border-neutral-200">
      <Container className="py-8">
        <h2 className="text-lg font-semibold">Popular Destinations in Korea</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {destinations.map((d) => (
            <Link
              key={d.label}
              href={`/browse?where=${encodeURIComponent(d.where)}`}
              className="shrink-0 w-[160px]"
            >
              <div className="relative h-24 overflow-hidden rounded-2xl bg-neutral-100">
                <Image
                  src={d.img}
                  alt={d.label}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div className="mt-2 text-sm font-semibold">{d.label}</div>
              <div className="text-xs text-neutral-500">Tap to explore</div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
