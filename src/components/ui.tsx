"use client";

import type { Campanha, Item, Tipo } from "@/lib/types";
import { STATUS_FINAL, TIPOS } from "@/lib/types";

export function SeloTipo({ tipo }: { tipo: Tipo }) {
  return <span className={`selo selo-${tipo}`}>{TIPOS[tipo].nome}</span>;
}

export function TagCampanha({ c }: { c?: Campanha }) {
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--muted)" }}>
      <span className="ponto" style={{ background: c.cor }} />
      {c.nome}
    </span>
  );
}

export function SeloConfirmar({ item }: { item: Item }) {
  if (!item.confirmar) return null;
  return <span className="selo selo-alerta" title="Precisa de confirmação antes de publicar">⚠ Confirmar</span>;
}

export function SeloCliente({ item }: { item: Item }) {
  if (item.criado_por !== "cliente") return null;
  return <span className="selo selo-neutro" title="Item criado pela cliente">Cliente</span>;
}

export const finalizado = (i: Item) => STATUS_FINAL[i.tipo].includes(i.status);

export function Vazio({ texto }: { texto: string }) {
  return (
    <div className="cartao p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
      {texto}
    </div>
  );
}
