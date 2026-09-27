import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "dev-only-secret-change-me"
);
const COOKIE = "admin_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      valid = true;
    } catch {
      /* invalid */
    }
  }

  const isLoginRoute = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (valid && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (!valid && !isLoginRoute) {
    const url = new URL("/admin/login", req.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("x-pathname", pathname);
  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};