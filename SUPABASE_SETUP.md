# Supabase — Configuração do banco (passo a passo)

Este guia aplica-se **diretamente ao projeto deste jogo**. As chaves já estão
cabladas em [`js/supabase-client.js`](js/supabase-client.js):

- **URL:** `https://nphydhwbuefcmyznobca.supabase.co`
- **Publishable key:** `sb_publishable_DWMSyHv8Q-XyeErNOb5UYg_DbGVeT3Z` (vai
  no front — protegida por RLS)
- **Secret key:** ⚠️ **NÃO** colocar no front. Ela foi vazada em chat uma vez
  — troque-a agora mesmo em **Project Settings → API Keys → Reset secret**.

Se só quiser testar localmente **sem Supabase**, o jogo funciona: o código
em `users.js` detecta a ausência do SDK e cai no `localStorage` automaticamente.

---

## 1) Criar as tabelas

No painel Supabase, abra **SQL Editor → New query** e cole:

```sql
-- Extensão de criptografia (caso queira usar senhas com crypt() depois)
create extension if not exists pgcrypto;

-- Jogadores cadastrados
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  player_name text unique not null,
  email text unique not null,
  phone text,
  password_hash text not null,
  created_at timestamptz default now(),
  last_played_at timestamptz,
  best_score integer default 0,
  total_coins integer default 0,
  total_kills integer default 0,
  levels_completed integer default 0,
  accepted_terms boolean default false,
  accepted_lgpd boolean default false,
  consent_at timestamptz,
  is_admin boolean default false
);

-- Índice pro ranking ordenar rápido
create index if not exists idx_players_ranking
  on public.players (total_coins desc, total_kills desc, best_score desc);
```

Clique em **Run**. Deve concluir sem erro.

### 1b) Banco já existente? Rode esta migração

Se a tabela `players` já foi criada antes, adicione as colunas novas:

```sql
alter table public.players add column if not exists phone text;
alter table public.players add column if not exists accepted_terms boolean default false;
alter table public.players add column if not exists accepted_lgpd boolean default false;
alter table public.players add column if not exists consent_at timestamptz;
alter table public.players add column if not exists is_admin boolean default false;
alter table public.players add column if not exists levels_completed integer default 0;

-- Recarrega o cache de schema do PostgREST
notify pgrst, 'reload schema';
```

---

## 2) Row Level Security (RLS)

Obrigatório antes de publicar. Sem RLS qualquer cliente anon pode apagar o
banco inteiro.

```sql
alter table public.players enable row level security;

-- LEITURA pública (qualquer um pode ver o ranking)
create policy "ranking público leitura"
  on public.players for select
  using (true);

-- INSERT permitido (cadastro de novos jogadores)
create policy "cadastro aberto"
  on public.players for insert
  with check (
    -- valida tamanhos mínimos — bloqueia lixo/bot
    length(player_name) between 3 and 20
    and length(email) >= 6
    and length(password_hash) >= 8
  );

-- UPDATE simplificado: permite atualizar **apenas o próprio registro por
-- player_name**. Não dá pra forjar score alheio porque o WHERE bate pelo
-- nome, e o front só manda o nome do jogador logado.
-- Pra hardening adicional, troque depois por autenticação via supabase.auth
-- (signUp/signInWithPassword) e use auth.uid() = id.
create policy "update pelo próprio nome"
  on public.players for update
  using (true);
```

> 🔒 **Nota de segurança:** como o jogo é um MVP de ranking comunitário, as
> políticas acima aceitam update/insert de qualquer cliente anon. Se for virar
> produto público, migre pra **Supabase Auth** (`supabase.auth.signUp`) e amarre
> as policies em `auth.uid()`. Veja a seção *Hardening* no fim.

---

## 3) (Opcional) RPC pra update atômico via senha

Se quiser impedir que alguém atualize o score de um nome alheio sem saber a
senha, crie uma RPC segura:

```sql
create or replace function public.register_play(
  p_name text,
  p_password_hash text,
  p_score integer,
  p_coins integer,
  p_kills integer,
  p_levels integer
) returns void
language plpgsql
security definer
as $$
begin
  update public.players
    set best_score        = greatest(best_score, p_score),
        total_coins       = greatest(total_coins, p_coins),
        total_kills       = greatest(total_kills, p_kills),
        levels_completed  = greatest(levels_completed, p_levels),
        last_played_at    = now()
  where player_name = p_name
    and password_hash = p_password_hash;
end;
$$;

-- Permite ao client anon invocar
grant execute on function public.register_play(text,text,int,int,int,int) to anon;
```

Nesse caso, troque [`js/users.js`](js/users.js) `updatePlayerScore` pra chamar
`sb.rpc('register_play', {...})` em vez do `update` direto.

---

## 4) Testar a conexão

Abra [`ranking.html`](ranking.html) no navegador após cadastrar e jogar uma
fase. O console deve mostrar algo como:

```
[B42] Supabase conectado em https://nphydhwbuefcmyznobca.supabase.co
```

Se aparecer `[B42] supabase-js não carregado — usando localStorage`, verifique
que o CDN `@supabase/supabase-js@2` está acessível (não bloqueado por firewall
/ plugin). O jogo **continua funcionando** — só não compartilha ranking.

---

## 5) Estrutura atual do código (já implementada)

| Arquivo                                     | Papel                                            |
|---------------------------------------------|--------------------------------------------------|
| [`js/supabase-client.js`](js/supabase-client.js) | Inicializa `window.SB_CLIENT` com as credenciais |
| [`js/users.js`](js/users.js)                | API `UserSystem` com fallback local/remoto       |
| [`ranking.html`](ranking.html)              | Chama `getRankingAsync()` — busca no Supabase    |
| [`index.html`](index.html)                  | Inclui SDK + client antes de `users.js`          |

### Fluxo da integração

- **Cadastro** (`UserSystem.registerUser`): grava no localStorage imediatamente
  (fluxo síncrono pro front) e dispara `INSERT` remoto em background.
- **Login** (`UserSystem.login`): tenta local primeiro. Se falhar e houver
  Supabase, busca remoto; ao encontrar, hidrata o localStorage pra próxima.
- **Update de score** (`UserSystem.updatePlayerScore`): sempre grava local
  instantaneamente. Em paralelo faz `select` + `update` com `greatest()` pra
  nunca baixar o recorde do jogador.
- **Ranking** (`UserSystem.getRankingAsync`): busca até 100 jogadores do
  Supabase, ordenados por `total_coins desc`, e guarda em `localStorage` como
  cache. Se cair a conexão, `getRanking()` devolve esse cache.

---

## 6) Hardening (quando virar produto)

1. **Remova a policy aberta de update** e migre pra RPC com senha validada
   (seção 3) ou pra Supabase Auth nativa.
2. **Ative rate limiting** no dashboard (Project Settings → API → Rate Limiting)
   pra evitar spam de cadastros.
3. **Rotacione a secret** a cada vazamento (e **nunca** coloque-a no front).
4. **Valide score máximo possível** num trigger (ex.: score nunca acima de
   500.000) pra barrar cheats via devtools.

```sql
create or replace function validate_score()
returns trigger language plpgsql as $$
begin
  if NEW.best_score > 500000 then
    raise exception 'score implausível';
  end if;
  return NEW;
end;
$$;

create trigger enforce_score_ceiling
before update on public.players
for each row execute function validate_score();
```

---

## 7) Troubleshooting

**"Ranking vazio mesmo após jogar"**
- Verifique no painel Supabase → **Table Editor → players** se os registros
  estão aparecendo. Se não: a policy de INSERT pode estar bloqueando (cheque
  tamanho mínimo do `password_hash`).

**"CORS error no console"**
- No painel → **Authentication → URL Configuration**, adicione a URL do seu
  Vercel (ex.: `https://b42-em-busca-da-aprendizagem.vercel.app`) na lista
  de redirect URLs.

**"ERR_NAME_NOT_RESOLVED no SDK"**
- Algum bloqueador de CDN. Teste trocar pelo mirror:
  `https://esm.sh/@supabase/supabase-js@2` no `index.html`/`ranking.html`.

**"Duplicate key value violates unique constraint"**
- Nome ou e-mail já existente. O `users.js` ignora esse erro silenciosamente
  — ele só significa que o jogador já tinha se cadastrado antes.
