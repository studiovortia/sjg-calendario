"use client";

import { useMemo, useState } from "react";
import { startOfWeek, parseISO } from "date-fns";
import type { Campanha, Item } from "@/lib/types";
import { STATUS } from "@/lib/types";
import { dataCurta, dataLonga, diasAte, hojeISO, paraISO, reais, rotuloSemana } from "@/lib/datas";
import { SeloCliente, SeloConfirmar, TagCampanha, Vazio, finalizado } from "./ui";

interface Base {
  itens: Item[];
  campanhas: Map<string, Campanha>;
  onAbrir: (i: Item) => void;
  onStatus: (i: Item, status: string) => void;
}

function SeletorStatus({ item, onStatus }: { item: Item; onStatus: Base["onStatus"] }) {
  return (
    <select
      className="entrada !min-h-0 !py-1 !px-2 text-xs font-semibold w-auto"
      value={item.status}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onStatus(item, e.target.value)}
      aria-label="Status"
    >
      {STATUS[item.tipo].map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}

// ------------------------------------------------------------------ Postagens
export function Postagens({ itens, campanhas, onAbrir, onStatus }: Base) {
  const colunas = STATUS.post;
  const porStatus = useMemo(() => {
    const m = new Map<string, Item[]>(colunas.map((s) => [s, []]));
    for (const i of itens) (m.get(i.status) ?? m.get(colunas[0])!).push(i);
    // publicados: mais recentes primeiro, só os 12 últimos
    m.set("Publicado", (m.get("Publicado") ?? []).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12));
    return m;
  }, [itens, colunas]);

  if (itens.length === 0) return <Vazio texto="Nenhuma postagem ainda. Use “+ Novo” para criar a primeira." />;

  return (
    <div className="rolagem-x -mx-4 px-4 pb-2">
      <div className="flex gap-3 min-w-max">
        {colunas.map((s) => (
          <div key={s} className="w-[264px] flex-none flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold">{s}</h3>
              <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{porStatus.get(s)?.length ?? 0}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-2 min-h-[120px]" style={{ background: "color-mix(in srgb, var(--line) 45%, transparent)" }}>
              {(porStatus.get(s) ?? []).map((i) => (
                <article key={i.id} className="cartao p-3 flex flex-col gap-2 cursor-pointer !shadow-none hover:!shadow-md transition-shadow" onClick={() => onAbrir(i)}>
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    <span>{dataLonga(i.data)}{i.horario ? ` · ${i.horario}` : ""}</span>
                    {i.formato && <span className="selo selo-post">{i.formato}</span>}
                  </div>
                  <p className={`text-sm font-semibold leading-snug ${finalizado(i) ? "opacity-60" : ""}`}>{i.titulo}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TagCampanha c={campanhas.get(i.campanha_id ?? "")} />
                    {i.pessoas && <span className="text-xs" style={{ color: "var(--muted)" }}>· {i.pessoas}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1"><SeloConfirmar item={i} /><SeloCliente item={i} /></div>
                    <SeletorStatus item={i} onStatus={onStatus} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Disparos
export function Disparos({ itens, campanhas, onAbrir, onStatus }: Base) {
  const [anteriores, setAnteriores] = useState(false);
  const inicioSemana = paraISO(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const semanas = useMemo(() => {
    const lista = itens
      .filter((i) => anteriores || i.data >= inicioSemana)
      .sort((a, b) => (a.data + (a.horario ?? "")).localeCompare(b.data + (b.horario ?? "")));
    const m = new Map<string, Item[]>();
    for (const i of lista) {
      const chave = paraISO(startOfWeek(parseISO(i.data), { weekStartsOn: 1 }));
      m.set(chave, [...(m.get(chave) ?? []), i]);
    }
    return [...m.entries()];
  }, [itens, anteriores, inicioSemana]);

  return (
    <div className="flex flex-col gap-4">
      <label className="inline-flex items-center gap-2 text-sm self-start" style={{ color: "var(--muted)" }}>
        <input type="checkbox" checked={anteriores} onChange={(e) => setAnteriores(e.target.checked)} />
        Mostrar semanas anteriores
      </label>
      {semanas.length === 0 && <Vazio texto="Nenhum disparo programado a partir desta semana." />}
      {semanas.map(([semana, lista]) => (
        <section key={semana} className="flex flex-col gap-2">
          <h3 className="text-sm font-bold px-1">
            Semana de {rotuloSemana(semana)}
            <span className="font-semibold ml-2" style={{ color: "var(--muted)" }}>{lista.length} disparo{lista.length > 1 ? "s" : ""}</span>
          </h3>
          <div className="cartao divide-y" style={{ borderColor: "var(--line)" }}>
            {lista.map((i) => (
              <div key={i.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 cursor-pointer hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--line)" }} onClick={() => onAbrir(i)}>
                <div className="sm:w-36 flex-none text-sm font-semibold" style={{ color: i.data === hojeISO() ? "var(--brand)" : undefined }}>
                  {dataLonga(i.data)}
                  {i.horario && <span style={{ color: "var(--muted)" }}> · {i.horario}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${finalizado(i) ? "line-through opacity-60" : ""}`}>{i.titulo}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {i.canal && <span className="selo selo-disparo">{i.canal}</span>}
                    {i.com_imagem && <span className="selo selo-neutro">🖼 com imagem</span>}
                    <TagCampanha c={campanhas.get(i.campanha_id ?? "")} />
                    <SeloConfirmar item={i} />
                    <SeloCliente item={i} />
                  </div>
                </div>
                <div className="flex-none"><SeletorStatus item={i} onStatus={onStatus} /></div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ Tráfego
const ORDEM_TRAFEGO = ["Rodando", "Planejado", "Pausado", "Encerrado"];

export function Trafego({ itens, campanhas, onAbrir, onStatus }: Base) {
  const grupos = ORDEM_TRAFEGO.map((s) => [s, itens.filter((i) => i.status === s).sort((a, b) => a.data.localeCompare(b.data))] as const);
  const rodando = itens.filter((i) => i.status === "Rodando");
  const orcDia = rodando.reduce((s, i) => s + (i.orcamento_dia ?? 0), 0);
  const investido = itens.reduce((s, i) => s + (i.investido ?? 0), 0);

  if (itens.length === 0) return <Vazio texto="Nenhum vídeo no tráfego ainda. Use “+ Novo” para cadastrar." />;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Numero rotulo="Vídeos rodando" valor={String(rodando.length)} />
        <Numero rotulo="Orçamento diário ativo" valor={reais(orcDia)} />
        <Numero rotulo="Investido (total anotado)" valor={reais(investido)} />
      </div>
      {grupos.map(([status, lista]) =>
        lista.length === 0 ? null : (
          <section key={status} className="flex flex-col gap-2">
            <h3 className="text-sm font-bold px-1">{status} <span className="font-semibold" style={{ color: "var(--muted)" }}>{lista.length}</span></h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lista.map((i) => (
                <CartaoAnuncio key={i.id} i={i} c={campanhas.get(i.campanha_id ?? "")} onAbrir={onAbrir} onStatus={onStatus} />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="cartao p-3">
      <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{rotulo}</div>
      <div className="text-xl font-bold mt-0.5 tabular-nums">{valor}</div>
    </div>
  );
}

function CartaoAnuncio({ i, c, onAbrir, onStatus }: { i: Item; c?: Campanha; onAbrir: Base["onAbrir"]; onStatus: Base["onStatus"] }) {
  const cpr = i.investido && i.resultados_qtd ? i.investido / i.resultados_qtd : null;
  let prazo = "";
  let atrasado = false;
  if (i.data_fim) {
    const d = diasAte(i.data_fim);
    if (i.status === "Rodando" && d < 0) atrasado = true;
    prazo = d > 1 ? `termina em ${d} dias` : d === 1 ? "termina amanhã" : d === 0 ? "termina hoje" : "data de fim já passou";
  }
  const comeca = diasAte(i.data);
  if (i.status === "Planejado" && comeca >= 0) prazo = comeca === 0 ? "começa hoje" : `começa em ${comeca} dia${comeca > 1 ? "s" : ""}`;

  return (
    <article className="cartao p-3 flex flex-col gap-2 cursor-pointer" onClick={() => onAbrir(i)}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold leading-snug ${finalizado(i) ? "opacity-60" : ""}`}>{i.titulo}</p>
        <SeletorStatus item={i} onStatus={onStatus} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TagCampanha c={c} />
        {i.objetivo && <span className="selo selo-trafego">{i.objetivo}</span>}
        <SeloConfirmar item={i} />
        <SeloCliente item={i} />
      </div>
      <div className="text-xs" style={{ color: atrasado ? "var(--alerta)" : "var(--muted)" }}>
        {dataCurta(i.data)}{i.data_fim ? ` → ${dataCurta(i.data_fim)}` : ""}{prazo && ` · ${prazo}`}
        {atrasado && " — pausar ou atualizar?"}
      </div>
      <dl className="grid grid-cols-4 gap-2 pt-2 text-xs" style={{ borderTop: "1px solid var(--line)" }}>
        <Dado k="Por dia" v={reais(i.orcamento_dia)} />
        <Dado k="Investido" v={reais(i.investido)} />
        <Dado k="Resultados" v={i.resultados_qtd === null ? "—" : String(i.resultados_qtd)} />
        <Dado k="Custo/res." v={reais(cpr)} />
      </dl>
    </article>
  );
}

function Dado({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt style={{ color: "var(--muted)" }}>{k}</dt>
      <dd className="font-bold tabular-nums truncate">{v}</dd>
    </div>
  );
}
