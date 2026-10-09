import { NextResponse } from "next/server";
import { criarItem, listarItens } from "@/lib/store";
import { erro, limparItem, perfilAtual } from "@/lib/sessao";

export async function GET() {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  try {
    return NextResponse.json(await listarItens());
  } catch (e) {
    return erro(`Não foi possível carregar: ${(e as Error).message}`, 500);
  }
}

export async function POST(request: Request) {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  const body = await request.json().catch(() => null);
  if (!body) return erro("Dados inválidos");
  const dados = limparItem(body, false);
  if (typeof dados === "string") return erro(dados);
  try {
    return NextResponse.json(await criarItem(dados, perfil), { status: 201 });
  } catch (e) {
    return erro(`Não foi possível salvar: ${(e as Error).message}`, 500);
  }
}
