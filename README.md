# B42 EdTech — Quest da Aprendizagem

Um **jogo web de plataforma 2D** autoral, em pixel art retrô, que transforma o
conteúdo pedagógico "O Resgate da Aprendizagem" em uma jornada jogável de 5
mundos com física real, inimigos, chefe final, power-ups e HUD completa.

**Não é slideshow. É um jogo de verdade** — canvas + game loop + física AABB
de verdade + colisão com tilemap + câmera com parallax + save local.

## Como rodar

Basta abrir `index.html` no navegador. Sem build, sem NPM, sem servidor.

```bash
# Opção 1: duplo clique em index.html

# Opção 2: servidor local (recomendado para carregar fontes Google)
python -m http.server 8080
# → http://localhost:8080
```

### Desktop
Funciona bem em tela horizontal ≥ 1024×600. Use teclado (seção Controles abaixo).

### Mobile (iOS / Android) — **público principal**
Abra a URL do servidor local direto do navegador do celular (ou hospede em
qualquer host estático: GitHub Pages, Netlify, Vercel, etc.).

- Funciona em **Safari iOS**, **Chrome Android**, **Samsung Internet**,
  **Firefox Mobile**.
- Recomendado em **landscape** (o jogo alerta automaticamente se estiver
  em portrait).
- O áudio destrava no primeiro toque na tela (política padrão do iOS).
- Para experiência fullscreen no iPhone: adicione o site à tela de início
  (Safari → Compartilhar → "Adicionar à Tela de Início"). O manifesto
  `apple-mobile-web-app-capable` já está configurado.
- Safe-areas (notch / dynamic island / barra de gestos) são respeitadas
  via `env(safe-area-inset-*)`.
- Zoom por pinça e scroll estão bloqueados durante o jogo.

## Controles

### Desktop (teclado)

| Tecla | Ação |
| --- | --- |
| `← →` ou `A/D` | Andar |
| `Z` ou `Espaço` | Pular (segure para pular mais alto) |
| `X` ou `Shift` | Correr |
| `C` | Usar poder equipado |
| `P` ou `Esc` | Pausar / continuar |
| `M` | Ligar/desligar som |
| `Enter` | Avançar em diálogos e telas de fim de fase |

Clique no canvas uma vez para garantir que ele recebe as teclas.

### Mobile (touch)

Os controles de toque aparecem automaticamente em dispositivos com tela
sensível ao toque (detectado via `pointer: coarse`).

| Botão | Posição | Ação |
| --- | --- | --- |
| **◄ ►** | Canto inferior esquerdo (d-pad) | Andar esquerda / direita |
| **A** (laranja, grande) | Canto inferior direito | Pular (segure para pular mais alto) |
| **B** (marrom, menor) | Ao lado do A | Correr |
| **❚❚** | Canto superior direito | Pausar |
| Toque na tela | Qualquer lugar do diálogo | Avançar narrativa |

**Dica**: tocar em A e B juntos faz o pulo-correndo mais alto.

**Rotação**: o jogo é em landscape. Se você segurar o celular em pé, aparece
um aviso animado pedindo pra girar.

**Safe areas**: os botões respeitam `env(safe-area-inset-*)` pra não ficar
debaixo do notch do iPhone ou da barra de gestos do Android.

## Estrutura do projeto

```
b42-quest-aprendizagem/
├── index.html          → Shell com canvas + HUD + overlays de menu
├── styles.css          → Toda a interface (menus, HUD, overlays, CRT)
├── js/
│   ├── sprites.js      → Atlas de sprites pixel art (bake em canvases offscreen)
│   ├── audio.js        → SFX e música chip-tune procedurais (Web Audio API)
│   ├── levels.js       → Dados das 5 fases (tilemaps ASCII + narrativa + lição)
│   └── game.js         → Física, colisão, entidades, câmera, state machine, loop
└── README.md
```

## Mundos (campanha)

1. **1-1 — Conhecendo o Aluno** — Tutorial. Apresenta movimentação, moedas,
   blocos `?` e o primeiro inimigo "Bloco Massante".
2. **2-1 — Power-ups Cognitivos** — Introduz o Cogumelo B42 (grow power)
   e power-ups temáticos (Foco / Curiosidade).
3. **3-1 — Carga Cognitiva** — Level design começa caótico (muitos inimigos,
   muitos blocos) e depois se abre em seções limpas, traduzindo a Teoria de
   Sweller em gameplay.
4. **4-1 — Mundo dos Formatos** — Três seções com ritmos diferentes
   (carrossel / quadrinhos / charges).
5. **5-1 — Castelo do Desengajamento** — Fase final em biome castelo (fundo
   roxo, estrelas, castelo pixel art) com o chefe **Desengajamento**
   (3 pontos de vida, projéteis que perseguem).

Cada fase começa com uma caixa de diálogo narrativa (pressione `Enter` para
jogar) e termina com uma **lição pedagógica** ligada ao conteúdo do slide
correspondente.

## Mecânicas implementadas

### Física do jogador
- Aceleração horizontal com atrito (não é velocidade instantânea)
- Gravidade com velocidade máxima de queda (`MAX_FALL`)
- Pulo com altura variável (segurar = pular mais alto)
- Pulo mais forte quando correndo
- Colisão AABB contra tilemap, eixo X e Y separados
- Plataformas one-way (sobe por baixo, pousa por cima)
- Espinhos causam dano
- Cair fora do mapa = perder vida

### Estados do herói
- **Pequeno** — forma inicial, 1 hit = morre
- **Evoluído (com Cogumelo B42)** — 1 hit = volta a pequeno; pode quebrar
  tijolos comuns pulando de baixo
- **Invulnerabilidade piscando** após levar dano

### Power-ups temáticos
- **Cogumelo B42** — faz o personagem crescer (forma evoluída). Item principal
  da jornada. Vem do bloco `M`.
- **Foco** — bloco `$`. Efeito temporário de 15s (placeholder expansível).
- **Curiosidade** — bloco `%`. Efeito temporário de 15s.

### Inimigos
- **Bloco Massante** (`E`) — walker. Anda e inverte ao bater em parede ou
  chegar numa beirada. Derrotado pulando em cima.
- **Distração** (`J`) — jumper. Pula periodicamente no lugar. Derrotado
  pulando em cima.
- **Ruído Cognitivo** (`N`) — flyer. Move em padrão senoidal. Derrotado
  pulando em cima.
- **Desengajamento** (`B`) — chefe final. 3 HP, anda de um lado pro outro,
  atira projéteis (textos massantes) que perseguem o herói. Derrotado com
  3 stomps no topo. Tem frames de invulnerabilidade entre hits.

### Itens
- **Moedas** (`o` ou dentro de bloco `?`) — 100 score + 1 no contador
- **Bloco quebrável** (`#`) — só o herói evoluído destrói pulando de baixo
- **Bandeira** (`F`) — fim da fase

### Sistemas
- **HUD**: score, moedas, mundo, barra de energia (vidas), poder equipado
- **Menus**: principal, seleção de mundo, controles, pausa, game over,
  fim de fase (com lição), vitória final
- **Save local**: `localStorage` guarda desbloqueios e melhor score
- **Áudio procedural**: bleeps de pulo, moeda, power-up, stomp, hit, dano,
  break, boss, level clear, victory — tudo via Web Audio API
- **Música chip-tune**: loop original de 2 padrões (overworld e castle)
- **Câmera com lookahead**: olha mais à frente na direção que o herói anda
- **Parallax de 4 camadas**: montanhas, nuvens, colinas, arbustos (no
  biome overworld) / campo estelar + castelo pixelado (no biome castle)

## Arquitetura

`game.js` tem ~1100 linhas divididas em:
1. Constantes de física
2. Sistema de input com edge trigger de pulo
3. Helpers de colisão AABB genéricos
4. Classe `LevelData` — parser do tilemap ASCII
5. Classe `Entity` base
6. `Player` com formas e upgrade
7. `Walker`, `Jumper`, `Flyer` — inimigos
8. `Boss` + `BossShot` — chefe final
9. `Coin`, `Mushroom`, `PowerItem`, `Flag` — itens
10. `Particle` — efeitos de moeda/stomp/power
11. `Game` — state machine, loop, camera, render, HUD sync, save
12. UI helpers + wiring de botões
13. Boot

`sprites.js` usa a função `bake(grid, palette)` que lê uma string ASCII com
chars de cor e produz um canvas offscreen 1px/char. Depois cada sprite
horizontal fica invertido automaticamente com `flip()`. Tudo cacheado em
`SPR.*` no boot. Zero custo em runtime.

`audio.js` é 100% procedural — nenhum arquivo .mp3/.wav. A música usa
`OscillatorNode` `square` para melodia e `triangle` para baixo, agendados
via `AudioContext.currentTime` para timing preciso.

## Personalização

### Adicionar uma fase nova
Edite `js/levels.js` e adicione um objeto ao array `LEVELS`:

```js
{
  id: '6-1',
  name: 'NOVA FASE',
  bg: 'sky',              // 'sky' ou 'castle'
  music: 'overworld',     // 'overworld' ou 'castle'
  narrative: 'Texto...',
  lesson: 'Lição...',
  map: [
    '................',
    '................',
    // ... 17 linhas ...
    'GGGGGGGGGGGGGGGG',
    'DDDDDDDDDDDDDDDD',
  ],
}
```

### Legenda do tilemap
```
.  = vazio        P = spawn do jogador
G  = grama        E = walker
D  = terra        J = jumper
#  = tijolo       N = flyer
?  = bloco moeda  B = boss
M  = bloco cogumelo B42
$  = bloco power foco
%  = bloco power curiosidade
o  = moeda solta  F = bandeira final
=  = plataforma   H = espinho
```

### Alterar paleta
Edite `PAL` em `js/sprites.js`. Os sprites recompilam sozinhos no próximo
boot (não há assets binários).

### Alterar física
Constantes no topo de `js/game.js`: `GRAVITY`, `MAX_FALL`, `JUMP_VEL`,
`JUMP_VEL_R`, `WALK_SPD`, `RUN_SPD`, `FRICTION`, `ACCEL`.

## Créditos

Obra original da **B42 EdTech**. Pixel art, física, código, níveis,
narrativa e trilha sonora — tudo autoral. Inspiração **conceitual** em
grandes plataformers 8-bit do gênero, zero assets de terceiros.

Personagem principal, inimigos (Bloco Massante / Distração / Ruído /
Desengajamento) e Cogumelo B42 são design próprio.
