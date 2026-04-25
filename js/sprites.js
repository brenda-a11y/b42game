/* ============================================================
   B42 QUEST — SPRITE ATLAS
   Sprites pixel art desenhados em grids ASCII, bakeados em
   offscreen canvases para drawImage rápido.
   ============================================================ */
(function(global) {
'use strict';

const PAL = {
  K: '#000000',  // preto (contorno)
  W: '#ffffff',  // branco
  e: '#e0e0e0',  // cinza claro
  D: '#5b5b5b',  // cinza escuro
  d: '#8b8b8b',  // cinza médio
  P: '#5b2d91',  // B42 purple
  L: '#8b5fbf',  // B42 purple light
  V: '#2a1454',  // B42 purple dark
  O: '#f7941d',  // B42 orange
  o: '#c4671a',  // B42 orange dark
  Y: '#ffd43b',  // B42 yellow
  C: '#fff5e1',  // B42 cream
  R: '#c40000',  // red
  r: '#8b0000',  // dark red
  G: '#00a800',  // green
  g: '#2cd82c',  // light green
  h: '#006400',  // dark green
  B: '#5c94fc',  // sky blue
  b: '#2a4ec8',  // dark blue
  F: '#f5d0a9',  // skin
  f: '#d9a578',  // skin shadow
  H: '#3a1f0a',  // hair/brown
  T: '#c84c0c',  // terracotta (ground)
  t: '#8b3504',  // dark terracotta
  S: '#1a1a4a',  // dark navy (pants)
  s: '#2a2a6a',  // navy light
  c: '#fbd000',  // coin dark yellow
  A: '#a0a0a0',  // armor gray
  M: '#3a3a3a',  // metal dark
  N: '#c0c0c0',  // metal light
};

// Bake um grid ASCII em um canvas offscreen
function bake(grid, pal) {
  pal = pal || PAL;
  const rows = grid.split('\n').map(r => r.replace(/\s+$/, '')).filter(r => r.length);
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === ' ' || !pal[ch]) continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// Espelha um canvas horizontalmente (para virar direção)
function flip(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

// ============================================================
// HERO — "BRENDA", A ESTUDANTE (forma pequena, 12x14) — fallback ASCII
// ============================================================
const HERO_SMALL_IDLE = `
...KKKKKK...
..KOOOOOOK..
..KOYYYYOK..
.KKFFFFFFK..
.KFKFFFKFK..
.KFFFKKFFK..
.KKPPPPPPKK.
KPPPYYYYPPK
KPPPPPPPPPK
KPPOOOOOOPK
.KKSSSSSKKK.
..KSSSSSSK..
..KSSK.KSSK.
..KKK...KKK.
`;

const HERO_SMALL_WALK = `
...KKKKKK...
..KOOOOOOK..
..KOYYYYOK..
.KKFFFFFFK..
.KFKFFFKFK..
.KFFFKKFFK..
.KKPPPPPPKK.
KPPPYYYYPPK
KPPPPPPPPPK
KPPOOOOOOPK
..KSSSSSKK..
.KSSSSSSSK..
.KSSK..KSK..
.KKK....KK..
`;

// Segundo frame de caminhada (alterna as pernas)
const HERO_SMALL_WALK2 = `
...KKKKKK...
..KOOOOOOK..
..KOYYYYOK..
.KKFFFFFFK..
.KFKFFFKFK..
.KFFFKKFFK..
.KKPPPPPPKK.
KPPPYYYYPPK
KPPPPPPPPPK
KPPOOOOOOPK
..KKSSSSSKK.
..KSSSSSSSK.
..KSK..KSSK.
..KK....KKK.
`;

// Frame de corrida/sprint (braços estendidos, pose dinâmica)
const HERO_SMALL_RUN = `
...KKKKKK...
..KOOOOOOK..
..KOYYYYOK..
.KKFFFFFFK..
.KFKFFFKFK..
KKFFFKKFFKK.
KPPPPPPPPPK.
KPPPYYYYPPK.
KPPPPPPPPPPK
.KPOOOOOOPK.
.KKSSSSSKK..
.KSSSSSSSK..
.KSKK..KSSK.
.KKK....KK..
`;

const HERO_SMALL_JUMP = `
...KKKKKK...
..KOOOOOOK..
..KOYYYYOK..
.KKFFFFFFK..
.KFKKKKKFK..
.KFFKKKFFK..
KKPPPPPPPKK.
KPPPYYYYPPK
KPPPPPPPPPK
KPPOOOOOOPK
.KSSSSSSSK..
KSSSSSSSSSK.
KKSK...KSSK.
.KK.....KK..
`;

// ============================================================
// HERO — "KAIRO" FORMA EVOLUÍDA (com cogumelo B42, 14x26)
// ============================================================
const HERO_BIG_IDLE = `
....KKKKKKKK....
...KYYYYYYYYK...
..KYOOOOOOOOYK..
..KYOOYYYYOOYK..
.KYOOYB42YOOYK..
..KYOOYYYYOOYK..
..KYOOOOOOOOYK..
..KKKFFFFFFFKK..
.KFFFFFFFFFFFK..
.KFKKFFFFKKFK..
.KFFFFFFFFFFK..
.KFFFKKKKFFFK..
.KFFFFFFFFFFK..
.KKPPPPPPPPKK..
KPPPPYYYYPPPPK
KPPPOOOOOOPPPK
KPPPYYYYYYPPPK
KPPPOOOOOOPPPK
KPPPPPPPPPPPPK
KPPOOOOOOOOPPK
.KKSSSSSSSSKK..
.KSSSSSSSSSSK..
.KSSSSSSSSSSK..
.KSSKK..KKSSK..
.KKK.....KKK..
.KK.......KK..
`;

// ============================================================
// HERO WALK / JUMP BIG (simplificado — só muda a linha inferior)
// ============================================================
const HERO_BIG_WALK = `
....KKKKKKKK....
...KYYYYYYYYK...
..KYOOOOOOOOYK..
..KYOOYYYYOOYK..
.KYOOYB42YOOYK..
..KYOOYYYYOOYK..
..KYOOOOOOOOYK..
..KKKFFFFFFFKK..
.KFFFFFFFFFFFK..
.KFKKFFFFKKFK..
.KFFFFFFFFFFK..
.KFFFKKKKFFFK..
.KFFFFFFFFFFK..
.KKPPPPPPPPKK..
KPPPPYYYYPPPPK
KPPPOOOOOOPPPK
KPPPYYYYYYPPPK
KPPPOOOOOOPPPK
KPPPPPPPPPPPPK
KPPOOOOOOOOPPK
..KSSSSSSSKK...
.KSSSSSSSSSK..
.KSSSSSSSSSSK.
.KSSK....KSK..
.KKK......KK..
..K........K..
`;

// ============================================================
// INIMIGOS
// ============================================================

// Walker — "Texto Maçante" (livro de texto maçante com pernas)
// 16 de largura por 14 de altura — livro fechado com lombada e pernas
const ENEMY_BOOK = `
KKKKKKKKKKKKKKKK
KPPPPPPPPPPPPPPK
KPCCCCCCCCCCCCPK
KPCDDDDDDDDDDCPK
KPCDeeeeeeeeDCPK
KPCDeKKKKKKKDCPK
KPCDeKeeeeKKDCPK
KPCDeKKKKKKKDCPK
KPCDeeeeeeeeDCPK
KPCDDDDDDDDDDCPK
KPCCCCCCCCCCCCPK
KPPPPPPPPPPPPPPK
KKKKKKKKKKKKKKKK
.KK..KKK..KK..KK
`;

// Walker — "Bloco Maçante" (texto sem fim)
const ENEMY_BLOCK = `
.KKKKKKKKKK.
KeeeeeeeeeeK
KeDDKDDKDDeK
KeDKDKDKDeeK
KeeeeeeeeeeK
KeDDKDKDDeeK
KeDKDKDDKeeK
KeeeeeeeeeeK
KeDDKDDKDDeK
KeDKDKDKDeeK
KeeeeeeeeeeK
.KDDDDDDKK..
.KDKKKKKKDK.
..KK....KK..
`;

// Jumper — "Distração Brilhante" (tipo um alerta)
const ENEMY_DISTR = `
....KKKK....
...KRRRRK...
..KRYYYYRK..
.KRYKKKKYRK.
KRYKRRRRKYRK
KRYKRRRRKYRK
KRYKKKKKKYRK
KRYKRRRRKYRK
KRYKKKKKKYRK
.KRYYYYYYRK.
..KRRRRRRK..
...KRKKRK...
...KK..KK...
`;

// Flyer — "Ruído Cognitivo" (nuvem escura pequena)
const ENEMY_NOISE = `
...KKKKKKKK...
..KVVVVVVVVK..
.KVVLLLLVVVK..
.KVLLLVVVLVK..
KVVVVVLLLLVVK.
KVVVVVLLLVVVK.
KVLLVVVLLLVVK.
.KVVVVVVVVVK..
..KVVVVVVVK...
...KKKKKK....
`;

// ============================================================
// BOSS — "DESENGAJAMENTO" (32x32)
// ============================================================
const BOSS_DESENGAJAMENTO = `
......KKKKKKKKKKKKKKKKKK......
.....KVVVVVVVVVVVVVVVVVVK.....
....KVVLLVVVVVVVVVVLLVVVK....
...KVVLLRLLVVVVVVLLRLLVVVK...
..KVVLLRRRLLVVVVLLRRRLLVVVK..
..KVVLLRRRLLVVVVLLRRRLLVVVK..
.KVVVVLLRLLVVVVVVLLRLLVVVVVK.
.KVVVVVLLLVVVVVVVVLLLVVVVVVK.
KVVVVVVVVVVVVVVVVVVVVVVVVVVVK
KVVKKKKKKKKVVVVVVKKKKKKKKVVK
KVKYYYYYYKVVVVVVVKYYYYYYKVVK
KVKYKKYKKYKVVVVVKYKKYKKYKVVK
KVKYKKYKKYKVVVVVKYKKYKKYKVVK
KVKYYYYYYKVVVVVVVKYYYYYYKVVK
KVKKKKKKKKVVVVVVKKKKKKKKKVVK
KVVVVVVVVVVVVRRVVVVVVVVVVVVK
KVVVVVVVVVRRRRRRVVVVVVVVVVVK
KVVVKKKKVVVRRRRVVVKKKKVVVVVK
KVVKWWWWKVVRRRRVVKWWWWKVVVK
KVVKWKKKKVVVRRVVVKWKKKKVVVK
KVVKKKKKKVVVVVVVVKKKKKKVVVVK
KVVVVVVVVVVVVVVVVVVVVVVVVVVK
KVVVKKKKKKKKKKKKKKKKKKKVVVVK
KVVKRRRRRRRRRRRRRRRRRRKVVVVK
KVKRRKKRRKKRRKKRRKKRRRKVVVVK
KVKRRKKRRKKRRKKRRKKRRRKVVVVK
KVKRRRRRRRRRRRRRRRRRRRKVVVVK
KVVKKKKKKKKKKKKKKKKKKKVVVVK
KVVVVVVVVVVVVVVVVVVVVVVVVVK
.KVVVKKKVVVVVVVVKKKVVVVVVK.
..KKKKKKKKKKKKKKKKKKKKKKK..
.....KKKKKK......KKKKKK.....
`;

// ============================================================
// ITENS
// ============================================================

// Moeda (14x14) — 4 frames para girar
const COIN_0 = `
...KKKKKKKK...
..KcYYYYYYcK..
.KcYYYYYYYYcK.
KcYYYKKYYYYcK
KcYYKKKKYYYcK
KcYYKKKKYYYcK
KcYYKKKKYYYcK
KcYYKKKKYYYcK
KcYYKKKKYYYcK
KcYYKKKKYYYcK
KcYYYYYYYYYcK
.KcYYYYYYYcK.
..KcYYYYYcK..
...KKKKKKKK...
`;

const COIN_1 = `
....KKKKKK....
...KcYYYYcK...
...KcYYYYcK...
...KcYYYYcK...
...KcYKKYcK...
...KcYKKYcK...
...KcYKKYcK...
...KcYKKYcK...
...KcYKKYcK...
...KcYYYYcK...
...KcYYYYcK...
...KcYYYYcK...
....KKKKKK....
..............
`;

const COIN_2 = `
......KK......
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
.....KccK.....
......KK......
..............
`;

const COIN_3 = COIN_1; // reflexo

// Cogumelo B42 — 16x14
const B42_MUSHROOM = `
...KKKKKKKKKK...
..KPPPPPPPPPPK..
.KPPOOPPPPOOPPK.
KPOOPPPPPPPPOPK
KPPPPPPPPPPPPPK
KPYYYYYYYYYYPK.
KPYKYKKYKKYYPK
KPYKYKYKYKYYPK
KPYYYYKKYYYYPK
KPPPPPPPPPPPPK
KKKKKKKKKKKKKK
.KCCCCCCCCCCK.
.KCKKCCCCKKCK.
..KKKCCCCKKK..
`;

// Power orb — "Foco" (10x10)
const POWER_FOCUS = `
..KKKKKK..
.KGGggGGK.
KGggGGggGK
KGgGGWWGgK
KGgGWWGGgK
KGgGGWGGgK
KGggGGggGK
.KGGggGGK.
..KKKKKK..
..........
`;

// Power orb — "Curiosidade"
const POWER_CURIOSITY = `
..KKKKKK..
.KOOOoOOK.
KOooOOooOK
KOoOOKKOoK
KOoOOKOOoK
KOoOOKOOoK
KOoOKOOooK
.KOOOoOOK.
..KKKKKK..
..........
`;

// Power orb — "Método" (aprendizado estruturado — livro aberto + estrela)
const POWER_METHOD = `
..KKKKKK..
.KBBBBBBK.
KBWWbbWWBK
KBWbYYbWBK
KBWbYYbWBK
KBWWbbWWBK
KBbBBBBbBK
.KBBBBBBK.
..KKKKKK..
..........
`;

// ============================================================
// TILES (16x16 base)
// ============================================================
// Chão estilo aventura 2D: grama densa escura em cima (topo recortado),
// transição em tufo, e terra marrom com pedras cinza embutidas.
const TILE_GROUND = `
hgghghgghgghghgh
gGGhgGGhGgGhGGg
hGggGgGgGggGggG
GGhhGhGhGhhGhGh
KKKKKKKKKKKKKKKK
TtTtdTtTTtTDtTt
tTTtttTtDtTtTtT
TtTtTtTTdttTtTt
tDtTtTtTTtTdTtT
TtTTtDtTtTTtTtT
tTtTttTtdTtdTtT
TtdTtTtTTtTtTtT
tTtTtDtTtTtDTtT
TtTTtTtTTtTtTDT
tTtTtdTtTDtTtTt
KKKKKKKKKKKKKKKK
`;

// Terra profunda com pedras cinza espalhadas (sem grama no topo).
const TILE_DIRT = `
KKKKKKKKKKKKKKKK
TtTTtTtDTtTtTtT
tTtDTtTTtTtTdTt
TtTtTtTtTtDTtTt
tTtTdTtTTtTtTtT
TdtTtTtTtTdtTtT
TtTTtTtTTtTtTtT
tTtDtTtTtTtDTtT
TtTTtTtTTtTtdtT
tTtTtDtTtdTtTtT
TtTtTtTTtTtTDtT
tTtTtdTtTtTTtTt
TtDtTtTTtTtTtDt
tTtTtTtTtTDtTtT
TtTTtTtTdTtTtTt
KKKKKKKKKKKKKKKK
`;

// Tijolo clássico Mario — 4 tijolos empilhados com sombra embaixo
const TILE_BRICK = `
KKKKKKKKKKKKKKKK
KOOOOOOoKOOOOOOK
KOOOOOOoKOOOOOOK
KOOOOOOoKOOOOOOK
KooooooKKooooooK
KKKKKKKKKKKKKKKK
KOOKOOOOOOOKOOOK
KOOKOOOOOOOKOOOK
KOOKOOOOOOOKOOOK
KooKoooooooKoooK
KKKKKKKKKKKKKKKK
KOOOOOOoKOOOOOOK
KOOOOOOoKOOOOOOK
KooooooKKooooooK
KOOOOOOOOOOOOOOK
KKKKKKKKKKKKKKKK
`;

// Caixa "?" clássica Super Mario — fundo laranja/amarelo, rebites nos cantos
// e ponto de interrogação BRANCO GROSSO com OUTLINE PRETO (pixel-art).
// 3 frames pro brilho animar (corpo muda entre amarelo/laranja/cream).
// Bloco "?" — design baseado em arte de referência do usuário:
// corpo amarelo com tijolinhos, cantos azuis com rebites, ? com contorno
// azul. 3 frames de cor pro brilho cíclico (Y → C → O → C → ...)
const TILE_QBLOCK = `
KKKKKKKKKKKKKKKK
KbbbbYYYYYYbbbbK
KbBYYYYYYYYYYBbK
KbYYYbbbbbbYYYbK
KYYYbYYYYYYbYYYK
KYYYbYYbbYYbYYYK
KYYYYYYYYbYYYYYK
KYYYYYYYbYYYYYYK
KYYYYYYbYYYYYYYK
KYYYYYbYYYYYYYYK
KYYYYYYYYYYYYYYK
KYYYYYbbbYYYYYYK
KYYYYYbbbYYYYYYK
KbYYYYYYYYYYYYbK
KbbbbYYYYYYbbbbK
KKKKKKKKKKKKKKKK
`;
const TILE_QBLOCK_2 = `
KKKKKKKKKKKKKKKK
KbbbbCCCCCCbbbbK
KbBCCCCCCCCCCBbK
KbCCCbbbbbbCCCbK
KCCCbCCCCCCbCCCK
KCCCbCCbbCCbCCCK
KCCCCCCCCbCCCCCK
KCCCCCCCbCCCCCCK
KCCCCCCbCCCCCCCK
KCCCCCbCCCCCCCCK
KCCCCCCCCCCCCCCK
KCCCCCbbbCCCCCCK
KCCCCCbbbCCCCCCK
KbCCCCCCCCCCCCbK
KbbbbCCCCCCbbbbK
KKKKKKKKKKKKKKKK
`;
const TILE_QBLOCK_3 = `
KKKKKKKKKKKKKKKK
KbbbbOOOOOObbbbK
KbBOOOOOOOOOOBbK
KbOOObbbbbbOOObK
KOOObOOOOOObOOOK
KOOObOObbOObOOOK
KOOOOOOOOObOOOOK
KOOOOOOObOOOOOOK
KOOOOOObOOOOOOOK
KOOOOObOOOOOOOOK
KOOOOOOOOOOOOOOK
KOOOOObbbOOOOOOK
KOOOOObbbOOOOOOK
KbOOOOOOOOOOOObK
KbbbbOOOOOObbbbK
KKKKKKKKKKKKKKKK
`;

const TILE_QEMPTY = `
KKKKKKKKKKKKKKKK
KVVVVVVVVVVVVVK
KVVVLLLLLLVVVVK
KVVLLLLLLLLVVVK
KVVLLLLLLLLVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KVVVVVVVVVVVVVK
KKKKKKKKKKKKKKKK
`;

// CANO ESTILO MARIO — cada sprite é 16x16. Montado em par (L+R) formando
// um cano de 32px de largura. A aba (top) é mais larga que o corpo.
// Sem bordas duplas no centro: a borda preta fica só em K col 0 do L e K col 15 do R.

// TOPO ESQUERDO (aba + início do corpo)
const TILE_PIPE_TOP_L = `
KKKKKKKKKKKKKKKK
KggGGGGGGGGGGGGG
KgGhhhhhhhhhhhhh
KgGhhhhhhhhhhhhh
KgGhhhhhhhhhhhhh
KgGhhhhhhhhhhhhh
KKKKKKKKKKKKKKKK
..KgGGGGGGGGGGGG
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
`;

// TOPO DIREITO (aba + início do corpo)
const TILE_PIPE_TOP_R = `
KKKKKKKKKKKKKKKK
GGGGGGGGGGGGGGgK
hhhhhhhhhhhhhhgK
hhhhhhhhhhhhhhgK
hhhhhhhhhhhhhhgK
hhhhhhhhhhhhhhgK
KKKKKKKKKKKKKKKK
GGGGGGGGGGGGGK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
`;

// CORPO ESQUERDO
const TILE_PIPE_BODY_L = `
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
..KgGhhhhhhhhhhh
`;

// CORPO DIREITO
const TILE_PIPE_BODY_R = `
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
hhhhhhhhhhhhhK..
`;

// Plataforma one-way — agora é um bloco TOTALMENTE preenchido: grama em cima + terra embaixo.
// Preenche o tile inteiro, sem espaço vazio. Continua one-way (passa por baixo, ↓ atravessa).
const TILE_PLATFORM = `
KgghhgghggghghgK
KgGgGgGgGgGgGgGK
KgGggGggGggGggGK
KGhGhGhGhGhGhGhK
KKKKKKKKKKKKKKKK
KTtTtTtTtTtTtTtK
KtTTtTTtTTtTTtTK
KTtTtTtTtTtTtTtK
KtTTtTTtTTtTTtTK
KTtTtTtTtTtTtTtK
KtTTtTTtTTtTTtTK
KTtTtTtTtTtTtTtK
KtTTtTTtTTtTTtTK
KTtTtTtTtTtTtTtK
KtTTtTTtTTtTTtTK
KKKKKKKKKKKKKKKK
`;

// Espinhos (hazard)
const TILE_SPIKE = `
................
................
................
................
................
.KK..KK..KK..KK.
KeeKKeeKKeeKKeeK
KeDKKeDKKeDKKeDK
KKKKKKKKKKKKKKKK
KDDDDDDDDDDDDDDK
KDMMDMMDMMDMMDDK
KDMMDMMDMMDMMDDK
KDDDDDDDDDDDDDDK
KDMMDMMDMMDMMDDK
KDDDDDDDDDDDDDDK
KKKKKKKKKKKKKKKK
`;

// Bandeira final (16x32)
const TILE_FLAG = `
.......KK.......
......KOOK......
......KOOK......
.....KOOOOK.....
....KOOOOOOK....
....KOOB42OK....
....KOOOOOOK....
.....KOOOOK.....
......KOOK......
.......KK.......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
......KNNK......
`;

// ============================================================
// CENÁRIO (background, drawn at a larger scale)
// ============================================================

// Colina clássica (48x24) — domo verde com "olhinhos" escuros
const BG_HILL = `
...............KKKKKKK...............
.............KKGGGGGGGKK.............
...........KKGGGGGGGGGGGKK...........
..........KGGGGGGgggggGGGGK..........
.........KGGGggggggGGGGGGGGK.........
........KGGGgggggGGGGGGGGGGGK........
.......KGGGGgggGGhhGGGhhGGGGGK.......
......KGGGggGGGhKhGGGhKhGGGGGGK......
.....KGGGGGGGGGGhhGGGhhGGGGGGGGK.....
....KGGGGGGGGGGGGGGGGGGGGGGGGGGGK....
...KGGGGggGGGGGGGGGGGGGGGGGGGGGGGK...
..KGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGK..
.KGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGK.
KGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGK
`;

// Nuvem (24x10)
const BG_CLOUD = `
......KKKKKKK.....KKKK...
....KKWWWWWWWKKKKWWWWKK..
...KWWWWWWWWWWWWWWWWWWK..
..KWWWWWWWWWWWWWWWWWWWWK.
.KWWWWWWWWWWWWWWWWWWWWWK.
.KWWWWWWWWWWWWWWWWWWWWWK.
..KKWWWWWWWWWWWWWWWWWKK..
....KKWWWWWWWWWWWWWKK....
......KKKKKKKKKKKKK......
.........................
`;

// Arbusto (26x12)
const BG_BUSH = `
.....KKK.......KKK......
....KGgGK.....KGgGK.....
...KGGGGKK...KGGGGKK....
..KGGgGGGGKKKGGgGGGGK...
.KGGggGGGGGGGGgGGGGGGK..
KGGGgGGGGGGGGGGGGggGGK..
KGGGGGGGGGGGGGGGGGGGGGK.
KGGGgGGGGGgGGGGGGgGGGGK.
KGGGGGGGGGGGGGGGGGGGGGGK
KGGGGGGGGGGGGGGGGGGGGGGK
.KKKKKKKKKKKKKKKKKKKKK..
........................
`;

// Arbusto pequeno (18x10)
const BG_BUSH_SM = `
...KKK......KKK..
..KGgGK....KGgGK.
.KGGGGKKKKGGGGK..
KGGgGGGGGGGgGGK..
KGGGGGGGGGGGGGK..
KGGGgGGGGGGGGGK..
KGGGGGGGGGGGGGK..
KGGGGGGGGGGGGGK..
.KKKKKKKKKKKKK...
.................
`;

// Castelo final clássico Super Mario Bros — silhueta limpa, torres simétricas,
// bandeira no topo, portão escuro ao centro, ameias no alto.
// 64x56 pixels, paleta de tijolo (O/o) + pedra (D/d) + preto contorno.
const BG_CASTLE = `
................................................................
.........KK....................................KK..............
........KOOK..................................KOOK.............
........KOOK..................................KOOK.............
.......KKKKKK................................KKKKKK............
.......KOOOOK..............KK................KOOOOK............
.......KOODOK..............KOK...............KOODOK............
.......KOOOOK.............KKOKK..............KOOOOK............
.......KKKKKK.............KOOOK..............KKKKKK............
.......KOOOOK............KKOOOKK.............KOOOOK............
.......KOOOOK............KOOOOOK.............KOOOOK............
.......KOOOOK...........KKOOOOOKK............KOOOOK............
.......KKKKKKKKKKKKKKKKKKOOOOOOOKKKKKKKKKKKKKKKKKKKK............
.......KOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOK............
.......KOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOK............
.......KOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOK............
.......KoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoK............
.......KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK............
.......KOOOOOOOOOOOOKKKKKKKKOOOOOOOOOOOOOOOOOOOOOOOK............
.......KOoOOoOOoOOoOKDDDDDDKOoOOoOOoOOoOOoOOoOOoOOOK............
.......KOOoOOoOOoOOoKDddddDKOOoOOoOOoOOoOOoOOoOOoOOK............
.......KoOOoOOoOOoOOKDddddDKoOOoOOoOOoOOoOOoOOoOOoOK............
.......KOOOOOOOOOOOOKDddddDKOOOOOOOOOOOOOOOOOOOOOOOK............
.......KOoOOoOOoOOoOKDKDKDDKOoOOoOOoOOoOOoOOoOOoOOOK............
.......KOOoOOoOOoOOoKDDDDDDKOOoOOoOOoOOoOOoOOoOOoOOK............
.......KoOOoOOoOOoOOKKKKKKKKoOOoOOoOOoOOoOOoOOoOOoOK............
.......KOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOK............
.......KOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOK............
.......KOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOK............
.......KoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoOOoK............
.......KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK............
.......KNKKKKKNKKKKKKNKKKKKKNKKKKKKNKKKKKKNKKKKKKNKK............
.......KNKOOKNKOOKOOKNKOOKOOKNKOOKOOKNKOOKOOKNKOOKNK............
.......KNKOOKNKOOKOOKNKOOKOOKNKOOKOOKNKOOKOOKNKOOKNK............
.......KNKKKKNKKKKKKKNKKKKKKKNKKKKKKKNKKKKKKKNKKKKKNK...........
.......KNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNK............
.......KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK............
................................................................
`;

// Montanha rochosa cinza (32x20) — estilo aventura 2D, com neve no topo
// e face sombreada do lado direito.
const BG_MOUNTAIN = `
...............KK...............
..............KeeK..............
.............KeeWWK.............
............KeeWWWeK............
...........KeeWWWeeDK...........
..........KeeeWWeeeeDK..........
.........KdeeeeeeeedDDK.........
........KddeeeeeeeedDDDK........
.......KDddeeeeeeeedDDDDK.......
......KDDddeeeeeeedDDDDDDK......
.....KDDDddeeeeeedDDDDDDDDK.....
....KDDDDdddeeedDDDDDDDDDDDK....
...KDDDDDDdddddDDDDDDDDDDDDDK...
..KDDDDDDDDdddDDDDDDDDDDDDDDDK..
.KDDDDDDDDDDDDDDDDDDDDDDDDDDDDK.
KDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDK
KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK
................................
................................
................................
`;

// ============================================================
// BAKE TUDO
// ============================================================
const SPR = {};

function bakeAll() {
  // Hero
  SPR.heroSmallIdle = bake(HERO_SMALL_IDLE);
  SPR.heroSmallWalk = bake(HERO_SMALL_WALK);
  SPR.heroSmallWalk2 = bake(HERO_SMALL_WALK2);
  SPR.heroSmallRun  = bake(HERO_SMALL_RUN);
  SPR.heroSmallJump = bake(HERO_SMALL_JUMP);
  SPR.heroSmallIdleL = flip(SPR.heroSmallIdle);
  SPR.heroSmallWalkL = flip(SPR.heroSmallWalk);
  SPR.heroSmallWalk2L = flip(SPR.heroSmallWalk2);
  SPR.heroSmallRunL  = flip(SPR.heroSmallRun);
  SPR.heroSmallJumpL = flip(SPR.heroSmallJump);

  SPR.heroBigIdle = bake(HERO_BIG_IDLE);
  SPR.heroBigWalk = bake(HERO_BIG_WALK);
  SPR.heroBigIdleL = flip(SPR.heroBigIdle);
  SPR.heroBigWalkL = flip(SPR.heroBigWalk);

  // Inimigos
  SPR.enemyBook = bake(ENEMY_BOOK);
  SPR.enemyBookL = flip(SPR.enemyBook);
  SPR.enemyBlock = bake(ENEMY_BLOCK);
  SPR.enemyBlockL = flip(SPR.enemyBlock);
  SPR.enemyDistr = bake(ENEMY_DISTR);
  SPR.enemyNoise = bake(ENEMY_NOISE);
  SPR.enemyNoiseL = flip(SPR.enemyNoise);

  // Boss
  SPR.bossDesengaj = bake(BOSS_DESENGAJAMENTO);

  // Itens
  SPR.coin = [bake(COIN_0), bake(COIN_1), bake(COIN_2), bake(COIN_1)];
  SPR.mushroomB42 = bake(B42_MUSHROOM);
  SPR.powerFocus = bake(POWER_FOCUS);
  SPR.powerCuriosity = bake(POWER_CURIOSITY);
  SPR.powerMethod = bake(POWER_METHOD);

  // Tiles
  SPR.ground    = bake(TILE_GROUND);
  SPR.dirt      = bake(TILE_DIRT);
  SPR.brick     = bake(TILE_BRICK);
  SPR.qblock    = bake(TILE_QBLOCK);
  SPR.qblockFrames = [bake(TILE_QBLOCK), bake(TILE_QBLOCK_2), bake(TILE_QBLOCK_3), bake(TILE_QBLOCK_2)];
  SPR.qempty    = bake(TILE_QEMPTY);
  SPR.pipeTopL  = bake(TILE_PIPE_TOP_L);
  SPR.pipeTopR  = bake(TILE_PIPE_TOP_R);
  SPR.pipeBodyL = bake(TILE_PIPE_BODY_L);
  SPR.pipeBodyR = bake(TILE_PIPE_BODY_R);
  SPR.platform  = bake(TILE_PLATFORM);
  SPR.spike     = bake(TILE_SPIKE);
  SPR.flag      = bake(TILE_FLAG);

  // Cenário
  SPR.bgHill     = bake(BG_HILL);
  SPR.bgCloud    = bake(BG_CLOUD);
  SPR.bgBush     = bake(BG_BUSH);
  SPR.bgBushSm   = bake(BG_BUSH_SM);
  SPR.bgCastle   = bake(BG_CASTLE);
  SPR.bgMountain = bake(BG_MOUNTAIN);
}

// ============================================================
// CARREGAR IMAGENS EXTERNAS — sprites reais de Brenda e vilões
// ============================================================
// Os PNGs têm tamanhos variados (300-800px). Normalizamos em
// offscreen canvases com tamanho consistente para evitar
// distorção e flickering durante animação.

// Normaliza uma imagem em um canvas de tamanho fixo, mantendo
// aspect ratio e centralizando. Remove fundo branco/claro E recorta
// pelo bounding box real dos pixels opacos — garante que os pés
// fiquem SEMPRE na mesma altura entre frames (zero tremedeira).
function normalizeSprite(img, targetW, targetH) {
  const c = document.createElement('canvas');
  c.width = targetW;
  c.height = targetH;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const tmp = document.createElement('canvas');
  tmp.width = img.naturalWidth || img.width;
  tmp.height = img.naturalHeight || img.height;
  const tmpCtx = tmp.getContext('2d');
  tmpCtx.drawImage(img, 0, 0);
  const data = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
  const px = data.data;

  // Remove fundo: branco puro E "quase-branco" com canal alfa original preservado
  // Threshold mais conservador para não comer pixels claros da pele/olhos.
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i+1], b = px[i+2];
    if (r > 240 && g > 240 && b > 240) {
      px[i+3] = 0;
    }
  }
  tmpCtx.putImageData(data, 0, 0);

  // ESCALA CONSISTENTE entre frames: usamos as dimensões RAW da imagem
  // (não bounding box). Assim walk1, walk2, jump etc. renderizam no mesmo
  // tamanho visual, eliminando tremedeira entre frames da animação.
  // Obs: para isso funcionar bem, os PNGs devem ter o mesmo canvas size
  // e a personagem posicionada de forma consistente dentro.
  const srcW = tmp.width;
  const srcH = tmp.height;
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const sw = Math.round(srcW * scale);
  const sh = Math.round(srcH * scale);
  const dx = Math.round((targetW - sw) / 2);
  const dy = targetH - sh; // alinha pela base

  ctx.drawImage(tmp, 0, 0, srcW, srcH, dx, dy, sw, sh);
  return c;
}

function loadExternalImages() {
  // Sprites de Brenda — normalizar para tamanho consistente
  const brendaFiles = {
    brIdle:   'assets/brenda/idle.png',
    brWalk1:  'assets/brenda/walk1.png',
    brWalk2:  'assets/brenda/walk2.png',
    brRun:    'assets/brenda/runrr.png',
    brJump:   'assets/brenda/ju3mp.png',
    brFly:    'assets/brenda/fl3y.png',
    brDead:   'assets/brenda/dead.png',
  };

  // Tamanho alvo para normalização (maior que o draw size para qualidade)
  const NORM_W = 48;
  const NORM_H = 60;

  for (const key in brendaFiles) {
    const img = new Image();
    img.onload = function() {
      SPR[key] = normalizeSprite(img, NORM_W, NORM_H);
    };
    // Placeholder enquanto carrega (canvas vazio para imgReady retornar false)
    SPR[key] = img;
    img.src = brendaFiles[key];
  }

  // Outros sprites — carregar normalmente (sem normalização).
  // O vilão final usa um único PNG (boss_villain.png) em todos os estados.
  const otherFiles = {
    vlRun:    'assets/boss_villain.png',
    vlCast:   'assets/boss_villain.png',
    vlIdle:   'assets/boss_villain.png',
    vlFloat:  'assets/boss_villain.png',
    vlGlow:   'assets/boss_villain.png',
    enemyBookImg:   'assets/enemy_texto_massante.png',
    enemyDesmotImg: 'assets/enemy_desmotivacao.png',
    mushroomB42Img: 'assets/mushroom_b42.png',
    vilaoVoaImg:    'assets/vilao-que-voa.png',
    bulletBillImg:  'assets/bala-passa-diretomdpi.png',
    piranhaImg:     'assets/piranha.png',
    fishPinkImg:    'assets/fish-pink.png',
    fishGreenImg:   'assets/fish-green.png',
  };
  for (const key in otherFiles) {
    const img = new Image();
    SPR[key] = img;
    img.src = otherFiles[key];
  }
}

global.SPR = SPR;
global.bakeAllSprites = function() {
  bakeAll();
  loadExternalImages();
};
global.PAL = PAL;

})(typeof window !== 'undefined' ? window : globalThis);
