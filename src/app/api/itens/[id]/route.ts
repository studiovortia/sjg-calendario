import { NextResponse } from "next/server";
import { atualizarItem, excluirItem } from "@/lib/store";
import { erro, limparItem, perfilAtual } from "@/lib/sessao";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return erro("Dados inválidos");
  const dados = limparItem(body, true);
  if (typeof dados === "string") return erro(dados);
  try {
    const item = await atualizarItem(id, dados, perfil);
    if (!item) return erro("Item não encontrado", 404);
    return NextResponse.json(item);
  } catch (e) {
    return erro(`Não foi possível salvar: ${(e as Error).message}`, 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  if (perfil !== "equipe") return erro("Só a equipe pode excluir itens.", 403);
  const { id } = await params;
  try {
    await excluirItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erro(`Não foi possível excluir: ${(e as Error).message}`, 500);
  }
}
