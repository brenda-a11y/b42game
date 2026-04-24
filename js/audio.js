/* ============================================================
   B42 QUEST — AUDIO (Web Audio API, procedural retrô)
   SFX e música-chip gerados em tempo real, sem dependências.
   ============================================================ */
(function(global) {
'use strict';

const AUDIO = {
  ctx: null,
  enabled: true,
  masterVol: 0.35,
  musicGain: null,
  musicNodes: [],
  musicTimer: null,

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) {}
      }
      return;
    }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVol;
      this.masterGain.connect(this.ctx.destination);
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch (e) {}
      }
    } catch (e) { this.ctx = null; }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? this.masterVol : 0;
    }
    return this.enabled;
  },

  _play(freq, dur, type = 'square', vol = 0.18, attack = 0.005, decay = null) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    return { osc, g };
  },

  jump() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.15);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.2);
  },

  coin() {
    this._play(988, 0.06, 'square', 0.16);
    setTimeout(() => this._play(1319, 0.10, 'square', 0.16), 55);
  },

  powerup() {
    const seq = [392, 494, 587, 698, 880, 1047, 1319, 1568];
    seq.forEach((f, i) => setTimeout(() => this._play(f, 0.08, 'square', 0.14), i * 55));
  },

  grow() {
    const seq = [523, 659, 784, 1047];
    seq.forEach((f, i) => setTimeout(() => this._play(f, 0.12, 'square', 0.16), i * 70));
  },

  stomp() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.22);
  },

  hurt() {
    const t = this.ctx ? this.ctx.currentTime : 0;
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.3);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.4);
  },

  die() {
    if (!this.ctx || !this.enabled) return;
    const notes = [440, 392, 330, 262, 196, 147];
    notes.forEach((f, i) => setTimeout(() => this._play(f, 0.2, 'square', 0.16), i * 120));
  },

  break() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200 + Math.random() * 400, t + i * 0.02);
      g.gain.setValueAtTime(0.12, t + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.02 + 0.08);
      osc.connect(g).connect(this.masterGain);
      osc.start(t + i * 0.02); osc.stop(t + i * 0.02 + 0.09);
    }
  },

  bossHit() {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.3);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.38);
  },

  levelClear() {
    const seq = [523, 659, 784, 1047, 784, 1047, 1319];
    seq.forEach((f, i) =>
      setTimeout(() => this._play(f, 0.18, 'square', 0.18), i * 140)
    );
  },

  victory() {
    const seq = [392, 523, 659, 784, 1047, 1319, 1568, 2093];
    seq.forEach((f, i) =>
      setTimeout(() => this._play(f, 0.22, 'square', 0.2), i * 150)
    );
  },

  click() {
    this._play(660, 0.04, 'square', 0.1);
  },

  // ============================================================
  // MÚSICA DE FUNDO (loop chip-tune simples)
  // ============================================================
  startMusic(track = 'overworld') {
    // Garante que o AudioContext esteja criado e "rodando" — crítico no
    // mobile, onde a init costuma estar suspensa até o primeiro toque.
    this.init();
    if (!this.ctx || !this.enabled) return;
    if (this.ctx.state === 'suspended') {
      try { this.ctx.resume(); } catch (e) {}
    }
    // Guarda a track pra re-tentar se o contexto ainda estiver suspenso
    // (mobile antes do primeiro gesto do usuário).
    this._lastTrack = track;
    this.stopMusic();
    // Padrão de notas (em Hz). Melodia original simples.
    const PATTERNS = {
      overworld: {
        bpm: 110,
        melody: [
          // Melodia suave estilo aventura — tons de Dó maior
          [523,1.5],[0,0.5],[587,1],[659,1],[784,2],[0,1],
          [659,1],[587,1],[523,1.5],[0,0.5],[440,2],[0,1],
          [523,1],[587,0.5],[659,0.5],[784,1],[880,1.5],[0,0.5],
          [784,1],[659,1],[587,1],[523,2],[0,1],
          [440,1],[523,1],[587,1.5],[0,0.5],[659,2],[0,1],
          [523,1],[440,1],[392,1.5],[0,0.5],[523,2],[0,1],
        ],
        bass: [
          [131,3],[165,3],[175,3],[131,3],
          [110,3],[131,3],[98,3],[131,3],
        ],
      },
      castle: {
        bpm: 95,
        melody: [
          // Tema de castelo sombrio mas não irritante
          [196,2],[220,1],[247,1],[196,2],[0,1],
          [175,2],[196,1],[220,1],[175,2],[0,1],
          [165,1],[196,1],[220,1],[247,1],[262,2],[0,1],
          [247,1],[220,1],[196,1],[175,2],[0,2],
        ],
        bass: [
          [65,3],[73,3],[82,3],[73,3],
          [65,3],[82,3],[73,3],[65,3],
        ],
      },
      // Tema medieval — escala menor natural (A minor), ritmo de balada
      // com marcha de baixo lenta tipo corda dedilhada (alaúde/harpa).
      medieval: {
        bpm: 88,
        melody: [
          // Frase A — ascendente heroica
          [440,2],[523,1],[587,1],[659,2],[587,1],[523,1],
          [440,2],[0,1],[392,1],[440,2],[0,2],
          // Frase B — melancólica, descida
          [659,1.5],[587,0.5],[523,1],[440,1],[392,2],[0,1],
          [523,1],[440,1],[392,1.5],[0,0.5],[330,2],[0,1],
          // Frase C — passagem grave
          [392,1],[440,1],[523,1.5],[0,0.5],[587,2],[0,1],
          [523,1],[440,1],[392,2],[0,2],
          // Frase D — resolução
          [440,1],[392,1],[330,1],[293,1],[262,2],[0,2],
        ],
        bass: [
          [110,4],[82,4],[98,4],[73,4],
          [110,4],[73,4],[98,4],[110,4],
        ],
      },
    };
    const pat = PATTERNS[track] || PATTERNS.overworld;
    const beatSec = 60 / pat.bpm;
    const totalBeats = pat.melody.reduce((a, n) => a + n[1], 0);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16; // volume mais baixo
    this.musicGain.connect(this.masterGain);

    const schedule = () => {
      if (!this.enabled || !this.ctx) return;
      const t0 = this.ctx.currentTime + 0.05;
      // Melodia — onda triangle (suave, sem o chiado do square)
      let t = t0;
      for (const [freq, beats] of pat.melody) {
        if (freq > 0) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.09, t + 0.02);
          g.gain.linearRampToValueAtTime(0.07, t + beats * beatSec * 0.7);
          g.gain.exponentialRampToValueAtTime(0.001, t + beats * beatSec * 0.95);
          osc.connect(g).connect(this.musicGain);
          osc.start(t);
          osc.stop(t + beats * beatSec + 0.02);
          this.musicNodes.push(osc);
        }
        t += beats * beatSec;
      }
      // Baixo — sine wave (grave suave)
      let bt = t0;
      let bassIdx = 0;
      while (bt < t0 + totalBeats * beatSec - 0.01) {
        const [freq, beats] = pat.bass[bassIdx % pat.bass.length];
        if (freq > 0) {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(0, bt);
          g.gain.linearRampToValueAtTime(0.10, bt + 0.03);
          g.gain.exponentialRampToValueAtTime(0.001, bt + beats * beatSec * 0.85);
          osc.connect(g).connect(this.musicGain);
          osc.start(bt);
          osc.stop(bt + beats * beatSec + 0.02);
          this.musicNodes.push(osc);
        }
        bt += beats * beatSec;
        bassIdx++;
      }
      this.musicTimer = setTimeout(schedule, totalBeats * beatSec * 1000 - 50);
    };
    schedule();
  },

  stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    for (const n of this.musicNodes) {
      try { n.stop(); } catch (e) {}
    }
    this.musicNodes = [];
    if (this.musicGain) {
      try { this.musicGain.disconnect(); } catch (e) {}
      this.musicGain = null;
    }
  },
};

global.AUDIO = AUDIO;

})(typeof window !== 'undefined' ? window : globalThis);
