import Link from "next/link";

const destinations = [
  { label: "Jeju", value: "Jeju", img: "https://source.unsplash.com/800x600/?jeju,island" },
  { label: "Seoul", value: "Seoul", img: "https://source.unsplash.com/800x600/?seoul,city" },
  { label: "Busan", value: "Busan", img: "https://source.unsplash.com/800x600/?busan,beach" },
  { label: "Gangneung", value: "Gangneung", img: "https://source.unsplash.com/800x600/?gangneung,korea" },
  { label: "Incheon", value: "Incheon", img: "https://source.unsplash.com/800x600/?incheon,korea" },
  { label: "Gyeongju", value: "Gyeongju", img: "https://source.unsplash.com/800x600/?gyeongju,korea" },
  { label: "Haeundae", value: "Haeundae", img: "https://source.unsplash.com/800x600/?haeundae,beach" },
  { label: "Gapyeong", value: "Gapyeong", img: "https://source.unsplash.com/800x600/?gapyeong,korea" },
  { label: "Yeosu", value: "Yeosu", img: "https://source.unsplash.com/800x600/?yeosu,korea" },
  { label: "Sokcho", value: "Sokcho", img: "https://source.unsplash.com/800x600/?sokcho,korea" },
];

export default function PopularDestinations() {
  return (
    <section className="mt-8">
      <div className="mb-3 text-lg font-semibold tracking-tight">Popular destinations in Korea</div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {destinations.map((d) => (
          <Link
            key={d.value}
            href={`/browse?where=${encodeURIComponent(d.value)}`}
            className="shrink-0 w-[180px] rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className="h-[110px] bg-neutral-100">
              <img src={d.img} alt={d.label} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold">{d.label}</div>
              <div className="text-xs text-neutral-500">Tap to explore</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
