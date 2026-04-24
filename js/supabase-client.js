/* ============================================================
   B42 QUEST — CLIENT SUPABASE
   Inicializa o client global (window.SB_CLIENT) quando o SDK
   `supabase-js` está disponível. O arquivo é incluído ANTES
   de users.js pra que o UserSystem possa detectar e usar.
   ============================================================ */
(function (global) {
  'use strict';

  // Projeto Supabase deste jogo.
  // ⚠️ A "publishable key" (anon) é segura no cliente — ela depende de RLS
  //    no banco pra proteger dados. NUNCA coloque a "secret" (service_role)
  //    aqui; ela ignora RLS e só pode viver em ambiente server-side.
  const SUPABASE_URL = 'https://nphydhwbuefcmyznobca.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_DWMSyHv8Q-XyeErNOb5UYg_DbGVeT3Z';

  // Permite override via window.__SUPABASE_CONFIG (útil pra ambientes
  // distintos — dev/staging/prod — sem recompilar).
  const cfg = global.__SUPABASE_CONFIG || {};
  const url = cfg.url || SUPABASE_URL;
  const key = cfg.anonKey || SUPABASE_ANON_KEY;

  global.SB_URL = url;
  global.SB_ANON_KEY = key;

  try {
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      global.SB_CLIENT = global.supabase.createClient(url, key, {
        auth: { persistSession: false }, // usamos auth próprio via tabela `players`
      });
      global.SB_AVAILABLE = true;
    } else {
      global.SB_CLIENT = null;
      global.SB_AVAILABLE = false;
      // Não é fatal — o jogo cai no fallback localStorage.
      console.info('[B42] supabase-js não carregado — usando localStorage.');
    }
  } catch (e) {
    global.SB_CLIENT = null;
    global.SB_AVAILABLE = false;
    console.warn('[B42] Falha ao inicializar Supabase:', e);
  }
})(typeof window !== 'undefined' ? window : globalThis);
