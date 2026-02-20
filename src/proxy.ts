import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    authorized({ req, token }) {
      const pathname = req.nextUrl.pathname;
      const role = (token?.role as "GUEST" | "HOST" | "ADMIN" | undefined) ?? "GUEST";

      if (pathname.startsWith("/admin")) {
        return role === "ADMIN";
      }

      if (pathname.startsWith("/host")) {
        return !!token;
      }

      return !!token;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/host/:path*"],
};
