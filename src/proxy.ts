import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, lerToken } from "@/lib/auth";

// Checagem rápida: quem não entrou com senha vai para /login.
// As rotas de API conferem a sessão de novo antes de ler ou gravar.
export async function proxy(request: NextRequest) {
  const perfil = await lerToken(request.cookies.get(COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/login") return NextResponse.next();
    if (!perfil) return NextResponse.json({ erro: "Sessão expirada. Entre de novo." }, { status: 401 });
    return NextResponse.next();
  }
  if (pathname === "/login") {
    return perfil ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (!perfil) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
};
