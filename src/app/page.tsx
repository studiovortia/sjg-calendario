import { redirect } from "next/navigation";
import Painel from "@/components/Painel";
import { perfilAtual } from "@/lib/sessao";
import { modoDemo } from "@/lib/store";

// página privada: sempre lê a sessão no servidor
export const instant = false;

export default async function Home({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const perfil = await perfilAtual();
  if (!perfil) redirect("/login");
  const { aba } = await searchParams;
  return <Painel perfil={perfil} demo={modoDemo()} abaInicial={aba} />;
}
