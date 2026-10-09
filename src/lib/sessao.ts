import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, lerToken } from "./auth";
import { CAMPOS_EDITAVEIS, STATUS, type ItemInput, type Perfil, type Tipo } from "./types";

export async function perfilAtual(): Promise<Perfil | null> {
  const c = await cookies();
  return lerToken(c.get(COOKIE)?.value);
}

export function erro(msg: string, status = 400) {
  return NextResponse.json({ erro: msg }, { status });
}

// Mantém só os campos permitidos e valida o essencial.
export function limparItem(body: Record<string, unknown>, parcial: boolean): ItemInput | string {
  const out: Record<string, unknown> = {};
  for (const k of CAMPOS_EDITAVEIS) {
    if (k in body) {
      const v = body[k];
      out[k] = typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : v;
    }
  }
  for (const k of ["com_imagem", "confirmar"] as const) if (k in out) out[k] = Boolean(out[k]);

  if (!parcial || "tipo" in out) {
    if (!["post", "disparo", "trafego"].includes(out.tipo as string)) return "Tipo inválido";
  }
  if (!parcial || "titulo" in out) {
    if (!out.titulo) return "Dê um título ao item";
    out.titulo = String(out.titulo).slice(0, 200);
  }
  if (!parcial || "data" in out) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(out.data ?? ""))) return "Data inválida";
  }
  if ("data_fim" in out && out.data_fim && !/^\d{4}-\d{2}-\d{2}$/.test(String(out.data_fim))) return "Data de fim inválida";
  if (!parcial && out.tipo) {
    const lista = STATUS[out.tipo as Tipo];
    if (!out.status || !lista.includes(out.status as string)) out.status = lista[0];
  }
  return out as ItemInput;
}
