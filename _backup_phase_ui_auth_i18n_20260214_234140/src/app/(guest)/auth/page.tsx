import Container from "@/components/layout/Container";
import { cookies } from "next/headers";
import { ROLE_COOKIE } from "@/lib/auth/session";

export default async function AuthPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next =
    typeof searchParams?.next === "string" && searchParams.next.startsWith("/")
      ? searchParams.next
      : "";
  const cookieStore = await cookies();
  const role = cookieStore.get(ROLE_COOKIE)?.value;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        Log in / Sign up
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        MVP(개발용): 역할을 선택해서 Guest / Host / Admin 화면을 테스트합니다.
      </p>

      <div className="mt-4 rounded-2xl border border-neutral-200 p-4 text-sm">
        <div className="font-semibold">Current session</div>
        <div className="mt-1 text-neutral-600">
          {role ? (
            <>
              Role: <span className="font-mono font-semibold">{role}</span>
              <span className="mx-2">·</span>
              <a className="text-brand underline" href="/auth/logout">
                Log out
              </a>
            </>
          ) : (
            <span className="text-neutral-500">Not logged in</span>
          )}
        </div>
      </div>

      <form
        className="mt-6 grid gap-3 max-w-md"
        action="/auth/login"
        method="post"
      >
        <input type="hidden" name="next" value={next} />

        <button
          type="submit"
          name="role"
          value="guest"
          className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          Continue as Guest
        </button>

        <button
          type="submit"
          name="role"
          value="host"
          className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold hover:bg-neutral-50 transition"
        >
          Continue as Host (Korean host portal)
        </button>

        <button
          type="submit"
          name="role"
          value="admin"
          className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
        >
          Continue as Admin (Operations)
        </button>

        <div className="mt-2 text-xs text-neutral-500">
          실서비스에서는 Google/Apple 소셜 로그인을 연결할 예정입니다.
        </div>
      </form>
    </Container>
  );
}
