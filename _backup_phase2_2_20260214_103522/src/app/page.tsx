import Container from "@/components/layout/Container";

export default function Page() {
  return (
    <>
      <section className="border-b border-neutral-200">
        <Container className="py-10">
          <h1 className="text-4xl font-semibold tracking-tight">
            Find your stay in <span className="text-brand">Korea</span>
          </h1>
          <p className="mt-3 text-neutral-600 max-w-2xl">
            Curated stays for international travelers ??clear rules, easy check-in, and a local experience.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:opacity-95">
              Explore stays
            </button>
            <button className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-semibold hover:bg-neutral-50">
              Learn more
            </button>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="rounded-2xl border border-neutral-200 p-6">
          <div className="text-sm font-semibold">Next (Phase 2-2)</div>
          <div className="mt-1 text-sm text-neutral-600">
            Category pills + listing grid (Airbnb-style cards).
          </div>
        </div>
      </Container>
    </>
  );
}
