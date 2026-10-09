import { NextResponse } from "next/server";
import { excluirCampanha, listarCampanhas, salvarCampanha, explicarErro } from "@/lib/store";
import { erro, perfilAtual } from "@/lib/sessao";

export async function GET() {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  try {
    return NextResponse.json(await listarCampanhas());
  } catch (e) {
    return erro(explicarErro(e), 500);
  }
}

// cria (sem id) ou atualiza (com id) — só a equipe
export async function POST(request: Request) {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  if (perfil !== "equipe") return erro("Só a equipe pode editar campanhas.", 403);
  const b = (await request.json().catch(() => ({}))) as { id?: string; nome?: string; cor?: string; ativa?: boolean };
  const nome = String(b.nome ?? "").trim().slice(0, 80);
  const cor = /^#[0-9a-fA-F]{6}$/.test(String(b.cor)) ? String(b.cor) : "#0e7490";
  if (!nome) return erro("Dê um nome à campanha");
  try {
    return NextResponse.json(await salvarCampanha({ id: b.id, nome, cor, ativa: b.ativa ?? true }));
  } catch (e) {
    return erro(`Não foi possível salvar: ${explicarErro(e)}`, 500);
  }
}

export async function DELETE(request: Request) {
  const perfil = await perfilAtual();
  if (!perfil) return erro("Sessão expirada. Entre de novo.", 401);
  if (perfil !== "equipe") return erro("Só a equipe pode excluir campanhas.", 403);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return erro("Campanha não informada");
  try {
    await excluirCampanha(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return erro(`Não foi possível excluir: ${explicarErro(e)}`, 500);
  }
}
