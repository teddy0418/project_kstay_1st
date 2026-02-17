import Link from "next/link";
import Container from "@/components/layout/Container";

const destinations = [
  { label: "Seoul", where: "Seoul", img: "/destinations/seoul.svg" },
  { label: "Busan", where: "Busan", img: "/destinations/busan.svg" },
  { label: "Jeju", where: "Jeju", img: "/destinations/jeju.svg" },
  { label: "Gyeongju", where: "Gyeongju", img: "/destinations/gyeongju.svg" },
  { label: "Gangneung", where: "Gangneung", img: "/destinations/gangneung.svg" },
];

export default function PopularDestinations() {
  console.log("[KSTAY:server] 4. PopularDestinations render", { count: destinations.length });
  return (
    <section className="border-b border-neutral-200">
      <Container className="py-8">
        <h2 className="text-lg font-semibold">Popular Destinations in Korea</h2>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {destinations.map((d) => (
            <Link
              key={d.label}
              href={`/browse?where=${encodeURIComponent(d.where)}`}
              className="shrink-0 w-[170px] transition-transform hover:-translate-y-0.5"
            >
              <div className="relative h-24 overflow-hidden rounded-2xl bg-neutral-100 shadow-soft">
                <img
                  src={d.img}
                  alt={d.label}
                  className="h-full w-full object-cover"
                  loading="lazy"
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
