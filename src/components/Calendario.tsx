"use client";

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import type { Campanha, Item } from "@/lib/types";
import { dataLonga, hojeISO, nomeMes, paraISO } from "@/lib/datas";
import { SeloConfirmar, SeloTipo, TagCampanha, finalizado } from "./ui";

type Entrada = { item: Item; marca?: "início" | "fim" };

interface Props {
  itens: Item[];
  campanhas: Map<string, Campanha>;
  mes: Date;
  setMes: (d: Date) => void;
  onAbrir: (i: Item) => void;
  onNovo: (data: string) => void;
}

export default function Calendario({ itens, campanhas, mes, setMes, onAbrir, onNovo }: Props) {
  const hoje = hojeISO();
  const dias = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
      }),
    [mes],
  );

  const porDia = useMemo(() => {
    const m = new Map<string, Entrada[]>();
    const add = (d: string, e: Entrada) => m.set(d, [...(m.get(d) ?? []), e]);
    for (const i of itens) {
      if (i.tipo === "trafego") {
        add(i.data, { item: i, marca: "início" });
        if (i.data_fim && i.data_fim !== i.data) add(i.data_fim, { item: i, marca: "fim" });
      } else add(i.data, { item: i });
    }
    for (const lista of m.values())
      lista.sort((a, b) => (a.item.horario ?? "99").localeCompare(b.item.horario ?? "99"));
    return m;
  }, [itens]);

  const diasDoMes = dias.filter((d) => isSameMonth(d, mes)).map(paraISO);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">{nomeMes(mes)}</h2>
        <div className="flex gap-1.5">
          <button className="btn" onClick={() => setMes(addMonths(mes, -1))} aria-label="Mês anterior">‹</button>
          <button className="btn" onClick={() => setMes(new Date())}>Hoje</button>
          <button className="btn" onClick={() => setMes(addMonths(mes, 1))} aria-label="Próximo mês">›</button>
        </div>
      </div>

      {/* Grade mensal (telas médias e grandes) */}
      <div className="cartao hidden md:block overflow-hidden">
        <div className="grid grid-cols-7 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--muted)", borderBottom: "1px solid var(--line)" }}>
          {dias.slice(0, 7).map((d) => (
            <div key={d.toISOString()} className="px-2 py-2">{format(d, "EEE", { locale: ptBR })}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d, idx) => {
            const iso = paraISO(d);
            const lista = porDia.get(iso) ?? [];
            const fora = !isSameMonth(d, mes);
            const ehHoje = iso === hoje;
            return (
              <div
                key={iso}
                className="group min-h-[124px] p-1.5 flex flex-col gap-1"
                style={{
                  borderRight: (idx + 1) % 7 ? "1px solid var(--line)" : undefined,
                  borderBottom: idx < dias.length - 7 ? "1px solid var(--line)" : undefined,
                  background: fora ? "var(--surface-2)" : undefined,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: ehHoje ? "var(--brand)" : undefined,
                      color: ehHoje ? "var(--brand-ink)" : fora ? "var(--faint)" : "var(--ink)",
                    }}
                  >
                    {format(d, "d")}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-base leading-none w-6 h-6 rounded-md border-0 bg-transparent"
                    style={{ color: "var(--brand)" }}
                    onClick={() => onNovo(iso)}
                    aria-label={`Novo item em ${iso}`}
                  >
                    +
                  </button>
                </div>
                {lista.slice(0, 4).map(({ item, marca }) => (
                  <Chip key={item.id + (marca ?? "")} item={item} marca={marca} campanha={campanhas.get(item.campanha_id ?? "")} onClick={() => onAbrir(item)} />
                ))}
                {lista.length > 4 && (
                  <span className="text-[11px] font-semibold px-1" style={{ color: "var(--muted)" }}>+{lista.length - 4} mais</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda (celular) */}
      <div className="md:hidden flex flex-col gap-2">
        {diasDoMes.filter((d) => porDia.has(d) || d === hoje).length === 0 && (
          <div className="cartao p-6 text-center text-sm" style={{ color: "var(--muted)" }}>Nada programado neste mês.</div>
        )}
        {diasDoMes
          .filter((d) => porDia.has(d) || d === hoje)
          .map((d) => (
            <div key={d} className="cartao p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: d === hoje ? "var(--brand)" : undefined }}>
                  {dataLonga(d)} {d === hoje && "· hoje"}
                </span>
                <button className="btn btn-fantasma h-7 px-2 text-xs" onClick={() => onNovo(d)}>+ Novo</button>
              </div>
              <div className="flex flex-col gap-1.5">
                {(porDia.get(d) ?? []).map(({ item, marca }) => (
                  <button
                    key={item.id + (marca ?? "")}
                    onClick={() => onAbrir(item)}
                    className="flex items-start gap-2 text-left p-2 rounded-lg border-0"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <SeloTipo tipo={item.tipo} />
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-semibold ${finalizado(item) ? "line-through opacity-60" : ""}`}>
                        {item.horario && <span style={{ color: "var(--muted)" }}>{item.horario} · </span>}
                        {marca && <span style={{ color: "var(--muted)" }}>{marca} · </span>}
                        {item.titulo}
                      </span>
                      <span className="flex flex-wrap gap-2 mt-1 items-center">
                        <TagCampanha c={campanhas.get(item.campanha_id ?? "")} />
                        <span className="text-xs" style={{ color: "var(--muted)" }}>{item.status}</span>
                        <SeloConfirmar item={item} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

function Chip({ item, marca, campanha, onClick }: { item: Item; marca?: string; campanha?: Campanha; onClick: () => void }) {
  const titulo = `${item.horario ? item.horario + " · " : ""}${marca ? marca + " · " : ""}${item.titulo} — ${item.status}`;
  return (
    <button className={`chip chip-${item.tipo} ${finalizado(item) ? "feito" : ""}`} onClick={onClick} title={titulo}>
      {campanha && <span className="ponto" style={{ background: campanha.cor, width: 6, height: 6 }} />}
      {item.confirmar && <span aria-label="precisa confirmar">⚠</span>}
      <span className="t">
        {marca === "início" && "▶ "}
        {marca === "fim" && "■ "}
        {item.horario && item.tipo !== "trafego" && <span style={{ opacity: 0.75 }}>{item.horario} </span>}
        {item.titulo}
      </span>
    </button>
  );
}
