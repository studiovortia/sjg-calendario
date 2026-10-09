-- =====================================================================
-- SJG · Calendário de Conteúdo
-- Cole este arquivo inteiro no Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- Campanhas (tags coloridas que agrupam posts, disparos e anúncios)
create table if not exists campanhas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  cor         text not null default '#0e7490',
  ativa       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- Itens do calendário: postagens, disparos de WhatsApp e vídeos no tráfego
create table if not exists itens (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null check (tipo in ('post', 'disparo', 'trafego')),
  titulo          text not null,
  data            date not null,              -- data do post / disparo / início do anúncio
  horario         text,                       -- "18:30"
  data_fim        date,                       -- fim do anúncio (tráfego)
  campanha_id     uuid references campanhas(id) on delete set null,
  status          text not null,

  formato         text,                       -- post: Reels, Carrossel, Estático, Stories
  canal           text,                       -- disparo: Grupo geral, Lista segmentada...
  pessoas         text,                       -- quem aparece / responsável
  texto           text,                       -- legenda, mensagem ou copy do anúncio
  link            text,                       -- arquivo, Drive, Canva, vídeo
  com_imagem      boolean not null default false,

  objetivo        text,                       -- tráfego
  orcamento_dia   numeric(10,2),
  investido       numeric(10,2),
  resultados_qtd  integer,

  notas           text,
  confirmar       boolean not null default false,  -- precisa de confirmação antes de publicar
  criado_por      text not null default 'equipe',
  atualizado_por  text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index if not exists itens_data_idx on itens (data);
create index if not exists itens_tipo_idx on itens (tipo);

-- Segurança: o sistema acessa o banco só pelo servidor (chave service_role).
-- Com RLS ligado e nenhuma política, a chave pública não lê nem grava nada.
alter table campanhas enable row level security;
alter table itens     enable row level security;

-- Campanhas iniciais do SJG (dá para editar tudo depois, dentro do sistema)
insert into campanhas (nome, cor) values
  ('Institucional SJG',          '#0e7490'),
  ('Treinamento Físico SJG',     '#1d4ed8'),
  ('Natação e Hidro',            '#0891b2'),
  ('Aquarela e Extravassa',      '#d97706'),
  ('Bela Gestante',              '#db2777'),
  ('Sala de Giro',               '#7c3aed'),
  ('Swim Camp 2027',             '#0f766e'),
  ('Adote um Sedentário',        '#16a34a'),
  ('Desafio SJG Terra e Água',   '#b45309')
on conflict do nothing;
