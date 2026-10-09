export type Perfil = "equipe" | "cliente";
export type Tipo = "post" | "disparo" | "trafego";

export interface Campanha {
  id: string;
  nome: string;
  cor: string;
  ativa: boolean;
}

export interface Item {
  id: string;
  tipo: Tipo;
  titulo: string;
  data: string; // yyyy-mm-dd
  horario: string | null;
  data_fim: string | null;
  campanha_id: string | null;
  status: string;
  formato: string | null;
  canal: string | null;
  pessoas: string | null;
  texto: string | null;
  link: string | null;
  com_imagem: boolean;
  objetivo: string | null;
  orcamento_dia: number | null;
  investido: number | null;
  resultados_qtd: number | null;
  notas: string | null;
  confirmar: boolean;
  criado_por: Perfil;
  atualizado_por: Perfil | null;
  criado_em: string;
  atualizado_em: string;
}

export type ItemInput = Partial<Omit<Item, "id" | "criado_em" | "atualizado_em" | "criado_por" | "atualizado_por">>;

export const TIPOS: Record<Tipo, { nome: string; plural: string; icone: string }> = {
  post: { nome: "Postagem", plural: "Postagens", icone: "◼" },
  disparo: { nome: "Disparo", plural: "Disparos", icone: "✉" },
  trafego: { nome: "Tráfego", plural: "Tráfego", icone: "▶" },
};

export const STATUS: Record<Tipo, string[]> = {
  post: ["Ideia", "Roteiro", "Gravação", "Edição", "Aprovação", "Agendado", "Publicado"],
  disparo: ["Rascunho", "Aprovação", "Agendado", "Enviado"],
  trafego: ["Planejado", "Rodando", "Pausado", "Encerrado"],
};

export const STATUS_FINAL: Record<Tipo, string[]> = {
  post: ["Publicado"],
  disparo: ["Enviado"],
  trafego: ["Encerrado"],
};

export const FORMATOS = ["Reels", "Carrossel", "Estático", "Stories"];
export const CANAIS = ["Grupo geral", "Lista segmentada", "Grupo de influenciadoras", "Status do WhatsApp"];
export const OBJETIVOS = [
  "Mensagens no WhatsApp",
  "Inscrições / Sympla",
  "Alcance",
  "Visitas ao perfil",
  "Seguidores",
  "Engajamento",
];

export const CAMPOS_EDITAVEIS: (keyof ItemInput)[] = [
  "tipo", "titulo", "data", "horario", "data_fim", "campanha_id", "status", "formato", "canal",
  "pessoas", "texto", "link", "com_imagem", "objetivo", "orcamento_dia", "investido",
  "resultados_qtd", "notas", "confirmar",
];
