"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Campanha, Item, Perfil, Tipo } from "@/lib/types";
import { STATUS, TIPOS } from "@/lib/types";
import { hojeISO, nestaSemana, reais } from "@/lib/datas";
import Calendario from "./Calendario";
import { Disparos, Postagens, Trafego } from "./Listas";
import ItemModal, { type Rascunho } from "./ItemModal";
import CampanhasModal from "./CampanhasModal";

type Aba = "calendario" | Tipo;
const ABAS: { id: Aba; nome: string }[] = [
  { id: "calendario", nome: "Calendário" },
  { id: "post", nome: "Postagens" },
  { id: "disparo", nome: "Disparos" },
  { id: "trafego", nome: "Tráfego" },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json" }, cache: "no-store" });
  if (r.status === 401) {
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.erro ?? "Algo deu errado. Tente de novo.");
  return j as T;
}


export default function Painel({ perfil, demo, abaInicial, erroConfig }: { perfil: Perfil; demo: boolean; abaInicial?: string; erroConfig?: string | null }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAbaState] = useState<Aba>(() => (ABAS.some((x) => x.id === abaInicial) ? (abaInicial as Aba) : "calendario"));
  const [mes, setMes] = useState(() => new Date());
  const [tipos, setTipos] = useState<Record<Tipo, boolean>>({ post: true, disparo: true, trafego: true });
  const [campanhaFiltro, setCampanhaFiltro] = useState("");
  const [busca, setBusca] = useState("");
  const [soConfirmar, setSoConfirmar] = useState(false);
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [verCampanhas, setVerCampanhas] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; erro?: boolean } | null>(null);
  const [falha, setFalha] = useState<string | null>(null);

  // a aba fica no endereço (?aba=disparo), então dá para mandar o link direto
  const setAba = (a: Aba) => {
    setAbaState(a);
    window.history.replaceState(null, "", a === "calendario" ? "/" : `/?aba=${a}`);
  };

  const avisar = useCallback((texto: string, erro = false) => {
    setAviso({ texto, erro });
    setTimeout(() => setAviso(null), erro ? 5000 : 2500);
  }, []);

  const carregar = useCallback(async () => {
    try {
      const [i, c] = await Promise.all([api<Item[]>("/api/itens"), api<Campanha[]>("/api/campanhas")]);
      setItens(i);
      setCampanhas(c);
      setFalha(null);
    } catch (e) {
      setFalha((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }, [avisar]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial dos dados
    carregar();
    // atualiza quando a pessoa volta para a aba do navegador (outra pessoa pode ter editado)
    const foco = () => document.visibilityState === "visible" && carregar();
    document.addEventListener("visibilitychange", foco);
    return () => document.removeEventListener("visibilitychange", foco);
  }, [carregar]);

  const mapaCampanhas = useMemo(() => new Map(campanhas.map((c) => [c.id, c])), [campanhas]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter(
      (i) =>
        (!campanhaFiltro || i.campanha_id === campanhaFiltro) &&
        (!soConfirmar || i.confirmar) &&
        (!q || [i.titulo, i.texto, i.notas, i.pessoas].some((t) => t?.toLowerCase().includes(q))),
    );
  }, [itens, campanhaFiltro, busca, soConfirmar]);

  const resumo = useMemo(() => {
    const semana = itens.filter((i) => i.tipo !== "trafego" && nestaSemana(i.data));
    const rodando = itens.filter((i) => i.tipo === "trafego" && i.status === "Rodando");
    return {
      posts: semana.filter((i) => i.tipo === "post").length,
      disparos: semana.filter((i) => i.tipo === "disparo").length,
      confirmar: itens.filter((i) => i.confirmar).length,
      rodando: rodando.length,
      orcamento: rodando.reduce((s, i) => s + (i.orcamento_dia ?? 0), 0),
    };
  }, [itens]);

  // ---------- ações ----------
  async function salvar(d: Rascunho): Promise<boolean> {
    try {
      if (d.id) {
        const atualizado = await api<Item>(`/api/itens/${d.id}`, { method: "PATCH", body: JSON.stringify(d) });
        setItens((xs) => xs.map((x) => (x.id === d.id ? atualizado : x)));
      } else {
        const novo = await api<Item>("/api/itens", { method: "POST", body: JSON.stringify(d) });
        setItens((xs) => [...xs, novo]);
      }
      avisar("Salvo ✓");
      return true;
    } catch (e) {
      avisar((e as Error).message, true);
      return false;
    }
  }

  async function mudarStatus(i: Item, status: string) {
    setItens((xs) => xs.map((x) => (x.id === i.id ? { ...x, status } : x)));
    try {
      const atualizado = await api<Item>(`/api/itens/${i.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setItens((xs) => xs.map((x) => (x.id === i.id ? atualizado : x)));
    } catch (e) {
      setItens((xs) => xs.map((x) => (x.id === i.id ? i : x)));
      avisar((e as Error).message, true);
    }
  }

  async function excluir(i: Item) {
    try {
      await api(`/api/itens/${i.id}`, { method: "DELETE" });
      setItens((xs) => xs.filter((x) => x.id !== i.id));
      setEditando(null);
      avisar("Item excluído");
    } catch (e) {
      avisar((e as Error).message, true);
    }
  }

  function duplicar(d: Rascunho) {
    const { id: _id, criado_em: _c, atualizado_em: _a, criado_por: _cp, atualizado_por: _ap, ...resto } = d;
    void _id; void _c; void _a; void _cp; void _ap;
    setEditando(null);
    setTimeout(() => setEditando({ ...resto, titulo: `${resto.titulo ?? ""} (cópia)`, status: STATUS[resto.tipo as Tipo][0] }), 0);
  }

  async function salvarCampanha(c: Partial<Campanha>) {
    try {
      const salva = await api<Campanha>("/api/campanhas", { method: "POST", body: JSON.stringify(c) });
      setCampanhas((xs) => (c.id ? xs.map((x) => (x.id === c.id ? salva : x)) : [...xs, salva]));
      avisar("Campanha salva ✓");
      return true;
    } catch (e) {
      avisar((e as Error).message, true);
      return false;
    }
  }

  async function excluirCampanha(c: Campanha) {
    try {
      await api(`/api/campanhas?id=${c.id}`, { method: "DELETE" });
      setCampanhas((xs) => xs.filter((x) => x.id !== c.id));
      setItens((xs) => xs.map((x) => (x.campanha_id === c.id ? { ...x, campanha_id: null } : x)));
    } catch (e) {
      avisar((e as Error).message, true);
    }
  }

  async function sair() {
    await fetch("/api/login", { method: "DELETE" });
    window.location.href = "/login";
  }

  const novo = (data?: string) =>
    setEditando({
      tipo: aba === "calendario" ? undefined : aba,
      status: aba === "calendario" ? undefined : STATUS[aba][0],
      data: data ?? hojeISO(),
      campanha_id: campanhaFiltro || null,
    });

  const doTipo = (t: Tipo) => filtrados.filter((i) => i.tipo === t);

  return (
    <div className="min-h-dvh">
      {(erroConfig || falha) && (
        <div className="text-center text-sm font-semibold py-2.5 px-4" style={{ background: "var(--perigo)", color: "#fff" }}>
          ⚠ O banco de dados não está respondendo: {erroConfig ?? falha}
        </div>
      )}
      {demo && !erroConfig && (
        <div className="text-center text-xs font-semibold py-1.5 px-4" style={{ background: "var(--alerta-bg)", color: "var(--alerta)" }}>
          Modo demonstração: o banco de dados ainda não foi conectado e nada fica salvo.
        </div>
      )}

      <header className="sticky top-0 z-30" style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div className="max-w-[1320px] mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5 flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" width={34} height={34} className="rounded-lg" />
            <div className="leading-tight hidden sm:block">
              <div className="font-bold text-[15px]">SJG</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Calendário de conteúdo</div>
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            {ABAS.map((a) => (
              <button key={a.id} className="aba" aria-current={aba === a.id ? "page" : undefined} onClick={() => setAba(a.id)}>{a.nome}</button>
            ))}
          </nav>
          <span className="flex-1" />
          <span className="selo selo-neutro hidden sm:inline-flex">{perfil === "equipe" ? "Equipe" : "Cliente"}</span>
          {perfil === "equipe" && (
            <button className="btn btn-fantasma hidden sm:inline-flex" onClick={() => setVerCampanhas(true)}>Campanhas</button>
          )}
          <button className="btn btn-fantasma" onClick={sair}>Sair</button>
          <button className="btn btn-primario" onClick={() => novo()}>+ Novo</button>
        </div>
        <nav className="md:hidden flex gap-1 px-3 pb-2 rolagem-x">
          {ABAS.map((a) => (
            <button key={a.id} className="aba" aria-current={aba === a.id ? "page" : undefined} onClick={() => setAba(a.id)}>{a.nome}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 py-5 flex flex-col gap-5">
        {/* resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Resumo rotulo="Posts nesta semana" valor={resumo.posts} cor="var(--post)" onClick={() => setAba("post")} />
          <Resumo rotulo="Disparos nesta semana" valor={resumo.disparos} cor="var(--disparo)" onClick={() => setAba("disparo")} />
          <Resumo rotulo={`Vídeos rodando · ${reais(resumo.orcamento)}/dia`} valor={resumo.rodando} cor="var(--trafego)" onClick={() => setAba("trafego")} />
          <Resumo rotulo="Aguardando confirmação" valor={resumo.confirmar} cor="var(--alerta)" ativo={soConfirmar} onClick={() => setSoConfirmar((v) => !v)} />
        </section>

        {/* filtros */}
        <section className="flex flex-wrap items-center gap-2">
          {aba === "calendario" &&
            (Object.keys(TIPOS) as Tipo[]).map((t) => (
              <button
                key={t}
                className={`btn h-9 ${tipos[t] ? `selo-${t}` : ""}`}
                style={tipos[t] ? { borderColor: `var(--${t})` } : { color: "var(--faint)" }}
                onClick={() => setTipos((x) => ({ ...x, [t]: !x[t] }))}
                aria-pressed={tipos[t]}
              >
                {TIPOS[t].plural}
              </button>
            ))}
          <select className="entrada !w-auto h-9 !min-h-0 !py-0" value={campanhaFiltro} onChange={(e) => setCampanhaFiltro(e.target.value)} aria-label="Filtrar por campanha">
            <option value="">Todas as campanhas</option>
            {campanhas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input className="entrada !w-auto flex-1 min-w-[160px] max-w-xs h-9 !min-h-0 !py-0" placeholder="Buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          {soConfirmar && (
            <button className="selo selo-alerta border-0" onClick={() => setSoConfirmar(false)}>Só “confirmar” ✕</button>
          )}
        </section>

        {carregando ? (
          <div className="cartao p-10 text-center text-sm" style={{ color: "var(--muted)" }}>Carregando…</div>
        ) : aba === "calendario" ? (
          <Calendario
            itens={filtrados.filter((i) => tipos[i.tipo])}
            campanhas={mapaCampanhas}
            mes={mes}
            setMes={setMes}
            onAbrir={(i) => setEditando(i)}
            onNovo={(d) => novo(d)}
          />
        ) : aba === "post" ? (
          <Postagens itens={doTipo("post")} campanhas={mapaCampanhas} onAbrir={setEditando} onStatus={mudarStatus} />
        ) : aba === "disparo" ? (
          <Disparos itens={doTipo("disparo")} campanhas={mapaCampanhas} onAbrir={setEditando} onStatus={mudarStatus} />
        ) : (
          <Trafego itens={doTipo("trafego")} campanhas={mapaCampanhas} onAbrir={setEditando} onStatus={mudarStatus} />
        )}

        {perfil === "equipe" && (
          <button className="btn btn-fantasma sm:hidden self-center" onClick={() => setVerCampanhas(true)}>Gerenciar campanhas</button>
        )}
      </main>

      {editando && (
        <ItemModal
          key={editando.id ?? "novo"}
          inicial={editando}
          campanhas={campanhas}
          perfil={perfil}
          onFechar={() => setEditando(null)}
          onSalvar={salvar}
          onExcluir={excluir}
          onDuplicar={duplicar}
        />
      )}
      {verCampanhas && (
        <CampanhasModal campanhas={campanhas} onFechar={() => setVerCampanhas(false)} onSalvar={salvarCampanha} onExcluir={excluirCampanha} />
      )}

      {aviso && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg max-w-[90vw]"
          style={{ background: aviso.erro ? "var(--perigo)" : "var(--ink)", color: "var(--surface)" }}
        >
          {aviso.texto}
        </div>
      )}
    </div>
  );
}

function Resumo({ rotulo, valor, cor, onClick, ativo }: { rotulo: string; valor: number; cor: string; onClick: () => void; ativo?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="cartao p-3.5 text-left flex flex-col gap-1 hover:!shadow-md transition-shadow"
      style={{ borderColor: ativo ? cor : undefined, borderLeft: `4px solid ${cor}` }}
    >
      <span className="text-2xl font-bold tabular-nums">{valor}</span>
      <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{rotulo}</span>
    </button>
  );
}
