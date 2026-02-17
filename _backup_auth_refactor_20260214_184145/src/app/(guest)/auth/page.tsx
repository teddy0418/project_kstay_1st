import Container from "@/components/layout/Container";

export default function AuthPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Log in / Sign up</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: Social login (Google/Apple) will be connected next.
      </p>

      <div className="mt-6 grid gap-3 max-w-md">
        <button className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition">
          Continue with Google (placeholder)
        </button>
        <button className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition">
          Continue with Apple (placeholder)
        </button>

        <div className="mt-2 text-xs text-neutral-500">
          You can browse without logging in. Login is required for Wishlist and bookings.
        </div>
      </div>
    </Container>
  );
}
