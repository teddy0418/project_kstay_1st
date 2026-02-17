export default function HelpPage() {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="text-3xl font-extrabold tracking-tight">Help Center</div>
        <div className="mt-2 text-sm text-neutral-600">
          Policies and FAQs for KSTAY guests.
        </div>

        <div className="mt-8 grid gap-4">
          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">Cancellation policy</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">
              Free cancellation is available until <b>7 days</b> before check-in (Korea Time, KST).
              After that, cancellations may not be refundable.
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">Pricing</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">
              KSTAY shows the <b>final price</b> upfront (tax &amp; service fee included) to avoid surprises at checkout.
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white shadow-sm p-6">
            <div className="text-lg font-bold">Contact</div>
            <div className="mt-2 text-sm text-neutral-600 leading-6">
              For urgent issues, please contact support via Messages (coming soon).
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
