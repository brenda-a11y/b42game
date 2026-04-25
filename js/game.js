/* ============================================================
   B42 QUEST — CORE GAME LOGIC
   Plataformer 2D completo: física, colisão, entidades, camera,
   state machine, HUD, save/load.
   ============================================================ */
(() => {
'use strict';

// ============================================================
// CONSTANTES
// ============================================================
const CANVAS_W   = 480;
const CANVAS_H   = 270;
const TILE       = 16;

// Sprites externos carregados do disco (substituem pixel art gerada programaticamente)
const SPRITE_IMGS = {
  yoshi: null,
  brenda_yoshi: null,
  brenda_raposa_1: null,
  brenda_raposa_2: null,
  brenda_raposa_pet: null,
  raposa_dormindo: null,
  princesa: null,
};
(function loadSpriteImages() {
  const load = (key, src) => {
    const img = new Image();
    img.onload = () => { SPRITE_IMGS[key] = img; };
    img.src = src;
  };
  // Mantém as chaves internas originais pra não quebrar referências, mas
  // aponta pros arquivos da Raposa.
  load('yoshi', 'assets/raposa.png');
  load('brenda_yoshi', 'assets/brenda+raposa.png');
  // Frames de corrida (Brenda montada) e idle de carinho / raposa dormindo.
  load('brenda_raposa_1',   'assets/raposa+brenda/1.png');
  load('brenda_raposa_2',   'assets/raposa+brenda/2.png');
  load('brenda_raposa_pet', 'assets/raposa+brenda/3.png');
  load('raposa_dormindo',   'assets/raposa+brenda/dormindo.png');
  load('princesa', 'assets/princesa.png');
})();
const GRAVITY    = 780;     // Mais snappy — queda responsiva
const MAX_FALL   = 420;
const JUMP_VEL   = -340;    // Pulo base — compensado pela gravidade maior
const JUMP_VEL_R = -375;    // Pulo correndo — mais alto
const JUMP_VEL_AIR = -300;  // Pulos aéreos
const WALK_SPD   = 100;     // Andar levemente mais rápido
const RUN_SPD    = 165;     // Sprint mais veloz
const FRICTION   = 0.84;    // Desaceleração suave
const ACCEL      = 720;     // Resposta mais imediata

const T = {
  EMPTY: 0, GROUND: 1, DIRT: 2, BRICK: 3,
  QCOIN: 4, QMUSH: 5, QFOCUS: 6, QCURIO: 7,
  PIPE_TL: 8, PIPE_TR: 9, PIPE_BL: 10, PIPE_BR: 11,
  PLATFORM: 12, SPIKE: 13, FLAG: 14, QEMPTY: 15,
  WATER: 16,
};

// ============================================================
// INPUT
// ============================================================
const input = {
  left: false, right: false, up: false, down: false,
  jump: false, jumpPressed: false,
  run: false, action: false, actionPressed: false,
};

const KEYMAP = {
  'ArrowLeft':'left', 'a':'left', 'A':'left',
  'ArrowRight':'right', 'd':'right', 'D':'right',
  // Seta pra cima agora é PULAR (antes era 'up' para canos)
  'ArrowUp':'jump', 'w':'jump', 'W':'jump',
  'ArrowDown':'down', 's':'down', 'S':'down',
  'z':'jump', 'Z':'jump', ' ':'jump',
  'x':'run', 'X':'run', 'Shift':'run',
  'c':'action', 'C':'action',
};

window.addEventListener('keydown', (e) => {
  const k = KEYMAP[e.key];
  if (k) {
    // Cada nova pressão registra um novo pulo (permite pulos múltiplos)
    if (k === 'jump' && !input.jump) input.jumpPressed = true;
    if (k === 'action' && !input.action) input.actionPressed = true;
    input[k] = true;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  }
  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (game) game.togglePause();
  }
  if (e.key === 'm' || e.key === 'M') {
    if (game) game.toggleSound();
  }
  if (e.key === 'Enter') {
    if (game) game.onEnter();
  }
  if (e.key === 'q' || e.key === 'Q') {
    if (game && game.player) game.player.cyclePower();
  }
});

window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.key];
  if (k) input[k] = false;
});

// ============================================================
// MOBILE DETECTION + TOUCH CONTROLS
// ============================================================
const IS_TOUCH = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) ||
                 (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

function wireTouchButton(btn, ctl) {
  const setPressed = (pressed) => btn.classList.toggle('pressed', pressed);

  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ctl === 'pause') {
      if (game) game.togglePause();
      return;
    }
    if (ctl === 'cycle') {
      if (game && game.player) game.player.cyclePower();
      setPressed(true);
      return;
    }
    // Jump: sempre registra jumpPressed a cada toque (permite pulos rápidos)
    if (ctl === 'jump') input.jumpPressed = true;
    if (ctl === 'action') input.actionPressed = true;
    input[ctl] = true;
    setPressed(true);
    // NÃO capturar pointer — deixa o dedo deslizar sem travar
    // Garante inicialização do áudio no primeiro toque (iOS)
    AUDIO.init();
  };

  const onUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (ctl === 'pause' || ctl === 'cycle') { setPressed(false); return; }
    input[ctl] = false;
    setPressed(false);
  };

  // Pointer events (cobre touch + mouse + pen)
  btn.addEventListener('pointerdown', onDown);
  btn.addEventListener('pointerup', onUp);
  btn.addEventListener('pointercancel', onUp);
  // NÃO usar pointerleave — causa bug de pulo cancelado ao mover o dedo
  // Fallback: touchstart/end para browsers antigos
  btn.addEventListener('touchstart',  (e) => { if (!('PointerEvent' in window)) onDown(e); }, { passive: false });
  btn.addEventListener('touchend',    (e) => { if (!('PointerEvent' in window)) onUp(e); },   { passive: false });
  btn.addEventListener('touchcancel', (e) => { if (!('PointerEvent' in window)) onUp(e); },   { passive: false });
  // Evita menu de contexto em press longo
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

function initTouchControls() {
  const panel = document.getElementById('touch-controls');
  if (!panel) return;
  panel.querySelectorAll('[data-ctl]').forEach(btn => {
    wireTouchButton(btn, btn.dataset.ctl);
  });
  // Bloqueia scroll/gestos em qualquer toque dentro do shell
  const shell = document.getElementById('game-shell');
  if (shell) {
    shell.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    // Previne double-tap zoom no iOS
    let lastTouch = 0;
    shell.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouch < 350) e.preventDefault();
      lastTouch = now;
    }, { passive: false });
  }
}

function showTouchControls() {
  if (!IS_TOUCH) return;
  const el = document.getElementById('touch-controls');
  if (el) el.classList.remove('hidden');
}
function hideTouchControls() {
  const el = document.getElementById('touch-controls');
  if (el) el.classList.add('hidden');
}

// ============================================================
// FULLSCREEN + RESIZE — preenche a tela sem esticar
// ============================================================
function requestFullscreen() {
  const el = document.documentElement;
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (rfs) {
    try { rfs.call(el); } catch (e) {}
  }
  // Lock landscape no mobile
  if (screen.orientation && screen.orientation.lock) {
    try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  }
}

function resizeCanvas() {
  // Redimensiona em QUALQUER dispositivo, pra caber bonitinho em qualquer tela
  // (mobile é o foco, mas desktop também se beneficia).
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const wrap = document.getElementById('canvas-wrap');
  if (!wrap) return;
  // Usa a dimensão real da janela em mobile para ocupar a tela toda
  const ww = (IS_TOUCH ? window.innerWidth  : wrap.clientWidth)  || window.innerWidth;
  const wh = (IS_TOUCH ? window.innerHeight : wrap.clientHeight) || window.innerHeight;
  const scaleX = ww / CANVAS_W;
  const scaleY = wh / CANVAS_H;
  const scale = Math.min(scaleX, scaleY);
  const cw = Math.floor(CANVAS_W * scale);
  const ch = Math.floor(CANVAS_H * scale);
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  canvas.style.marginLeft = Math.floor((ww - cw) / 2) + 'px';
  canvas.style.marginTop = Math.floor((wh - ch) / 2) + 'px';
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 300));
document.addEventListener('fullscreenchange', () => setTimeout(resizeCanvas, 100));
document.addEventListener('webkitfullscreenchange', () => setTimeout(resizeCanvas, 100));

// ============================================================
// UTIL
// ============================================================
function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Verifica se uma Image ou Canvas está pronta para ser desenhada
function imgReady(img) {
  if (!img) return false;
  // Canvas processado tem width/height
  if (img.tagName === 'CANVAS' && img.width > 0 && img.height > 0) return true;
  // Image tag bruta
  if (img.complete && (img.naturalWidth || img.width)) return true;
  return false;
}

// Quebra um texto em linhas com comprimento máximo de N caracteres
function wrapText(str, maxLen) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxLen) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Informações dos Poderes de Aprendizagem
const POWER_INFO = {
  focus: {
    name:  'FOCO',
    short: 'FOCO',
    color: '#2ce06f',
    color2:'#b3ff3a',
    desc:  'O Foco é sua primeira arma. Mira, respira, dispara. (aperte C)',
    theory:'Mayer: respeita a atenção.',
  },
  curiosity: {
    name:  'CURIOSIDADE',
    short: 'CURIO',
    color: '#ff9c1d',
    color2:'#ffe14f',
    desc:  'Perguntas incendeiam qualquer distração e ferem o Desengajamento.',
    theory:'Prensky: a pergunta engaja a Gen Z.',
  },
  method: {
    name:  'MÉTODO',
    short: 'MÉTODO',
    color: '#4fd6ff',
    color2:'#a273f5',
    desc:  'Estudo estruturado atravessa paredes de tédio e derrota o chefe.',
    theory:'Sweller: estrutura reduz carga cognitiva.',
  },
  super: {
    name:  'RETENÇÃO DE APRENDIZADO',
    short: 'SUPER',
    color: '#ffd43b',
    color2:'#fff5a1',
    desc:  'Super modo ativado! Velocidade, pulo e poderes turbinados por 20 segundos. Você reteve tudo.',
  },
};

function isSolidTile(t) {
  return t === T.GROUND || t === T.DIRT || t === T.BRICK ||
         t === T.QCOIN || t === T.QMUSH || t === T.QFOCUS || t === T.QCURIO ||
         t === T.PIPE_TL || t === T.PIPE_TR || t === T.PIPE_BL || t === T.PIPE_BR ||
         t === T.QEMPTY;
}
function isPlatformTile(t) { return t === T.PLATFORM; }
function isHazardTile(t)   { return t === T.SPIKE; }

// Verifica se um tile está submerso (ele próprio ou qualquer vizinho é ÁGUA).
// Usado pra não renderizar sprites de cano dentro da piscina (evita os
// retângulos pálidos que aparecem por trás do fill de água).
function isTileSubmerged(level, tx, ty) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (level.getTile(tx + dx, ty + dy) === T.WATER) return true;
    }
  }
  return false;
}

// Colisão genérica Y para qualquer entidade com x/y/w/h/vx/vy/onGround
function collideGenericY(ent, level) {
  const left   = Math.floor(ent.x / TILE);
  const right  = Math.floor((ent.x + ent.w - 1) / TILE);
  const top    = Math.floor(ent.y / TILE);
  const bottom = Math.floor((ent.y + ent.h - 1) / TILE);
  ent.onGround = false;
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      const t = level.getTile(tx, ty);
      if (isSolidTile(t)) {
        if (ent.vy > 0) { ent.y = ty * TILE - ent.h; ent.onGround = true; }
        else if (ent.vy < 0) { ent.y = (ty + 1) * TILE; }
        ent.vy = 0;
      }
    }
  }
}
function collideGenericX(ent, level) {
  const left   = Math.floor(ent.x / TILE);
  const right  = Math.floor((ent.x + ent.w - 1) / TILE);
  const top    = Math.floor(ent.y / TILE);
  const bottom = Math.floor((ent.y + ent.h - 1) / TILE);
  let hit = false;
  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isSolidTile(level.getTile(tx, ty))) {
        if (ent.vx > 0) ent.x = tx * TILE - ent.w;
        else if (ent.vx < 0) ent.x = (tx + 1) * TILE;
        hit = true;
      }
    }
  }
  return hit;
}

// ============================================================
// LEVEL
// ============================================================
class LevelData {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.bg = def.bg;
    this.music = def.music;
    this.narrative = def.narrative;
    this.lesson = def.lesson;
    this.isBossLevel = def.isBossLevel || false;
    this.width = 0; this.height = 0;
    this.tiles = [];
    this.spawns = { player: def.playerSpawn || null, entities: [] };
    this.parse();
  }

  parse() {
    const rows = this.def.map;
    this.height = rows.length;
    this.width  = Math.max(...rows.map(r => r.length));
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        const ch = rows[y][x] || '.';
        row.push(this._char(ch, x, y));
      }
      this.tiles.push(row);
    }
    // Auto-fill de água: a partir do primeiro ~ numa coluna, preenche todos os
    // tiles vazios abaixo com água até encontrar um sólido. (Apenas vertical —
    // o usuário precisa marcar ~ em TODAS as colunas onde quer água.)
    for (let x = 0; x < this.width; x++) {
      let inWater = false;
      for (let y = 0; y < this.height; y++) {
        const t = this.tiles[y][x];
        if (t === T.WATER) {
          inWater = true;
        } else if (inWater && t === T.EMPTY) {
          this.tiles[y][x] = T.WATER;
        } else if (t !== T.EMPTY && t !== T.WATER) {
          break;
        }
      }
    }
    if (!this.spawns.player) {
      // default spawn if not explicitly set
      this.spawns.player = { x: 2 * TILE, y: 11 * TILE };
    } else if (this.spawns.player.col !== undefined) {
      this.spawns.player = {
        x: this.spawns.player.col * TILE,
        y: this.spawns.player.row * TILE,
      };
    }
  }

  _char(ch, x, y) {
    switch (ch) {
      case 'G': return T.GROUND;
      case 'D': return T.DIRT;
      case '#': return T.BRICK;
      case '?': return T.QCOIN;
      case 'M': return T.QMUSH;
      case '$': return T.QFOCUS;
      case '%': return T.QCURIO;
      case '[': return T.PIPE_TL;
      case ']': return T.PIPE_TR;
      case '{': return T.PIPE_BL;
      case '}': return T.PIPE_BR;
      case '=': return T.PLATFORM;
      case 'H': return T.SPIKE;
      case '~': return T.WATER;
      case 'o': this.spawns.entities.push({type:'coin',   x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'E': this.spawns.entities.push({type:'walker', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'J': this.spawns.entities.push({type:'jumper', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'N': this.spawns.entities.push({type:'flyer',  x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'B': this.spawns.entities.push({type:'boss',   x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'L': this.spawns.entities.push({type:'life',   x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'V': this.spawns.entities.push({type:'weapon_focus',     x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'K': this.spawns.entities.push({type:'weapon_curiosity', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'A': this.spawns.entities.push({type:'weapon_method',    x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'W': this.spawns.entities.push({type:'miniboss_texto', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'Z': this.spawns.entities.push({type:'miniboss_desmot', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'F': this.spawns.entities.push({type:'flag',   x:x*TILE, y:y*TILE}); return T.EMPTY;
      // * = pergaminho coletável (castelo final)
      case '*': this.spawns.entities.push({type:'pergaminho', x:x*TILE, y:y*TILE}); return T.EMPTY;
      // @ = princesa (entregar o pergaminho = vitória)
      case '@': this.spawns.entities.push({type:'princesa',   x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'Y': this.spawns.entities.push({type:'mount',  x:x*TILE, y:y*TILE}); return T.EMPTY;
      // T = topo-esquerdo do cano secreto. A detecção vira entidade, mas
      // o tile continua sólido (PIPE_TL) para o cano ser palpável.
      case 'T': this.spawns.entities.push({type:'pipe_secret', x:x*TILE, y:y*TILE}); return T.PIPE_TL;
      case 'U': this.spawns.entities.push({type:'pipe_minigame', x:x*TILE, y:y*TILE}); return T.PIPE_TL;
      // Novos inimigos:
      case 'b': this.spawns.entities.push({type:'bullet_spawner', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'p': this.spawns.entities.push({type:'piranha', x:x*TILE, y:y*TILE}); return T.EMPTY;
      case 'R': this.spawns.entities.push({type:'super_orb', x:x*TILE, y:y*TILE}); return T.EMPTY;
      // Peixes: retornam T.WATER pro tile ficar visualmente coberto por água
      // (evita "buraco branco" quando o q/r está na linha de superfície).
      case 'q': this.spawns.entities.push({type:'fish_pink',  x:x*TILE, y:y*TILE}); return T.WATER;
      case 'r': this.spawns.entities.push({type:'fish_green', x:x*TILE, y:y*TILE}); return T.WATER;
      case '|': return T.EMPTY; // visual pipe/pole helper — ignored
      case 'P': this.spawns.player = { x:x*TILE, y:y*TILE }; return T.EMPTY;
      default:  return T.EMPTY;
    }
  }

  getTile(x, y) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return T.EMPTY;
    return this.tiles[y][x];
  }
  setTile(x, y, v) {
    if (y < 0 || y >= this.height || x < 0 || x >= this.width) return;
    this.tiles[y][x] = v;
  }
}

// ============================================================
// ENTITY BASE
// ============================================================
class Entity {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.dead = false;
    this.type = 'entity';
  }
  update(dt, game) {}
  draw(ctx, cam) {}
  onPlayerContact(player, game) {}
}

// ============================================================
// PLAYER
// ============================================================
class Player extends Entity {
  constructor(x, y) {
    super(x, y, 14, 16);
    this.state = 'small';
    this.type = 'player';
    this.invincible = 0;
    this.coins = 0;
    this.score = 0;
    this.kills = 0;
    this.lives = 3;
    this.power = null;
    this.powerTime = 0;
    this.powerAmmo = 0;
    // Munição acumulativa por tipo de poder — os poderes coletados somam-se
    // e o jogador pode alternar apertando Q (desktop) ou o botão ★ em mobile.
    this.powers = { focus: 0, curiosity: 0, method: 0 };
    this.shootCooldown = 0;
    this.animFrame = 0;
    this.walking = false;
    this.jumping = false;
    this.bobPhase = 0;
    this.airJumps = 0;
    this.maxAirJumps = 2;
    // Melhorias de game feel
    this.coyoteTime = 0;      // tempo após sair da borda em que ainda pode pular
    this.jumpBuffer = 0;      // tempo que um input de pulo fica "guardado"
    this.wasOnGround = false;  // para detectar saída da borda
    this.dropThrough = 0;     // timer para atravessar plataformas amarelas ao apertar ↓
    this.mount = null;        // referência à montaria se estiver montada
    this.dismountCd = 0;      // debounce pra não remontar imediato após desmontar
    this.superTime = 0;       // timer da transformação "Retenção de Aprendizado"
    // Janela curta após pisar num inimigo: impede que o 2º inimigo
    // do mesmo frame machuque a Brenda (ela acabou de quicar pra cima).
    this.stompCd = 0;
  }

  setForm(form) {
    const oldH = this.h;
    this.state = form;
    // Largura uniforme (14px) em todas as formas: evita que Brenda fique
    // presa em corredores/fendas de 1 tile (16px) quando cresce. Só a altura
    // varia entre formas. O sprite desenhado mantém o tamanho visual maior.
    if (form === 'super') { this.w = 14; this.h = 32; }
    else if (form === 'big') { this.w = 14; this.h = 28; }
    else { this.w = 14; this.h = 16; }
    this.y -= (this.h - oldH);
  }

  activateSuper() {
    // Transformação "Retenção de Aprendizado": forma máxima.
    // +velocidade, +pulo, tiros ilimitados por 20s, invencibilidade breve.
    this.setForm('super');
    this.superTime = 20; // duração da transformação
    this.invincible = Math.max(this.invincible, 2.0);
    // Estoca munição em todos os poderes para o show visual
    this.powers.focus     = Math.max(this.powers.focus || 0, 99);
    this.powers.curiosity = Math.max(this.powers.curiosity || 0, 99);
    this.powers.method    = Math.max(this.powers.method || 0, 99);
    this.power = 'method';
    this.powerAmmo = 99;
    this.powerTime = 60;
    AUDIO.powerup && AUDIO.powerup();
    AUDIO.grow && AUDIO.grow();
  }

  update(dt, game) {
    if (game.frozen > 0) return;

    if (this.dismountCd > 0) this.dismountCd -= dt;
    if (this.stompCd > 0) this.stompCd -= dt;

    // Atualiza timer do modo super (Retenção de Aprendizado)
    if (this.superTime > 0) {
      this.superTime -= dt;
      if (this.superTime <= 0) {
        this.superTime = 0;
        // Volta pra forma big se ainda tinha cogumelo, senão small
        this.setForm('big');
      }
    }

    // --- Movimento horizontal com aceleração suave ---
    // Montaria = +30% velocidade. Super = +50%.
    const mountBoost = this.mount ? 1.3 : 1.0;
    const superBoost = this.superTime > 0 ? 1.5 : 1.0;
    const target = (input.run ? RUN_SPD : WALK_SPD) * mountBoost * superBoost;
    const accel = this.onGround ? ACCEL : ACCEL * 0.85; // menos controle no ar
    if (input.left) {
      this.vx -= accel * dt;
      if (this.vx < -target) this.vx = -target;
      this.facing = -1;
    } else if (input.right) {
      this.vx += accel * dt;
      if (this.vx > target) this.vx = target;
      this.facing = 1;
    } else {
      const fric = this.onGround ? FRICTION : 0.92; // menos atrito no ar
      this.vx *= fric;
      if (Math.abs(this.vx) < 0.5) {
        this.vx = 0;
        if (this.onGround) this.x = Math.round(this.x);
      }
    }

    // --- Coyote Time: permite pular 0.1s após sair da borda ---
    if (this.onGround) {
      this.coyoteTime = 0.1;
      this.wasOnGround = true;
    } else {
      if (this.wasOnGround && this.vy >= 0) {
        this.coyoteTime -= dt;
      } else {
        this.coyoteTime = 0;
      }
      this.wasOnGround = false;
    }

    // --- Jump Buffer: guarda input de pulo por 0.12s ---
    if (input.jumpPressed) {
      this.jumpBuffer = 0.12;
    } else {
      this.jumpBuffer -= dt;
    }

    // --- Drop-through: ↓ sobre plataforma amarela atravessa pra baixo ---
    if (this.dropThrough > 0) this.dropThrough -= dt;
    if (input.down && this.onGround && this.dropThrough <= 0) {
      const belowY = Math.floor((this.y + this.h) / TILE);
      const leftTx  = Math.floor(this.x / TILE);
      const rightTx = Math.floor((this.x + this.w - 1) / TILE);
      let onPlatform = false;
      for (let tx = leftTx; tx <= rightTx; tx++) {
        if (isPlatformTile(game.level.getTile(tx, belowY))) { onPlatform = true; break; }
      }
      if (onPlatform) {
        this.dropThrough = 0.22;
        this.onGround = false;
        this.y += 1;
      }
    }

    // --- Desmontar: ↓ + pulo desmonta ---
    if (this.mount && input.down && input.jumpPressed) {
      this.mount.dismount(this);
      this.dismountCd = 0.35;
      this.vy = JUMP_VEL_AIR;
      this.jumpBuffer = 0;
      AUDIO.jump();
    }

    // --- PULO: chão/coyote + até 2 pulos no ar ---
    const canGroundJump = this.onGround || this.coyoteTime > 0;
    // Pulo +15% quando montado, +30% quando em super form. Em mobile, sempre usa
    // o pulo máximo (JUMP_VEL_R) pra a jogadora não precisar segurar o botão.
    const jumpMult = (this.mount ? 1.15 : 1.0) * (this.superTime > 0 ? 1.3 : 1.0);
    if (this.jumpBuffer > 0) {
      if (canGroundJump) {
        const baseJump = (IS_TOUCH || input.run) ? JUMP_VEL_R : JUMP_VEL;
        this.vy = baseJump * jumpMult;
        this.onGround = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.airJumps = 0;
        AUDIO.jump();
      } else if (this.airJumps < this.maxAirJumps) {
        this.vy = JUMP_VEL_AIR * jumpMult;
        this.airJumps++;
        this.jumpBuffer = 0;
        AUDIO.jump();
      }
    }
    // Mobile: pulo fixo no máximo com um toque (sem variable-jump-height).
    // Desktop: mantém o controle variável pra quem quer pulinhos curtos.
    if (!IS_TOUCH && !input.jump && this.vy < -60) this.vy = -60;

    // Poder especial da Raposa: voo planado. Montada + ↑ no ar durante a queda
    // faz a Raposa bater as asas e descer em câmera lenta (igual Yoshi do SMW).
    const fluttering = this.mount && !this.onGround && input.jump && this.vy > -30;
    if (fluttering) {
      this.vy += GRAVITY * 0.18 * dt;
      if (this.vy > 70) this.vy = 70;
      this.fluttering = true;
    } else {
      this.vy += GRAVITY * dt;
      if (this.vy > MAX_FALL) this.vy = MAX_FALL;
      this.fluttering = false;
    }

    // Atirar poder aprendido
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (input.actionPressed && this.power && this.powerAmmo > 0 && this.shootCooldown <= 0) {
      this.shoot(game);
    }

    // X
    this.x += this.vx * dt;
    collideGenericX(this, game.level);
    // Clamp às bordas do mapa — impede cair no void pelas laterais.
    const maxX = game.level.width * TILE - this.w;
    if (this.x < 0) { this.x = 0; if (this.vx < 0) this.vx = 0; }
    if (this.x > maxX) { this.x = maxX; if (this.vx > 0) this.vx = 0; }
    // Y
    this.y += this.vy * dt;
    this.collideY(game);
    // Reseta pulos aéreos ao tocar o chão
    if (this.onGround) {
      this.airJumps = 0;
    }

    // Animação de andar: avança enquanto tecla de direção pressionada
    this.walking = input.left || input.right;
    this.jumping = !this.onGround;
    if (this.walking) {
      this.animFrame += dt * 6;
    } else {
      this.animFrame = 0;
    }

    if (this.y > game.level.height * TILE + 80) {
      this.die(game);
    }

    if (this.invincible > 0) this.invincible -= dt;
    if (this.powerTime > 0) {
      this.powerTime -= dt;
      if (this.powerTime <= 0) { this.power = null; this.powerAmmo = 0; }
    }
  }

  shoot(game) {
    const dir = this.facing || 1;
    const sx = this.x + (dir > 0 ? this.w : -4);
    const sy = this.y + this.h / 2 - 3;
    game.entities.push(new PlayerShot(sx, sy, dir * 220, this.power));
    this.powers[this.power] = Math.max(0, (this.powers[this.power] || 0) - 1);
    this.powerAmmo = this.powers[this.power];
    this.shootCooldown = 0.22;
    if (this.powerAmmo <= 0) {
      // Auto-troca para o próximo poder disponível; senão limpa.
      const next = ['focus', 'curiosity', 'method'].find(k => this.powers[k] > 0);
      if (next) { this.power = next; this.powerAmmo = this.powers[next]; }
      else { this.power = null; this.powerTime = 0; }
    }
    AUDIO.powerup && AUDIO.powerup();
  }

  cyclePower() {
    const order = ['focus', 'curiosity', 'method'];
    const avail = order.filter(k => this.powers[k] > 0);
    if (avail.length <= 1) return;
    const idx = avail.indexOf(this.power);
    const next = avail[(idx + 1) % avail.length];
    this.power = next;
    this.powerAmmo = this.powers[next];
    AUDIO.click && AUDIO.click();
  }

  collideY(game) {
    const level = game.level;
    const prevBottom = this.y + this.h - this.vy * (1/60);
    const left   = Math.floor(this.x / TILE);
    const right  = Math.floor((this.x + this.w - 1) / TILE);
    const top    = Math.floor(this.y / TILE);
    const bottom = Math.floor((this.y + this.h - 1) / TILE);
    this.onGround = false;
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        const t = level.getTile(tx, ty);
        if (isSolidTile(t)) {
          if (this.vy > 0) {
            this.y = ty * TILE - this.h;
            this.onGround = true;
          } else if (this.vy < 0) {
            this.y = (ty + 1) * TILE;
            this.onBlockHit(game, tx, ty);
          }
          this.vy = 0;
        } else if (isPlatformTile(t) && this.vy > 0 && this.dropThrough <= 0) {
          if (prevBottom <= ty * TILE + 2) {
            this.y = ty * TILE - this.h;
            this.vy = 0;
            this.onGround = true;
          }
        } else if (isHazardTile(t)) {
          this.takeDamage(game);
        } else if (t === T.WATER) {
          // Cair na água mata direto (afoga). Ignora super/cogumelo: cair n'água é fatal.
          if (!this.dying) {
            this.dying = true;
            game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
            AUDIO.die && AUDIO.die();
            this.die(game);
          }
        }
      }
    }
  }

  onBlockHit(game, tx, ty) {
    const level = game.level;
    const t = level.getTile(tx, ty);
    switch (t) {
      case T.QCOIN:
        level.setTile(tx, ty, T.QEMPTY);
        this.coins++; this.score += 100;
        game.spawnParticle('coin', tx*TILE + TILE/2, ty*TILE - 4);
        AUDIO.coin();
        break;
      case T.QMUSH:
        level.setTile(tx, ty, T.QEMPTY);
        game.spawnItem('mushroom', tx*TILE, ty*TILE);
        AUDIO.powerup();
        break;
      case T.QFOCUS:
        level.setTile(tx, ty, T.QEMPTY);
        game.spawnItem('focus', tx*TILE, ty*TILE);
        AUDIO.powerup();
        break;
      case T.QCURIO:
        level.setTile(tx, ty, T.QEMPTY);
        // Em níveis de chefe, o bloco de Curiosidade revela o poder do Método
        game.spawnItem(level.isBossLevel ? 'method' : 'curiosity', tx*TILE, ty*TILE);
        AUDIO.powerup();
        break;
      case T.BRICK:
        if (this.state === 'big') {
          level.setTile(tx, ty, T.EMPTY);
          this.score += 50;
          game.spawnParticle('brick', tx*TILE + TILE/2, ty*TILE + TILE/2);
          AUDIO.break();
        }
        break;
    }
  }

  takeDamage(game) {
    if (this.invincible > 0) return;
    // Montaria absorve o primeiro hit — ela foge e player fica brevemente invencível
    if (this.mount) {
      this.mount.dismount(this);
      this.invincible = 1.5;
      AUDIO.hurt();
      return;
    }
    game.triggerShake(0.2);
    if (this.state === 'big') {
      this.setForm('small');
      this.invincible = 2;
      AUDIO.hurt();
    } else {
      this.die(game);
    }
  }

  die(game) {
    AUDIO.die();
    this.lives--;
    if (this.lives <= 0) {
      game.gameOver();
    } else {
      game.restartLevel();
    }
  }

  collectMushroom() {
    this.mushroomsCollected = (this.mushroomsCollected || 0) + 1;
    // 1º cogumelo: forma big (vida extra).
    // 2º+ cogumelo: ativa super modo por 10s (acumula se já tiver super).
    if (this.mushroomsCollected === 1) {
      if (this.state === 'small') this.setForm('big');
    } else {
      this.superTime = Math.max(this.superTime, 0) + 10;
      if (this.state !== 'super') this.setForm('super');
      this.invincible = Math.max(this.invincible, 1.0);
    }
    this.score += 1000;
    AUDIO.grow && AUDIO.grow();
  }

  collectPower(type) {
    // Cumulativo: soma 6 munições ao tipo coletado e ativa este tipo
    this.powers[type] = (this.powers[type] || 0) + 6;
    this.power = type;
    this.powerAmmo = this.powers[type];
    this.powerTime = 60; // validade longa: acumulativo
    this.score += 500;
    AUDIO.powerup();
  }

  draw(ctx, cam) {
    if (this.invincible > 0 && Math.floor(this.invincible * 10) % 2 === 0) return;
    // Aura da transformação "Retenção de Aprendizado"
    if (this.superTime > 0) this._drawSuperAura(ctx, cam);
    // Montada? Desenha a imagem combinada brenda+raposa por cima dos dois.
    if (this.mount) {
      // Seleciona sprite conforme estado.
      const moving = Math.abs(this.vx) > 8;
      const idleTime = this.mount.idleTime || 0;
      let img = null;
      // Após 5s parada no chão, Brenda faz carinho na Raposa (imagem 3.png).
      if (!moving && this.onGround && idleTime > 5.0) {
        img = SPRITE_IMGS.brenda_raposa_pet;
      } else if (moving) {
        // Alterna 2 frames a ~8fps.
        const frame = Math.floor(performance.now() / 125) % 2;
        img = frame === 0 ? SPRITE_IMGS.brenda_raposa_1 : SPRITE_IMGS.brenda_raposa_2;
      } else {
        img = SPRITE_IMGS.brenda_raposa_1;
      }
      // Fallbacks em cascata caso algum frame ainda não tenha carregado.
      if (!img || !img.complete || !img.naturalWidth) img = SPRITE_IMGS.brenda_raposa_1;
      if (!img || !img.complete || !img.naturalWidth) img = SPRITE_IMGS.brenda_yoshi;
      if (img && img.complete && img.naturalWidth) {
        // Brenda+Raposa: 60px de largura (antes 72) — sprite mais discreto e
        // proporcional aos inimigos pra não dominar a tela.
        const drawW = 60;
        const drawH = Math.round(drawW * (img.naturalHeight / img.naturalWidth));
        const cx = this.x + this.w / 2 - cam.x;
        let baseY = this.y + this.h - cam.y + 1;
        if (this.fluttering) {
          baseY += Math.sin(performance.now() / 60) * 1.5;
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = '#ffd43b';
          for (let i = -2; i <= 2; i++) {
            const fx = cx + i * 7 + Math.sin(performance.now()/150 + i) * 2;
            const fy = baseY - 6 + Math.cos(performance.now()/120 + i) * 2;
            ctx.fillRect(fx - 1, fy - 1, 2, 2);
          }
          ctx.restore();
        }
        const drawX = Math.round(cx - drawW / 2);
        // Tom de respiração: escala vertical sutil quando Brenda+Raposa
        // estão estáveis no chão (pés alinhados à base).
        const resting = this.onGround && !this.fluttering;
        let drawH2 = drawH;
        let drawY = Math.round(baseY - drawH);
        if (resting) {
          const t = performance.now() / 1000;
          const pulse = Math.sin(t * 2.2) * 0.018; // ±1.8%
          drawH2 = Math.round(drawH * (1 + pulse));
          drawY = Math.round(baseY - drawH2);
        }
        ctx.imageSmoothingEnabled = false;
        if (this.facing < 0) {
          ctx.save();
          ctx.translate(drawX + drawW, drawY);
          ctx.scale(-1, 1);
          ctx.drawImage(img, 0, 0, drawW, drawH2);
          ctx.restore();
        } else {
          ctx.drawImage(img, drawX, drawY, drawW, drawH2);
        }
        this._drawPowerAura(ctx, cam);
        return;
      }
    }
    const big = this.state === 'big';
    this._drawBrenda(ctx, cam, big);
    this._drawPowerAura(ctx, cam);
  }

  // Regras claras de sprite (com fallback em cascata — se o sprite
  // ainda não carregou, usa walk1/idle pra nunca desenhar um frame em branco):
  // - deathAnim       → dead
  // - no ar, subindo  → jump
  // - no ar, caindo   → fly
  // - correndo rápido → run
  // - andando         → walk1/walk2 alternados
  // - parada          → idle
  _pickBrendaSprite() {
    if (this.deathAnim && imgReady(SPR.brDead)) return SPR.brDead;

    // No ar: mantém o sprite de andar/idle (sem sprite de pulo específico)
    // pra não "piscar" entre frames quando sobe/cai.
    if (!this.onGround) {
      if (input.left || input.right) {
        const f = Math.floor(this.animFrame) % 2;
        const walkSpr = f === 0 ? SPR.brWalk1 : SPR.brWalk2;
        return imgReady(walkSpr) ? walkSpr : SPR.brIdle;
      }
      return SPR.brIdle;
    }

    // No chão, andando
    if (input.left || input.right) {
      // Sprint com Shift/X → run se disponível
      if (input.run && Math.abs(this.vx) > WALK_SPD * 1.05 && imgReady(SPR.brRun)) {
        return SPR.brRun;
      }
      const f = Math.floor(this.animFrame) % 2;
      const walkSpr = f === 0 ? SPR.brWalk1 : SPR.brWalk2;
      return imgReady(walkSpr) ? walkSpr : SPR.brIdle;
    }

    return SPR.brIdle;
  }

  // Desenha Brenda — UMA ÚNICA imagem por frame. Zero bobbing.
  // Sprites já normalizados em 48×60 canvases — basta desenhar no tamanho correto.
  _drawBrenda(ctx, cam, big) {
    const sprite = this._pickBrendaSprite();
    if (!imgReady(sprite)) return;

    const targetW = big ? 40 : 36;
    const targetH = big ? 50 : 46;
    // Pés da Brenda alinhados à base da hitbox (this.y + this.h). O +4
    // empurra o sprite pra baixo, deixando a personagem mais colada no chão.
    const drawX = Math.round(this.x - cam.x - (targetW - this.w) / 2);
    const drawY = Math.round(this.y - cam.y - (targetH - this.h) + 4);

    if (big) this._drawIdeaGlow(ctx, drawX, drawY, targetW, targetH);

    // Pixel art = SEM suavização para manter nítido
    ctx.imageSmoothingEnabled = false;

    // Sombra sob os pés — dá peso visual e elimina sensação de flutuação
    if (this.onGround) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(drawX + targetW / 2, drawY + targetH - 1, targetW * 0.32, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const sw = sprite.width  || sprite.naturalWidth  || targetW;
    const sh = sprite.height || sprite.naturalHeight || targetH;

    // Tom de pulso "respiração": escala vertical sutil sempre que está no
    // chão; amplitude maior quando parada, menor enquanto anda.
    let drawH = targetH;
    let drawYAdj = drawY;
    if (this.onGround) {
      const t = performance.now() / 1000;
      const idle = !input.left && !input.right && Math.abs(this.vx) < 6;
      const amp = idle ? 0.022 : 0.010; // ±2.2% parada, ±1% em movimento
      const pulse = Math.sin(t * (idle ? 2.1 : 3.2)) * amp;
      drawH = Math.round(targetH * (1 + pulse));
      // Mantém os pés na mesma linha; só o topo "respira".
      drawYAdj = drawY + (targetH - drawH);
    }

    if (this.facing < 0) {
      ctx.save();
      ctx.translate(drawX + targetW, drawYAdj);
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, 0, 0, sw, sh, 0, 0, targetW, drawH);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, 0, 0, sw, sh, drawX, drawYAdj, targetW, drawH);
    }

    this._drawBrendaLabel(ctx, drawX + targetW / 2, drawY - (big ? 14 : 10));
    if (big) this._drawIdeaBulb(ctx, drawX + targetW / 2, drawY - (big ? 26 : 20));
  }

  _drawBrendaLabel(ctx, cx, cy) {
    // Label flutuante removido (estilo Mario: sem nomes pairando acima dos sprites).
  }

  _drawIdeaGlow(ctx, x, y, w, h) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const t = performance.now() / 300;
    const r = Math.max(w, h) * 0.65 + Math.sin(t) * 4;
    const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
    grad.addColorStop(0,    'rgba(255, 245, 160, 0.55)');
    grad.addColorStop(0.45, 'rgba(255, 212,  59, 0.28)');
    grad.addColorStop(1,    'rgba(255, 212,  59, 0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawIdeaBulb(ctx, cx, cy) {
    const t = performance.now() / 120;
    const pulse = (Math.sin(t) + 1) / 2; // 0..1
    ctx.save();

    // Raios de luz animados
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7 + pulse * 0.3;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + t * 0.4;
      const r1 = 9 + pulse * 1;
      const r2 = 13 + pulse * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
      ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Contorno preto da lâmpada
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 3, cy + 3, 6, 5);

    // Vidro amarelo brilhante
    ctx.fillStyle = pulse > 0.4 ? '#fff5a1' : '#ffd43b';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 5, 0, Math.PI * 2);
    ctx.fill();

    // Reflexo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 2, cy - 3, 2, 2);

    // Filamento em X
    ctx.strokeStyle = '#8b5f00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + 2, cy + 2);
    ctx.moveTo(cx + 2, cy); ctx.lineTo(cx - 2, cy + 2);
    ctx.stroke();

    // Base metálica
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(cx - 2, cy + 4, 4, 1);
    ctx.fillRect(cx - 2, cy + 6, 4, 1);
    ctx.restore();
  }

  _drawSuperAura(ctx, cam) {
    if (this.superTime <= 0) return;
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const t = performance.now() / 80;
    // Labareda dourada pulsante
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + t * 0.1;
      const r = 22 + Math.sin(t + i) * 5;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,220,60,0.7)' : 'rgba(255,140,30,0.6)';
      ctx.fillRect(x - 1, y - 2, 2, 4);
    }
    // Halo radial
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 36);
    g.addColorStop(0, 'rgba(255,245,120,0.45)');
    g.addColorStop(1, 'rgba(255,180,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
  }

  _drawPowerAura(ctx, cam) {
    if (!this.power || this.powerAmmo <= 0) return;
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const t = performance.now() / 200;
    ctx.globalAlpha = 0.5 + Math.sin(t) * 0.25;
    const col = this.power === 'focus' ? '#2cd82c'
              : this.power === 'curiosity' ? '#f7941d'
              : '#5c94fc';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 16 + Math.sin(t*1.3) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// WALKER ENEMY — "Texto Maçante" (livro ambulante, imagem fixa)
// ============================================================
class Walker extends Entity {
  constructor(x, y) {
    super(x - 4, y + TILE - 26, 26, 26);
    this.type = 'enemy';
    // Ritmo moderado: suficiente pra desafiar sem parecer injusto.
    this.vx = -34;
    this.invincible = 0;
  }
  update(dt, game) {
    if (this.invincible > 0) this.invincible -= dt;
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.x += this.vx * dt;
    if (collideGenericX(this, game.level)) this.vx = -this.vx;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
    if (this.onGround) {
      // Borda detectada: vira. Considera tile à frente-abaixo — se for água
      // ou vazio (buraco), inverte direção (o Walker é terráqueo).
      const foreX = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
      const tx = Math.floor(foreX / TILE);
      const ty = Math.floor((this.y + this.h + 2) / TILE);
      const tile = game.level.getTile(tx, ty);
      if (!isSolidTile(tile) || tile === T.WATER) this.vx = -this.vx;
    }
    // Walker é terráqueo: se cair na água, morre.
    const mx = Math.floor((this.x + this.w/2) / TILE);
    const my = Math.floor((this.y + this.h/2) / TILE);
    if (game.level.getTile(mx, my) === T.WATER) {
      this.dead = true;
      game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
    }
    this.facing = this.vx > 0 ? 1 : -1;
  }
  onPlayerContact(player, game) {
    if (this.dead || player.invincible > 0) return;
    if (player.stompCd > 0) return;
    // Stomp = simplesmente "caindo" + "centro da personagem acima do
    // centro do inimigo". Critério ultra-generoso: em quedas rápidas o
    // jogador costumava overshoot e levar hit por engano (bug reportado).
    const playerCenterY  = player.y + player.h * 0.5;
    const enemyCenterY   = this.y + this.h * 0.5;
    const isStomp = (player.vy >= 0) && (playerCenterY < enemyCenterY);
    if (isStomp) {
      player.vy = -260;
      player.stompCd = 0.15;
      player.invincible = Math.max(player.invincible, 0.12);
      AUDIO.stomp();
      game.spawnParticle('stomp', this.x + this.w/2, this.y);
      this.dead = true;
      player.score += 150;
      player.kills = (player.kills || 0) + 1;
      game.spawnParticle('bookBurst', this.x + this.w/2, this.y + this.h/2);
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    const img = SPR.enemyBookImg;
    const tw = 22, th = 22;
    const px = Math.round(this.x - cam.x - (tw - this.w) / 2);
    const py = Math.round(this.y - cam.y - (th - this.h));
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sw = img.naturalWidth  || img.width;
      const sh = img.naturalHeight || img.height;
      // Sombra sob o inimigo — dá peso visual
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(px + tw/2, py + th - 1, tw/2 - 2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      if (this.facing < 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.drawImage(this.facing > 0 ? SPR.enemyBook : SPR.enemyBookL,
                    Math.round(this.x - cam.x), Math.round(this.y - cam.y));
    }
    // Label "TEXTO MAÇANTE" só na fase 1-1 (tutorial).
    if (game && game.level && game.level.id === '1-1') {
      drawEnemyLabel(ctx, 'TEXTO MAÇANTE', px + tw/2, py - 3, '#ff5050');
    }
  }
}

// Helper: desenha o nome flutuante de um inimigo com outline preto.
function drawEnemyLabel(ctx, text, cx, cy, color) {
  ctx.save();
  ctx.font = 'bold 5px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = color || '#fff';
  ctx.strokeText(text, cx, cy);
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

// ============================================================
// PLAYER SHOT — projétil de poder de aprendizagem
// ============================================================
class PlayerShot extends Entity {
  constructor(x, y, vx, kind) {
    super(x, y, 8, 6);
    this.vx = vx;
    this.kind = kind;
    this.t = 0;
    this.type = 'pshot';
  }
  update(dt, game) {
    this.t += dt;
    this.x += this.vx * dt;
    if (this.t > 2 || this.x < 0 || this.x > game.level.width * TILE) { this.dead = true; return; }
    if (collideGenericX(this, game.level)) { this.dead = true; return; }
    // colisão com inimigos
    for (const e of game.entities) {
      if (e.dead || e === this) continue;
      if (e.type === 'enemy' && aabb(this, e)) {
        // Super modo: tiros de poder matam qualquer inimigo com um golpe.
        const oneShot = (game.player.superTime > 0);
        if (!oneShot && typeof e.hp === 'number' && e.hp > 1) {
          if (e.invincible && e.invincible > 0) { this.dead = true; return; }
          e.hp--;
          e.invincible = 0.35;
          game.player.score += 100;
          AUDIO.bossHit && AUDIO.bossHit();
          game.spawnParticle('powerup', e.x + e.w/2, e.y + e.h/2);
          this.dead = true;
          return;
        }
        e.dead = true;
        game.player.score += 300;
        game.player.kills = (game.player.kills || 0) + 1;
        AUDIO.stomp();
        game.spawnParticle('powerup', e.x + e.w/2, e.y + e.h/2);
        this.dead = true;
        return;
      }
      if (e.type === 'boss' && aabb(this, e) && e.invincible <= 0) {
        // Em super modo ("Retenção de Aprendizado"), o tiro é FATAL: one-shot kill.
        const oneShot = (game.player.superTime > 0);
        if (oneShot) {
          e.hp = 0;
          game.player.score += 5000;
        } else {
          e.hp--;
          e.invincible = 0.7;
          game.player.score += 400;
        }
        game.triggerShake(0.2);
        AUDIO.bossHit && AUDIO.bossHit();
        game.spawnParticle('powerup', this.x, this.y);
        if (e.hp <= 0) {
          e.dead = true;
          game.player.score += 3000;
          game.player.kills = (game.player.kills || 0) + 1;
          game.onBossDefeated();
        }
        this.dead = true;
        return;
      }
    }
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const col1 = this.kind === 'focus' ? '#2ce06f'
               : this.kind === 'curiosity' ? '#ff9c1d'
               : '#4fd6ff';
    const col2 = this.kind === 'focus' ? '#b3ff3a'
               : this.kind === 'curiosity' ? '#ffe14f'
               : '#a273f5';

    // Glow externo
    const r = 9 + Math.sin(this.t * 18) * 1.5;
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
    grad.addColorStop(0, col2);
    grad.addColorStop(0.4, col1 + 'aa');
    grad.addColorStop(1, col1 + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Estela ondulada
    const dir = this.vx > 0 ? -1 : 1;
    ctx.strokeStyle = col1;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const px = cx + dir * i * 3;
      const py = cy + Math.sin(this.t * 30 + i) * (i * 0.5);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Estrela núcleo (4 pontas)
    ctx.fillStyle = col2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx + 1, cy - 1);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx + 1, cy + 1);
    ctx.lineTo(cx, cy + 4);
    ctx.lineTo(cx - 1, cy + 1);
    ctx.lineTo(cx - 4, cy);
    ctx.lineTo(cx - 1, cy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }
}

// ============================================================
// JUMPER ENEMY — "Desmotivação" (criatura cinza saltitante)
// ============================================================
class Jumper extends Entity {
  constructor(x, y) {
    super(x - 4, y + TILE - 26, 26, 26);
    this.type = 'enemy';
    this.jumpT = Math.random() * 1.2;
    // 2 tiros de poder pra derrotar — razoável pro tamanho da ameaça.
    this.hp = 2;
    this.invincible = 0;
  }
  update(dt, game) {
    if (this.invincible > 0) this.invincible -= dt;
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
    if (this.onGround) {
      this.jumpT -= dt;
      if (this.jumpT <= 0) {
        // Pulo médio — previsível o suficiente pra jogadora esquivar.
        this.vy = -260;
        this.jumpT = 1.0 + Math.random() * 0.5;
      }
    }
  }
  onPlayerContact(player, game) {
    // DESMOTIVAÇÃO tem espinhos no topo: pisar NÃO mata, sempre machuca.
    // Só morre com tiro de poder (Foco, Curiosidade ou Método).
    if (this.dead || player.invincible > 0) return;
    if (player.vy > 0 && player.y + player.h <= this.y + 10) {
      // A jogadora caiu em cima dos espinhos: ricocheteia pra cima e toma dano.
      player.vy = -220;
      player.stompCd = 0.2;
    }
    player.takeDamage(game);
  }
  draw(ctx, cam) {
    // Pisca enquanto está invencível depois de tomar tiro.
    if (this.invincible > 0 && Math.floor(this.invincible * 20) % 2 === 0) return;
    const img = SPR.enemyDesmotImg;
    const tw = 22, th = 22;
    const px = Math.round(this.x - cam.x - (tw - this.w) / 2);
    // Sem bobbing artificial: a física do pulo já dá movimento suficiente.
    const py = Math.round(this.y - cam.y - (th - this.h));
    // Sombra no chão (não sobe com o pulo)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px + tw/2, this.y - cam.y + this.h - 1, tw/2 - 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.drawImage(SPR.enemyDistr, Math.round(this.x - cam.x), Math.round(this.y - cam.y));
    }
    if (game && game.level && game.level.id === '1-1') {
      drawEnemyLabel(ctx, 'DESMOTIVAÇÃO', px + tw/2, py - 3, '#ff5050');
    }
  }
}

// ============================================================
// FLYER ENEMY — "Ruído Cognitivo"
// ============================================================
class Flyer extends Entity {
  constructor(x, y) {
    super(x, y, 14, 10);
    this.type = 'enemy';
    this.startX = x; this.startY = y;
    this.t = Math.random() * 6;
  }
  update(dt, game) {
    this.t += dt;
    // Voo moderado — perigoso mas possível de esquivar.
    this.x = this.startX + Math.sin(this.t * 1.6) * 64;
    this.y = this.startY + Math.sin(this.t * 3.0) * 14;
    this.facing = Math.cos(this.t * 1.6) > 0 ? 1 : -1;
  }
  onPlayerContact(player, game) {
    if (this.dead || player.invincible > 0) return;
    if (player.stompCd > 0) return;
    // Stomp com mesma tolerância do Walker (centro a centro).
    const playerCenterY  = player.y + player.h * 0.5;
    const enemyCenterY   = this.y + this.h * 0.5;
    const isStomp = (player.vy >= 0) && (playerCenterY < enemyCenterY);
    if (isStomp) {
      this.dead = true;
      player.vy = -240;
      player.stompCd = 0.15;
      player.invincible = Math.max(player.invincible, 0.12);
      player.score += 250;
      player.kills = (player.kills || 0) + 1;
      AUDIO.stomp();
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    // Vilão-que-voa: usa o PNG se disponível; senão cai no pixel-art "Ruído Cognitivo".
    const img = SPR.vilaoVoaImg;
    const tw = 22, th = 20; // pequeno, bem menor que a Brenda
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const px = cx - tw/2;
    const py = cy - th/2;
    // Pequena sombra flutuante
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 8, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      if (this.facing < 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      const s = this.facing > 0 ? SPR.enemyNoise : SPR.enemyNoiseL;
      ctx.drawImage(s, Math.round(this.x - cam.x), Math.round(this.y - cam.y));
    }
    if (game && game.level && game.level.id === '1-1') {
      drawEnemyLabel(ctx, 'RUÍDO COGNITIVO', cx, py - 3, '#c8a8ff');
    }
  }
}

// ============================================================
// SUPER ORB — item "Retenção de Aprendizado"
// Ativa a forma SUPER da jogadora (velocidade/pulo/poder turbinados).
// ============================================================
class SuperOrb extends Entity {
  constructor(x, y) {
    super(x, y, 18, 18);
    this.type = 'item';
    this.t = Math.random() * 6;
  }
  update(dt) { this.t += dt; }
  onPlayerContact(player, game) {
    if (this.dead) return;
    this.dead = true;
    player.activateSuper();
    player.score += 1500;
    game.showSuperPopup && game.showSuperPopup();
    game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y + Math.sin(this.t * 3) * 3);
    // Aura dourada pulsante
    const r = 16 + Math.sin(this.t * 4) * 3;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, 'rgba(255,245,120,0.9)');
    g.addColorStop(0.5, 'rgba(255,180,30,0.45)');
    g.addColorStop(1, 'rgba(255,180,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    // Estrela de 5 pontas dourada (rotação suave)
    const R = 10, r2 = R * 0.42;
    const rot = this.t * 0.5;
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI/2 + i * Math.PI/5 + rot;
      const rad = (i % 2 === 0) ? R : r2;
      const px = cx + Math.cos(a) * rad;
      const py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Rostinho fofo na estrela dourada
    drawCuteFace(ctx, cx, cy, R, this.t);
    // Label flutuante discreta só pra este item especial
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('RETENÇÃO', cx, cy - 14);
    ctx.fillText('RETENÇÃO', cx, cy - 14);
  }
}

// ============================================================
// BULLET BILL — "Bala que Passa Direto": atravessa horizontalmente
// Não afeta gravidade, só machuca no contato. Morre com tiro de poder.
// ============================================================
class BulletBill extends Entity {
  constructor(x, y) {
    super(x, y + 4, 20, 14);
    this.type = 'enemy';
    this.vx = -110; // sempre da direita pra esquerda por padrão; facing controla visual
    this.startX = x;
    this.startY = y + 4;
    this.t = 0;
  }
  update(dt, game) {
    this.t += dt;
    this.x += this.vx * dt;
    this.facing = this.vx > 0 ? 1 : -1;
    // Morre ao sair da tela
    if (this.x < -40 || this.x > game.level.width * TILE + 40) this.dead = true;
  }
  onPlayerContact(player, game) {
    if (this.dead || player.invincible > 0) return;
    // Pular em cima mata — janela generosa (centro a centro) pra evitar
    // o bug de quedas rápidas onde jogador overshoot e tomava hit.
    if ((player.vy >= 0) && (player.y + player.h * 0.5 < this.y + this.h * 0.5)) {
      this.dead = true;
      player.vy = -240;
      player.stompCd = 0.15;
      player.invincible = Math.max(player.invincible, 0.12);
      player.score += 300;
      AUDIO.stomp();
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    const img = SPR.bulletBillImg;
    const tw = 22, th = 16;
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const px = cx - tw/2;
    const py = cy - th/2;
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      if (this.facing > 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      // Fallback: bala preta arredondada
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(cx, cy, tw/2, th/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// BulletBill SPAWNER — cano/canhão que cospe balas periodicamente
class BulletBillSpawner extends Entity {
  constructor(x, y) {
    super(x, y, 8, 8);
    this.type = 'spawner';
    this.t = 2 + Math.random() * 2;
  }
  update(dt, game) {
    this.t -= dt;
    if (this.t <= 0) {
      this.t = 3.2 + Math.random() * 1.8;
      const bb = new BulletBill(this.x, this.y);
      bb.vx = -110;
      game.entities.push(bb);
    }
  }
  onPlayerContact() {}
  draw() {}
}

// ============================================================
// PIRANHA PLANT — sai de um cano, sobe e desce
// ============================================================
class Piranha extends Entity {
  // 'p' deve ser colocado UMA LINHA acima da aba esquerda do cano (char '[').
  // A Piranha fica escondida dentro do cano, sobe e desce novamente.
  // Centraliza a hitbox (18px) nos 2 tiles do cano (32px de largura total).
  constructor(x, y) {
    super(x + (TILE * 2 - 18) / 2, y, 18, 22);
    this.type = 'enemy';
    // Superfície do cano = uma linha abaixo do spawn (onde estão [ ]).
    this.pipeSurfaceY = y + TILE;
    this.hiddenY = this.pipeSurfaceY;       // sprite inteiramente abaixo da borda do cano
    this.outY = this.pipeSurfaceY - this.h; // sprite inteiramente acima da borda
    this.y = this.hiddenY;
    this.t = Math.random() * 4;
    this.phase = 'hidden';
  }
  update(dt, game) {
    this.t += dt;
    // Ciclo total: 4s. Escondido 1.5s, subindo 0.5s, fora 1.5s, descendo 0.5s.
    const cycle = this.t % 4;
    if (cycle < 1.5) {
      this.y = this.hiddenY;
      this.phase = 'hidden';
    } else if (cycle < 2.0) {
      const k = (cycle - 1.5) / 0.5;
      this.y = this.hiddenY + (this.outY - this.hiddenY) * k;
      this.phase = 'rising';
    } else if (cycle < 3.5) {
      this.y = this.outY;
      this.phase = 'out';
    } else {
      const k = (cycle - 3.5) / 0.5;
      this.y = this.outY + (this.hiddenY - this.outY) * k;
      this.phase = 'descending';
    }
  }
  onPlayerContact(player, game) {
    if (this.dead || player.invincible > 0) return;
    if (this.phase === 'hidden') return; // protegida dentro do cano
    // Espinhos na planta: pisar = dano.
    player.takeDamage(game);
  }
  draw(ctx, cam) {
    if (this.phase === 'hidden') return;
    const img = SPR.piranhaImg;
    const tw = 22, th = 26;
    const px = Math.round(this.x - cam.x - (tw - this.w)/2);
    const py = Math.round(this.y - cam.y - (th - this.h));
    // Recorta tudo abaixo da borda do cano pra planta "sumir dentro" dele.
    const clipTop = 0;
    const clipBottom = Math.round(this.pipeSurfaceY - cam.y);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px - 4, clipTop, tw + 8, clipBottom - clipTop);
    ctx.clip();
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      ctx.imageSmoothingEnabled = false;
    } else {
      // Fallback: flor verde com centro branco
      ctx.fillStyle = '#2cd82c';
      ctx.beginPath();
      ctx.arc(px + tw/2, py + th/3, tw/2 - 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(px + tw/2 - 3, py + th/3 - 3, 6, 6);
      ctx.fillStyle = '#1a9a1a';
      ctx.fillRect(px + tw/2 - 3, py + th/2, 6, th/2);
    }
    ctx.restore();
  }
}

// ============================================================
// CHEEP CHEEP — peixe que pula para fora da água
// Usa fish-pink.png ou fish-green.png. "Água" é a fronteira vertical (waterY).
// ============================================================
class CheepCheep extends Entity {
  constructor(x, y, color) {
    super(x, y, 18, 14);
    this.type = 'enemy';
    this.color = color || 'pink';
    this.spawnX = x;
    // waterY = topo da primeira água (busca na coluna do spawn)
    this.waterY = y; // fallback; ajustado em update quando level estiver disponível
    this.waterLeft = x - 40;
    this.waterRight = x + 40;
    this.t = Math.random() * 3;
    this.cooldown = 0.8 + Math.random() * 1.5;
    this.jumping = false;
    this.swimVx = (Math.random() < 0.5 ? -1 : 1) * 22;
    this.vx = this.swimVx;
    this._waterFound = false;
  }
  _findWater(level) {
    if (this._waterFound) return;
    const tx = Math.floor((this.x + this.w/2) / TILE);
    let topY = -1;
    let leftTx = tx, rightTx = tx;
    // Procura topo d'água na coluna
    for (let ty = 0; ty < level.height; ty++) {
      if (level.getTile(tx, ty) === T.WATER) { topY = ty * TILE; break; }
    }
    if (topY < 0) {
      // Sem água encontrada: usa y atual como superfície (fallback seguro)
      this._waterFound = true;
      return;
    }
    this.waterY = topY;
    // Limites laterais da água (mesma linha)
    const wr = Math.floor(this.waterY / TILE);
    while (leftTx > 0 && level.getTile(leftTx - 1, wr) === T.WATER) leftTx--;
    while (rightTx < level.width - 1 && level.getTile(rightTx + 1, wr) === T.WATER) rightTx++;
    this.waterLeft  = leftTx * TILE;
    this.waterRight = (rightTx + 1) * TILE - this.w;
    this.y = this.waterY + TILE / 2; // spawn dentro d'água
    this._waterFound = true;
  }
  update(dt, game) {
    this.t += dt;
    this._findWater(game.level);
    // Altura máxima permitida do pulo — nunca sobe mais que isso
    const maxJumpHeight = this.waterY - 64;
    if (!this.jumping) {
      this.cooldown -= dt;
      this.x += this.swimVx * dt;
      // Clamp horizontal rígido (fish NUNCA ultrapassa os limites da água)
      if (this.x < this.waterLeft) { this.x = this.waterLeft; this.swimVx = Math.abs(this.swimVx); }
      if (this.x > this.waterRight) { this.x = this.waterRight; this.swimVx = -Math.abs(this.swimVx); }
      this.facing = this.swimVx > 0 ? 1 : -1;
      // Bobbing suave abaixo da superfície, com limite vertical
      this.y = this.waterY + 6 + Math.sin(this.t * 3) * 2;
      if (this.y < this.waterY + 2) this.y = this.waterY + 2;
      if (this.cooldown <= 0) {
        this.jumping = true;
        this.vy = -260;
        // Direção do pulo só pode ser pra um lado se há espaço lá
        const dir = (Math.random() < 0.5 ? -1 : 1);
        this.vx = dir * (30 + Math.random() * 25);
        AUDIO.jump && AUDIO.jump();
      }
    } else {
      this.vy += GRAVITY * 0.6 * dt;
      this.y += this.vy * dt;
      this.x += this.vx * dt;
      this.facing = this.vx > 0 ? 1 : -1;
      // Bounds laterais rígidos — inverte direção se bater na parede
      if (this.x < this.waterLeft) { this.x = this.waterLeft; this.vx = Math.abs(this.vx); }
      if (this.x > this.waterRight) { this.x = this.waterRight; this.vx = -Math.abs(this.vx); }
      // Limite de altura: não pula mais que maxJumpHeight
      if (this.y < maxJumpHeight) { this.y = maxJumpHeight; this.vy = Math.max(this.vy, 0); }
      // Volta pra água SEMPRE — sem exceção
      if (this.vy > 0 && this.y >= this.waterY) {
        this.y = this.waterY;
        this.jumping = false;
        this.cooldown = 1.0 + Math.random() * 1.8;
        this.vy = 0;
      }
    }
  }
  onPlayerContact(player, game) {
    if (this.dead || player.invincible > 0) return;
    if (!this.jumping) return; // dentro d'água não machuca
    if ((player.vy >= 0) && (player.y + player.h * 0.5 < this.y + this.h * 0.5)) {
      this.dead = true;
      player.vy = -240;
      player.stompCd = 0.15;
      player.invincible = Math.max(player.invincible, 0.12);
      player.score += 200;
      AUDIO.stomp();
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    const img = this.color === 'green' ? SPR.fishGreenImg : SPR.fishPinkImg;
    const tw = 22, th = 18;
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const px = cx - tw/2;
    const py = cy - th/2;
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      if (this.facing < 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillStyle = this.color === 'green' ? '#2cd82c' : '#ff7aa8';
      ctx.fillRect(px, py, tw, th);
    }
  }
}

// ============================================================
// BOSS — "DESENGAJAMENTO"
// ============================================================
class Boss extends Entity {
  constructor(x, y) {
    super(x - 12, y - 44, 56, 60);
    this.type = 'boss';
    this.hp = 10;
    this.maxHp = 10;
    this.invincible = 0;
    this.t = 0;
    this.shootT = 1.6;
    this.frame = 0;
    this.frameT = 0;
    // Contador de ataques: a cada 4º disparo é um ataque ESPECIAL (leque mágico);
    // entre os normais, alterna FOGO/MAGIA a cada 2.
    this.shotCount = 0;
  }
  update(dt, game) {
    this.t += dt;
    this.frameT += dt;
    if (this.frameT >= 0.25) { // troca de frame a cada 0.25s → 4 fps
      this.frameT -= 0.25;
      this.frame = (this.frame + 1) % 6;
    }
    if (this.invincible > 0) this.invincible -= dt;
    this.vx = Math.sin(this.t * 0.9) * 32;
    this.x += this.vx * dt;
    collideGenericX(this, game.level);
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
    this.shootT -= dt;
    if (this.shootT <= 0) {
      this.shotCount++;
      const dx = game.player.x - this.x;
      const dir = dx > 0 ? 1 : -1;
      const sx = this.x + this.w/2;
      const sy = this.y + this.h/2;
      const isSpecial = (this.shotCount % 4 === 0);
      if (isSpecial) {
        // Leque mágico: 3 projéteis em ângulos diferentes.
        this.shootT = 3.0;
        game.entities.push(new BossShot(sx, sy, dir * 120, -30, 'special'));
        game.entities.push(new BossShot(sx, sy, dir * 140,   0, 'special'));
        game.entities.push(new BossShot(sx, sy, dir * 120,  30, 'special'));
        game.triggerShake(0.2);
      } else {
        // Tiros alternados (fogo/mágico), cadência confortável.
        this.shootT = 2.2;
        const kind = (this.shotCount % 2 === 0) ? 'magic' : 'fire';
        game.entities.push(new BossShot(sx, sy, dir * 130, 0, kind));
      }
    }
  }
  onPlayerContact(player, game) {
    if (this.dead || this.invincible > 0 || player.invincible > 0) return;
    if (player.stompCd > 0) return;
    if ((player.vy >= 0) && (player.y + player.h * 0.5 < this.y + this.h * 0.5)) {
      this.hp--;
      this.invincible = 1.1;
      player.vy = -300;
      player.stompCd = 0.18;
      player.score += 500;
      game.triggerShake(0.25);
      AUDIO.bossHit();
      if (this.hp <= 0) {
        this.dead = true;
        player.score += 3000;
        player.kills = (player.kills || 0) + 1;
        game.onBossDefeated();
      }
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    if (this.invincible > 0 && Math.floor(this.invincible * 14) % 2 === 0) return;
    const tw = 60, th = 72;
    const px = Math.round(this.x - cam.x - (tw - this.w)/2);
    const py = Math.round(this.y - cam.y - (th - this.h));

    // Brilho sombrio ao redor do boss
    const gcx = px + tw/2, gcy = py + th/2;
    const glowR = 60 + Math.sin(this.t * 2) * 8;
    const glow = ctx.createRadialGradient(gcx, gcy, 10, gcx, gcy, glowR);
    glow.addColorStop(0, 'rgba(180,0,0,0.35)');
    glow.addColorStop(0.5, 'rgba(100,0,50,0.2)');
    glow.addColorStop(1, 'rgba(40,0,40,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gcx, gcy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Escolhe sprite do vilão
    let sprite = null;
    const cycleFrames = [SPR.vlIdle, SPR.vlFloat, SPR.vlGlow, SPR.vlFloat, SPR.vlIdle];
    if (this.shootT < 0.5) {
      sprite = SPR.vlCast;
    } else if (Math.abs(this.vx) > 12) {
      sprite = SPR.vlRun;
    } else {
      sprite = cycleFrames[this.frame % cycleFrames.length];
    }

    if (imgReady(sprite)) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sw = sprite.naturalWidth  || sprite.width;
      const sh = sprite.naturalHeight || sprite.height;
      // Vira conforme direção do boss (facing = +1 direita, -1 esquerda).
      // Usa vx pra orientar quando está correndo; fallback pro facing.
      const dir = (this.vx < -2) ? -1 : (this.vx > 2 ? 1 : (this.facing || 1));
      if (dir < 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(sprite, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      // Fallback visual enquanto a imagem carrega
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(px, py, tw, th);
    }

    // HP BAR NO TOPO DA TELA
    const bw = 180;
    const bx = (CANVAS_W - bw) / 2;
    const by = 32;
    // Fundo
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx - 4, by - 16, bw + 8, 24);
    // Nome
    ctx.save();
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff3838';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('DESENGAJAMENTO', bx + bw/2, by - 5);
    ctx.fillText('DESENGAJAMENTO', bx + bw/2, by - 5);
    ctx.restore();
    // Barra
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(bx, by, bw, 6);
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0, '#ff3838');
    grad.addColorStop(0.5, '#ff8800');
    grad.addColorStop(1, '#ffd43b');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * hpRatio, 6);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 5);
  }
}

class BossShot extends Entity {
  // kind: 'fire' (padrão), 'magic', 'special' (grande e roxo com trail)
  constructor(x, y, vx, vy, kind) {
    super(x, y, 10, 10);
    this.vx = vx;
    this.vy = vy || 0;
    this.t = 0;
    this.kind = kind || 'fire';
    this.type = 'shot';
    if (this.kind === 'special') { this.w = 16; this.h = 16; }
    this.trail = [];
  }
  update(dt, game) {
    this.t += dt;
    // Guarda posições anteriores pra trail
    if (this.trail.length === 0 || this.t * 60 % 1 < 0.5) {
      this.trail.push({ x: this.x + this.w/2, y: this.y + this.h/2, age: 0 });
      if (this.trail.length > 10) this.trail.shift();
    }
    for (const p of this.trail) p.age += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Special desacelera levemente na vertical pra "flutuar"
    if (this.kind === 'special') this.vy *= 0.98;
    if (this.t > 4 || this.x < -32 || this.x > game.level.width * TILE + 32) this.dead = true;
    if (this.y > game.level.height * TILE + 48) this.dead = true;
  }
  onPlayerContact(player, game) {
    if (player.invincible > 0) return;
    player.takeDamage(game);
    this.dead = true;
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y);
    const t = this.t;

    // Paleta por tipo
    const pal = this.kind === 'special'
      ? { outer:'#c87aff', mid:'#ff4aff', core:'#ffd4ff', trail:'#8a2ad6' }
      : this.kind === 'magic'
      ? { outer:'#4fd6ff', mid:'#a273f5', core:'#ffffff', trail:'#4a2fa0' }
      : { outer:'#ffb347', mid:'#ff4e26', core:'#fff3a1', trail:'#8b1a00' };

    // Trail (fumaça/faíscas) atrás
    for (const p of this.trail) {
      const a = 1 - Math.min(1, p.age / 0.35);
      if (a <= 0) continue;
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = pal.trail;
      const r = (this.kind === 'special' ? 4 : 2.4) * a;
      ctx.beginPath();
      ctx.arc(p.x - cam.x, p.y - cam.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Glow externo pulsante
    const pulse = 1 + Math.sin(t * 22) * 0.12;
    const rOuter = (this.kind === 'special' ? 18 : 11) * pulse;
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rOuter);
    grad.addColorStop(0, pal.core);
    grad.addColorStop(0.35, pal.mid);
    grad.addColorStop(0.75, pal.outer + 'aa');
    grad.addColorStop(1, pal.outer + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.fill();

    // Anel rotativo (magic) ou línguas de fogo (fire)
    if (this.kind === 'fire') {
      ctx.fillStyle = pal.mid;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + t * 10;
        const r = 5 + Math.sin(t * 18 + i) * 1.5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Runa mágica: triângulo girando
      ctx.strokeStyle = pal.mid;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      const rr = this.kind === 'special' ? 9 : 6;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + t * 3;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Núcleo brilhante
    ctx.fillStyle = pal.core;
    ctx.beginPath();
    ctx.arc(cx, cy, this.kind === 'special' ? 4 : 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
// ITENS
// ============================================================
class Coin extends Entity {
  constructor(x, y) {
    // Hitbox generoso (tile inteiro) para coletar facilmente ao andar
    super(x, y, 16, 16);
    this.type = 'item';
    this.frame = Math.random() * 4;
  }
  update(dt, game) { this.frame += dt * 8; }
  onPlayerContact(player, game) {
    if (this.dead) return;
    this.dead = true;
    player.coins++;
    player.score += 100;
    AUDIO.coin();
    game.spawnParticle('coin', this.x + this.w/2, this.y);
  }
  draw(ctx, cam) {
    const f = Math.floor(this.frame) % 4;
    ctx.drawImage(SPR.coin[f], Math.round(this.x - 2 - cam.x), Math.round(this.y - 1 - cam.y));
  }
}

class Mushroom extends Entity {
  constructor(x, y) {
    super(x - 6, y - 8, 28, 24);
    this.type = 'item';
    this.vx = 36;
    this.vy = 0;
    this.riseT = 0.9;
    this.originY = y - 8;
  }
  update(dt, game) {
    if (this.riseT > 0) {
      this.riseT -= dt;
      this.y = this.originY - (1 - this.riseT / 0.9) * TILE;
      return;
    }
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.x += this.vx * dt;
    if (collideGenericX(this, game.level)) this.vx = -this.vx;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
  }
  onPlayerContact(player, game) {
    if (this.dead || this.riseT > 0) return;
    this.dead = true;
    player.collectMushroom();
    game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
  }
  draw(ctx, cam) {
    const img = SPR.mushroomB42Img;
    const tw = 44, th = 44;
    const px = Math.round(this.x - cam.x - (tw - this.w) / 2);
    const py = Math.round(this.y - cam.y - (th - this.h));
    // Brilho ao redor
    const cx = px + tw/2, cy = py + th/2;
    const t = performance.now() / 250;
    const r = 26 + Math.sin(t) * 3;
    const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,220,100,0.45)');
    grad.addColorStop(1, 'rgba(255,220,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.drawImage(SPR.mushroomB42, Math.round(this.x - 1 - cam.x), Math.round(this.y - cam.y));
    }
    // Label flutuante removido.
  }
}

class PowerItem extends Entity {
  constructor(x, y, kind) {
    super(x, y, 16, 16);
    this.type = 'item';
    this.kind = kind;
    this.riseT = 0.7;
    this.originY = y;
    this.vy = 0;
    this.t = 0;
  }
  update(dt, game) {
    this.t += dt;
    if (this.riseT > 0) {
      this.riseT -= dt;
      this.y = this.originY - (1 - this.riseT / 0.7) * TILE;
      return;
    }
    this.vy += GRAVITY * dt * 0.7;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
  }
  onPlayerContact(player, game) {
    if (this.dead || this.riseT > 0) return;
    this.dead = true;
    player.collectPower(this.kind);
    game.showPowerPopup(this.kind);
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y + Math.sin(this.t * 4) * 2);
    drawPowerStar(ctx, cx, cy, this.kind, 9, this.t);
  }
}

class Flag extends Entity {
  constructor(x, y) {
    super(x, y, 16, 64);
    this.type = 'item';
    this.raised = false;
    this._snapped = false;
  }
  update(dt, game) {
    // Na primeira atualização, snapa o flag pro chão sólido logo abaixo —
    // assim independentemente da posição do `F` no mapa, ele sempre fica
    // fincado em cima de um bloco de terra (não flutuando nem enterrado).
    if (!this._snapped && game && game.level) {
      const tx = Math.floor((this.x + this.w / 2) / TILE);
      let ty = Math.floor((this.y + this.h) / TILE);
      // Procura pra baixo o primeiro tile sólido (chão/terra/bloco).
      let scan = 0;
      while (scan < 30 && !isSolidTile(game.level.getTile(tx, ty))) {
        ty++; scan++;
      }
      if (scan < 30) {
        // bottom do entity = topo do bloco de chão
        this.y = ty * TILE - this.h;
      }
      this._snapped = true;
    }
  }
  onPlayerContact(player, game) {
    if (this.raised) return;
    this.raised = true;
    game.onLevelClear();
  }
  draw(ctx, cam) {
    const px = Math.round(this.x - cam.x);
    const py = Math.round(this.y - cam.y);
    // Sprite da bandeira tem 16x32. Desenha de modo que o bottom do
    // mastro fique alinhado com o bottom do hitbox (= topo do chão).
    const sprH = 32;
    const sprY = py + this.h - sprH;

    // ===== Pedestal de terra/grama segurando o mastro =====
    const pedW = 22, pedH = 12;
    const pedX = px + Math.round((this.w - pedW) / 2);
    const pedY = py + this.h - pedH + 2; // 2px de overlap c/ tile abaixo
    // Sombra projetada
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(pedX + 2, pedY + pedH, pedW, 2);
    // Corpo de terra (com leve gradiente)
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(pedX, pedY + 4, pedW, pedH - 4);
    ctx.fillStyle = '#7a4a23';
    ctx.fillRect(pedX + 1, pedY + 5, pedW - 2, pedH - 7);
    // Tampa de grama
    ctx.fillStyle = '#2a8c3a';
    ctx.fillRect(pedX, pedY, pedW, 5);
    ctx.fillStyle = '#4ec55a';
    ctx.fillRect(pedX + 1, pedY + 1, pedW - 2, 2);
    ctx.fillStyle = '#7be38c';
    ctx.fillRect(pedX + 2, pedY, 1, 1);
    ctx.fillRect(pedX + pedW - 4, pedY, 1, 1);
    // Borda preta pixel-art
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(pedX + 0.5, pedY + 0.5, pedW - 1, pedH - 1);

    // ===== Bandeira em cima do pedestal =====
    ctx.drawImage(SPR.flag, px - 4, sprY);
  }
}

// ============================================================
// PERGAMINHO — item especial no castelo final. Pegar = receber o
// "Pergaminho do Conhecimento". Precisa ser entregue à Princesa.
// ============================================================
class PergaminhoItem extends Entity {
  constructor(x, y) {
    super(x, y, 18, 20);
    this.type = 'item';
    this.t = Math.random() * 6;
  }
  update(dt) { this.t += dt; }
  onPlayerContact(player, game) {
    if (this.dead) return;
    this.dead = true;
    player.hasPergaminho = true;
    player.score += 2000;
    AUDIO.powerup && AUDIO.powerup();
    game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y + Math.sin(this.t * 3) * 3);
    // Aura dourada pulsante
    const r = 18 + Math.sin(this.t * 4) * 3;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, 'rgba(255,245,160,0.8)');
    g.addColorStop(0.5, 'rgba(255,210,80,0.4)');
    g.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    // Corpo do pergaminho (rolo bege)
    ctx.fillStyle = '#000';
    ctx.fillRect(cx - 9, cy - 7, 18, 14);
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(cx - 8, cy - 6, 16, 12);
    // Rolos laterais (marrom)
    ctx.fillStyle = '#c4671a';
    ctx.fillRect(cx - 9, cy - 7, 2, 14);
    ctx.fillRect(cx + 7, cy - 7, 2, 14);
    // Selo vermelho no centro
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(cx - 2, cy - 1, 4, 2);
    // Linhas de texto (detalhe)
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(cx - 5, cy - 4, 10, 1);
    ctx.fillRect(cx - 5, cy - 2, 8, 1);
    ctx.fillRect(cx - 5, cy + 2, 9, 1);
    ctx.fillRect(cx - 5, cy + 4, 6, 1);
    // Label PERGAMINHO
    ctx.font = 'bold 5px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('PERGAMINHO', cx, cy - 14);
    ctx.fillText('PERGAMINHO', cx, cy - 14);
  }
}

// ============================================================
// PRINCESA — aguarda no fim do castelo final. Entrar em contato COM
// o pergaminho = vitória.
// ============================================================
class Princesa extends Entity {
  constructor(x, y) {
    // Hitbox maior (princesa + altar). Largura 32, altura 56.
    super(x - 8, y - 32, 32, 56);
    this.type = 'item';
    this.t = Math.random() * 3;
  }
  update(dt) { this.t += dt; }
  onPlayerContact(player, game) {
    if (this.triggered) return;
    if (!player.hasPergaminho) return;
    this.triggered = true;
    // Dispara o diálogo com a Princesa. Ao final, abre a tela de vitória.
    game._startPrincessDialog && game._startPrincessDialog();
  }
  draw(ctx, cam) {
    const px = Math.round(this.x - cam.x);
    const py = Math.round(this.y - cam.y);
    const cx = px + this.w / 2;
    // Princesa colada no altar — sem bob pra não "flutuar".
    const bob = 0;

    // ======== ALTAR DE PEDRA ========
    // Base do altar (na parte de baixo da hitbox)
    const altarTop = py + this.h - 22;
    const altarW = this.w;
    const altarX = px;
    // Sombra ampla sob o altar
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, py + this.h, altarW / 2 + 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Corpo do altar (cinza pedra com contorno preto)
    ctx.fillStyle = '#000';
    ctx.fillRect(altarX - 2, altarTop, altarW + 4, 22);
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(altarX - 1, altarTop + 1, altarW + 2, 20);
    // Highlight esquerdo (pedra mais clara)
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(altarX - 1, altarTop + 1, 3, 20);
    // Sombra direita
    ctx.fillStyle = '#5b5b5b';
    ctx.fillRect(altarX + altarW - 2, altarTop + 1, 3, 20);
    // Base alargada (pedestal em degrau)
    ctx.fillStyle = '#000';
    ctx.fillRect(altarX - 4, py + this.h - 6, altarW + 8, 6);
    ctx.fillStyle = '#8b8b8b';
    ctx.fillRect(altarX - 3, py + this.h - 5, altarW + 6, 4);
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(altarX - 3, py + this.h - 5, 4, 4);
    ctx.fillStyle = '#5b5b5b';
    ctx.fillRect(altarX + altarW - 1, py + this.h - 5, 4, 4);
    // Detalhe de tijolos no altar (linhas horizontais escuras)
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(altarX - 1, altarTop + 7, altarW + 2, 1);
    ctx.fillRect(altarX - 1, altarTop + 14, altarW + 2, 1);
    // Joia dourada no centro do altar
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(cx - 2, altarTop + 10, 4, 4);
    ctx.fillStyle = '#fff5a1';
    ctx.fillRect(cx - 2, altarTop + 10, 2, 2);

    // ======== AURA ROSA AO REDOR DA PRINCESA ========
    const auraCY = altarTop - 20;
    const g = ctx.createRadialGradient(cx, auraCY, 6, cx, auraCY, 42);
    g.addColorStop(0, 'rgba(255,180,220,0.6)');
    g.addColorStop(1, 'rgba(255,180,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, auraCY, 42, 0, Math.PI*2); ctx.fill();

    // ======== PRINCESA EM CIMA DO ALTAR ========
    const img = SPRITE_IMGS.princesa;
    // Tamanho aumentado mais uma pincelada: 68px (antes 56).
    const drawW = 68;
    let drawH = drawW;
    let drawX = Math.round(cx - drawW / 2);
    let drawY = Math.round(altarTop - drawH + bob);
    if (img && img.complete && img.naturalWidth) {
      drawH = Math.round(drawW * (img.naturalHeight / img.naturalWidth));
      drawX = Math.round(cx - drawW / 2);
      drawY = Math.round(altarTop - drawH + bob);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Fallback pixel-art maior
      const fpx = cx - 12;
      const fpy = altarTop - 42 + bob;
      ctx.fillStyle = '#ff9ed2';
      ctx.fillRect(fpx + 2, fpy + 18, 20, 24);
      ctx.fillStyle = '#f5d0a9';
      ctx.fillRect(fpx + 6, fpy + 5, 12, 12);
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(fpx + 5, fpy + 2, 14, 6);
      drawY = fpy;
    }

    // ======== LABEL "PRINCESA" ========
    // Fica acima da cabeça (não mais em cima do rosto). Usa o topo do
    // sprite como referência e adiciona um respiro de 8px.
    ctx.save();
    ctx.font = 'bold 6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ff9ed2';
    const labelY = drawY - 8;
    ctx.strokeText('PRINCESA', cx, labelY);
    ctx.fillText('PRINCESA', cx, labelY);
    ctx.restore();
  }
}

// ============================================================
// LIFE PICKUP — vida extra no caminho
// ============================================================
class LifePickup extends Entity {
  constructor(x, y) {
    super(x, y, 16, 16);
    this.type = 'item';
    this.t = Math.random() * 6;
  }
  update(dt) { this.t += dt; }
  onPlayerContact(player, game) {
    if (this.dead) return;
    this.dead = true;
    player.lives = Math.min(player.lives + 1, 5);
    player.score += 500;
    AUDIO.powerup();
    game.spawnParticle('powerup', this.x + this.w/2, this.y + this.h/2);
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y) + Math.sin(this.t * 3) * 2;
    // Glow
    const r = 10 + Math.sin(this.t * 2) * 2;
    const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    grad.addColorStop(0, 'rgba(255,56,56,0.6)');
    grad.addColorStop(1, 'rgba(255,56,56,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // Coracao
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u2764', cx, cy);
    // Label flutuante removido.
  }
}

// ============================================================
// WEAPON PICKUP — arma coletável no caminho
// ============================================================
class WeaponPickup extends Entity {
  constructor(x, y, kind) {
    super(x, y, 16, 16);
    this.type = 'item';
    this.kind = kind; // 'focus', 'curiosity', 'method'
    this.t = Math.random() * 6;
  }
  update(dt) { this.t += dt; }
  onPlayerContact(player, game) {
    if (this.dead) return;
    this.dead = true;
    player.collectPower(this.kind);
    game.showPowerPopup(this.kind);
  }
  draw(ctx, cam) {
    const cx = Math.round(this.x + this.w/2 - cam.x);
    const cy = Math.round(this.y + this.h/2 - cam.y + Math.sin(this.t * 3) * 3);
    drawPowerStar(ctx, cx, cy, this.kind, 9, this.t);
  }
}

// Desenho unificado de estrela de poder (5 pontas, colorida por tipo).
// Usado por WeaponPickup, PowerItem, HUD e popup.
function drawPowerStar(ctx, cx, cy, kind, outerR, time) {
  const col = kind === 'focus'      ? { main: '#2ce06f', light: '#b3ff3a', glow: 'rgba(44,224,111,0.55)' }
            : kind === 'curiosity'  ? { main: '#ff9c1d', light: '#ffe14f', glow: 'rgba(255,156,29,0.55)' }
            : kind === 'super'      ? { main: '#ffd43b', light: '#fff5a1', glow: 'rgba(255,220,80,0.65)' }
            :                          { main: '#4fd6ff', light: '#a8eaff', glow: 'rgba(79,214,255,0.55)' };
  const t = time || 0;
  const R = outerR;
  const r = R * 0.45;
  // Halo
  const haloR = R * 1.9 + Math.sin(t * 3) * 1.5;
  const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, haloR);
  grad.addColorStop(0, col.glow);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
  ctx.fill();
  // Estrela 5 pontas
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = (i % 2 === 0) ? R : r;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = col.main;
  ctx.fill();
  // Brilho interno (estrela menor, cor clara) pra efeito 3D
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = (i % 2 === 0) ? R * 0.6 : r * 0.6;
    const px = cx + Math.cos(a) * rad - R * 0.12;
    const py = cy + Math.sin(a) * rad - R * 0.12;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = col.light;
  ctx.fill();
  // Contorno preto pixel-art
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rad = (i % 2 === 0) ? R : r;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  // Rostinho fofo no centro da estrela
  drawCuteFace(ctx, cx, cy, R, t);
}

// Desenha um rostinho fofo (2 olhos + bochechas + sorriso) centrado em (cx,cy).
// O tamanho se adapta ao raio da estrela. time permite piscadinhas animadas.
function drawCuteFace(ctx, cx, cy, R, time) {
  const t = time || 0;
  // Olhos — spacing proporcional ao raio
  const eyeDX = Math.max(2, Math.round(R * 0.32));
  const eyeDY = Math.round(R * 0.05);
  const eyeR  = Math.max(1, Math.round(R * 0.16));
  // Piscadinha periódica: a cada ~2.4s, fica de olhos fechados por 0.18s.
  // Usa uma única forma normalizada pra ser consistente entre chamadas.
  const cycle = ((t % 2.4) / 2.4);
  const blink = cycle < 0.075;
  ctx.fillStyle = '#000';
  if (blink) {
    // Olhos fechados (linhas)
    ctx.fillRect(cx - eyeDX - eyeR, cy + eyeDY, eyeR * 2, 1);
    ctx.fillRect(cx + eyeDX - eyeR, cy + eyeDY, eyeR * 2, 1);
  } else {
    ctx.beginPath(); ctx.arc(cx - eyeDX, cy + eyeDY, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eyeDX, cy + eyeDY, eyeR, 0, Math.PI * 2); ctx.fill();
    // Reflexos brancos nos olhos
    ctx.fillStyle = '#fff';
    const hl = Math.max(1, Math.round(eyeR * 0.5));
    ctx.beginPath(); ctx.arc(cx - eyeDX + hl*0.4, cy + eyeDY - hl*0.4, hl * 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + eyeDX + hl*0.4, cy + eyeDY - hl*0.4, hl * 0.6, 0, Math.PI * 2); ctx.fill();
  }
  // Bochechas rosadas
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  const cheekR = Math.max(1, Math.round(R * 0.12));
  const cheekDX = Math.round(R * 0.52);
  const cheekDY = Math.round(R * 0.28);
  ctx.beginPath(); ctx.arc(cx - cheekDX, cy + cheekDY, cheekR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + cheekDX, cy + cheekDY, cheekR, 0, Math.PI * 2); ctx.fill();
  // Sorriso (arco sutil)
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy + Math.round(R * 0.22), Math.max(2, Math.round(R * 0.26)), 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

// ============================================================
// MINI-BOSS — versao maior do inimigo padrao, com HP
// ============================================================
class MiniBoss extends Entity {
  constructor(x, y, name, hp) {
    super(x - 16, y - 30, 48, 48);
    this.type = 'boss';
    this.hp = hp || 3;
    this.maxHp = this.hp;
    this.invincible = 0;
    this.bossName = name || 'MINI-BOSS';
    this.t = 0;
    this.shootT = 2.0;
    this.vx = -38;
    this.shotCount = 0;
  }
  update(dt, game) {
    this.t += dt;
    if (this.invincible > 0) this.invincible -= dt;
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    this.x += this.vx * dt;
    if (collideGenericX(this, game.level)) this.vx = -this.vx;
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
    if (this.onGround) {
      const foreX = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
      const tx = Math.floor(foreX / TILE);
      const ty = Math.floor((this.y + this.h + 2) / TILE);
      if (!isSolidTile(game.level.getTile(tx, ty))) this.vx = -this.vx;
    }
    this.facing = this.vx > 0 ? 1 : -1;
    this.shootT -= dt;
    if (this.shootT <= 0) {
      this.shotCount++;
      const dx = game.player.x - this.x;
      const dir = dx > 0 ? 1 : -1;
      const sx = this.x + this.w/2;
      const sy = this.y + this.h/2;
      const isSpecial = (this.shotCount % 4 === 0);
      if (isSpecial) {
        this.shootT = 2.6;
        game.entities.push(new BossShot(sx, sy, dir * 110, -30, 'special'));
        game.entities.push(new BossShot(sx, sy, dir * 130,  20, 'special'));
      } else {
        this.shootT = 2.0;
        const kind = this.bossName.includes('TEXTO') ? 'magic' : 'fire';
        game.entities.push(new BossShot(sx, sy, dir * 120, 0, kind));
      }
    }
  }
  onPlayerContact(player, game) {
    if (this.dead || this.invincible > 0 || player.invincible > 0) return;
    if (player.stompCd > 0) return;
    if ((player.vy >= 0) && (player.y + player.h * 0.5 < this.y + this.h * 0.5)) {
      this.hp--;
      this.invincible = 0.8;
      player.vy = -280;
      player.stompCd = 0.18;
      player.score += 400;
      game.triggerShake(0.2);
      AUDIO.bossHit && AUDIO.bossHit();
      if (this.hp <= 0) {
        this.dead = true;
        player.score += 2000;
        player.kills = (player.kills || 0) + 1;
        game.onBossDefeated();
      }
    } else {
      player.takeDamage(game);
    }
  }
  draw(ctx, cam) {
    if (this.invincible > 0 && Math.floor(this.invincible * 14) % 2 === 0) return;
    const tw = 42, th = 42;
    const px = Math.round(this.x - cam.x - (tw - this.w)/2);
    const py = Math.round(this.y - cam.y - (th - this.h));

    // Brilho sombrio ao redor do mini-boss
    const gcx = px + tw/2, gcy = py + th/2;
    const glowR = 44 + Math.sin(this.t * 2.5) * 6;
    const glow = ctx.createRadialGradient(gcx, gcy, 8, gcx, gcy, glowR);
    glow.addColorStop(0, 'rgba(150,0,0,0.3)');
    glow.addColorStop(0.6, 'rgba(80,0,40,0.15)');
    glow.addColorStop(1, 'rgba(30,0,30,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gcx, gcy, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Sprite
    const img = this.bossName.includes('TEXTO') ? SPR.enemyBookImg : SPR.enemyDesmotImg;
    if (imgReady(img)) {
      ctx.imageSmoothingEnabled = true;
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;
      if (this.facing < 0) {
        ctx.save();
        ctx.translate(px + tw, py);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, tw, th);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0, sw, sh, px, py, tw, th);
      }
      ctx.imageSmoothingEnabled = false;
    } else {
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(px, py, tw, th);
    }

    // HP BAR NO TOPO DA TELA
    const bw = 160;
    const bx = (CANVAS_W - bw) / 2;
    const by = 32;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx - 4, by - 16, bw + 8, 24);
    ctx.save();
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5050';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(this.bossName, bx + bw/2, by - 5);
    ctx.fillText(this.bossName, bx + bw/2, by - 5);
    ctx.restore();
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(bx, by, bw, 6);
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
    grad.addColorStop(0, '#ff3838');
    grad.addColorStop(1, '#ffd43b');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * hpRatio, 6);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 5);
  }
}

// ============================================================
// PIPE SECRET — cano verde clássico que leva pra fase escondida
// Fique em cima e aperte ↓ para descer.
// ============================================================
// PipeSecret é apenas um detector invisível posicionado em cima do cano (tiles []).
// Quando o jogador está em pé sobre ele e aperta ↓, entra na fase bônus.
class PipeSecret extends Entity {
  constructor(x, y, destination) {
    // cobre os 2 tiles acima do topo do cano para detectar o jogador
    super(x, y - 4, TILE * 2, 8);
    this.type = 'pipe';
    this.t = 0;
    this.activated = false;
    this.destination = destination || 'bonus'; // 'bonus' | 'minigame'
  }
  update(dt, game) {
    this.t += dt;
    if (this.activated) return;
    // Se já foi usado nesta fase (sem restart), não ativa.
    if (game._bonusUsedPerLevel && game._bonusUsedPerLevel[game.levelIdx]) {
      this.activated = true;
      return;
    }
    const p = game.player;
    if (!p) return;
    const feetOnTop = (p.y + p.h) >= this.y && (p.y + p.h) <= this.y + 10 && p.onGround;
    const overlap = (p.x + p.w > this.x + 2) && (p.x < this.x + this.w - 2);
    if (feetOnTop && overlap && input.down) {
      this.activated = true;
      AUDIO.powerup && AUDIO.powerup();
      if (this.destination === 'minigame') game.enterMinigame();
      else game.enterBonus();
    }
  }
  onPlayerContact() { /* não-sólido; só detecta */ }
  draw(/* ctx, cam */) {
    // Sem label flutuante: como no Mario original, o jogador descobre sozinho.
  }
}

// ============================================================
// MOUNT — "RAPOSA" (Yoshi-like): a aliada roxa que carrega a jogadora
// Pule em cima pra montar. Enquanto montada: +velocidade, pulo +alto,
// imune a um hit (solta a montaria em vez de tomar dano).
// Aperte ↓ para desmontar.
// ============================================================
class Mount extends Entity {
  constructor(x, y) {
    super(x - 4, y + TILE - 24, 26, 24);
    this.type = 'mount';
    this.vx = 0;     // começa parada, dormindo
    this.rider = null;
    this.tongueT = 0;
    this.idleTime = 0;      // tempo acumulado parada (usado pra carinho)
    this.awakened = false;  // vira true quando Brenda se aproxima ou monta
  }
  update(dt, game) {
    this.tongueT += dt;
    if (this.rider) {
      // Acumula idleTime enquanto rider está parado no chão; zera se se mover.
      const moving = Math.abs(this.rider.vx) > 8;
      if (moving || !this.rider.onGround) this.idleTime = 0;
      else this.idleTime += dt;
      const p = this.rider;
      this.x = p.x - (this.w - p.w) / 2;
      this.y = p.y + p.h - 6;
      this.facing = p.facing;
      return;
    }
    this.idleTime = 0;
    // Livre: se Brenda estiver perto, acorda e começa a andar. Antes disso,
    // fica deitada respirando (pulsando) no ponto de spawn.
    if (!this.awakened && game.player) {
      const dx = game.player.x - this.x;
      const dy = game.player.y - this.y;
      if (Math.abs(dx) < 90 && Math.abs(dy) < 40) {
        this.awakened = true;
        this.vx = (dx < 0) ? -18 : 18;
      }
    }
    this.vy += GRAVITY * dt;
    if (this.vy > MAX_FALL) this.vy = MAX_FALL;
    if (this.awakened) {
      this.x += this.vx * dt;
      if (collideGenericX(this, game.level)) this.vx = -this.vx;
    }
    this.y += this.vy * dt;
    collideGenericY(this, game.level);
    if (this.onGround && this.awakened) {
      const foreX = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
      const tx = Math.floor(foreX / TILE);
      const ty = Math.floor((this.y + this.h + 2) / TILE);
      if (!isSolidTile(game.level.getTile(tx, ty))) this.vx = -this.vx;
    }
    this.facing = this.vx > 0 ? 1 : (this.vx < 0 ? -1 : (this.facing || 1));
  }
  onPlayerContact(player, game) {
    if (this.rider || this.dead) return;
    if (player.vy > 0 && player.y + player.h <= this.y + 10) {
      this.rider = player;
      this.awakened = true;
      player.mount = this;
      player.vy = -200;
      // Marca que o jogador conquistou a Raposa nesta fase — se morrer,
      // ela reaparece junto no respawn.
      game._foxRespawnOnRestart = true;
      AUDIO.powerup && AUDIO.powerup();
      game.spawnParticle('powerup', this.x + this.w/2, this.y);
    }
  }
  dismount(player) {
    this.rider = null;
    player.mount = null;
    this.vx = (player.facing || 1) * 36;
    this.awakened = true;
  }
  draw(ctx, cam) {
    // Se montado, o Player desenha a imagem combinada sobre ele mesmo.
    if (this.rider) return;
    const px = Math.round(this.x - cam.x);
    const py = Math.round(this.y - cam.y);
    const dir = this.facing >= 0 ? 1 : -1;
    const cx = px + this.w/2;
    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, py + this.h, this.w/2 - 1, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antes de Brenda se aproximar, a Raposa aparece deitada "respirando"
    // (pulsação suave) grudada no chão. Depois que acorda, fica de pé.
    const sleepImg = SPRITE_IMGS.raposa_dormindo;
    if (!this.awakened && sleepImg && sleepImg.complete && sleepImg.naturalWidth) {
      const now = performance.now() / 1000;
      // Respiração: largura pulsa suavemente; altura fixa pra não descolar do chão.
      const breathe = 1 + Math.sin(now * 1.9) * 0.05;
      const baseW = 48; // menor — raposa enrolada dorme compacta
      const drawW = Math.round(baseW * breathe);
      const baseH = Math.round(baseW * (sleepImg.naturalHeight / sleepImg.naturalWidth));
      const drawH = baseH;
      const drawX = Math.round(cx - drawW / 2);
      // Cola FORTE no chão: o sprite tem padding transparente em baixo,
      // então empurra +6px pra ela tocar a grama de fato.
      const drawY = Math.round(py + this.h - drawH) + 6;
      ctx.imageSmoothingEnabled = false;
      if (dir < 0) {
        ctx.save();
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(sleepImg, 0, 0, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(sleepImg, drawX, drawY, drawW, drawH);
      }
      // Destaque branco nos olhos (imagem original tem olho preto, fica mais viva)
      ctx.fillStyle = '#ffffff';
      const eyeCY = drawY + Math.round(drawH * 0.45);
      const eyeCX = drawX + Math.round(drawW * (dir < 0 ? 0.68 : 0.32));
      ctx.beginPath(); ctx.arc(eyeCX, eyeCY, 1.2, 0, Math.PI * 2); ctx.fill();
      // "Z" flutuando em cima indicando que está dormindo
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      const zY = drawY - 4 + Math.sin(now * 3) * 2;
      ctx.strokeText('z', cx, zY);
      ctx.fillText('z', cx, zY);
      ctx.restore();
      return;
    }

    const img = SPRITE_IMGS.yoshi;
    if (img && img.complete && img.naturalWidth) {
      // Raposa livre: um pouco maior que antes — 64px (antes 52).
      const drawW = 64;
      const drawH = Math.round(drawW * (img.naturalHeight / img.naturalWidth));
      const drawX = cx - drawW / 2;
      const drawY = py + this.h - drawH;
      ctx.imageSmoothingEnabled = false;
      if (dir < 0) {
        ctx.save();
        ctx.translate(drawX + drawW, drawY);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, drawW, drawH);
        ctx.restore();
      } else {
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }
      // Destaque branco nos olhos pra não ficar apenas a mancha preta.
      ctx.fillStyle = '#ffffff';
      const eyeCY = drawY + Math.round(drawH * 0.28);
      const eyeCX = drawX + Math.round(drawW * (dir < 0 ? 0.32 : 0.68));
      ctx.beginPath(); ctx.arc(eyeCX, eyeCY, 1.4, 0, Math.PI * 2); ctx.fill();
    } else {
      // Fallback: pixel art original gerada programaticamente
      ctx.fillStyle = '#2cd82c';
      ctx.fillRect(px + 3, py + 8, 20, 14);
      ctx.fillStyle = '#b3ff3a';
      ctx.fillRect(px + 6, py + 14, 14, 7);
      ctx.fillStyle = '#2cd82c';
      ctx.fillRect(px + (dir > 0 ? 18 : 2), py + 2, 10, 10);
      ctx.fillStyle = '#fff';
      ctx.fillRect(px + (dir > 0 ? 22 : 4), py + 4, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(px + (dir > 0 ? 23 : 5), py + 5, 2, 2);
      ctx.fillStyle = '#1a9a1a';
      ctx.fillRect(px + 4, py + 20, 5, 4);
      ctx.fillRect(px + 17, py + 20, 5, 4);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 2.5, py + 7.5, 21, 15);
    }

    // Labels flutuantes removidos (estilo Mario: sprites sem nomes pairando).
  }
}

// ============================================================
// PARTICLE
// ============================================================
class Particle {
  constructor(x, y, kind) {
    this.x = x; this.y = y;
    this.kind = kind;
    this.t = 0;
    this.life = kind === 'coin' ? 0.5
              : kind === 'powerup' ? 0.8
              : kind === 'jumpPuff' ? 0.3
              : kind === 'bookBurst' ? 0.6
              : 0.4;
    this.dead = false;
  }
  update(dt) {
    this.t += dt;
    if (this.t > this.life) this.dead = true;
  }
  draw(ctx, cam) {
    const p = this.t / this.life;
    const alpha = 1 - p;
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y - p * 24);
    ctx.globalAlpha = alpha;
    if (this.kind === 'coin') {
      ctx.fillStyle = '#ffd43b';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+100', x, y);
    } else if (this.kind === 'stomp') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.fillRect(x + Math.cos(a) * p * 18, y + Math.sin(a) * p * 18, 2, 2);
      }
    } else if (this.kind === 'brick') {
      ctx.fillStyle = '#c4671a';
      ctx.fillRect(x - 5, y - 5, 4, 4);
      ctx.fillRect(x + 2, y - 7, 4, 4);
      ctx.fillRect(x - 7, y + 4, 4, 4);
      ctx.fillRect(x + 4, y + 6, 4, 4);
    } else if (this.kind === 'powerup') {
      ctx.fillStyle = '#ffd43b';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + this.t * 4;
        const r = p * 26;
        ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 3, 3);
      }
    } else if (this.kind === 'jumpPuff') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI + Math.PI;
        const r = p * 12;
        ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.3, 2, 2);
      }
    } else if (this.kind === 'bookBurst') {
      // páginas voando
      ctx.fillStyle = '#fff5e1';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = p * 22;
        ctx.fillRect(x + Math.cos(a) * r - 1, y + Math.sin(a) * r - 1, 3, 2);
      }
      ctx.fillStyle = '#5b2d91';
      ctx.font = 'bold 8px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('+APRENDI!', x, y - p * 14);
    }
    ctx.globalAlpha = 1;
  }
}

// ============================================================
// GAME
// ============================================================
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = 'menu';
    this.levelIdx = 0;
    this.level = null;
    this.player = null;
    this.entities = [];
    this.particles = [];
    this.camera = { x: 0, y: 0 };
    this.frozen = 0;
    this.lastTime = performance.now();
    this.save = this._loadSave();
    this.cloudOffset = 0;
    this.powerPopup = null;
    this.powerToast = null; // toast não-modal ao coletar poder (não pausa jogo)
    this.shake = 0; // screen shake timer
    // Balões de diálogo informativos — a Brenda solta uma frase curta a
    // cada 12-20s sobre aprendizagem (Mayer, Sweller, Prensky, Rojo).
    this.speechBubble = null;
    this.nextSpeechAt = 6; // primeiro balão aos 6s de play
    this.playTime = 0;
  }

  showPowerPopup(kind) {
    // Seleciona uma frase inspiradora aleatória pra não repetir sempre a mesma
    const info = POWER_INFO[kind];
    const quotes = (info && info.quotes) || [];
    const quote = quotes.length ? quotes[Math.floor(Math.random() * quotes.length)] : '';
    // Só mostra o popup tutorial (bloqueante) na fase 1-1. Nas outras,
    // apenas toca o som do power-up sem abrir nenhuma notificação — a
    // experiência fica mais limpa e não interrompe o jogo.
    if (this.level && this.level.id !== '1-1') {
      AUDIO.powerup && AUDIO.powerup();
      return;
    }
    this.powerPopup = { kind, t: 0, life: 3.4, quote };
    // Esconde HUD e badges sobrepostos (HTML) para a notificação ficar no topo.
    const hud = document.getElementById('hud');
    const sb = document.getElementById('sound-badge');
    const logo = document.getElementById('b42-logo');
    if (hud) hud.classList.add('popup-hidden');
    if (sb) sb.classList.add('popup-hidden');
    if (logo) logo.classList.add('popup-hidden');
  }

  showSuperPopup() {
    const info = POWER_INFO.super;
    const quotes = (info && info.quotes) || [];
    const quote = quotes.length ? quotes[Math.floor(Math.random() * quotes.length)] : '';
    this.powerPopup = { kind: 'super', t: 0, life: 4.0, quote };
    const hud = document.getElementById('hud');
    const sb = document.getElementById('sound-badge');
    const logo = document.getElementById('b42-logo');
    if (hud) hud.classList.add('popup-hidden');
    if (sb) sb.classList.add('popup-hidden');
    if (logo) logo.classList.add('popup-hidden');
  }

  dismissPowerPopup() {
    if (this.powerPopup) this.powerPopup = null;
    const hud = document.getElementById('hud');
    const sb = document.getElementById('sound-badge');
    const logo = document.getElementById('b42-logo');
    if (hud) hud.classList.remove('popup-hidden');
    if (sb) sb.classList.remove('popup-hidden');
    if (logo) logo.classList.remove('popup-hidden');
  }

  triggerShake(duration) {
    // Tremor de tela desativado — mantido como no-op para compatibilidade com chamadas existentes.
  }

  _loadSave() {
    try {
      const raw = localStorage.getItem('b42-quest-save');
      return raw ? JSON.parse(raw) : { unlocked: 1, best: 0 };
    } catch (e) { return { unlocked: 1, best: 0 }; }
  }
  _saveProgress() {
    try { localStorage.setItem('b42-quest-save', JSON.stringify(this.save)); } catch (e) {}
    // Atualiza ranking do usuario logado
    if (typeof UserSystem !== 'undefined') {
      const user = UserSystem.getCurrentUser();
      if (user && this.player) {
        UserSystem.updatePlayerScore(
          user.playerName,
          this.player.score,
          this.player.coins,
          this.save.unlocked - 1,
          this.player.kills || 0
        );
      }
    }
  }
  resetSave() {
    this.save = { unlocked: 1, best: 0 };
    this._saveProgress();
  }

  // ---------- State transitions ----------
  showMenu() {
    this.state = 'menu';
    AUDIO.stopMusic();
    hideAll();
    show('ov-menu');
    hide('hud');
    hideTouchControls();
  }

  startGame() {
    AUDIO.init();
    // Tenta fullscreen no mobile
    if (IS_TOUCH) requestFullscreen();
    this.levelIdx = 0;
    this.player = null;
    this.loadLevel(0);
  }

  loadLevel(idx) {
    this.levelIdx = idx;
    const def = LEVELS[idx];
    this.level = new LevelData(def);
    const prevLives = this.player ? this.player.lives : 3;
    const prevCoins = this.player ? this.player.coins : 0;
    const prevKills = this.player ? (this.player.kills || 0) : 0;
    const prevScore = this.player ? this.player.score : 0;
    const prevBig   = this.player && this.player.state === 'big';
    // Preserva poderes acumulados entre fases (por tipo)
    const prevPowers    = this.player ? {...this.player.powers} : null;
    const prevPower     = this.player ? this.player.power : null;
    const prevPowerTime = this.player ? this.player.powerTime : 0;
    // Preserva Raposa entre fases — ele só some ao tomar dano ou morrer
    const prevHadMount  = this.player && this.player.mount ? true : false;
    this.player = new Player(this.level.spawns.player.x, this.level.spawns.player.y);
    this.player.lives = prevLives;
    this.player.coins = prevCoins;
    this.player.kills = prevKills;
    this.player.score = prevScore;
    if (prevBig) this.player.setForm('big');
    // Restaura poderes acumulativos por tipo da fase anterior
    if (prevPowers) {
      this.player.powers = prevPowers;
      if (prevPower && prevPowers[prevPower] > 0) {
        this.player.power = prevPower;
        this.player.powerAmmo = prevPowers[prevPower];
        this.player.powerTime = prevPowerTime;
      }
    }
    this.entities = [];
    this.particles = [];
    this.powerPopup = null;
    for (const sp of this.level.spawns.entities) this._spawnFromDef(sp);
    // Re-spawna Raposa e monta automaticamente se a jogadora vinha montada
    if (prevHadMount) {
      const mount = new Mount(this.player.x + this.player.w/2, this.player.y + this.player.h);
      mount.rider = this.player;
      mount.awakened = true;
      this.player.mount = mount;
      this.entities.push(mount);
    } else if (this._foxRespawnOnRestart) {
      // A jogadora morreu nesta fase, mas já havia conquistado a Raposa.
      // Respawna ela do lado do player, já acordada e pronta pra ser montada
      // ao pular em cima.
      const alreadyHasMount = this.entities.some(e => e instanceof Mount);
      if (!alreadyHasMount) {
        const mount = new Mount(this.player.x + 40, this.player.y + this.player.h);
        mount.awakened = true;
        mount.vx = 0;
        this.entities.push(mount);
      }
    }
    // No mundo do chefe, garante pelo menos o poder MÉTODO
    if (this.level.isBossLevel && !this.player.power) {
      this.player.powers.method = Math.max(8, this.player.powers.method || 0);
      this.player.power = 'method';
      this.player.powerAmmo = this.player.powers.method;
      this.player.powerTime = 60;
    }
    this.camera.x = 0;
    this.camera.y = 0;
    this.frozen = 0;
    this._showDialog(def);
    this.state = 'dialog';
    AUDIO.startMusic(def.music || 'overworld');
  }

  _spawnFromDef(sp) {
    switch (sp.type) {
      case 'coin':   this.entities.push(new Coin(sp.x, sp.y)); break;
      case 'walker': this.entities.push(new Walker(sp.x, sp.y)); break;
      case 'jumper': this.entities.push(new Jumper(sp.x, sp.y)); break;
      case 'flyer':  this.entities.push(new Flyer(sp.x, sp.y)); break;
      case 'boss':   this.entities.push(new Boss(sp.x, sp.y)); break;
      case 'life':   this.entities.push(new LifePickup(sp.x, sp.y)); break;
      case 'weapon_focus':     this.entities.push(new WeaponPickup(sp.x, sp.y, 'focus')); break;
      case 'weapon_curiosity': this.entities.push(new WeaponPickup(sp.x, sp.y, 'curiosity')); break;
      case 'weapon_method':    this.entities.push(new WeaponPickup(sp.x, sp.y, 'method')); break;
      case 'miniboss_texto':  this.entities.push(new MiniBoss(sp.x, sp.y, 'TEXTO MAÇANTE', 4)); break;
      case 'miniboss_desmot': this.entities.push(new MiniBoss(sp.x, sp.y, 'DESMOTIVAÇÃO', 5)); break;
      case 'flag':   this.entities.push(new Flag(sp.x, sp.y)); break;
      case 'mount':  this.entities.push(new Mount(sp.x, sp.y)); break;
      case 'pergaminho': this.entities.push(new PergaminhoItem(sp.x, sp.y)); break;
      case 'princesa':   this.entities.push(new Princesa(sp.x, sp.y)); break;
      case 'pipe_secret': this.entities.push(new PipeSecret(sp.x, sp.y)); break;
      case 'pipe_minigame': this.entities.push(new PipeSecret(sp.x, sp.y, 'minigame')); break;
      case 'bullet_spawner': this.entities.push(new BulletBillSpawner(sp.x, sp.y)); break;
      case 'piranha': this.entities.push(new Piranha(sp.x, sp.y)); break;
      case 'fish_pink':  this.entities.push(new CheepCheep(sp.x, sp.y, 'pink')); break;
      case 'fish_green': this.entities.push(new CheepCheep(sp.x, sp.y, 'green')); break;
      case 'super_orb':  this.entities.push(new SuperOrb(sp.x, sp.y)); break;
    }
  }

  spawnItem(kind, x, y) {
    if (kind === 'mushroom')  this.entities.push(new Mushroom(x, y));
    else if (kind === 'focus') this.entities.push(new PowerItem(x, y, 'focus'));
    else if (kind === 'curiosity') this.entities.push(new PowerItem(x, y, 'curiosity'));
    else if (kind === 'method') this.entities.push(new PowerItem(x, y, 'method'));
  }

  spawnParticle(kind, x, y) {
    this.particles.push(new Particle(x, y, kind));
  }

  _showDialog(def) {
    document.getElementById('dialog-title').textContent = 'MUNDO ' + def.id;
    document.getElementById('dialog-subtitle').textContent = def.name;
    const _currentUser = (typeof UserSystem !== 'undefined') ? UserSystem.getCurrentUser() : null;
    const _playerName = (_currentUser && _currentUser.playerName) ? _currentUser.playerName : 'JOGADOR';
    document.getElementById('dialog-body').innerHTML = def.narrative.replace(/\{PLAYER\}/g, _playerName);
    hideAll();
    show('ov-dialog');
    hideTouchControls();
  }

  startLevel() {
    hideAll();
    show('hud');
    showTouchControls();
    this.state = 'play';
    this.frozen = 0.3;
  }

  restartLevel() {
    // Reiniciou a fase: libera reentrada nas fases secretas dela novamente.
    if (this._bonusUsedPerLevel) this._bonusUsedPerLevel[this.levelIdx] = false;
    this.frozen = 1;
    setTimeout(() => this.loadLevel(this.levelIdx), 900);
  }

  // Transição para fase bônus (acesso por cano secreto).
  // Cada fase só permite 1 entrada na bônus por "vida" naquela fase:
  // se não morrer/reiniciar, o cano fica inativo. Também salvamos a posição
  // do jogador antes de entrar, pra retornar no mesmo cano.
  enterBonus() {
    if (!this._bonusUsedPerLevel) this._bonusUsedPerLevel = {};
    if (this._bonusUsedPerLevel[this.levelIdx]) return;
    const bonusIdx = LEVELS.findIndex(l => l.isBonus);
    if (bonusIdx < 0) return;
    this._bonusUsedPerLevel[this.levelIdx] = true;
    this._bonusReturn = this.levelIdx;
    this._bonusReturnPos = this.player ? { x: this.player.x, y: this.player.y } : null;
    this.frozen = 0.8;
    setTimeout(() => this.loadLevel(bonusIdx), 700);
  }

  enterMinigame() {
    if (!this._bonusUsedPerLevel) this._bonusUsedPerLevel = {};
    if (this._bonusUsedPerLevel[this.levelIdx]) return;
    const idx = LEVELS.findIndex(l => l.isMinigame);
    if (idx < 0) return;
    this._bonusUsedPerLevel[this.levelIdx] = true;
    this._bonusReturn = this.levelIdx;
    this._bonusReturnPos = this.player ? { x: this.player.x, y: this.player.y } : null;
    this.frozen = 0.8;
    setTimeout(() => this.loadLevel(idx), 700);
  }

  gameOver() {
    this.state = 'gameover';
    AUDIO.stopMusic();
    hideTouchControls();
    document.getElementById('go-score').textContent = this.player.score;
    document.getElementById('go-coins').textContent = this.player.coins;
    hideAll();
    show('ov-gameover');
  }

  onLevelClear() {
    if (this.state === 'complete') return;
    const def = LEVELS[this.levelIdx];
    // Se foi uma fase bônus, volta pra fase de origem sem abrir a tela de conclusão
    if ((def.isBonus || def.isMinigame) && this._bonusReturn !== undefined) {
      const ret = this._bonusReturn;
      const pos = this._bonusReturnPos;
      this._bonusReturn = undefined;
      this._bonusReturnPos = null;
      this.frozen = 0.7;
      AUDIO.levelClear();
      setTimeout(() => {
        this.loadLevel(ret);
        // Reposiciona o jogador no cano de entrada depois do load
        if (pos && this.player) {
          this.player.x = pos.x;
          this.player.y = pos.y;
        }
      }, 700);
      return;
    }
    this.state = 'complete';
    AUDIO.levelClear();
    AUDIO.stopMusic();
    hideTouchControls();
    document.getElementById('complete-stats').innerHTML =
      `<div>CONHECIMENTO: <span>× ${this.player.coins}</span></div>` +
      `<div>MONSTROS: <span>× ${this.player.kills || 0}</span></div>` +
      `<div>SCORE: <span>${this.player.score}</span></div>` +
      `<div>VIDAS: <span>× ${this.player.lives}</span></div>`;
    document.getElementById('complete-lesson').innerHTML =
      '<strong>LIÇÃO DA FASE:</strong> ' + def.lesson;
    if (this.levelIdx + 1 > this.save.unlocked - 1) {
      this.save.unlocked = Math.max(this.save.unlocked, this.levelIdx + 2);
    }
    this.save.best = Math.max(this.save.best, this.player.score);
    this._saveProgress();
    hideAll();
    show('ov-complete');
  }

  onBossDefeated() {
    // Determina última fase normal (ignora fases bônus no cálculo)
    let lastNormal = LEVELS.length - 1;
    while (lastNormal > 0 && (LEVELS[lastNormal].isBonus || LEVELS[lastNormal].isMinigame || LEVELS[lastNormal].isFinalCastle)) lastNormal--;
    if (this.levelIdx >= lastNormal) {
      this.frozen = 1.5;
      setTimeout(() => this._startCastleCutscene(), 1400);
    } else {
      setTimeout(() => this.onLevelClear(), 1300);
    }
  }

  nextLevel() {
    // Mudou de fase com sucesso — a Raposa volta a ser conquistada do zero
    // na próxima, a não ser que a jogadora já esteja montada (cobre isso em loadLevel).
    this._foxRespawnOnRestart = false;
    // Pula qualquer fase bônus/minigame — só acessíveis por cano secreto
    let next = this.levelIdx + 1;
    while (next < LEVELS.length && (LEVELS[next].isBonus || LEVELS[next].isMinigame || LEVELS[next].isFinalCastle)) next++;
    if (next >= LEVELS.length) this._startCastleCutscene();
    else this.loadLevel(next);
  }

  // ========== CUTSCENE DO CASTELO ==========
  _startCastleCutscene() {
    // Em vez de cutscene passiva, carrega a fase do castelo final onde a
    // jogadora anda, pega o pergaminho e entrega pra princesa.
    const idx = LEVELS.findIndex(l => l.isFinalCastle);
    if (idx >= 0) {
      this.loadLevel(idx);
      return;
    }
    // Fallback: mantém cutscene antiga caso a fase não exista.
    this.state = 'cutscene';
    this.cutscene = { phase: 'walk', t: 0, brendaX: 40, pickedScroll: false, fadeAlpha: 0 };
    AUDIO.stopMusic();
    hideTouchControls();
    hideAll();
    show('hud');
  }

  _updateCutscene(dt) {
    if (!this.cutscene) return;
    const cs = this.cutscene;
    cs.t += dt;

    if (cs.phase === 'walk') {
      // Brenda anda até o pergaminho no altar
      cs.brendaX += 55 * dt;
      // Quando ENCOSTA no pergaminho (centro da tela) → pega e finaliza
      if (cs.brendaX >= CANVAS_W / 2 - 30) {
        cs.brendaX = CANVAS_W / 2 - 30;
        cs.pickedScroll = true;
        cs.phase = 'glow';
        cs.t = 0;
        AUDIO.victory && AUDIO.victory();
      }
    } else if (cs.phase === 'glow') {
      // Brilho rápido por 2.5s e finaliza
      cs.fadeAlpha = Math.min(1, cs.t / 2);
      if (cs.t > 2.5) {
        cs.phase = 'done';
        this._showVictoryScreen();
      }
    }
  }

  _drawCutscene() {
    const ctx = this.ctx;
    const cs = this.cutscene;
    if (!cs) return;

    // Fundo do castelo (interior escuro com tochas)
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#0a0520');
    grad.addColorStop(0.5, '#1a0a3e');
    grad.addColorStop(1, '#2a1454');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Paredes do castelo
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 30, CANVAS_H);
    ctx.fillRect(CANVAS_W - 30, 0, 30, CANVAS_H);

    // Tochas nas paredes
    const flicker = Math.sin(cs.t * 12) * 0.15;
    for (let i = 0; i < 2; i++) {
      const tx = i === 0 ? 20 : CANVAS_W - 20;
      // Suporte
      ctx.fillStyle = '#5b3a1a';
      ctx.fillRect(tx - 2, 80, 4, 20);
      // Chama
      const cr = 8 + Math.sin(cs.t * 8 + i * 3) * 3;
      const fg = ctx.createRadialGradient(tx, 75, 1, tx, 75, cr);
      fg.addColorStop(0, `rgba(255,220,80,${0.9 + flicker})`);
      fg.addColorStop(0.5, `rgba(255,140,20,${0.6 + flicker})`);
      fg.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(tx, 75, cr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chão de pedra
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, CANVAS_H - 50, CANVAS_W, 50);
    ctx.fillStyle = '#3a3a5e';
    for (let x = 0; x < CANVAS_W; x += 32) {
      ctx.fillRect(x, CANVAS_H - 50, 30, 2);
      ctx.fillRect(x + 16, CANVAS_H - 30, 30, 2);
    }

    // Altar no centro
    const altarX = CANVAS_W / 2 - 25;
    const altarY = CANVAS_H - 90;
    ctx.fillStyle = '#4a3a5e';
    ctx.fillRect(altarX, altarY, 50, 40);
    ctx.fillStyle = '#6a5a7e';
    ctx.fillRect(altarX - 4, altarY - 4, 58, 8);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 1;
    ctx.strokeRect(altarX - 4.5, altarY - 4.5, 59, 9);

    // Pergaminho no altar (se ainda não foi pego)
    if (!cs.pickedScroll) {
      const scrollX = CANVAS_W / 2;
      const scrollY = altarY - 18 + Math.sin(cs.t * 3) * 4;

      // Brilho ao redor do pergaminho
      const sg = ctx.createRadialGradient(scrollX, scrollY, 2, scrollX, scrollY, 28);
      sg.addColorStop(0, 'rgba(255,225,79,0.6)');
      sg.addColorStop(0.5, 'rgba(255,200,50,0.2)');
      sg.addColorStop(1, 'rgba(255,200,50,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(scrollX, scrollY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Corpo do pergaminho
      ctx.fillStyle = '#f5deb3';
      ctx.fillRect(scrollX - 12, scrollY - 8, 24, 16);
      ctx.fillStyle = '#c4671a';
      ctx.fillRect(scrollX - 14, scrollY - 9, 4, 18); // rolo esquerdo
      ctx.fillRect(scrollX + 10, scrollY - 9, 4, 18); // rolo direito
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(scrollX - 4, scrollY + 2, 8, 3); // selo

      // Texto "PERGAMINHO" brilhante
      ctx.save();
      ctx.font = 'bold 6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd43b';
      ctx.globalAlpha = 0.7 + Math.sin(cs.t * 5) * 0.3;
      ctx.fillText('PERGAMINHO', scrollX, scrollY - 16);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Brenda andando
    const brendaSprite = cs.phase === 'walk' ? SPR.brWalk1 : SPR.brIdle;
    const brendaY = CANVAS_H - 96;
    if (imgReady(brendaSprite)) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(brendaSprite, cs.brendaX, brendaY, 36, 46);
      ctx.imageSmoothingEnabled = prev;
    }

    // Se pegou o pergaminho, mostra brilho intenso
    if (cs.pickedScroll) {
      // Pergaminho acima da cabeça da Brenda
      const scrollAbove = brendaY - 24 - Math.sin(cs.t * 4) * 3;
      ctx.fillStyle = '#f5deb3';
      ctx.fillRect(cs.brendaX + 8, scrollAbove, 20, 14);
      ctx.fillStyle = '#c4671a';
      ctx.fillRect(cs.brendaX + 6, scrollAbove - 1, 3, 16);
      ctx.fillRect(cs.brendaX + 28, scrollAbove - 1, 3, 16);

      // Brilho expandindo
      const glowR = cs.t * 50;
      const gg = ctx.createRadialGradient(CANVAS_W/2, CANVAS_H/2, 2, CANVAS_W/2, CANVAS_H/2, glowR);
      gg.addColorStop(0, `rgba(255,245,200,${0.7 * cs.fadeAlpha})`);
      gg.addColorStop(1, `rgba(255,220,100,0)`);
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Texto centralizado
      ctx.save();
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.globalAlpha = cs.fadeAlpha;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#ffd43b';
      ctx.strokeText('PERGAMINHO DO CONHECIMENTO', CANVAS_W/2, 40);
      ctx.fillText('PERGAMINHO DO CONHECIMENTO', CANVAS_W/2, 40);
      ctx.font = '18px "VT323", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText('O saber foi conquistado!', CANVAS_W/2, 60);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Fade branco final
      if (cs.fadeAlpha > 0.6) {
        ctx.fillStyle = `rgba(255,255,255,${(cs.fadeAlpha - 0.6) * 2.5})`;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
    }

    // Label BRENDA
    ctx.save();
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#ffd43b';
    ctx.strokeText('BRENDA', cs.brendaX + 18, brendaY - 8);
    ctx.fillText('BRENDA', cs.brendaX + 18, brendaY - 8);
    ctx.restore();
  }

  // Tela gigante "VISITE O STAND DA B42 E GANHE BRINDES" antes dos créditos.
  // Só é chamada no fim do jogo (depois que a jogadora entrega o Pergaminho).
  // Pode ser pulada com ENTER, clique/tap ou botão "PULAR".
  _showB42Ad(next) {
    this.state = 'b42ad';
    hideTouchControls();
    hideAll();
    const el = document.getElementById('ov-b42ad');
    if (el) show('ov-b42ad');
    this._b42AdNext = next || (() => this._showVictoryScreen());
    this._b42AdSkipped = false;
    // Auto-avança depois de 6s se o jogador não pular
    this._b42AdTimeout = setTimeout(() => this._skipB42Ad(), 6000);
  }

  _skipB42Ad() {
    if (this._b42AdSkipped) return;
    this._b42AdSkipped = true;
    if (this._b42AdTimeout) { clearTimeout(this._b42AdTimeout); this._b42AdTimeout = null; }
    const el = document.getElementById('ov-b42ad');
    if (el) hide('ov-b42ad');
    const next = this._b42AdNext;
    this._b42AdNext = null;
    if (next) next();
  }

  // ========== DIÁLOGO DA PRINCESA (final de jogo) ==========
  _startPrincessDialog() {
    const _currentUser = (typeof UserSystem !== 'undefined') ? UserSystem.getCurrentUser() : null;
    const _playerName = (_currentUser && _currentUser.playerName) ? _currentUser.playerName : 'JOGADOR';
    // Script do encontro: agradecimento, convite à aprendizagem real e
    // convite pro stand da B42 no CIAED 2026.
    this._princessDialog = {
      idx: 0,
      lines: [
        {
          speaker: 'PRINCESA APRENDIZAGEM',
          text:
            'Ah, ' + _playerName + '... você conseguiu. Passou pelo Texto Maçante, ' +
            'pela Desmotivação e até pelo Desengajamento. E continuou.<br/><br/>' +
            '<em>Obrigada por vir me buscar.</em>'
        },
        {
          speaker: 'PRINCESA APRENDIZAGEM',
          text:
            'O que você viveu aqui não foi apenas um jogo: foi <strong>Foco</strong>, ' +
            '<strong>Curiosidade</strong> e <strong>Método</strong> — os três ' +
            'poderes que soltam a aprendizagem do cativeiro.<br/><br/>' +
            'Agora eu quero te convidar pra conhecer a aprendizagem <em>de verdade</em>.'
        },
        {
          speaker: 'PRINCESA APRENDIZAGEM',
          text:
            'Venha visitar o <strong>stand da B42</strong> no ' +
            '<strong>CIAED 2026</strong>. Lá a gente mostra, ao vivo, como ' +
            'transformar conteúdo chato em jornada que prende — ' +
            'da <em>história ilustrada</em> ao <em>ritmo interativo</em>.'
        },
        {
          speaker: _playerName.toUpperCase(),
          text:
            '★ Então é isso que vocês fazem? Pegar o que seria maçante... ' +
            'e transformar em <strong>quest</strong>?<br/><br/>' +
            'Tô dentro. Te vejo no <strong>CIAED 2026</strong>, Princesa!'
        },
      ],
    };
    this.state = 'princess';
    AUDIO.stopMusic && AUDIO.stopMusic();
    AUDIO.victory && AUDIO.victory();
    hideAll();
    hideTouchControls();
    show('ov-princess');
    this._renderPrincessDialog();
  }

  _renderPrincessDialog() {
    const pd = this._princessDialog;
    if (!pd) return;
    const line = pd.lines[pd.idx];
    document.getElementById('princess-speaker').textContent = line.speaker;
    document.getElementById('princess-body').innerHTML = line.text;
  }

  _advancePrincessDialog() {
    const pd = this._princessDialog;
    if (!pd) return;
    pd.idx++;
    if (pd.idx >= pd.lines.length) {
      this._princessDialog = null;
      hide('ov-princess');
      this._showVictoryScreen();
    } else {
      this._renderPrincessDialog();
    }
  }

  _showVictoryScreen() {
    this.state = 'victory';
    hideTouchControls();
    // Som de vitória final — fanfarra ascendente ao abrir a tela de conquista.
    AUDIO.stopMusic && AUDIO.stopMusic();
    AUDIO.victory && AUDIO.victory();
    this.save.best = Math.max(this.save.best, this.player.score);
    this._saveProgress();
    const _currentUser = (typeof UserSystem !== 'undefined') ? UserSystem.getCurrentUser() : null;
    const _playerName = (_currentUser && _currentUser.playerName) ? _currentUser.playerName : 'JOGADOR';
    // Estatística de retenção: amarra a experiência vivida à teoria de
    // Sweller/Mayer/Prensky que o artigo defende. Os números são derivados
    // do score e das fases completadas para dar sensação de métrica real.
    const totalLevels = 7;
    const finishedLevels = Math.max(1, Math.min(totalLevels, (this.levelIdx || 0) + 1));
    const retention = Math.min(92, 60 + finishedLevels * 4);

    document.getElementById('victory-body').innerHTML = (
      '<p class="victory-p">' +
      'O <strong>Desengajamento</strong> foi derrotado e a <strong>Princesa Aprendizagem</strong> está livre.<br/>' +
      'Você dominou <strong>Foco, Curiosidade e Método</strong> ao lado da <strong>Raposa</strong>, ' +
      'vivendo na pele o que a <strong>B42 EdTech</strong> entrega: ' +
      '<em>aprendizagem que faz sentido</em>. Se te prendeu até aqui, <strong>{PLAYER}</strong>, a tese está provada.' +
      '</p>' +
      '<div class="retention-card">' +
        '<div class="retention-title">★ RELATÓRIO DE APRENDIZAGEM ★</div>' +
        '<div class="retention-grid">' +
          '<div class="retention-item"><span class="retention-label">FASES</span><span class="retention-value">' + finishedLevels + '/' + totalLevels + '</span></div>' +
          '<div class="retention-item"><span class="retention-label">RETENÇÃO</span><span class="retention-value">' + retention + '%</span></div>' +
          '<div class="retention-item"><span class="retention-label">SCORE</span><span class="retention-value">' + this.player.score + '</span></div>' +
        '</div>' +
        '<div class="retention-note">Sweller · Mayer · Prensky · Rojo · teoria vivida, não apenas lida.</div>' +
      '</div>' +
      '<div class="victory-ranking"><a href="ranking.html">VER RANKING ►</a></div>'
    ).replace(/\{PLAYER\}/g, _playerName);
    hideAll();
    show('ov-victory');
  }

  togglePause() {
    if (this.state === 'play') {
      this.state = 'paused';
      show('ov-pause');
      hideTouchControls();
      // Limpa inputs para evitar movimento travado ao voltar
      input.left = input.right = input.up = input.down = false;
      input.jump = input.run = input.action = false;
    } else if (this.state === 'paused') {
      this.state = 'play';
      hide('ov-pause');
      showTouchControls();
    }
  }

  toggleSound() {
    const on = AUDIO.toggle();
    const badge = document.getElementById('sound-badge');
    if (badge) {
      badge.textContent = on ? '♪ ON' : '♪ OFF';
      badge.classList.toggle('off', !on);
    }
  }

  onEnter() {
    if (this.state === 'play' && this.powerPopup) { this.dismissPowerPopup(); return; }
    if (this.state === 'dialog') this.startLevel();
    else if (this.state === 'princess') this._advancePrincessDialog();
    else if (this.state === 'menu') this.startGame();
    else if (this.state === 'complete') this.nextLevel();
    else if (this.state === 'gameover') { this.player = null; this.loadLevel(this.levelIdx); }
    else if (this.state === 'victory') this.showMenu();
    else if (this.state === 'b42ad') this._skipB42Ad();
  }

  // ---------- Update ----------
  update(dt) {
    // Cutscene do castelo roda à parte
    if (this.state === 'cutscene') { this._updateCutscene(dt); return; }
    if (this.state !== 'play') return;
    // Popup de Poder de Aprendizagem pausa toda a física/entidades.
    if (this.powerPopup) {
      this.powerPopup.t += dt;
      input.jumpPressed = false;
      input.actionPressed = false;
      return;
    }
    // Toast não-modal: avança timer e expira, sem pausar jogo
    if (this.powerToast) {
      this.powerToast.t += dt;
      if (this.powerToast.t >= this.powerToast.life) this.powerToast = null;
    }
    if (this.frozen > 0) {
      this.frozen -= dt;
      input.jumpPressed = false;
      input.actionPressed = false;
      return;
    }
    this.player.update(dt, this);
    for (const e of this.entities) if (!e.dead) e.update(dt, this);
    for (const e of this.entities) {
      if (e.dead) continue;
      // Projéteis do jogador não interagem como "contato" com o player
      if (e.type === 'pshot') continue;
      if (aabb(this.player, e)) e.onPlayerContact(this.player, this);
    }
    this.entities = this.entities.filter(e => !e.dead);
    for (const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p => !p.dead);
    // Popup de poder só fecha manualmente (Enter / tap) — ver onEnter/canvas click.
    this._updateCamera();
    this._syncHud();
    input.jumpPressed = false;
    input.actionPressed = false;
    this.cloudOffset += dt * 6;
    if (this.shake > 0) this.shake -= dt;

    // Agenda e atualiza balões de diálogo informativos (teoria viva).
    this.playTime += dt;
    if (this.speechBubble) {
      this.speechBubble.t += dt;
      if (this.speechBubble.t >= this.speechBubble.life) this.speechBubble = null;
    }
    if (!this.speechBubble && this.playTime >= this.nextSpeechAt) {
      this._spawnSpeechBubble();
      this.nextSpeechAt = this.playTime + 14 + Math.random() * 8; // 14-22s entre frases
    }
  }

  _spawnSpeechBubble() {
    const phrases = [
      // Teorias e autores
      'Texto bem feito vira quest.',
      'Menos carga cognitiva, mais foco. (Sweller)',
      'Imagem + texto = duplo canal. (Mayer)',
      'Pergunta engaja quem é nativo digital. (Prensky)',
      'Várias linguagens, uma aprendizagem. (Rojo)',
      'Paivio: palavra + figura gravam em dobro.',
      'Bloom: entender vem antes de aplicar.',
      'Vygotsky: se aprende junto, não sozinho.',
      'Piaget: o erro faz parte do caminho.',
      // Didática prática
      'Aprender é resgatar sentido, não decorar.',
      'Feedback imediato prende a atenção.',
      'Curiosidade é o primeiro poder do conhecimento.',
      'Ritmo certo derrota o Desengajamento.',
      'Humor + participação = retenção.',
      'Jornada boa se vive, não só se lê.',
      'Foco, Curiosidade e Método: tripé da B42.',
      'História + personagem = memória que gruda.',
      'Quem se diverte aprendendo volta pra aprender de novo.',
      'Progresso visível vale mais que nota.',
      'Repetir com variação > repetir igual.',
      'Aprendizado sem pergunta é passagem rápida.',
      'Quem ensina também revisa.',
      // Motivacionais
      'Respira. Foca. Próxima fase.',
      'Cada moeda é um conceito salvo.',
      'A Raposa te leva mais longe, junto.',
      'Se travou, mude a abordagem.',
      'Erro não é fim — é dica do próximo passo.',
      'Quest terminada: XP de verdade é na cabeça.',
      'Atenção é combustível; cuide dela.',
      'Um bom material te respeita.',
    ];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    this.speechBubble = { text, t: 0, life: 4.5 };
  }

  _updateCamera() {
    // Lookahead proporcional à velocidade do jogador
    const speedRatio = Math.abs(this.player.vx) / RUN_SPD;
    const look = this.player.facing * (20 + speedRatio * 30);
    const target = this.player.x - CANVAS_W / 3 + look;
    const diff = target - this.camera.x;
    this.camera.x += diff * 0.08;
    this.camera.x = clamp(this.camera.x, 0, Math.max(0, this.level.width * TILE - CANVAS_W));
    // Pixel-snap: evita sub-pixel jitter entre sprites (tremedeira).
    this.camera.x = Math.round(this.camera.x);
    this.camera.y = 0;
  }

  // ---------- Draw ----------
  draw() {
    if (this.state === 'cutscene') { this._drawCutscene(); return; }
    const ctx = this.ctx;

    this._drawBackground();
    this._drawTiles();
    this._drawWaterAnimation();
    for (const e of this.entities) e.draw(ctx, this.camera);
    if (this.player) this.player.draw(ctx, this.camera);
    for (const p of this.particles) p.draw(ctx, this.camera);
    this._drawPowerPopup();
    this._drawPowerToast();
    this._drawSpeechBubble();
    this._drawPowerHUD();
    this._drawSuperHUD();
  }

  _drawPowerToast() {
    if (!this.powerToast) return;
    const ctx = this.ctx;
    const pt = this.powerToast;
    const info = POWER_INFO[pt.kind] || POWER_INFO.focus;
    const life = pt.life;
    // Curva de opacidade: fade-in 0.2s, fade-out nos últimos 0.5s
    const fadeIn  = Math.min(1, pt.t / 0.2);
    const fadeOut = Math.min(1, (life - pt.t) / 0.5);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    // Slide sutil de cima pra baixo na entrada
    const slideY = (1 - fadeIn) * -8;

    const w = 260, h = 58;
    const x = Math.round((CANVAS_W - w) / 2);
    const y = 12 + slideY;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fundo escuro translúcido
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(26, 10, 60, 0.92)');
    grad.addColorStop(1, 'rgba(6, 3, 22, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Borda colorida do poder
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // Estrela à esquerda, alinhada verticalmente ao centro do card
    drawPowerStar(ctx, x + 20, y + h/2, pt.kind, 10, pt.t);

    // Nome do poder (linha 1)
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = info.color2 || '#fff';
    ctx.fillText('+ ' + info.name, x + 42, y + 15);

    // Frase inspiradora (linha 2) — destaque em branco
    ctx.font = '12px "VT323", monospace';
    ctx.fillStyle = '#ffffff';
    const quote = pt.quote || '';
    if (quote) ctx.fillText(quote, x + 42, y + 32);

    // Âncora teórica (linha 3) — amarelo pálido
    ctx.font = '11px "VT323", monospace';
    ctx.fillStyle = '#ffe8a0';
    ctx.fillText(info.theory || info.desc, x + 42, y + 48);

    ctx.restore();
  }

  // Balão de diálogo "estilo quest" sobre a cabeça da Brenda — pergaminho
  // dourado com cantos ornamentados, estrelinha e setinha apontando.
  _drawSpeechBubble() {
    if (!this.speechBubble || !this.player) return;
    const sb = this.speechBubble;
    const fadeIn  = Math.min(1, sb.t / 0.3);
    const fadeOut = Math.min(1, (sb.life - sb.t) / 0.6);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    if (alpha <= 0.02) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Se o texto for longo, quebra em até 3 linhas (balão menor).
    ctx.font = '10px "VT323", monospace';
    ctx.textBaseline = 'middle';
    const maxW = 150;
    const words = sb.text.split(' ');
    const lines = [];
    let cur = '';
    for (const wd of words) {
      const test = cur ? (cur + ' ' + wd) : wd;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = wd;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);

    const padX = 7, padY = 4;
    const lineH = 11;
    const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const iconW = 11; // espaço pra estrelinha à esquerda
    const w = Math.min(maxW + iconW + padX * 2, Math.ceil(textW) + iconW + padX * 2);
    const h = padY * 2 + lines.length * lineH;

    // Slide-in suave de cima
    const slide = (1 - fadeIn) * -6;

    // Ancora bem acima da cabeça, clampa nas bordas da tela.
    // O sprite da Brenda estende ~10px acima da hitbox (padding do PNG),
    // então usamos 28px de folga pra não tampar o cabelo/coroa.
    let cx = Math.round(this.player.x + this.player.w/2 - this.camera.x);
    let y  = Math.round(this.player.y - this.camera.y - h - 28) + slide;
    cx = Math.max(w/2 + 4, Math.min(CANVAS_W - w/2 - 4, cx));
    const x = Math.round(cx - w/2);
    if (y < 4) y = 4;

    // ===== Pergaminho (fundo creme com gradiente sutil) =====
    const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
    bgGrad.addColorStop(0, '#fff4d0');
    bgGrad.addColorStop(1, '#f0d98a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // Borda externa dourada grossa
    ctx.strokeStyle = '#caa23b';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    // Borda interna fina preta (contorno pixel-art)
    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);

    // ===== Cantos ornamentados (quadradinhos dourados) =====
    ctx.fillStyle = '#ffd43b';
    // 4 cantos
    const corners = [[x+2, y+2], [x+w-6, y+2], [x+2, y+h-6], [x+w-6, y+h-6]];
    for (const [cx0, cy0] of corners) {
      ctx.fillRect(cx0, cy0, 4, 4);
      ctx.fillStyle = '#fff5a1';
      ctx.fillRect(cx0, cy0, 2, 2);
      ctx.fillStyle = '#ffd43b';
    }

    // ===== Estrelinha à esquerda =====
    const starCX = x + padX;
    const starCY = y + h/2;
    const R = 4, r = R * 0.45;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI/2 + i * Math.PI/5;
      const rad = (i % 2 === 0) ? R : r;
      const sx2 = starCX + Math.cos(a) * rad;
      const sy2 = starCY + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(sx2, sy2); else ctx.lineTo(sx2, sy2);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd43b';
    ctx.fill();
    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // ===== Texto =====
    ctx.fillStyle = '#3a2a10';
    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      const ty = y + padY + lineH * (i + 0.5);
      ctx.fillText(lines[i], x + padX + iconW, ty);
    }

    // ===== Setinha apontando pra Brenda (triângulo dourado com borda) =====
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + h - 1);
    ctx.lineTo(cx + 4, y + h - 1);
    ctx.lineTo(cx, y + h + 4);
    ctx.closePath();
    ctx.fillStyle = '#f0d98a';
    ctx.fill();
    ctx.strokeStyle = '#caa23b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + h - 1);
    ctx.lineTo(cx, y + h + 4);
    ctx.lineTo(cx + 4, y + h - 1);
    ctx.stroke();

    ctx.restore();
  }

  _drawSuperHUD() {
    if (!this.player || this.player.superTime <= 0) return;
    const ctx = this.ctx;
    const t = this.player.superTime;
    const tmax = 20;
    const ratio = Math.max(0, Math.min(1, t / tmax));
    const w = 120, h = 14;
    const x = Math.round((CANVAS_W - w) / 2);
    const y = 48;
    ctx.save();
    ctx.globalAlpha = 0.55; // Mais transparente: só um lembrete discreto
    // Fundo
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
    // Preenchimento gradiente
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, '#ff8c1a');
    g.addColorStop(0.5, '#ffd43b');
    g.addColorStop(1, '#fff5a1');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w * ratio, h);
    // Texto discreto
    ctx.font = 'bold 6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const label = 'RETENÇÃO ' + Math.ceil(t) + 's';
    ctx.strokeText(label, x + w/2, y + h/2);
    ctx.fillText(label, x + w/2, y + h/2);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  _drawPowerHUD() {
    if (!this.player || !this.player.power || this.player.powerAmmo <= 0) return;
    const ctx = this.ctx;
    const p = this.player.power;
    const info = POWER_INFO[p] || POWER_INFO.focus;
    // Mini card no canto inferior esquerdo do canvas
    const x = 6, y = CANVAS_H - 36, w = 104, h = 30;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // Estrela colorida do poder
    drawPowerStar(ctx, x + 14, y + 15, p, 8, performance.now() / 500);
    // Texto
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.fillStyle = info.color;
    ctx.textAlign = 'left';
    ctx.fillText(info.short, x + 18, y + 11);
    ctx.font = '10px "VT323", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Tiros: ' + this.player.powerAmmo + '  (C)', x + 18, y + 22);
  }

  _drawPowerPopup() {
    if (!this.powerPopup) return;
    const ctx = this.ctx;
    const pp = this.powerPopup;
    const info = POWER_INFO[pp.kind] || POWER_INFO.focus;
    const alpha = Math.min(1, pp.t / 0.25);

    // Escurece o fundo do jogo pra dar contraste
    ctx.save();
    ctx.globalAlpha = 0.55 * alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.restore();

    // Layout dinâmico: largura maior, altura calculada pelo conteúdo,
    // com espaço garantido embaixo pra linha "pressione Enter".
    const w = Math.min(CANVAS_W - 20, 360);
    const padY = 18;
    const titleBandH = 18;
    const starCY_rel = 46;
    const starR = 15;
    const nameBaseline = 86;
    const descTopBaseline = 104;
    const descLineH = 14;
    const hintSpace = 22; // espaço extra no rodapé pra "pressione Enter"

    ctx.font = '13px "VT323", monospace';
    const lines = wrapText(info.desc, 40);
    // Frase inspiradora opcional (rotativa) — se existir, ocupa 1 linha extra
    const quoteLines = pp.quote ? wrapText(pp.quote, 38) : [];

    const descBlockH = lines.length * descLineH;
    const quoteBlockH = quoteLines.length ? (quoteLines.length * descLineH + 6) : 0;
    const h = Math.max(160, descTopBaseline + descBlockH + quoteBlockH + hintSpace + padY);
    const x = Math.round((CANVAS_W - w) / 2);
    const y = Math.round((CANVAS_H - h) / 2);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'alphabetic';

    // Fundo gradiente
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(26, 10, 60, 0.97)');
    grad.addColorStop(1, 'rgba(6, 3, 22, 0.97)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Halo colorido
    const halo = ctx.createRadialGradient(x + w/2, y + starCY_rel, 6, x + w/2, y + starCY_rel, 160);
    halo.addColorStop(0, info.color + '55');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x, y, w, h);

    // Borda dupla
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3.5, y + 3.5, w - 7, h - 7);

    // Faixa de título
    ctx.fillStyle = info.color;
    ctx.fillRect(x + 4, y + 4, w - 8, titleBandH);
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111';
    ctx.fillText('\u2605 PODER DE APRENDIZAGEM \u2605', x + w/2, y + 4 + titleBandH/2);

    // Estrela grande centralizada
    drawPowerStar(ctx, x + w/2, y + starCY_rel, pp.kind, starR, pp.t);

    // Nome do poder
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = info.color2 || '#fff';
    ctx.fillText(info.name, x + w/2, y + nameBaseline);

    // Descrição completa (todas as linhas, sem overflow/corte)
    ctx.font = '13px "VT323", monospace';
    ctx.fillStyle = '#ffe8a0';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + w/2, y + descTopBaseline + i * descLineH);
    }

    // Frase inspiradora rotativa — cor do próprio poder pra reforçar identidade
    if (quoteLines.length) {
      const quoteTop = descTopBaseline + descBlockH + 6;
      ctx.font = 'bold 12px "VT323", monospace';
      ctx.fillStyle = info.color2 || '#ffffff';
      for (let i = 0; i < quoteLines.length; i++) {
        ctx.fillText(quoteLines[i], x + w/2, y + quoteTop + i * descLineH);
      }
    }

    // Hint rodapé — mais pra cima pra não ser cortado por padding/border
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'middle';
    ctx.fillText('pressione Enter para continuar', x + w/2, y + h - 12);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // Fundo estilo "carrossel de Instagram" animado — para a Fase 4 (MUNDO DOS FORMATOS)
  _drawCarouselBackdrop(cx) {
    const ctx = this.ctx;
    const t = performance.now() / 1000;
    // Posts flutuantes com diferentes rótulos
    const slides = [
      { label: 'SLIDE 1', color: '#ff9c1d', icon: '★' },
      { label: 'QUADRINHOS', color: '#2ce06f', icon: '□' },
      { label: 'CHARGE', color: '#4fd6ff', icon: '◆' },
      { label: 'SLIDE 2', color: '#b3ff3a', icon: '●' },
      { label: 'INFOGRÁFICO', color: '#a273f5', icon: '▲' },
      { label: 'REELS', color: '#ffd43b', icon: '▶' },
    ];
    // parallax leve
    const offX = (t * 20 + cx * 0.3) % (CANVAS_W + 160);
    for (let i = 0; i < 8; i++) {
      const s = slides[i % slides.length];
      const baseX = (i * 110 - offX) % (CANVAS_W + 160);
      const x = ((baseX % (CANVAS_W + 160)) + (CANVAS_W + 160)) % (CANVAS_W + 160) - 80;
      const y = 30 + (i % 3) * 30 + Math.sin(t * 1.3 + i) * 5;
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(x + 2, y + 2, 56, 56);
      // moldura
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 56, 56);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, 54, 54);
      // conteúdo do post
      ctx.fillStyle = s.color;
      ctx.fillRect(x + 4, y + 4, 48, 34);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px "VT323", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(s.icon, x + 28, y + 26);
      // label
      ctx.fillStyle = '#333';
      ctx.font = 'bold 6px "Press Start 2P", monospace';
      ctx.fillText(s.label, x + 28, y + 50);
    }
    // Indicadores (bolinhas) no topo simulando carrossel
    const dotsY = 10;
    const dotsStart = CANVAS_W / 2 - 26;
    for (let i = 0; i < 5; i++) {
      const active = Math.floor(t / 1.2) % 5 === i;
      ctx.fillStyle = active ? '#fff' : 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(dotsStart + i * 14, dotsY, active ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sol / lua / estrelas / chuva conforme o período do dia.
  _drawSkyDisc(tod, camX) {
    const ctx = this.ctx;
    // Parallax ultra lento (disco quase fixo no céu)
    const dx = (CANVAS_W - 80) - (camX * 0.1) % CANVAS_W;
    const cx = Math.round(dx);
    const cy = 44;
    if (tod === 'day') {
      // Sol amarelo
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
      g.addColorStop(0, 'rgba(255,255,220,1)');
      g.addColorStop(0.5, 'rgba(255,225,120,0.85)');
      g.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff8a0';
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill();
    } else if (tod === 'sunset') {
      // Sol laranja baixo
      const g = ctx.createRadialGradient(cx, cy + 20, 4, cx, cy + 20, 40);
      g.addColorStop(0, 'rgba(255,200,100,1)');
      g.addColorStop(0.5, 'rgba(255,130,60,0.8)');
      g.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy + 20, 40, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffaa33';
      ctx.beginPath(); ctx.arc(cx, cy + 20, 14, 0, Math.PI*2); ctx.fill();
    } else if (tod === 'dawn') {
      // Sol nascente com tons pêssego
      const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, 32);
      g.addColorStop(0, '#fff0c0');
      g.addColorStop(0.5, 'rgba(255,150,180,0.6)');
      g.addColorStop(1, 'rgba(255,120,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff5d6';
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI*2); ctx.fill();
    } else if (tod === 'storm') {
      // Relâmpagos aleatórios + chuva
      const t = performance.now() / 1000;
      const flash = Math.sin(t * 0.8) > 0.92 ? 0.4 : 0;
      if (flash > 0) {
        ctx.fillStyle = 'rgba(255,255,255,' + flash + ')';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      // Chuva diagonal
      ctx.strokeStyle = 'rgba(180,200,230,0.55)';
      ctx.lineWidth = 1;
      const rt = performance.now() / 30;
      for (let i = 0; i < 60; i++) {
        const rx = (i * 37 - rt * 5) % (CANVAS_W + 20);
        const ry = (i * 53 + rt) % CANVAS_H;
        const x = ((rx % (CANVAS_W + 20)) + (CANVAS_W + 20)) % (CANVAS_W + 20) - 10;
        ctx.beginPath();
        ctx.moveTo(x, ry);
        ctx.lineTo(x - 3, ry + 6);
        ctx.stroke();
      }
    } else if (tod === 'dusk') {
      // Lua crescente
      ctx.fillStyle = '#ffe8a0';
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#0e0830';
      ctx.beginPath(); ctx.arc(cx + 5, cy - 3, 13, 0, Math.PI*2); ctx.fill();
    } else if (tod === 'night') {
      // Lua cheia + estrelas cintilantes
      const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, 26);
      g.addColorStop(0, '#fffde0');
      g.addColorStop(0.6, 'rgba(230,230,200,0.4)');
      g.addColorStop(1, 'rgba(230,230,200,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.fill();
      // Estrelas
      const tw = Math.sin(performance.now() / 300);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 97) % CANVAS_W);
        const sy = ((i * 41) % 140);
        const s = (i % 5 === 0 && tw > 0.5) ? 2 : 1;
        ctx.fillRect(sx, sy, s, s);
      }
    } else if (tod === 'bloodmoon') {
      // Lua vermelha sangrenta
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 40);
      g.addColorStop(0, '#ff3838');
      g.addColorStop(0.5, 'rgba(180,10,30,0.65)');
      g.addColorStop(1, 'rgba(100,0,10,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c40000';
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8b0000';
      ctx.beginPath(); ctx.arc(cx + 3, cy - 2, 5, 0, Math.PI*2); ctx.fill();
      // Estrelas vermelhas
      ctx.fillStyle = '#ff5050';
      for (let i = 0; i < 20; i++) {
        const sx = ((i * 71) % CANVAS_W);
        const sy = ((i * 31) % 120);
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  }

  // Tile de água com profundidade: cada linha do tile tem cor levemente mais
  // escura, dando sensação de rio sem criar gradientes per-tile (que podem
  // gerar artefatos visuais em HiDPI). Animação contínua fica no pass separado.
  _drawWaterTile(sx, sy, tx, ty) {
    const ctx = this.ctx;
    const lv = this.level;
    // Descobre profundidade: quantas linhas de água tem acima deste tile.
    let depth = 0;
    for (let r = ty - 1; r >= 0; r--) {
      if (lv.getTile(tx, r) === T.WATER) depth++;
      else break;
    }
    const isSurface = (depth === 0);
    // Cor base em função da profundidade (clamp 0..8 tiles)
    const d = Math.min(depth, 8);
    // Azul escurecendo com profundidade
    const r = Math.round(64 - d * 5);
    const gCh = Math.round(150 - d * 10);
    const b = Math.round(220 - d * 10);
    ctx.fillStyle = `rgb(${Math.max(r,14)}, ${Math.max(gCh,55)}, ${Math.max(b,130)})`;
    ctx.fillRect(sx, sy, TILE, TILE);
    // Pequena sombra no topo do tile (exceto superfície) pra dar "peso" entre linhas
    if (!isSurface) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fillRect(sx, sy, TILE, 1);
    }
  }

  // Pass animado: desenha ondulações fluidas na superfície de cada região
  // contígua de água. Roda UMA VEZ por frame, sem sobreposição por-tile.
  _drawWaterAnimation() {
    const ctx = this.ctx;
    const lv = this.level;
    if (!lv) return;
    const camX = this.camera.x;
    const now = performance.now() / 350;
    const startX = Math.max(0, Math.floor(camX / TILE) - 1);
    const endX = Math.min(lv.width - 1, Math.ceil((camX + CANVAS_W) / TILE) + 1);
    // PASS 1: cobertura sólida. Antes de desenhar as ondas, pinta cada tile
    // de água com uma cor sólida por cima do que já foi renderizado. Isso
    // elimina qualquer "vazamento" visual (pipe tiles, coins, etc.) dentro
    // da água.
    for (let y = 0; y < lv.height; y++) {
      for (let x = startX; x <= endX; x++) {
        if (lv.getTile(x, y) !== T.WATER) continue;
        const sx = x * TILE - camX;
        const sy = y * TILE;
        // Profundidade = quantos tiles de água acima
        let depth = 0;
        for (let r = y - 1; r >= 0; r--) {
          if (lv.getTile(x, r) === T.WATER) depth++;
          else break;
        }
        const d = Math.min(depth, 8);
        const rC = Math.max(64 - d * 5, 14);
        const gC = Math.max(150 - d * 10, 55);
        const bC = Math.max(220 - d * 10, 130);
        ctx.fillStyle = `rgb(${rC}, ${gC}, ${bC})`;
        ctx.fillRect(Math.round(sx), sy, TILE, TILE);
      }
    }
    // PASS 2: identifica spans horizontais de superfície pra ondas animadas.
    const surfaces = {}; // key: row -> array de spans [fromX, toX]
    for (let y = 0; y < lv.height; y++) {
      let span = null;
      for (let x = startX; x <= endX + 1; x++) {
        const t = lv.getTile(x, y);
        const above = lv.getTile(x, y - 1);
        const isSurfaceTile = (t === T.WATER && above !== T.WATER);
        if (isSurfaceTile) {
          if (!span) span = { fromX: x, toX: x };
          else span.toX = x;
        } else if (span) {
          if (!surfaces[y]) surfaces[y] = [];
          surfaces[y].push(span);
          span = null;
        }
      }
      if (span) {
        if (!surfaces[y]) surfaces[y] = [];
        surfaces[y].push(span);
      }
    }
    // Renderiza cada span com 2 ondas senoidais sobrepostas (claro + brilho)
    for (const yStr in surfaces) {
      const y = parseInt(yStr, 10);
      for (const span of surfaces[y]) {
        const fromPX = Math.round(span.fromX * TILE - camX);
        const toPX = Math.round((span.toX + 1) * TILE - camX);
        const baseY = y * TILE;
        // Onda 1: linha branca ondulando (mais visível)
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let px = fromPX; px <= toPX; px++) {
          const worldX = px + camX;
          const wy = baseY + 1 + Math.sin(worldX * 0.18 + now * 2.5) * 1.1;
          if (px === fromPX) ctx.moveTo(px, wy);
          else ctx.lineTo(px, wy);
        }
        ctx.stroke();
        // Onda 2: brilho secundário azul claro (menor amplitude)
        ctx.strokeStyle = 'rgba(180,220,255,0.45)';
        ctx.beginPath();
        for (let px = fromPX; px <= toPX; px++) {
          const worldX = px + camX;
          const wy = baseY + 4 + Math.sin(worldX * 0.22 + now * 1.8 + 1.3) * 0.9;
          if (px === fromPX) ctx.moveTo(px, wy);
          else ctx.lineTo(px, wy);
        }
        ctx.stroke();
        // Onda 3: reflexo bem sutil mais profundo
        ctx.strokeStyle = 'rgba(200,230,255,0.22)';
        ctx.beginPath();
        for (let px = fromPX; px <= toPX; px++) {
          const worldX = px + camX;
          const wy = baseY + 8 + Math.sin(worldX * 0.14 - now * 1.2) * 0.7;
          if (px === fromPX) ctx.moveTo(px, wy);
          else ctx.lineTo(px, wy);
        }
        ctx.stroke();
      }
    }
  }
  _drawWaterInPits(camX) {
    const ctx = this.ctx;
    const lv = this.level;
    if (!lv) return;
    // Encontra a linha de chão: primeiro tile sólido de baixo pra cima em qualquer coluna.
    let groundRow = -1;
    for (let r = lv.height - 1; r >= 0; r--) {
      for (let c = 0; c < lv.width; c++) {
        if (isSolidTile(lv.getTile(c, r))) { groundRow = r; break; }
      }
      if (groundRow >= 0) break;
    }
    // Sobe até achar a linha "topo do chão" (primeiro sólido consecutivo de baixo).
    while (groundRow > 0) {
      let allSolid = false;
      for (let c = 0; c < lv.width; c++) {
        if (isSolidTile(lv.getTile(c, groundRow - 1))) { allSolid = true; break; }
      }
      if (!allSolid) break;
      groundRow--;
    }
    if (groundRow < 0) return;
    const startX = Math.max(0, Math.floor(camX / TILE) - 1);
    const endX = Math.min(lv.width - 1, Math.ceil((camX + CANVAS_W) / TILE) + 1);
    const surfaceY = groundRow * TILE; // topo da água = topo do chão
    let pitStart = -1;
    const pits = [];
    for (let tx = startX; tx <= endX + 1; tx++) {
      const t = lv.getTile(tx, groundRow);
      // Canos dentro de área aquática devem ser cobertos pela água: tratamos
      // PIPE_TL/TR/BL/BR como "não sólido" pro preenchimento quando há um
      // tile WATER adjacente (horizontal ou vertical). Isso evita o retângulo
      // branco que aparece onde o cano fica dentro da piscina.
      const isPipe = (t === T.PIPE_TL || t === T.PIPE_TR || t === T.PIPE_BL || t === T.PIPE_BR);
      const pipeTouchesWater = isPipe && (
        lv.getTile(tx - 1, groundRow) === T.WATER ||
        lv.getTile(tx + 1, groundRow) === T.WATER ||
        lv.getTile(tx, groundRow - 1) === T.WATER ||
        lv.getTile(tx, groundRow + 1) === T.WATER
      );
      const isAir = !isSolidTile(t) || pipeTouchesWater;
      if (isAir) {
        if (pitStart < 0) pitStart = tx;
      } else {
        if (pitStart >= 0) { pits.push({ from: pitStart, to: tx - 1 }); pitStart = -1; }
      }
    }
    if (pitStart >= 0) pits.push({ from: pitStart, to: endX });
    const time = performance.now() / 400;
    for (const pit of pits) {
      const px = Math.round(pit.from * TILE - camX);
      const pw = (pit.to - pit.from + 1) * TILE;

      // Encontra o topo REAL da água neste pit (primeiro T.WATER de cima pra baixo
      // na coluna inicial). Se não houver, usa o groundRow calculado como fallback.
      let realSurfaceRow = groundRow;
      for (let r = 0; r < lv.height; r++) {
        if (lv.getTile(pit.from, r) === T.WATER) { realSurfaceRow = r; break; }
      }
      const realSurfaceY = realSurfaceRow * TILE;
      const waterH = CANVAS_H - realSurfaceY;

      const g = ctx.createLinearGradient(0, realSurfaceY, 0, realSurfaceY + waterH);
      g.addColorStop(0, 'rgba(64, 150, 220, 0.8)');
      g.addColorStop(1, 'rgba(12, 40, 100, 0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(px, realSurfaceY, pw, waterH);
      // Ondinhas brancas animadas na superfície
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < pw; i += 6) {
        const wy = realSurfaceY + Math.sin((px + i) * 0.15 + time) * 1.2;
        ctx.fillRect(px + i, Math.round(wy), 3, 1);
      }
      ctx.fillStyle = 'rgba(200, 230, 255, 0.45)';
      for (let i = 3; i < pw; i += 8) {
        const wy = realSurfaceY + 4 + Math.sin((px + i) * 0.2 + time * 1.5) * 1.2;
        ctx.fillRect(px + i, Math.round(wy), 2, 1);
      }
      // Reflexo no topo
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px, realSurfaceY, pw, 1);
    }
  }

  // Árvore clássica Mario: tronco marrom reto, copa em "pirâmide de degraus"
  // verde escuro/claro com highlights. Blocos quadrados, pixel art.
  // Pinheiro estilo aventura 2D: tronco reto marrom + copa cônica de camadas
  // triangulares verde escuro, com highlight do lado esquerdo.
  _drawTree(ctx, x, baseY, big) {
    const tx = Math.round(x);
    const ty = Math.round(baseY);
    const u = big ? 3 : 2; // unidade menor = árvore mais fina e alta
    const trunkW = u * 2;
    const trunkH = u * 2;
    const baseW = u * 10; // largura da camada mais baixa
    const layers = big ? 5 : 4;
    const cx = tx + baseW / 2;
    // Tronco marrom curto embaixo
    const trunkX = Math.round(cx - trunkW / 2);
    const trunkY = ty - trunkH;
    ctx.fillStyle = '#5b3a1a';
    ctx.fillRect(trunkX, trunkY, trunkW, trunkH);
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(trunkX, trunkY, 1, trunkH);
    ctx.fillStyle = '#8b5c33';
    ctx.fillRect(trunkX + trunkW - 1, trunkY, 1, trunkH);

    // Copa cônica: camadas triangulares empilhadas, cada uma + estreita
    // Camada i: largura = baseW - i*2u, altura = u*2, centrada horizontalmente
    for (let i = 0; i < layers; i++) {
      const lw = baseW - i * u * 2;
      const lh = u * 2 + (i === layers - 1 ? u : 0); // topo um pouco mais alto
      const lx = Math.round(cx - lw / 2);
      const ly = trunkY - (i + 1) * u * 2 - (i === layers - 1 ? u : 0);
      // Sombra escura na base da camada (embaixo)
      ctx.fillStyle = '#044a04';
      ctx.fillRect(lx, ly + lh - u, lw, u);
      // Corpo verde escuro
      ctx.fillStyle = '#0a6e14';
      ctx.fillRect(lx, ly, lw, lh - u);
      // Highlight verde médio (metade esquerda)
      ctx.fillStyle = '#1a9a1a';
      ctx.fillRect(lx + 1, ly + 1, Math.floor(lw / 2) - 1, Math.max(1, Math.floor(lh / 2) - 1));
      // Destaque bem claro pontinho no topo-esquerdo
      ctx.fillStyle = '#2cd82c';
      ctx.fillRect(lx + 1, ly + 1, u, u);
      // Contorno preto
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx + 0.5, ly + 0.5, lw - 1, lh - 1);
    }
    // Ponta do topo: triângulo pequeno em forma de agulha
    const topY = trunkY - layers * u * 2 - u * 2;
    ctx.fillStyle = '#0a6e14';
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx + u, topY + u * 2);
    ctx.lineTo(cx - u, topY + u * 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  _drawBackground() {
    const ctx = this.ctx;
    const bg = this.level ? this.level.bg : 'sky';
    const tod = (this.level && this.level.timeOfDay) || (bg === 'castle' ? 'night' : 'day');
    let grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    switch (tod) {
      case 'day':
        grad.addColorStop(0, '#5c94fc');
        grad.addColorStop(0.7, '#88b8ff');
        grad.addColorStop(1, '#c8e0ff');
        break;
      case 'sunset':
        grad.addColorStop(0, '#ff6b6b');
        grad.addColorStop(0.4, '#ffa65a');
        grad.addColorStop(0.8, '#ffd9a5');
        grad.addColorStop(1, '#ffe8c2');
        break;
      case 'dawn':
        grad.addColorStop(0, '#8b5fbf');
        grad.addColorStop(0.4, '#ff9ed2');
        grad.addColorStop(0.8, '#ffd6a5');
        grad.addColorStop(1, '#fff2c0');
        break;
      case 'storm':
        grad.addColorStop(0, '#323844');
        grad.addColorStop(0.6, '#4c556a');
        grad.addColorStop(1, '#6f7c94');
        break;
      case 'dusk':
        grad.addColorStop(0, '#0e0830');
        grad.addColorStop(0.5, '#2a1454');
        grad.addColorStop(1, '#6a2dbf');
        break;
      case 'night':
        grad.addColorStop(0, '#02010a');
        grad.addColorStop(0.6, '#0d0a2a');
        grad.addColorStop(1, '#1a1040');
        break;
      case 'bloodmoon':
        grad.addColorStop(0, '#0a0005');
        grad.addColorStop(0.55, '#3a0612');
        grad.addColorStop(1, '#7a0a22');
        break;
      default:
        if (bg === 'castle') {
          grad.addColorStop(0, '#1a0a2e');
          grad.addColorStop(0.6, '#2a1454');
          grad.addColorStop(1, '#5b2d91');
        } else {
          grad.addColorStop(0, '#5c94fc');
          grad.addColorStop(0.7, '#88b8ff');
          grad.addColorStop(1, '#c8e0ff');
        }
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!this.level) return;
    const cx = this.camera.x;

    // Disco (sol/lua) e efeitos atmosféricos por período
    this._drawSkyDisc(tod, cx);

    if (bg === 'sky') {
      // Mountains (parallax lento)
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(((i * 200 - cx * 0.22) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200)) - 50;
        ctx.drawImage(SPR.bgMountain, x, 128);
      }
      // Nuvens (várias fileiras)
      for (let i = 0; i < 9; i++) {
        const base = i * 140 + 30 - cx * 0.35 - this.cloudOffset;
        const x = Math.floor(((base) % (CANVAS_W + 250) + CANVAS_W + 250) % (CANVAS_W + 250)) - 50;
        const y = 12 + (i % 3) * 24;
        ctx.drawImage(SPR.bgCloud, x, y);
      }
      // Hills (parallax médio)
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(((i * 260 - cx * 0.55) % (CANVAS_W + 320) + CANVAS_W + 320) % (CANVAS_W + 320)) - 60;
        ctx.drawImage(SPR.bgHill, x, 168);
      }
      // Árvores (desenhadas procedurmente): mais denso e com variação
      for (let i = 0; i < 14; i++) {
        const x = Math.floor(((i * 92 + 40 - cx * 0.7) % (CANVAS_W + 180) + CANVAS_W + 180) % (CANVAS_W + 180)) - 40;
        const big = (i % 3) !== 0;
        this._drawTree(ctx, x, 198, big);
      }
      // Arbustos próximos (parallax rápido)
      for (let i = 0; i < 11; i++) {
        const x = Math.floor(((i * 150 + 20 - cx * 0.9) % (CANVAS_W + 200) + CANVAS_W + 200) % (CANVAS_W + 200)) - 30;
        ctx.drawImage(i % 2 ? SPR.bgBushSm : SPR.bgBush, x, 210);
      }
    } else if (bg === 'castle') {
      // Star field parallax
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 30; i++) {
        const sx = (i * 97 - cx * 0.15) % (CANVAS_W + 40);
        const sy = (i * 53) % CANVAS_H;
        const x = Math.floor(((sx) + CANVAS_W + 40) % (CANVAS_W + 40)) - 20;
        if (sy < 180) ctx.fillRect(x, sy, 2, 2);
      }
      // Large castle in background
      const cXpos = Math.round(CANVAS_W / 2 - 170 - cx * 0.25);
      ctx.drawImage(SPR.bgCastle, cXpos, 10);
    }
  }

  _drawTiles() {
    const ctx = this.ctx;
    const lv = this.level;
    if (!lv) return;
    const startX = Math.max(0, Math.floor(this.camera.x / TILE));
    const endX = Math.min(lv.width - 1, Math.ceil((this.camera.x + CANVAS_W) / TILE));
    for (let y = 0; y < lv.height; y++) {
      for (let x = startX; x <= endX; x++) {
        const t = lv.tiles[y][x];
        if (t === T.EMPTY) continue;
        const sx = Math.round(x * TILE - this.camera.x);
        const sy = Math.round(y * TILE - this.camera.y);
        let spr = null;
        switch (t) {
          case T.GROUND:   spr = SPR.ground; break;
          case T.DIRT:     spr = SPR.dirt; break;
          case T.BRICK:    spr = SPR.brick; break;
          case T.QCOIN:
          case T.QMUSH:
          case T.QFOCUS:
          case T.QCURIO: {
            // Animação "brilhando" dos blocos ? (4 frames)
            const frames = SPR.qblockFrames;
            if (frames && frames.length) {
              const idx = Math.floor(performance.now() / 180) % frames.length;
              spr = frames[idx];
            } else {
              spr = SPR.qblock;
            }
            break;
          }
          case T.QEMPTY:   spr = SPR.qempty; break;
          case T.PIPE_TL:
            if (!isTileSubmerged(lv, x, y)) spr = SPR.pipeTopL;
            break;
          case T.PIPE_TR:
            if (!isTileSubmerged(lv, x, y)) spr = SPR.pipeTopR;
            break;
          case T.PIPE_BL:
            if (!isTileSubmerged(lv, x, y)) spr = SPR.pipeBodyL;
            break;
          case T.PIPE_BR:
            if (!isTileSubmerged(lv, x, y)) spr = SPR.pipeBodyR;
            break;
          case T.PLATFORM: spr = SPR.platform; break;
          case T.SPIKE:    spr = SPR.spike; break;
          case T.WATER:
            // Desenha água animada direto (não via sprite).
            this._drawWaterTile(sx, sy, x, y);
            break;
        }
        if (spr) ctx.drawImage(spr, sx, sy);
      }
    }
  }

  _syncHud() {
    if (!this.player) return;
    document.getElementById('hud-score').textContent = String(this.player.score).padStart(6, '0');
    document.getElementById('hud-coins').textContent = '× ' + String(this.player.coins).padStart(2, '0');
    document.getElementById('hud-world').textContent = LEVELS[this.levelIdx].id;

    // Atualiza corações de vida (visual)
    const heartsEl = document.getElementById('hud-hearts');
    if (heartsEl) {
      const lives = Math.max(0, Math.min(3, this.player.lives));
      const hearts = heartsEl.querySelectorAll('.heart');
      hearts.forEach((h, i) => {
        h.classList.toggle('lost', i >= lives);
      });
    }

    let pwr = '';
    if (this.player.power === 'focus') pwr = 'FOCO ×' + this.player.powerAmmo;
    else if (this.player.power === 'curiosity') pwr = 'CURIO ×' + this.player.powerAmmo;
    else if (this.player.power === 'method') pwr = 'MÉTODO ×' + this.player.powerAmmo;
    else if (this.player.state === 'big') pwr = 'IDEIA';
    document.getElementById('hud-power').textContent = pwr;

    const energy = clamp(this.player.lives / 3, 0, 1);
    document.getElementById('hud-energy-fill').style.width = (energy * 100) + '%';
  }

  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 1/30);
    this.lastTime = now;
    if (this.state === 'play' || this.state === 'cutscene') this.update(dt);
    this.draw();
    requestAnimationFrame(this.loop.bind(this));
  }
}

// ============================================================
// UI HELPERS
// ============================================================
function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}
function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}
function hideAll() {
  ['ov-menu','ov-select','ov-controls','ov-dialog','ov-princess','ov-pause','ov-gameover','ov-complete','ov-victory','ov-login','ov-register','ov-b42ad','ov-admin','ov-terms','ov-lgpd']
    .forEach(hide);
}

function buildLevelGrid() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    if (lv.isBonus || lv.isMinigame || lv.isFinalCastle) return; // fases especiais escondidas
    const card = document.createElement('div');
    const unlocked = i < game.save.unlocked;
    const completed = i < game.save.unlocked - 1;
    card.className = 'level-card' +
      (unlocked ? '' : ' locked') +
      (completed ? ' completed' : '');
    card.innerHTML = `
      <div class="level-num">${lv.id}</div>
      <div class="level-name">${lv.name}</div>
    `;
    if (unlocked) {
      card.addEventListener('click', () => {
        AUDIO.click();
        AUDIO.init();
        game.player = null;
        game.loadLevel(i);
      });
    }
    grid.appendChild(card);
  });
}

// ============================================================
// BOOT
// ============================================================
let game;

function boot() {
  bakeAllSprites();
  const canvas = document.getElementById('game');
  canvas.addEventListener('click', () => {
    canvas.focus();
    // Tap no canvas fecha popup de poder (mobile)
    if (game && game.state === 'play' && game.powerPopup) game.dismissPowerPopup();
  });

  // Inicializa controles de toque (só liga listeners; visibilidade é por estado)
  initTouchControls();

  // Desbloqueio robusto de áudio: qualquer interação (tecla/clique/toque)
  // garante que o AudioContext saia de "suspended" em todos os browsers.
  // Em mobile, a música só começa de fato após esse primeiro gesto — aqui
  // a gente re-dispara a track atual caso alguma tenha sido agendada antes.
  const audioUnlock = () => {
    AUDIO.init();
    // Se já tinha uma música agendada (ex.: loadLevel rodou antes do toque),
    // re-inicia pra que ela comece a tocar agora que o contexto está ativo.
    if (AUDIO._lastTrack && (!AUDIO.musicTimer && (!AUDIO.musicNodes || !AUDIO.musicNodes.length))) {
      AUDIO.startMusic(AUDIO._lastTrack);
    }
  };
  document.addEventListener('touchstart', audioUnlock, { once: true, passive: true });
  document.addEventListener('pointerdown', audioUnlock, { once: true });
  document.addEventListener('mousedown',  audioUnlock, { once: true });
  document.addEventListener('keydown',    audioUnlock, { once: true });

  game = new Game(canvas);

  // ============================================================
  // AUTH — Login / Cadastro
  // ============================================================
  function updateUserBadge() {
    const badge = document.getElementById('user-badge');
    const nameSpan = document.getElementById('user-badge-name');
    if (!badge) return;
    const user = UserSystem.getCurrentUser();
    if (user) {
      nameSpan.textContent = user.playerName.toUpperCase();
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
    // Botões "admin-only" só aparecem se o usuário logado for admin.
    const isAdmin = UserSystem.isCurrentUserAdmin && UserSystem.isCurrentUserAdmin();
    document.querySelectorAll('.admin-only').forEach(el => {
      el.classList.toggle('hidden', !isAdmin);
    });
  }

  function showAuthOrMenu() {
    hideAll();
    if (UserSystem.isLoggedIn()) {
      updateUserBadge();
      show('ov-menu');
    } else {
      show('ov-login');
    }
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('login-name').value;
      const pass = document.getElementById('login-pass').value;
      const errEl = document.getElementById('login-error');
      const result = UserSystem.login(name, pass);
      if (result.ok) {
        errEl.classList.add('hidden');
        AUDIO.init();
        AUDIO.click();
        updateUserBadge();
        hideAll();
        show('ov-menu');
      } else {
        errEl.textContent = result.error;
        errEl.classList.remove('hidden');
      }
    });
  }

  // Register form
  const regForm = document.getElementById('register-form');
  if (regForm) {
    // Verificação em tempo real do nome de jogador
    const regName = document.getElementById('reg-name');
    const nameStatus = document.getElementById('reg-name-status');
    if (regName) {
      regName.addEventListener('input', () => {
        const val = regName.value.trim();
        if (val.length < 3) {
          nameStatus.textContent = '';
          nameStatus.className = 'form-hint';
          regName.classList.remove('valid', 'invalid');
        } else if (UserSystem.playerNameExists(val)) {
          nameStatus.textContent = '✕ Nome ja em uso';
          nameStatus.className = 'form-hint taken';
          regName.classList.remove('valid');
          regName.classList.add('invalid');
        } else {
          nameStatus.textContent = '✓ Nome disponivel';
          nameStatus.className = 'form-hint available';
          regName.classList.remove('invalid');
          regName.classList.add('valid');
        }
      });
    }

    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const phone = (document.getElementById('reg-phone') || {}).value || '';
      const pass = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;
      const acceptedTerms = !!(document.getElementById('reg-consent-terms') || {}).checked;
      const acceptedLGPD  = !!(document.getElementById('reg-consent-lgpd')  || {}).checked;
      const errEl = document.getElementById('reg-error');

      const errors = UserSystem.validateRegistration(name, email, pass, pass2, {
        phone, acceptedTerms, acceptedLGPD,
      });
      if (errors.length > 0) {
        errEl.innerHTML = errors.join('<br>');
        errEl.classList.remove('hidden');
        return;
      }

      UserSystem.registerUser(name, email, pass, {
        phone, acceptedTerms, acceptedLGPD,
      });
      UserSystem.login(name, pass);
      AUDIO.init();
      AUDIO.click();
      errEl.classList.add('hidden');
      updateUserBadge();
      hideAll();
      show('ov-menu');
    });
  }

  // Mostrar login ou menu na inicialização
  showAuthOrMenu();

  // Wire menu buttons
  document.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      AUDIO.init();
      AUDIO.click();
      switch (act) {
        case 'start':
          game.startGame();
          break;
        case 'select':
          hideAll(); show('ov-select'); buildLevelGrid();
          break;
        case 'controls':
          hideAll(); show('ov-controls');
          break;
        case 'reset':
          if (confirm('Resetar todo o progresso salvo?')) {
            game.resetSave();
            buildLevelGrid();
          }
          break;
        case 'back':
          hideAll(); show('ov-menu'); updateUserBadge();
          break;
        case 'show-register':
          hideAll(); show('ov-register');
          break;
        case 'show-login':
          hideAll(); show('ov-login');
          break;
        case 'guest':
          hideAll(); show('ov-menu'); updateUserBadge();
          break;
        case 'logout':
          UserSystem.logout();
          updateUserBadge();
          hideAll(); show('ov-login');
          break;
        case 'resume':
          game.togglePause();
          break;
        case 'restart':
          hide('ov-pause');
          game.loadLevel(game.levelIdx);
          break;
        case 'menu':
          game.showMenu();
          break;
        case 'b42ad-skip':
          if (game && game._skipB42Ad) game._skipB42Ad();
          break;
        case 'retry':
          game.player = null;
          game.loadLevel(game.levelIdx);
          break;
        case 'next':
          game.nextLevel();
          break;
        case 'show-terms':
          show('ov-terms');
          break;
        case 'show-lgpd':
          show('ov-lgpd');
          break;
        case 'close-modal':
          hide('ov-terms'); hide('ov-lgpd');
          break;
        case 'admin':
          if (!UserSystem.isCurrentUserAdmin()) {
            alert('Apenas administradores podem acessar este painel.');
            return;
          }
          hideAll(); show('ov-admin');
          renderAdminPanel();
          break;
        case 'admin-refresh':
          renderAdminPanel();
          break;
      }
    });
  });

  // ============================================================
  // Painel Admin — render + ações (delete)
  // ============================================================
  async function renderAdminPanel() {
    const tbody = document.getElementById('admin-tbody');
    const totalEl = document.getElementById('admin-total');
    const sourceEl = document.getElementById('admin-source');
    const updatedEl = document.getElementById('admin-updated');
    const search = (document.getElementById('admin-search') || {}).value || '';
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:14px;">Carregando...</td></tr>';
    let result;
    try {
      result = await UserSystem.adminListAllUsers();
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ff5050;padding:14px;">Erro: ' + (e && e.message || e) + '</td></tr>';
      return;
    }
    const items = (result.items || []).filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (u.playerName || '').toLowerCase().includes(q)
          || (u.email || '').toLowerCase().includes(q)
          || (u.phone || '').toLowerCase().includes(q);
    });
    totalEl.textContent = items.length;
    sourceEl.textContent = result.source === 'supabase' ? 'NUVEM' : 'LOCAL';
    updatedEl.textContent = new Date().toLocaleTimeString('pt-BR');

    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;padding:14px;">Nenhum jogador encontrado.</td></tr>';
      return;
    }

    tbody.innerHTML = items.map((u, i) => {
      const tag = u.isAdmin ? '<span class="admin-tag">ADMIN</span>' : '';
      const consentMark = u.acceptedLGPD ? '✓' : '—';
      const phone = u.phone ? _formatPhoneBR(u.phone) : '—';
      return `
        <tr data-pname="${_escHtml(u.playerName)}">
          <td>${i + 1}</td>
          <td><strong>${_escHtml(u.playerName)}</strong> ${tag}<br/><span class="admin-meta">${consentMark} LGPD</span></td>
          <td>${_escHtml(u.email || '—')}</td>
          <td>${phone}</td>
          <td>${u.levelsCompleted}/5</td>
          <td>${u.bestScore}</td>
          <td>
            <button class="admin-btn-del" data-pname="${_escHtml(u.playerName)}" title="Excluir jogador">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.admin-btn-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pname = btn.getAttribute('data-pname');
        if (!confirm('Excluir definitivamente o jogador "' + pname + '"? Esta ação é IRREVERSÍVEL.')) return;
        btn.disabled = true;
        const r = await UserSystem.adminDeleteUser(pname);
        if (r.ok) {
          renderAdminPanel();
        } else {
          alert('Erro ao excluir: ' + (r.error || 'desconhecido'));
          btn.disabled = false;
        }
      });
    });
  }

  // Filtro em tempo real do admin search
  const adminSearch = document.getElementById('admin-search');
  if (adminSearch) {
    let _t = null;
    adminSearch.addEventListener('input', () => {
      clearTimeout(_t);
      _t = setTimeout(renderAdminPanel, 200);
    });
  }

  function _escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _formatPhoneBR(digits) {
    const d = String(digits || '').replace(/\D/g, '');
    if (d.length === 11) return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
    return d;
  }

  // Sound badge click (desktop)
  const sb = document.getElementById('sound-badge');
  if (sb) sb.addEventListener('click', () => game.toggleSound());

  // Sound toggle button (mobile touch)
  const tcSnd = document.getElementById('tc-sound-btn');
  if (tcSnd) {
    tcSnd.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      AUDIO.init();
      const on = AUDIO.toggle();
      tcSnd.textContent = on ? '♪' : '✕';
      tcSnd.classList.toggle('off', !on);
      // Sync desktop badge too
      if (sb) {
        sb.textContent = on ? '♪ ON' : '♪ OFF';
        sb.classList.toggle('off', !on);
      }
    });
  }

  // Mobile: toque no diálogo narrativo avança a fase (equivalente a Enter)
  const ovDialog = document.getElementById('ov-dialog');
  if (ovDialog) {
    ovDialog.addEventListener('click', (e) => {
      if (game && game.state === 'dialog') {
        AUDIO.init();
        AUDIO.click();
        game.startLevel();
      }
    });
  }

  // Diálogo da Princesa — clique/tap avança uma linha; na última abre vitória.
  const ovPrincess = document.getElementById('ov-princess');
  if (ovPrincess) {
    ovPrincess.addEventListener('click', () => {
      if (game && game.state === 'princess') {
        AUDIO.init();
        AUDIO.click();
        game._advancePrincessDialog();
      }
    });
  }

  canvas.focus();
  resizeCanvas();
  game.lastTime = performance.now();
  requestAnimationFrame(game.loop.bind(game));
}

window.addEventListener('load', boot);

})();
