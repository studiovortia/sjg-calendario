import type { Perfil } from "./types";

export const COOKIE = "sjg_sessao";
export const DURACAO_SEGUNDOS = 60 * 60 * 24 * 30; // 30 dias

function senhaDo(perfil: Perfil): string | undefined {
  return perfil === "equipe" ? process.env.SENHA_EQUIPE : process.env.SENHA_CLIENTE;
}

async function assinar(texto: string, chave: string): Promise<string> {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey("raw", enc.encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(texto));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// A chave inclui a senha do perfil: trocar a senha desconecta quem entrou com a antiga.
function chaveDo(perfil: Perfil): string | null {
  const senha = senhaDo(perfil);
  if (!senha) return null;
  return `${process.env.SESSION_SECRET ?? "sjg"}|${perfil}|${senha}`;
}

export async function criarToken(perfil: Perfil): Promise<string | null> {
  const chave = chaveDo(perfil);
  if (!chave) return null;
  return `${perfil}.${await assinar(perfil, chave)}`;
}

export async function lerToken(token: string | undefined | null): Promise<Perfil | null> {
  if (!token) return null;
  const [perfil, sig] = token.split(".");
  if (perfil !== "equipe" && perfil !== "cliente") return null;
  const chave = chaveDo(perfil);
  if (!chave || !sig) return null;
  const esperado = await assinar(perfil, chave);
  if (esperado.length !== sig.length) return null;
  let dif = 0;
  for (let i = 0; i < sig.length; i++) dif |= esperado.charCodeAt(i) ^ sig.charCodeAt(i);
  return dif === 0 ? perfil : null;
}

export function perfilDaSenha(senha: string): Perfil | null {
  if (!senha) return null;
  if (process.env.SENHA_EQUIPE && senha === process.env.SENHA_EQUIPE) return "equipe";
  if (process.env.SENHA_CLIENTE && senha === process.env.SENHA_CLIENTE) return "cliente";
  return null;
}
