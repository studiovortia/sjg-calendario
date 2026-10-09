"use client";

import { useState } from "react";

export default function Login() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro("");
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senha }),
    });
    if (r.ok) {
      window.location.href = "/";
      return;
    }
    const j = await r.json().catch(() => ({}));
    setErro(j.erro ?? "Não foi possível entrar.");
    setEnviando(false);
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={entrar} className="cartao w-full max-w-sm p-7 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={44} height={44} className="rounded-xl" />
          <div>
            <h1 className="text-lg font-bold leading-tight">Studio Júnia Guimarães</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Calendário de conteúdo</p>
          </div>
        </div>
        <label className="campo">
          <span>Senha de acesso</span>
          <input
            className="entrada"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>
        {erro && <p className="text-sm font-semibold" style={{ color: "var(--perigo)" }}>{erro}</p>}
        <button className="btn btn-primario" disabled={!senha || enviando}>
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
