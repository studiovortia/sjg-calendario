import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Campanha, Item, ItemInput, Perfil } from "./types";

// ---------------------------------------------------------------------
// Acesso a dados. Com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY configurados,
// usa o Supabase. Sem eles, roda em "modo demonstração" (dados na memória,
// somem ao reiniciar) — útil só para testar no computador.
// ---------------------------------------------------------------------

// Aceita os formatos mais comuns que alguém pode colar no Vercel:
// "https://abc.supabase.co", "abc.supabase.co", só o código "abc",
// o link do painel ".../dashboard/project/abc/..." ou ".../rest/v1".
export function normalizarUrl(bruto: string | undefined): string | null {
  if (!bruto) return null;
  let v = bruto.trim().replace(/^["']|["']$/g, "").trim();
  const painel = v.match(/project\/([a-z0-9]{15,})/i);
  if (painel) return `https://${painel[1].toLowerCase()}.supabase.co`;
  if (/^[a-z0-9]{15,}$/i.test(v)) return `https://${v.toLowerCase()}.supabase.co`;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  v = v.replace(/\/+$/, "").replace(/\/rest\/v1$/i, "").replace(/\/+$/, "");
  try {
    const u = new URL(v);
    return u.origin;
  } catch {
    return null;
  }
}

type Config = { url: string; key: string } | { erro: string } | null;

function lerConfig(): Config {
  const urlBruta = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!urlBruta && !key) return null; // modo demonstração
  if (!urlBruta) return { erro: "Falta a variável SUPABASE_URL no Vercel." };
  if (!key) return { erro: "Falta a variável SUPABASE_SERVICE_ROLE_KEY no Vercel." };
  const url = normalizarUrl(urlBruta);
  if (!url) return { erro: `SUPABASE_URL não parece um endereço válido (começa com "${urlBruta.slice(0, 12)}…"). O certo é algo como https://abcdefgh.supabase.co` };
  if (key.startsWith("sb_publishable_")) return { erro: "SUPABASE_SERVICE_ROLE_KEY está com a chave pública (sb_publishable_). Use a chave secreta (sb_secret_)." };
  return { url, key };
}

let sb: SupabaseClient | null = null;
function supabase(): SupabaseClient | null {
  const c = lerConfig();
  if (!c) return null;
  if ("erro" in c) throw new Error(c.erro);
  if (!sb) sb = createClient(c.url, c.key, { auth: { persistSession: false } });
  return sb;
}

export function modoDemo(): boolean {
  return lerConfig() === null;
}

/** Problema de configuração, para mostrar na tela em vez de quebrar o site. */
export function erroConfig(): string | null {
  const c = lerConfig();
  return c && "erro" in c ? c.erro : null;
}

/** Traduz erros comuns do banco para algo que dá para resolver. */
export function explicarErro(e: unknown): string {
  const m = (e as Error)?.message ?? String(e);
  if (/relation .* does not exist|Could not find the table|schema cache/i.test(m))
    return "As tabelas ainda não existem no Supabase. Rode o arquivo schema.sql no SQL Editor.";
  if (/Invalid API key|JWT|apikey|Unauthorized|401/i.test(m))
    return "A chave do Supabase foi recusada. Confira se SUPABASE_SERVICE_ROLE_KEY é a chave secreta (sb_secret_) do mesmo projeto.";
  if (/fetch failed|ENOTFOUND|getaddrinfo|Failed to fetch/i.test(m))
    return "Não foi possível falar com o Supabase. Confira o endereço em SUPABASE_URL.";
  return m;
}

// ---------- modo demonstração ----------
type Mem = { campanhas: Campanha[]; itens: Item[] };
const g = globalThis as unknown as { __sjgMem?: Mem };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function diasDeHoje(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
}

function mem(): Mem {
  if (g.__sjgMem) return g.__sjgMem;
  const campanhas: Campanha[] = [
    ["Institucional SJG", "#0e7490"],
    ["Treinamento Físico SJG", "#1d4ed8"],
    ["Natação e Hidro", "#0891b2"],
    ["Aquarela e Extravassa", "#d97706"],
    ["Bela Gestante", "#db2777"],
    ["Sala de Giro", "#7c3aed"],
    ["Swim Camp 2027", "#0f766e"],
  ].map(([nome, cor], i) => ({ id: `c${i + 1}`, nome, cor, ativa: true }));
  const base = (p: Partial<Item>): Item => ({
    id: crypto.randomUUID(), tipo: "post", titulo: "", data: diasDeHoje(0), horario: null, data_fim: null,
    campanha_id: null, status: "Ideia", formato: null, canal: null, pessoas: null, texto: null, link: null,
    com_imagem: false, objetivo: null, orcamento_dia: null, investido: null, resultados_qtd: null, notas: null,
    confirmar: false, criado_por: "equipe", atualizado_por: null,
    criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...p,
  });
  const itens: Item[] = [
    base({ titulo: "[Exemplo] Reels Júnia — mobilidade no dia a dia", data: diasDeHoje(1), horario: "18:00", campanha_id: "c2", status: "Edição", formato: "Reels", pessoas: "Júnia" }),
    base({ titulo: "[Exemplo] Carrossel Bela Gestante", data: diasDeHoje(3), horario: "12:00", campanha_id: "c5", status: "Aprovação", formato: "Carrossel", confirmar: true }),
    base({ titulo: "[Exemplo] Stories bastidores natação infantil", data: diasDeHoje(-2), campanha_id: "c3", status: "Publicado", formato: "Stories" }),
    base({ tipo: "disparo", titulo: "[Exemplo] Convite aula experimental Sala de Giro", data: diasDeHoje(2), horario: "09:00", campanha_id: "c6", status: "Aprovação", canal: "Grupo geral", com_imagem: true, texto: "Oi, tudo bem? 💜 Essa semana tem aula experimental..." }),
    base({ tipo: "disparo", titulo: "[Exemplo] Lembrete matrículas Aquarela", data: diasDeHoje(5), horario: "10:00", campanha_id: "c4", status: "Rascunho", canal: "Lista segmentada", criado_por: "cliente" }),
    base({ tipo: "trafego", titulo: "[Exemplo] Vídeo Júnia — Treinamento Físico", data: diasDeHoje(-6), data_fim: diasDeHoje(8), campanha_id: "c2", status: "Rodando", objetivo: "Mensagens no WhatsApp", orcamento_dia: 25, investido: 150, resultados_qtd: 38 }),
    base({ tipo: "trafego", titulo: "[Exemplo] Vídeo Swim Camp — chamada", data: diasDeHoje(4), data_fim: diasDeHoje(18), campanha_id: "c7", status: "Planejado", objetivo: "Inscrições / Sympla", orcamento_dia: 30, confirmar: true }),
  ];
  g.__sjgMem = { campanhas, itens };
  return g.__sjgMem;
}

// ---------- normalização ----------
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normalizar(i: Record<string, unknown>): Item {
  return {
    ...(i as unknown as Item),
    orcamento_dia: num(i.orcamento_dia),
    investido: num(i.investido),
    resultados_qtd: num(i.resultados_qtd),
  };
}

// ---------- itens ----------
export async function listarItens(): Promise<Item[]> {
  const db = supabase();
  if (!db) return [...mem().itens].sort((a, b) => a.data.localeCompare(b.data));
  const { data, error } = await db.from("itens").select("*").order("data").order("horario", { nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizar);
}

export async function criarItem(input: ItemInput, perfil: Perfil): Promise<Item> {
  const db = supabase();
  const registro = { ...input, criado_por: perfil, atualizado_por: perfil };
  if (!db) {
    const novo = normalizar({
      id: crypto.randomUUID(), horario: null, data_fim: null, campanha_id: null, formato: null, canal: null,
      pessoas: null, texto: null, link: null, com_imagem: false, objetivo: null, orcamento_dia: null,
      investido: null, resultados_qtd: null, notas: null, confirmar: false,
      criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...registro,
    });
    mem().itens.push(novo);
    return novo;
  }
  const { data, error } = await db.from("itens").insert(registro).select("*").single();
  if (error) throw new Error(error.message);
  return normalizar(data);
}

export async function atualizarItem(id: string, input: ItemInput, perfil: Perfil): Promise<Item | null> {
  const db = supabase();
  const patch = { ...input, atualizado_por: perfil, atualizado_em: new Date().toISOString() };
  if (!db) {
    const m = mem();
    const idx = m.itens.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    m.itens[idx] = normalizar({ ...m.itens[idx], ...patch });
    return m.itens[idx];
  }
  const { data, error } = await db.from("itens").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizar(data) : null;
}

export async function excluirItem(id: string): Promise<void> {
  const db = supabase();
  if (!db) {
    const m = mem();
    m.itens = m.itens.filter((i) => i.id !== id);
    return;
  }
  const { error } = await db.from("itens").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------- campanhas ----------
export async function listarCampanhas(): Promise<Campanha[]> {
  const db = supabase();
  if (!db) return mem().campanhas;
  const { data, error } = await db.from("campanhas").select("id,nome,cor,ativa").order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function salvarCampanha(c: Partial<Campanha>): Promise<Campanha> {
  const db = supabase();
  const reg = { nome: c.nome, cor: c.cor, ativa: c.ativa ?? true };
  if (!db) {
    const m = mem();
    if (c.id) {
      const idx = m.campanhas.findIndex((x) => x.id === c.id);
      m.campanhas[idx] = { ...m.campanhas[idx], ...reg } as Campanha;
      return m.campanhas[idx];
    }
    const nova = { id: crypto.randomUUID(), ...reg } as Campanha;
    m.campanhas.push(nova);
    return nova;
  }
  const q = c.id
    ? db.from("campanhas").update(reg).eq("id", c.id).select("id,nome,cor,ativa").single()
    : db.from("campanhas").insert(reg).select("id,nome,cor,ativa").single();
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data;
}

export async function excluirCampanha(id: string): Promise<void> {
  const db = supabase();
  if (!db) {
    const m = mem();
    m.campanhas = m.campanhas.filter((c) => c.id !== id);
    m.itens = m.itens.map((i) => (i.campanha_id === id ? { ...i, campanha_id: null } : i));
    return;
  }
  const { error } = await db.from("campanhas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
