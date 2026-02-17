import Link from "next/link";
import Container from "@/components/layout/Container";

const destinations = [
  {
    label: "Seoul",
    where: "Seoul",
    img: "https://source.unsplash.com/featured/800x600/?seoul,korea",
  },
  {
    label: "Busan",
    where: "Busan",
    img: "https://source.unsplash.com/featured/800x600/?busan,korea",
  },
  {
    label: "Jeju",
    where: "Jeju",
    img: "https://source.unsplash.com/featured/800x600/?jeju,island,korea",
  },
  {
    label: "Gyeongju",
    where: "Gyeongju",
    img: "https://source.unsplash.com/featured/800x600/?gyeongju,korea",
  },
  {
    label: "Gangneung",
    where: "Gangneung",
    img: "https://source.unsplash.com/featured/800x600/?gangneung,korea",
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
                <img
                  src={d.img}
                  alt={d.label}
                  loading="lazy"
                  className="h-full w-full object-cover"
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
