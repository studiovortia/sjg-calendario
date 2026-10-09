"use client";

import { useState } from "react";
import type { Campanha } from "@/lib/types";

interface Props {
  campanhas: Campanha[];
  onFechar: () => void;
  onSalvar: (c: Partial<Campanha>) => Promise<boolean>;
  onExcluir: (c: Campanha) => Promise<void>;
}

export default function CampanhasModal({ campanhas, onFechar, onSalvar, onExcluir }: Props) {
  const [nova, setNova] = useState({ nome: "", cor: "#0e7490" });

  return (
    <div className="fundo-modal" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal">
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <h2 className="text-lg font-bold">Campanhas</h2>
          <button className="btn btn-fantasma w-9 px-0" onClick={onFechar} aria-label="Fechar">✕</button>
        </header>
        <div className="p-5 flex flex-col gap-2">
          <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            Campanhas inativas somem das opções ao criar itens, mas continuam nos itens antigos.
          </p>
          {campanhas.map((c) => <Linha key={c.id} c={c} onSalvar={onSalvar} onExcluir={onExcluir} />)}
          <form
            className="flex items-center gap-2 mt-3 pt-3"
            style={{ borderTop: "1px solid var(--line)" }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (await onSalvar(nova)) setNova({ nome: "", cor: "#0e7490" });
            }}
          >
            <input type="color" className="w-10 h-10 rounded-lg border-0 bg-transparent flex-none" value={nova.cor} onChange={(e) => setNova({ ...nova, cor: e.target.value })} aria-label="Cor" />
            <input className="entrada" placeholder="Nova campanha" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} />
            <button className="btn btn-primario" disabled={!nova.nome.trim()}>Adicionar</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Linha({ c, onSalvar, onExcluir }: { c: Campanha } & Pick<Props, "onSalvar" | "onExcluir">) {
  const [v, setV] = useState(c);
  const mudou = v.nome !== c.nome || v.cor !== c.cor || v.ativa !== c.ativa;
  return (
    <div className="flex items-center gap-2" style={{ opacity: v.ativa ? 1 : 0.6 }}>
      <input type="color" className="w-10 h-10 rounded-lg border-0 bg-transparent flex-none" value={v.cor} onChange={(e) => setV({ ...v, cor: e.target.value })} aria-label="Cor" />
      <input className="entrada" value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} />
      <label className="inline-flex items-center gap-1.5 text-xs font-semibold flex-none" style={{ color: "var(--muted)" }}>
        <input type="checkbox" checked={v.ativa} onChange={(e) => setV({ ...v, ativa: e.target.checked })} />
        Ativa
      </label>
      {mudou ? (
        <button className="btn btn-primario flex-none" onClick={() => onSalvar(v)}>Salvar</button>
      ) : (
        <button
          className="btn btn-fantasma btn-perigo flex-none w-9 px-0"
          aria-label={`Excluir ${c.nome}`}
          onClick={() => confirm(`Excluir a campanha "${c.nome}"? Os itens dela ficam sem campanha.`) && onExcluir(c)}
        >
          🗑
        </button>
      )}
    </div>
  );
}
