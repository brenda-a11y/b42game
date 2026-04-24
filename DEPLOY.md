# 🚀 Deploy — B42: Em busca da aprendizagem

Um projeto de **Brenda M.** e **Guilherme G. Ferreira**.

Este documento explica, passo a passo, como colocar o jogo no ar com **Vercel** (hospedagem) e, opcionalmente, plugar o **Supabase** pra persistir ranking, usuários e pontuação entre dispositivos (hoje o jogo usa `localStorage` — perfeito pra ambiente local, mas não compartilha dados entre navegadores).

---

## 📁 Estrutura do projeto

```
.
├── index.html              # Tela principal do jogo
├── ranking.html            # Página de ranking
├── styles.css              # Estilos
├── js/
│   ├── game.js             # Motor e lógica
│   ├── levels.js           # Mapas das fases
│   ├── sprites.js          # Pixel art procedural
│   ├── audio.js            # SFX + música
│   └── users.js            # Cadastro/login/ranking (localStorage)
├── assets/                 # Imagens (Brenda, Raposa, Princesa, vilões)
└── DEPLOY.md               # Este arquivo
```

O jogo é **100% estático** — apenas HTML/CSS/JS, sem build step. Qualquer hospedagem estática serve.

---

## ✅ Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (o login com GitHub é o caminho mais rápido)
- (Opcional) Conta no [Supabase](https://supabase.com)
- [Git](https://git-scm.com/) instalado localmente
- [Node.js 18+](https://nodejs.org/) (opcional, só pra servir local com `npx serve`)

---

## 1. Subir o projeto pro GitHub

Se o projeto ainda não estiver num repositório:

```bash
cd "caminho/para/[JOGO] b42-quest-aprendizagem-corrigido"
git init
git add .
git commit -m "B42 — Em busca da aprendizagem (primeiro commit)"
```

Crie um repositório **vazio** no GitHub (ex.: `b42-em-busca-da-aprendizagem`) e rode:

```bash
git branch -M main
git remote add origin https://github.com/<SEU_USUARIO>/b42-em-busca-da-aprendizagem.git
git push -u origin main
```

---

## 2. Deploy no Vercel (hospedagem estática)

### 2.1. Importar o repositório

1. Acesse <https://vercel.com/new>.
2. Clique em **Import Git Repository** e selecione o repositório criado.
3. Na tela de configuração:
   - **Framework Preset:** `Other`
   - **Root Directory:** deixe a raiz (onde está o `index.html`)
   - **Build Command:** *(vazio — não precisa)*
   - **Output Directory:** *(vazio — Vercel serve a raiz direto)*
4. Clique em **Deploy**.

Em ~30 segundos você recebe uma URL tipo `https://b42-em-busca-da-aprendizagem.vercel.app`.

### 2.2. Configurações úteis

Na aba **Settings → Domains** você pode:
- Adicionar um domínio próprio (ex.: `jogo.b42.com.br`) e apontar o DNS conforme as instruções do Vercel.

Na aba **Settings → General → Production Branch**:
- Confirme que é `main`. Todo `git push origin main` faz redeploy automático.

### 2.3. (Opcional) arquivo `vercel.json`

Se quiser forçar cache longo nos assets e redirecionar rotas, crie na raiz:

```json
{
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico|mp3|wav)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

Commite e empurre — o Vercel aplica automaticamente.

---

## 3. (Opcional) Integrar com Supabase

O jogo hoje salva usuários e ranking em `localStorage` ([`js/users.js`](js/users.js)). Isso significa que cada navegador tem sua própria lista — não há ranking global. Pra ter **ranking compartilhado** entre jogadores, conecte o Supabase.

### 3.1. Criar o projeto

1. Acesse <https://supabase.com/dashboard> e clique em **New Project**.
2. Escolha um nome (ex.: `b42-quest`), uma senha forte pro DB e a região mais próxima.
3. Aguarde o provisionamento (~2 min).

### 3.2. Criar as tabelas

Abra **SQL Editor** no painel do Supabase e cole:

```sql
-- Usuários cadastrados no jogo
create table public.players (
  id uuid primary key default gen_random_uuid(),
  player_name text unique not null,
  email text unique not null,
  password_hash text not null,
  best_score int default 0,
  total_coins int default 0,
  total_kills int default 0,
  levels_completed int default 0,
  created_at timestamptz default now()
);

-- Política: qualquer um pode LER o ranking (público).
alter table public.players enable row level security;

create policy "ranking público"
  on public.players for select
  using (true);

-- Só o próprio jogador pode atualizar o próprio registro.
-- (Simplificação: vamos usar anon key + chamadas pela app.
-- Em produção real, migrar para auth.uid() com Supabase Auth.)
create policy "jogador pode atualizar o próprio registro"
  on public.players for update
  using (true);

create policy "jogador pode inserir o próprio registro"
  on public.players for insert
  with check (true);
```

> ⚠️ As políticas acima são **permissivas** pra facilitar integração. Se for virar produto público, troque `using (true)` por `using (auth.uid() = id)` e ative o Supabase Auth.

### 3.3. Pegar as credenciais

No painel do Supabase:
- **Project Settings → API**
- Copie o **Project URL** e a **anon public key**.

### 3.4. Adaptar `js/users.js`

Substitua o conteúdo de [`js/users.js`](js/users.js) por uma versão que fale com o Supabase. Esqueleto mínimo:

```js
// js/users.js  (versão Supabase)
(function (global) {
  'use strict';

  // ⚠️ SUBSTITUA pelos seus valores do painel Supabase.
  const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
  const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';

  // O client é carregado via CDN — adicione no index.html:
  // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function registerUser(playerName, email, password) {
    const { data, error } = await client.from('players').insert({
      player_name: playerName,
      email,
      password_hash: simpleHash(password),
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function login(playerName, password) {
    const { data } = await client.from('players')
      .select('*').eq('player_name', playerName).single();
    if (!data || data.password_hash !== simpleHash(password)) {
      return { ok: false, error: 'Usuário ou senha inválidos.' };
    }
    sessionStorage.setItem('b42-quest-session', JSON.stringify({
      id: data.id, playerName: data.player_name
    }));
    return { ok: true, user: data };
  }

  async function updatePlayerScore(playerName, score, coins, levels, kills) {
    await client.from('players').update({
      best_score: score,
      total_coins: coins,
      total_kills: kills,
      levels_completed: levels,
    }).eq('player_name', playerName);
  }

  async function getRanking() {
    const { data } = await client.from('players')
      .select('player_name, best_score, total_coins, total_kills, levels_completed')
      .order('total_coins', { ascending: false })
      .limit(50);
    return (data || []).map(r => ({
      playerName: r.player_name,
      bestScore: r.best_score,
      totalCoins: r.total_coins,
      totalKills: r.total_kills,
      levelsCompleted: r.levels_completed,
    }));
  }

  function getCurrentUser() {
    try {
      const s = JSON.parse(sessionStorage.getItem('b42-quest-session'));
      return s || null;
    } catch (e) { return null; }
  }

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
    return h.toString(36);
  }

  global.UserSystem = {
    registerUser, login, getCurrentUser,
    updatePlayerScore, getRanking,
  };
})(window);
```

E no [`index.html`](index.html) adicione **antes** da linha `<script src="js/users.js"></script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Em [`ranking.html`](ranking.html), faça a mesma inclusão pra página ler o ranking global.

### 3.5. Proteger a anon key (opcional)

A `anon key` é pública por design, mas se quiser esconder do código-fonte:

1. No Vercel: **Settings → Environment Variables** → adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Converta o projeto em Next.js ou use um tiny backend (`api/ranking.js`). Mas pra um MVP estático, a anon key no código é aceitável.

---

## 4. Testar localmente antes de publicar

No terminal, na raiz do projeto:

```bash
npx serve .
# abre em http://localhost:3000
```

Ou com Python:

```bash
python -m http.server 8080
# abre em http://localhost:8080
```

> ⚠️ Abrir `index.html` com duplo-clique (file://) **não funciona** em alguns navegadores por causa de CORS com as imagens. Sempre sirva via HTTP.

---

## 5. Checklist pós-deploy

Depois que a URL do Vercel está no ar, valide:

- [ ] Tela inicial abre com o título **"B42 — Em busca da aprendizagem"**
- [ ] Áudio funciona após o primeiro clique (política dos navegadores)
- [ ] Personagem pula, corre e colide com o cenário
- [ ] Fases 1-1 até 7-1 carregam em sequência
- [ ] Boss final aparece e pode ser derrotado
- [ ] Diálogo da Princesa roda até o convite pro **CIAED 2026**
- [ ] Tela de vitória mostra o relatório de aprendizagem
- [ ] Ranking lista os jogadores (localStorage ou Supabase, conforme config)

---

## 6. Troubleshooting

**"Imagens não aparecem em produção"**
Verifique se os caminhos em `assets/` estão em minúsculas — o Vercel é case-sensitive, o Windows não. Renomeie se necessário e commite.

**"Não toca som"**
Os navegadores só liberam áudio após interação do usuário. Confirme que tem um clique antes de esperar som.

**"Ranking vazio"**
Usando `localStorage`, cada navegador tem o próprio. Para ranking global, siga a seção 3 (Supabase).

**"Quero adicionar uma fase"**
Edite [`js/levels.js`](js/levels.js) seguindo a legenda no topo do arquivo. Commite e empurre — o Vercel faz redeploy automático.

---

## 📬 Contato

- Brenda M. — projeto **B42**
- Guilherme G. Ferreira — projeto **B42**
- Encontro: **Stand da B42 no CIAED 2026** ★
