import { NextResponse } from "next/server";
import { COOKIE, DURACAO_SEGUNDOS, criarToken, perfilDaSenha } from "@/lib/auth";

export async function POST(request: Request) {
  if (!process.env.SENHA_EQUIPE) {
    return NextResponse.json({ erro: "O sistema ainda não tem senha configurada (SENHA_EQUIPE)." }, { status: 500 });
  }
  const { senha } = (await request.json().catch(() => ({}))) as { senha?: string };
  // pequena pausa para dificultar tentativas em sequência
  await new Promise((r) => setTimeout(r, 400));
  const perfil = perfilDaSenha(String(senha ?? ""));
  if (!perfil) return NextResponse.json({ erro: "Senha incorreta." }, { status: 401 });

  const token = await criarToken(perfil);
  const res = NextResponse.json({ ok: true, perfil });
  res.cookies.set(COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
