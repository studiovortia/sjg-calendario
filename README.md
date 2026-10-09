# SJG · Calendário de Conteúdo

Postagens, disparos de WhatsApp e vídeos no tráfego do Studio Júnia Guimarães em um só lugar.

## O que tem

- **Calendário** mensal com tudo junto, colorido por tipo; no celular vira uma agenda.
- **Postagens** em quadro de produção: Ideia → Roteiro → Gravação → Edição → Aprovação → Agendado → Publicado.
- **Disparos** organizados por semana, com canal, se vai com imagem e botão de copiar a mensagem.
- **Tráfego** com período, objetivo, orçamento/dia, investido, resultados e custo por resultado calculado.
- **Campanhas** coloridas para filtrar tudo (só a equipe edita).
- Marcação **"Precisa de confirmação"** para valores, cupons, parceiros e logística.

## Dois acessos

| Senha | Pode |
|---|---|
| `SENHA_EQUIPE` | tudo: criar, editar, excluir, gerenciar campanhas |
| `SENHA_CLIENTE` | criar, editar e mudar status — **não exclui** nada nem mexe nas campanhas |

Itens criados pela cliente aparecem com o selo **Cliente**. Trocar uma senha desconecta quem entrou com a antiga.

---

## Como colocar no ar (uma vez só, ~20 min)

### 1. Banco de dados — Supabase
1. Crie uma conta em supabase.com → **New project** (região: São Paulo). Guarde a senha do banco.
2. No menu lateral, **SQL Editor → New query**. Cole todo o conteúdo de `supabase/schema.sql` e clique **Run**.
3. Vá em **Project Settings → API** e copie:
   - **Project URL** → vai ser o `SUPABASE_URL`
   - chave **service_role** (secreta) → vai ser o `SUPABASE_SERVICE_ROLE_KEY`

> A chave service_role dá acesso total ao banco. Ela só fica no Vercel; nunca mande por WhatsApp nem coloque no código.

### 2. Código — GitHub
1. Crie uma conta em github.com → **New repository** → nome `sjg-calendario`, **Private**.
2. Envie os arquivos deste projeto para o repositório.

### 3. Site — Vercel
1. Crie uma conta em vercel.com entrando **com o GitHub**.
2. **Add New → Project** → escolha `sjg-calendario` → **Import**.
3. Em **Environment Variables**, adicione:
   - `SENHA_EQUIPE`
   - `SENHA_CLIENTE`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET` (opcional, uma frase longa qualquer)
4. **Deploy**. Em 1–2 minutos o site estará em `sjg-calendario.vercel.app` (ou parecido).

Pronto: mande o link + `SENHA_CLIENTE` para a cliente.

### Trocar uma senha depois
Vercel → projeto → **Settings → Environment Variables** → edite → **Deployments → ⋯ → Redeploy**.

### Se aparecer a faixa amarela "Modo demonstração"
As variáveis do Supabase não foram encontradas. Confira os nomes no Vercel e faça Redeploy.

---

## Para desenvolver no computador

```bash
npm install
cp .env.example .env.local   # preencha os valores
npm run dev                  # abre em http://localhost:3000
```

Sem as variáveis do Supabase o sistema roda em modo demonstração, com exemplos que somem ao reiniciar.

Feito com Next.js 16, Tailwind 4 e Supabase.
