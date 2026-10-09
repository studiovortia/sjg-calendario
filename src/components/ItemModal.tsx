"use client";

import { useEffect, useState } from "react";
import type { Campanha, Item, Perfil, Tipo } from "@/lib/types";
import { CANAIS, FORMATOS, OBJETIVOS, STATUS, TIPOS } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Rascunho = Partial<Item>;

interface Props {
  inicial: Rascunho;
  campanhas: Campanha[];
  perfil: Perfil;
  onFechar: () => void;
  onSalvar: (dados: Rascunho) => Promise<boolean>;
  onExcluir: (i: Item) => Promise<void>;
  onDuplicar: (dados: Rascunho) => void;
}

export default function ItemModal({ inicial, campanhas, perfil, onFechar, onSalvar, onExcluir, onDuplicar }: Props) {
  const [d, setD] = useState<Rascunho>(inicial);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const existente = Boolean(inicial.id);
  const tipo = d.tipo;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const set = <K extends keyof Item>(k: K, v: Item[K] | null) => setD((x) => ({ ...x, [k]: v }));

  function escolherTipo(t: Tipo) {
    setD((x) => ({ ...x, tipo: t, status: STATUS[t].includes(x.status ?? "") ? x.status : STATUS[t][0] }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const ok = await onSalvar(d);
    setSalvando(false);
    if (ok) onFechar();
  }

  const ativas = campanhas.filter((c) => c.ativa || c.id === d.campanha_id);
  const rotuloTexto = tipo === "post" ? "Legenda / roteiro" : tipo === "disparo" ? "Mensagem" : "Copy do anúncio";

  return (
    <div className="fundo-modal" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <form className="modal" onSubmit={salvar}>
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4" style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}>
          <h2 className="text-lg font-bold">{existente ? `Editar ${TIPOS[tipo!].nome.toLowerCase()}` : "Novo item"}</h2>
          <button type="button" className="btn btn-fantasma w-9 px-0" onClick={onFechar} aria-label="Fechar">✕</button>
        </header>

        <div className="p-5 flex flex-col gap-4">
          {!existente && (
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TIPOS) as Tipo[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => escolherTipo(t)}
                  className={`btn h-auto py-2.5 flex-col gap-0.5 ${tipo === t ? `selo-${t}` : ""}`}
                  style={tipo === t ? { borderColor: `var(--${t})` } : undefined}
                >
                  <span className="text-base">{TIPOS[t].icone}</span>
                  <span className="text-xs">{t === "trafego" ? "Vídeo no tráfego" : t === "disparo" ? "Disparo WhatsApp" : "Postagem"}</span>
                </button>
              ))}
            </div>
          )}

          {!tipo ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Escolha o tipo de item.</p>
          ) : (
            <>
              <label className="campo">
                <span>{tipo === "trafego" ? "Nome do vídeo / anúncio" : "Título"}</span>
                <input className="entrada" required autoFocus={!existente} value={d.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="campo">
                  <span>{tipo === "trafego" ? "Início" : "Data"}</span>
                  <input className="entrada" type="date" required value={d.data ?? ""} onChange={(e) => set("data", e.target.value)} />
                </label>
                {tipo === "trafego" ? (
                  <label className="campo">
                    <span>Fim</span>
                    <input className="entrada" type="date" min={d.data ?? undefined} value={d.data_fim ?? ""} onChange={(e) => set("data_fim", e.target.value)} />
                  </label>
                ) : (
                  <label className="campo">
                    <span>Horário</span>
                    <input className="entrada" type="time" value={d.horario ?? ""} onChange={(e) => set("horario", e.target.value)} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="campo">
                  <span>Campanha</span>
                  <select className="entrada" value={d.campanha_id ?? ""} onChange={(e) => set("campanha_id", e.target.value || null)}>
                    <option value="">Sem campanha</option>
                    {ativas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </label>
                <label className="campo">
                  <span>Status</span>
                  <select className="entrada" value={d.status ?? STATUS[tipo][0]} onChange={(e) => set("status", e.target.value)}>
                    {STATUS[tipo].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              {tipo === "post" && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="campo">
                    <span>Formato</span>
                    <select className="entrada" value={d.formato ?? ""} onChange={(e) => set("formato", e.target.value || null)}>
                      <option value="">—</option>
                      {FORMATOS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </label>
                  <label className="campo">
                    <span>Quem aparece</span>
                    <input className="entrada" placeholder="Júnia, Júlia…" value={d.pessoas ?? ""} onChange={(e) => set("pessoas", e.target.value)} />
                  </label>
                </div>
              )}

              {tipo === "disparo" && (
                <div className="grid grid-cols-2 gap-3 items-end">
                  <label className="campo">
                    <span>Canal</span>
                    <select className="entrada" value={d.canal ?? ""} onChange={(e) => set("canal", e.target.value || null)}>
                      <option value="">—</option>
                      {CANAIS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm font-semibold min-h-10">
                    <input type="checkbox" checked={Boolean(d.com_imagem)} onChange={(e) => set("com_imagem", e.target.checked)} />
                    Vai com imagem
                  </label>
                </div>
              )}

              {tipo === "trafego" && (
                <>
                  <label className="campo">
                    <span>Objetivo</span>
                    <select className="entrada" value={d.objetivo ?? ""} onChange={(e) => set("objetivo", e.target.value || null)}>
                      <option value="">—</option>
                      {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="campo">
                      <span>R$ por dia</span>
                      <input className="entrada" type="number" min="0" step="0.01" inputMode="decimal" value={d.orcamento_dia ?? ""} onChange={(e) => set("orcamento_dia", e.target.value === "" ? null : Number(e.target.value))} />
                    </label>
                    <label className="campo">
                      <span>Investido (R$)</span>
                      <input className="entrada" type="number" min="0" step="0.01" inputMode="decimal" value={d.investido ?? ""} onChange={(e) => set("investido", e.target.value === "" ? null : Number(e.target.value))} />
                    </label>
                    <label className="campo">
                      <span>Resultados</span>
                      <input className="entrada" type="number" min="0" step="1" inputMode="numeric" value={d.resultados_qtd ?? ""} onChange={(e) => set("resultados_qtd", e.target.value === "" ? null : Number(e.target.value))} />
                    </label>
                  </div>
                </>
              )}

              <label className="campo">
                <span className="flex justify-between">
                  {rotuloTexto}
                  {d.texto && (
                    <button
                      type="button"
                      className="text-xs font-semibold border-0 bg-transparent"
                      style={{ color: "var(--brand)" }}
                      onClick={() => {
                        navigator.clipboard?.writeText(d.texto ?? "").then(() => {
                          setCopiado(true);
                          setTimeout(() => setCopiado(false), 1500);
                        });
                      }}
                    >
                      {copiado ? "Copiado ✓" : "Copiar texto"}
                    </button>
                  )}
                </span>
                <textarea className="entrada" rows={tipo === "disparo" ? 7 : 5} value={d.texto ?? ""} onChange={(e) => set("texto", e.target.value)} />
              </label>

              <label className="campo">
                <span>{tipo === "trafego" ? "Link do vídeo" : "Link (arquivo, Drive, Canva)"}</span>
                <input className="entrada" type="url" placeholder="https://" value={d.link ?? ""} onChange={(e) => set("link", e.target.value)} />
                {d.link && /^https?:\/\//.test(d.link) && (
                  <a href={d.link} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>Abrir link ↗</a>
                )}
              </label>

              {tipo !== "post" && (
                <label className="campo">
                  <span>{tipo === "disparo" ? "Responsável" : "Quem aparece"}</span>
                  <input className="entrada" value={d.pessoas ?? ""} onChange={(e) => set("pessoas", e.target.value)} />
                </label>
              )}

              <label className="campo">
                <span>Observações</span>
                <textarea className="entrada !min-h-[64px]" rows={2} value={d.notas ?? ""} onChange={(e) => set("notas", e.target.value)} />
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl text-sm" style={{ background: "var(--alerta-bg)" }}>
                <input type="checkbox" className="mt-1" checked={Boolean(d.confirmar)} onChange={(e) => set("confirmar", e.target.checked)} />
                <span>
                  <strong style={{ color: "var(--alerta)" }}>Precisa de confirmação antes de publicar</strong>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>Valores, cupons, nomes de parceiros, horários ou logística ainda não confirmados.</span>
                </span>
              </label>

              {existente && (
                <p className="text-xs" style={{ color: "var(--faint)" }}>
                  Criado por {inicial.criado_por === "cliente" ? "cliente" : "equipe"}
                  {inicial.atualizado_em && ` · última alteração por ${inicial.atualizado_por === "cliente" ? "cliente" : "equipe"} em ${format(parseISO(inicial.atualizado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}`}
                </p>
              )}
            </>
          )}
        </div>

        <footer className="sticky bottom-0 flex flex-wrap items-center gap-2 px-5 py-3" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
          {existente && perfil === "equipe" && (
            <button
              type="button"
              className="btn btn-perigo"
              onClick={async () => {
                if (confirm("Excluir este item? Não dá para desfazer.")) await onExcluir(inicial as Item);
              }}
            >
              Excluir
            </button>
          )}
          {existente && (
            <button type="button" className="btn" onClick={() => onDuplicar(d)}>Duplicar</button>
          )}
          <span className="flex-1" />
          <button type="button" className="btn" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario" disabled={!tipo || salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
        </footer>
      </form>
    </div>
  );
}
