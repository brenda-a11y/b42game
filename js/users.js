/* ============================================================
   B42 QUEST — SISTEMA DE USUARIOS
   Cadastro, login, validação e ranking.

   Estratégia: se o SDK Supabase estiver carregado (window.SB_CLIENT),
   persiste/lê na nuvem. Caso contrário, cai pro localStorage — assim o
   jogo funciona offline e sem breaking changes.

   A API pública permanece SÍNCRONA pra não quebrar o fluxo existente
   (get/update/register/login retornam valores imediatos). Operações que
   tocam o Supabase disparam em segundo plano (fire-and-forget) ou lêem
   de um cache local atualizado periodicamente.
   ============================================================ */
(function(global) {
'use strict';

const STORAGE_KEY = 'b42-quest-users';
const SESSION_KEY = 'b42-quest-session';
const RANKING_CACHE_KEY = 'b42-quest-ranking-cache';

const HAS_SB = !!global.SB_CLIENT;
const sb = global.SB_CLIENT || null;

// E-mails com privilégio de admin. Pode ser sobrescrito por
// window.__B42_ADMIN_EMAILS antes de users.js carregar.
const ADMIN_EMAILS = (global.__B42_ADMIN_EMAILS || [
  'guhenrferreirass209@gmail.com',
  'thayla@b42.com.br',
  'brendamarconato1704@gmail.com',
  'admin@b42.com.br',
]).map(e => e.toLowerCase());

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());
}

// ============================================================
// localStorage helpers (baseline / fallback)
// ============================================================
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
function findUserLocal(playerName) {
  return getUsers().find(u => u.playerName.toLowerCase() === playerName.toLowerCase());
}
function playerNameExistsLocal(playerName) {
  return !!findUserLocal(playerName);
}
function emailExistsLocal(email) {
  return getUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Hash SHA-256 hex (usado quando Supabase está disponível — mais seguro
// que o simpleHash). Assíncrono, mas sempre fazemos em background.
async function sha256Hex(str) {
  if (!global.crypto || !global.crypto.subtle) return simpleHash(str);
  const buf = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ============================================================
// Validações (100% locais — o banco valida por constraints também)
// ============================================================
function _normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function validateRegistration(playerName, email, password, confirmPassword, opts) {
  opts = opts || {};
  const phone = opts.phone;
  const acceptedTerms = !!opts.acceptedTerms;
  const acceptedLGPD  = !!opts.acceptedLGPD;
  const errors = [];

  if (!playerName || playerName.trim().length < 3) {
    errors.push('Nome de jogador deve ter pelo menos 3 caracteres.');
  }
  if (playerName && playerName.trim().length > 20) {
    errors.push('Nome de jogador deve ter no máximo 20 caracteres.');
  }
  if (playerName && !/^[a-zA-Z0-9_\-\s]+$/.test(playerName.trim())) {
    errors.push('Nome de jogador só pode conter letras, números, espaços, _ e -.');
  }
  if (playerName && playerNameExistsLocal(playerName.trim())) {
    errors.push('Este nome de jogador já está em uso. Escolha outro.');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('Informe um e-mail válido.');
  }
  if (email && emailExistsLocal(email.trim())) {
    errors.push('Este e-mail já está cadastrado.');
  }

  // Telefone: 10 ou 11 dígitos (com DDD). Aceita formatos com (), -, espaços.
  const digits = _normalizePhone(phone);
  if (!digits || digits.length < 10 || digits.length > 13) {
    errors.push('Informe um telefone válido com DDD (10 ou 11 dígitos).');
  }

  if (!password || password.length < 4) {
    errors.push('Senha deve ter pelo menos 4 caracteres.');
  }
  if (password !== confirmPassword) {
    errors.push('As senhas não conferem.');
  }

  if (!acceptedTerms) {
    errors.push('Você precisa aceitar os Termos de Uso para continuar.');
  }
  if (!acceptedLGPD) {
    errors.push('Você precisa autorizar o tratamento dos dados (LGPD).');
  }

  return errors;
}

// ============================================================
// Registro — sempre grava no local E, se online, também no Supabase.
// ============================================================
function registerUser(playerName, email, password, opts) {
  opts = opts || {};
  const users = getUsers();
  const phoneDigits = _normalizePhone(opts.phone);
  const nowIso = new Date().toISOString();
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    playerName: playerName.trim(),
    email: email.trim().toLowerCase(),
    phone: phoneDigits,
    passwordHash: simpleHash(password),
    createdAt: nowIso,
    bestScore: 0,
    totalCoins: 0,
    totalKills: 0,
    levelsCompleted: 0,
    acceptedTerms: !!opts.acceptedTerms,
    acceptedLGPD:  !!opts.acceptedLGPD,
    consentAt:     nowIso,
    isAdmin:       isAdminEmail(email),
  };
  users.push(user);
  saveUsers(users);

  if (HAS_SB) {
    // Fire-and-forget: o front continua sem esperar.
    sha256Hex(password).then(async (hashHex) => {
      try {
        // Tenta inserir com os novos campos. Se a tabela ainda não tem as
        // colunas (banco antigo), faz fallback inserindo apenas o essencial.
        const fullPayload = {
          player_name:     user.playerName,
          email:           user.email,
          phone:           phoneDigits,
          password_hash:   hashHex,
          best_score:      0,
          total_coins:     0,
          total_kills:     0,
          levels_completed: 0,
          accepted_terms:  user.acceptedTerms,
          accepted_lgpd:   user.acceptedLGPD,
          consent_at:      nowIso,
          is_admin:        user.isAdmin,
        };
        let { error } = await sb.from('players').insert(fullPayload);
        if (error && /column .* does not exist|schema cache/i.test(String(error.message || ''))) {
          // Banco antigo sem as colunas novas — insere só os campos que ele conhece.
          const minimal = {
            player_name:    user.playerName,
            email:          user.email,
            password_hash:  hashHex,
            best_score:     0,
            total_coins:    0,
            total_kills:    0,
            levels_completed: 0,
          };
          const fb = await sb.from('players').insert(minimal);
          error = fb.error;
          if (!error) {
            console.info('[B42] cadastro feito (sem telefone/consent — rode o ALTER TABLE pra habilitar).');
          }
        }
        if (error && !String(error.message || '').match(/duplicate|unique/i)) {
          console.warn('[B42] register remote falhou:', error.message);
        }
      } catch (e) { console.warn('[B42] register remote erro:', e); }
    });
  }
  return user;
}

// ============================================================
// Login — checa local primeiro. Se achar, salva sessão.
// Se não achar E houver Supabase, busca na nuvem e traz pra cá.
// ============================================================
function login(playerName, password) {
  const user = findUserLocal(playerName);
  if (user) {
    if (user.passwordHash !== simpleHash(password)) {
      // Pode ser que a senha foi cadastrada remotamente com SHA-256 e
      // replicada com outro hash localmente — tenta remoto se disponível.
      if (HAS_SB) _tryRemoteLogin(playerName, password); // async best-effort
      return { ok: false, error: 'Senha incorreta.' };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: user.id, playerName: user.playerName
    }));
    return { ok: true, user };
  }
  // Sem cadastro local: tenta remoto (retorna sem sucesso imediato, mas
  // já dispara sync assíncrono).
  if (HAS_SB) _tryRemoteLogin(playerName, password);
  return { ok: false, error: 'Jogador não encontrado.' };
}

async function _tryRemoteLogin(playerName, password) {
  try {
    const hashHex = await sha256Hex(password);
    const { data, error } = await sb
      .from('players')
      .select('*')
      .eq('player_name', playerName.trim())
      .eq('password_hash', hashHex)
      .maybeSingle();
    if (error || !data) return;
    // Traz pro localStorage pra próxima chamada síncrona achar.
    const users = getUsers();
    if (!users.find(u => u.playerName.toLowerCase() === data.player_name.toLowerCase())) {
      users.push({
        id: data.id,
        playerName: data.player_name,
        email: data.email,
        phone: data.phone || '',
        passwordHash: simpleHash(password), // alinha com o formato local
        createdAt: data.created_at,
        bestScore: data.best_score || 0,
        totalCoins: data.total_coins || 0,
        totalKills: data.total_kills || 0,
        levelsCompleted: data.levels_completed || 0,
        acceptedTerms: !!data.accepted_terms,
        acceptedLGPD:  !!data.accepted_lgpd,
        isAdmin: !!data.is_admin || isAdminEmail(data.email),
      });
      saveUsers(users);
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      id: data.id, playerName: data.player_name
    }));
  } catch (e) { console.warn('[B42] remote login falhou:', e); }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

function getCurrentUser() {
  try {
    const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!session) return null;
    return findUserLocal(session.playerName) || null;
  } catch (e) { return null; }
}

function isLoggedIn() {
  return !!getCurrentUser();
}

// ============================================================
// playerNameExists — checa local (async: também checa remoto mas
// retorna síncrono pro front; resultado remoto só afeta prox. chamada)
// ============================================================
function playerNameExists(playerName) {
  const local = playerNameExistsLocal(playerName);
  if (local) return true;
  if (HAS_SB) {
    // best-effort async: se descobrirmos que existe remotamente, vamos
    // cachar no localStorage pra próxima validação bater.
    (async () => {
      try {
        const { data } = await sb.from('players')
          .select('player_name')
          .ilike('player_name', playerName.trim())
          .maybeSingle();
        if (data) {
          const users = getUsers();
          if (!users.find(u => u.playerName.toLowerCase() === data.player_name.toLowerCase())) {
            users.push({
              playerName: data.player_name,
              email: '__remote__',
              passwordHash: '',
              createdAt: new Date().toISOString(),
            });
            saveUsers(users);
          }
        }
      } catch (e) {}
    })();
  }
  return false;
}

// ============================================================
// Score / Ranking
// ============================================================
function updatePlayerScore(playerName, score, coins, levelsCompleted, kills) {
  const users = getUsers();
  const idx = users.findIndex(u => u.playerName.toLowerCase() === playerName.toLowerCase());
  if (idx !== -1) {
    if (score > (users[idx].bestScore || 0)) users[idx].bestScore = score;
    users[idx].totalCoins = Math.max(users[idx].totalCoins || 0, coins || 0);
    users[idx].totalKills = Math.max(users[idx].totalKills || 0, kills || 0);
    users[idx].levelsCompleted = Math.max(users[idx].levelsCompleted || 0, levelsCompleted || 0);
    saveUsers(users);
  }

  if (HAS_SB) {
    (async () => {
      try {
        // SELECT-then-UPDATE pra aplicar "greatest" no lado do cliente
        // (sem precisar de RPC customizada no Supabase).
        const { data: cur } = await sb
          .from('players')
          .select('best_score, total_coins, total_kills, levels_completed')
          .eq('player_name', playerName)
          .maybeSingle();
        const payload = {
          best_score:        Math.max((cur && cur.best_score) || 0, score || 0),
          total_coins:       Math.max((cur && cur.total_coins) || 0, coins || 0),
          total_kills:       Math.max((cur && cur.total_kills) || 0, kills || 0),
          levels_completed:  Math.max((cur && cur.levels_completed) || 0, levelsCompleted || 0),
          last_played_at:    new Date().toISOString(),
        };
        const { error } = await sb.from('players')
          .update(payload)
          .eq('player_name', playerName);
        if (error) console.warn('[B42] update score remoto falhou:', error.message);
      } catch (e) { console.warn('[B42] update score erro:', e); }
    })();
  }
}

// Cache de ranking remoto — o ranking.html faz `getRanking()` e lê isso.
// getRankingAsync() força refresh e popula a cache.
function getRanking() {
  // Se houver cache remoto válido, usa-o (mais completo, cross-device)
  try {
    const cached = JSON.parse(localStorage.getItem(RANKING_CACHE_KEY));
    if (cached && Array.isArray(cached.items) && cached.items.length) {
      return cached.items;
    }
  } catch (e) {}
  // Fallback: ranking local
  return getUsers()
    .map(u => ({
      playerName: u.playerName,
      bestScore: u.bestScore || 0,
      totalCoins: u.totalCoins || 0,
      totalKills: u.totalKills || 0,
      levelsCompleted: u.levelsCompleted || 0,
    }))
    .sort((a, b) => {
      const ap = (a.totalCoins || 0) + (a.totalKills || 0) * 2;
      const bp = (b.totalCoins || 0) + (b.totalKills || 0) * 2;
      if (bp !== ap) return bp - ap;
      return (b.bestScore || 0) - (a.bestScore || 0);
    });
}

async function getRankingAsync() {
  if (!HAS_SB) return getRanking();
  try {
    const { data, error } = await sb
      .from('players')
      .select('player_name, best_score, total_coins, total_kills, levels_completed')
      .order('total_coins', { ascending: false })
      .limit(100);
    if (error) throw error;
    const items = (data || []).map(r => ({
      playerName:        r.player_name,
      bestScore:         r.best_score || 0,
      totalCoins:        r.total_coins || 0,
      totalKills:        r.total_kills || 0,
      levelsCompleted:   r.levels_completed || 0,
    })).sort((a, b) => {
      const ap = (a.totalCoins || 0) + (a.totalKills || 0) * 2;
      const bp = (b.totalCoins || 0) + (b.totalKills || 0) * 2;
      if (bp !== ap) return bp - ap;
      return (b.bestScore || 0) - (a.bestScore || 0);
    });
    try {
      localStorage.setItem(RANKING_CACHE_KEY, JSON.stringify({
        items, updatedAt: Date.now()
      }));
    } catch (e) {}
    return items;
  } catch (e) {
    console.warn('[B42] getRankingAsync falhou — usando cache/local:', e);
    return getRanking();
  }
}

// ============================================================
// ADMIN — listagem completa e gerenciamento de jogadores
// Acesso restrito: o front só chama estas funções se o usuário
// logado for admin (isAdminEmail). RLS no Supabase ainda governa
// quem pode ler/deletar de fato.
// ============================================================
function isCurrentUserAdmin() {
  const u = getCurrentUser();
  if (!u) return false;
  return !!u.isAdmin || isAdminEmail(u.email);
}

async function adminListAllUsers() {
  // Busca lista mais completa possível: tenta Supabase primeiro,
  // cai pro localStorage se offline ou bloqueado.
  if (HAS_SB) {
    try {
      const { data, error } = await sb
        .from('players')
        .select('id, player_name, email, phone, best_score, total_coins, total_kills, levels_completed, created_at, last_played_at, accepted_terms, accepted_lgpd, consent_at, is_admin')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        // Tabela pode não ter as colunas novas — refaz com select mínimo.
        if (/column .* does not exist|schema cache/i.test(String(error.message || ''))) {
          const fb = await sb.from('players')
            .select('id, player_name, email, best_score, total_coins, total_kills, levels_completed, created_at, last_played_at')
            .order('created_at', { ascending: false })
            .limit(500);
          if (!fb.error) {
            return { source: 'supabase', items: (fb.data || []).map(_mapRow) };
          }
        }
        throw error;
      }
      return { source: 'supabase', items: (data || []).map(_mapRow) };
    } catch (e) {
      console.warn('[B42] admin list remoto falhou — usando local:', e);
    }
  }
  return {
    source: 'local',
    items: getUsers().map(u => ({
      id: u.id,
      playerName: u.playerName,
      email: u.email,
      phone: u.phone || '',
      bestScore: u.bestScore || 0,
      totalCoins: u.totalCoins || 0,
      totalKills: u.totalKills || 0,
      levelsCompleted: u.levelsCompleted || 0,
      createdAt: u.createdAt,
      lastPlayedAt: u.lastPlayedAt,
      acceptedTerms: !!u.acceptedTerms,
      acceptedLGPD:  !!u.acceptedLGPD,
      isAdmin:       !!u.isAdmin,
    })),
  };
}

function _mapRow(r) {
  return {
    id: r.id,
    playerName: r.player_name,
    email: r.email,
    phone: r.phone || '',
    bestScore: r.best_score || 0,
    totalCoins: r.total_coins || 0,
    totalKills: r.total_kills || 0,
    levelsCompleted: r.levels_completed || 0,
    createdAt: r.created_at,
    lastPlayedAt: r.last_played_at,
    acceptedTerms: !!r.accepted_terms,
    acceptedLGPD:  !!r.accepted_lgpd,
    consentAt:     r.consent_at,
    isAdmin:       !!r.is_admin,
  };
}

async function adminDeleteUser(playerName) {
  if (!playerName) return { ok: false, error: 'Nome obrigatório.' };
  // Local
  const users = getUsers().filter(u => u.playerName.toLowerCase() !== String(playerName).toLowerCase());
  saveUsers(users);
  // Remoto
  if (HAS_SB) {
    try {
      const { error } = await sb.from('players').delete().eq('player_name', playerName);
      if (error) return { ok: false, error: error.message, localOk: true };
    } catch (e) {
      return { ok: false, error: String(e), localOk: true };
    }
  }
  return { ok: true };
}

// ============================================================
// API global
// ============================================================
global.UserSystem = {
  validateRegistration,
  registerUser,
  playerNameExists,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  updatePlayerScore,
  getRanking,
  getRankingAsync,
  getUsers,
  // Admin:
  isCurrentUserAdmin,
  adminListAllUsers,
  adminDeleteUser,
  // Info pro HUD/debug:
  isRemoteEnabled: () => HAS_SB,
};

})(typeof window !== 'undefined' ? window : globalThis);
