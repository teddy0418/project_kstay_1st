import Container from "@/components/layout/Container";

export default function SignupPage() {
  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP: 1-second signup (Google/Apple) will be added next.
      </p>

      <div className="mt-6 grid gap-3 max-w-md">
        <button className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95">
          Create account (placeholder)
        </button>
        <div className="text-xs text-neutral-500">
          By signing up, you agree to our Terms & Privacy Policy (to be added).
        </div>
      </div>
    </Container>
  );
}
