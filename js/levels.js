/* ============================================================
   B42 QUEST — LEVELS
   Legenda dos tiles (1 char = 1 tile 16x16):
     . = sky/empty       G = ground        D = dirt
     # = brick           ? = ?block moeda  M = ?block cogumelo
     $ = ?block foco     % = ?block curio  o = moeda solta
     L = vida extra      V = arma foco     K = arma curiosidade
     A = arma metodo     P = spawn player  E = walker
     J = jumper           N = flyer         B = boss final
     W = mini-boss texto  Z = mini-boss desmot
     F = bandeira         H = espinho       = = plataforma
     Y = montaria (Raposa — pule em cima dela pra montar!)
     [ ] { } = cano TL/TR/BL/BR (entrada oculta pra fase bônus)
   ============================================================ */
(function(global) {
'use strict';

const LEVELS = [

  // ==========================================================
  // MUNDO 1-1 — CONHECENDO O ALUNO (tutorial)
  // ==========================================================
  {
    id: '1-1',
    name: 'CONHECENDO O ALUNO',
    theme: 'overworld',
    bg: 'sky',
    timeOfDay: 'day',
    music: 'medieval',
    narrative:
      'Você é <strong>{PLAYER}</strong>, e acaba de chegar ao <strong>Reino do Conhecimento</strong>. ' +
      'A <strong>Princesa Aprendizagem</strong> foi sequestrada pelo Desengajamento, e só um material ' +
      'bem feito pode resgatá-la. Comece simples: <em>corra, pule e colete Conhecimento</em>. ' +
      'Cuidado com o <strong>Bloco Massante</strong> que anda pelo chão, e fique atento: em algum ' +
      'ponto da fase você vai encontrar a <strong>Raposa</strong>, sua primeira grande aliada. ' +
      'Pule em cima dela pra montar e ganhar velocidade.',
    lesson:
      'A <strong>Geração Z</strong> é nativa digital (Prensky, 2001). ' +
      'Aprende com <em>imagens, movimento e feedback imediato</em>, exatamente o que você acabou de fazer. ' +
      'Material que fala a <strong>língua visual</strong> de quem estuda segura a atenção.<br/><br/>' +
      'E você conheceu a <strong>Raposa</strong>: a parceira que representa tudo que a B42 faz. ' +
      'Sozinho(a) você aprende. Com ela, você vai <strong>mais longe, mais rápido e com mais clareza</strong>.',
    map: [
      '...............................................................................................',
      '...............................................................................................',
      '...............................................................................................',
      '...............................................................................................',
      '.................?...............................................V...........?..................',
      '...............................................................................................',
      '...........?..........oooo.........M................?..........#?#.....oooo...................',
      '.......................========================..........==========...........................',
      '.......................................E.............o.o...............................o.o...F',
      '.....................................................========================..============|',
      '....o.o.o...........###.........J......T].....E..........E..o.o.....E........E...............|',
      '..........E.....E.............E........{}.E......o.o..........E.........J......J........Y......',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.....DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.....DDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 2, row: 11 },
  },

  // ==========================================================
  // MUNDO 2-1 — POWER-UPS COGNITIVOS
  // ==========================================================
  {
    id: '2-1',
    name: 'POWER-UPS COGNITIVOS',
    theme: 'overworld',
    bg: 'sky',
    timeOfDay: 'sunset',
    music: 'medieval',
    narrative:
      'Três teorias equipam qualquer material eficaz: <strong>Rojo</strong> (várias linguagens), ' +
      '<strong>Mayer</strong> (vários canais cognitivos) e <strong>Paivio</strong> (texto + imagem juntos). ' +
      'Nesta fase, colete as armas de <strong>Foco</strong> e <strong>Curiosidade</strong> ' +
      'espalhadas pelo caminho, quebre os blocos <strong>?</strong> e pegue o <strong>Cogumelo B42</strong>. ' +
      'Aperte <strong>C</strong> pra disparar um poder; <strong>Q</strong> pra alternar entre eles.',
    lesson:
      'Texto + imagem <strong>duplicam</strong> as vias de absorção do cérebro (Mayer). ' +
      'A fusão verbal-visual (Paivio) consolida a memorização, e cada pessoa precisa de ' +
      '<strong>várias linguagens</strong> pra aprender (Rojo). Foco e Curiosidade não são só ' +
      'armas do jogo: são <em>como o cérebro aprende</em> de verdade. ' +
      'Você armou seu arsenal cognitivo.',
    map: [
      '......................................................................................................',
      '......................................................................................................',
      '......................................................................................................',
      '......................................................................................................',
      '...................#?##...............................................................................',
      '......................................................................................................',
      '.........?.................###......V.........................#K#......?..oooo................',
      '..................................................=========..............==========...............',
      '.............E............oooo........J.............E.......E.......E.........J.....................',
      '........=========.........====..........E.........J..........................===========.............|.',
      '.........................................E...........###..........E.......o.o.o...................|.',
      '...o.o..........####..........E.......ooo...........U].........E....E...............................F',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGG.{}.GGGGGGGGGGGGGGGGGGGGG.....GGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDD.....DDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDD.....DDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 2, row: 11 },
  },

  // ==========================================================
  // MUNDO 3-1 — CARGA COGNITIVA (Sweller)
  // ==========================================================
  {
    id: '3-1',
    name: 'CARGA COGNITIVA',
    theme: 'overworld',
    bg: 'sky',
    timeOfDay: 'storm',
    music: 'medieval',
    narrative:
      'A <strong>Teoria de Sweller</strong> diz: o cérebro trava com excesso ' +
      'de informação ao mesmo tempo. A primeira metade desta fase vai te mostrar ' +
      'o caos: <em>inimigos por todo lado, voadores no alto e chão cheio de ' +
      'armadilhas</em>. Depois, tudo se organiza e você respira. ' +
      'Colete as 3 armas pelo caminho enquanto atravessa.',
    lesson:
      'Sentiu o aperto no começo? Era a <strong>carga cognitiva</strong> real acontecendo. ' +
      'Quando o chão se organizou, você respirou. É por isso que bons materiais <em>dividem</em> ' +
      'conteúdo em módulos, micro-entregas e pausas: uma aula gigante vira <strong>6 módulos menores</strong>, ' +
      'um PDF de 60 páginas vira várias partes com respiro. Menos informação por vez, mais aprendizagem.',
    map: [
      '......................................................................................................',
      '......................................................................................................',
      '......................................................................................................',
      '........N.........N.........N...................b......................b..........................',
      '......#?#####?####....................................V..............................................',
      '............N......................N.................................................................',
      '.......J......J.........J......J................?............?..............?..........M.............',
      '.........................................K....................=========..............==========.',
      '.....E.....E.....E.....E.....E............................E..............E..........J.................',
      '.........................................E.........####....####....E......J.........##...............=|.',
      '...oooo.oo.oo.ooo.oo..................E................................oooo....o.o...................|.',
      '.......................................................................................................F',
      'GGGGGGGGGGGGGGGGGGGGGG.GG..GGGG.GGG.GG.GGGGGGGGGGGGGG...GGG...GGG....GGGGGG....GGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDD.DD..DDDD.DDD.DD.DDDDDDDDDDDDDD...DDD...DDD....DDDDDD....DDDDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDD.DD..DDDD.DDD.DD.DDDDDDDDDDDDDD...DDD...DDD....DDDDDD....DDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 2, row: 11 },
  },

  // ==========================================================
  // MUNDO 4-1 — MUNDO DOS FORMATOS (carrossel)
  // ==========================================================
  {
    id: '4-1',
    name: 'MUNDO DOS FORMATOS',
    theme: 'overworld',
    bg: 'sky',
    timeOfDay: 'dawn',
    music: 'medieval',
    narrative:
      'Esta fase é um <strong>Carrossel de aprendizagem</strong>. Assim como um carrossel ' +
      'no Instagram, ela se divide em trechos curtos: plataformas em sequência, saltos sobre buracos ' +
      'e inimigos variando o ritmo. Colete as 3 armas espalhadas (<strong>Foco, Curiosidade e Método</strong>) ' +
      'e, no fim do caminho, a <strong>Raposa</strong> te espera de novo, pra te levar voando até a bandeira. ' +
      '<em>Deslize pela jornada!</em>',
    lesson:
      'Existem 4 formatos de histórias ilustradas. <strong>Carrossel</strong>: micro-vitórias rápidas, ' +
      'uma ideia por vez. <strong>Quadrinhos</strong>: a história em cenas, quem estuda se vê dentro. ' +
      '<strong>Charges</strong>: humor que ensina sem perceber. <strong>Interativas</strong>: ' +
      'quem aprende escolhe e descobre pela decisão. Cada formato tem um propósito, ' +
      'e combinados com a <strong>Raposa</strong>, prendem qualquer aprendiz.',
    map: [
      '.........................................................................................................',
      '.........................................................................................................',
      '.........................................................................................................',
      '.........................................................................................................',
      '.......?....?....?....?....................M...........A...............................................',
      '...oo...oo...oo...oo...........V......................oooo..........#?#%#$#..........oooo........',
      '.........................................................................................................',
      '....==..==..==..==................J......=============........J..........N.......E..........K........',
      '....................................J.........E........................E........=======...............',
      '.....E...E...E...E............####....E....J.........###..........E......===================........|.',
      '.......................................................................................................',
      '..................................................E...................oooo...o.o................F',
      'GGGGGGGGGGGGGGGGGGGGGGGGGG~~~~GGGGGGGGGGGGGGGGG~~q~GGGGGGGGGGGGGGGGGGGGGG~~r~GGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDDDDDDD~~~~DDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 2, row: 11 },
  },

  // ==========================================================
  // MUNDO 5-1 — BOSS: TEXTO MASSANTE (Biblioteca-Torre)
  // Escalada de estantes, plataformas amarelas entre os livros,
  // o mini-boss aguarda no alto da última prateleira.
  // ==========================================================
  {
    id: '5-1',
    name: 'BIBLIOTECA DO TEXTO MASSANTE',
    theme: 'castle',
    bg: 'castle',
    timeOfDay: 'dusk',
    music: 'castle',
    isBossLevel: true,
    narrative:
      'Bem-vindo(a) à <strong>Biblioteca do Texto Massante</strong>: um labirinto vertical ' +
      'de estantes gigantes, onde parágrafos sem fim se empilham até o teto. ' +
      'Escale os livros, pule entre as <em>prateleiras amarelas</em> (aperte <strong>↓</strong> para descer delas), ' +
      'colete as 3 armas espalhadas (Foco, Curiosidade e Método) e derrote o ' +
      '<strong>Texto Massante</strong> no alto da torre.',
    lesson:
      'O <strong>Texto Massante</strong> caiu. Parede de texto sem respiro é o que mais afasta ' +
      'a Geração Z. <strong>Histórias em quadrinhos</strong> transformam conteúdo denso em ' +
      '<em>narrativa visual</em>: quem estuda deixa de apenas ler e passa a <strong>viver</strong> o conteúdo. ' +
      'A linguagem visual é a ponte entre conceito e compreensão.',
    map: [
      '................................................................................',
      '.............................................................####..............',
      '................................####..........####..........####..........?...',
      '................####............####..........####..........####...........W..',
      '......V.........####......$.....####.....K....####.....R.....####.....?........',
      '................................................................................',
      '.....========....========....========....========....========....========....==',
      '..........J..........E............J...........H.H..........E............J......',
      '................................................................................',
      '.........o.o..........o.o............o.o............o.o............o.o..........',
      '.............H.H..............H.H..............H.H..............H.H............',
      '.....E...........J...........E...........J...........E...........J............|',
      '.P...............................................................................F',
      '................................................................................',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 1, row: 12 },
  },

  // ==========================================================
  // MUNDO 6-1 — BOSS: DESMOTIVAÇÃO (Caverna Descendente)
  // Começa no alto, desce pelas plataformas amarelas (↓ para atravessar),
  // atravessa fosso de espinhos e enfrenta Z no fim.
  // ==========================================================
  {
    id: '6-1',
    name: 'CAVERNA DA DESMOTIVAÇÃO',
    theme: 'castle',
    bg: 'castle',
    timeOfDay: 'night',
    music: 'castle',
    isBossLevel: true,
    narrative:
      'A <strong>Caverna da Desmotivação</strong> afunda no escuro, onde as pessoas ' +
      'desistem em silêncio. Você começa lá no alto: <strong>mergulhe</strong> pelas ' +
      'plataformas amarelas (aperte <strong>↓</strong> pra descer delas), desvie dos ' +
      '<em>espinhos no caminho</em> e dos ataques da <strong>Desmotivação</strong>. ' +
      'Pegue as armas de <strong>Foco</strong> e <strong>Método</strong> espalhadas pela queda. ' +
      'Reacenda a luz e derrote a <strong>Desmotivação</strong> no fundo da caverna.',
    lesson:
      'A <strong>desmotivação</strong> é o inimigo silencioso da EAD: a que faz qualquer pessoa desistir sem avisar. ' +
      'Combatê-la exige <em>propósito claro</em>, <em>feedback constante</em>, <em>metas alcançáveis</em> ' +
      'e <em>conexão emocional</em> com o conteúdo. Cada moeda que brilhou no escuro foi uma pequena vitória: ' +
      'é assim que bons materiais mantêm a jornada viva.',
    map: [
      '................................................................................',
      '.P..............................................................................',
      '................................................................................',
      '.==========.......==========......==========......==========......==========...',
      '..........V............$.............A.......R...o.o.o..........K..............',
      '................................................................................',
      '.........========......========.......========......========........========...',
      '..........E............J.............E.............J..............E.........?..',
      '................................................................................',
      '....####..........####..........####..........####..........####..........####.',
      '................................................................................',
      '................................................................................',
      '........E.........J.........E.........J.........E.........J..................Z|.',
      '....H.H.......H.H........H.H.........H.H........H.H..........H.H................F',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 1, row: 1 },
  },

  // ==========================================================
  // MUNDO 7-1 — BOSS FINAL: DESENGAJAMENTO (Arena do Trono)
  // Grande salão com fileira de pilares no alto, armas espalhadas,
  // o Desengajamento aguarda no centro-direito da arena.
  // ==========================================================
  {
    id: '7-1',
    name: 'ARENA DO DESENGAJAMENTO',
    theme: 'castle',
    bg: 'castle',
    timeOfDay: 'bloodmoon',
    music: 'castle',
    isBossLevel: true,
    narrative:
      'A <strong>Arena do Desengajamento</strong> é o salão do trono: pilares altos, ' +
      'ecos frios e o <strong>último vilão</strong> esperando no centro da arena. ' +
      'Hora da verdade, <strong>{PLAYER}</strong>. Recolha todas as armas espalhadas ' +
      '(<em>Foco, Curiosidade e Método</em>), use <strong>Q</strong> pra alternar entre elas ' +
      'e <strong>C</strong> pra disparar. Derrote o Desengajamento, conquiste o ' +
      '<strong>Pergaminho do Conhecimento</strong> e resgate a Princesa Aprendizagem. ' +
      '<em>É o confronto final.</em>',
    lesson:
      'Derrotar o Desengajamento <strong>não é um truque final</strong>: é o resultado somado de ' +
      '<em>história ilustrada, design cuidadoso, ritmo, humor e participação</em>. ' +
      'Você começou aprendendo a pular; terminou dominando Foco, Curiosidade e Método, ' +
      'ao lado da Raposa. É assim que a B42 faz na EAD: a aprendizagem se resgata com ' +
      '<strong>estratégia</strong>, não com sorte.',
    map: [
      '................................................................................',
      '................................................................................',
      '.....####....####....####....####....####....####....####....####....####.....',
      '.....####....####....####....####....####....####....####....####....####.....',
      '................................................................................',
      '........V..........$..........K..........A..........?.......R.............M....',
      '................................................................................',
      '...======......======......======......======......======......======......===.',
      '..........J..........E...........H.H...........E..........J...........H.H......',
      '................................................................................',
      '........o.o.o........o.o.o........o.o.o........o.o.o........o.o.o........o.o....',
      '................................................................................',
      '...E........J........E........J........E........J........B........E........J..|',
      '.P...............................................................................F',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 1, row: 13 },
  },

  // ==========================================================
  // MUNDO BÔNUS — SALA SECRETA (acessada por cano ↓)
  // Chuva de moedas + vidas + poderes. Pegue a bandeira pra voltar.
  // ==========================================================
  {
    id: 'BÔNUS',
    name: 'SALA SECRETA',
    theme: 'cave',
    bg: 'cave',
    music: 'medieval',
    isBonus: true,
    narrative:
      '★ <strong>VOCÊ ENCONTROU UMA SALA SECRETA!</strong> ★<br/>' +
      'Só chega aqui quem teve curiosidade de explorar além do óbvio. ' +
      'Pegue tudo e volte mais forte. A bandeira te leva de volta à jornada.',
    lesson:
      '<strong>Curiosidade vale ouro!</strong> Quem explora, quem clica, ' +
      'quem desce canos, quem testa caminhos, <em>aprende mais e mais rápido</em>. ' +
      'Por isso, no design de um bom material, cada detalhe extra é uma porta: ' +
      '<strong>recompense a curiosidade</strong> e terá pessoas que voltam sozinhas.',
    map: [
      '................................................',
      '................................................',
      '....oooooooooooooooooooooooooooooooooooooooo....',
      '....o................................?.....o...',
      '....o....====....====....====....====....==.o..',
      '....o.V...........$.........K.........A.....o..',
      '....o........M........?........M........?...o..',
      '....o....====....====....====....[]==........o.',
      '....o......ooo.....ooo....ooo....{}......oooo.o',
      '....o...........====........====............o..',
      '....o....ooo........E..........ooo..........o..',
      '....o..====..........====...........====....o..',
      '....o.....................................F.o..',
      '.P..GGGGGGGGG~~~~~~~~~~~~~~~~~~~~~~~GGGGGGGGGGGG',
      'GGGGGGGGGGGGG~~~~~q~~~~~~~~~r~~~~~~~GGGGGGGGGGGG',
      'DDDDDDDDDDDDD~~~~~~~~~~~~~~~~~~~~~~~DDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 1, row: 13 },
  },

  // ==========================================================
  // MINIGAME ESCONDIDO — corrida de moedas sobre a água
  // Acesso por cano secreto extra (char 'U' no mapa). Chuva de moedas,
  // peixes pulando, chegue na bandeira antes dos peixes te pegarem.
  // ==========================================================
  {
    id: 'MINI',
    name: 'MINIGAME DA CURIOSIDADE',
    theme: 'overworld',
    bg: 'sky',
    timeOfDay: 'dawn',
    music: 'medieval',
    isMinigame: true,
    narrative:
      '★ <strong>MINIGAME ESCONDIDO!</strong> ★<br/>' +
      'Atravesse a piscina d\'água pulando pelas plataformas amarelas. ' +
      'Pegue o máximo de moedas, desvie dos peixes e alcance a bandeira. ' +
      '<em>Curiosidade é premiada.</em>',
    lesson:
      '<strong>Quem pergunta, descobre.</strong> Quem testa caminhos ocultos ' +
      'encontra recompensas reais. É o mesmo no design de conteúdo: ' +
      'esconda bônus pra quem explorar, e sua taxa de engajamento explode.',
    map: [
      '..............................................................',
      '..P...........................................................',
      '..======......................................................',
      '......===......===.......===......===......===......===......',
      '.....o......o.....o.....o......o....o......o.....o............',
      '..............................................................',
      '.......===.......===......===......===......===......===......',
      '......o.o.......o.o......o.o......o.o......o.o.......o.o......',
      '..............................................................',
      '...====.....====.....====.....====.....====.....====.......F..',
      '..o.o.....o..........o..........o..........o..........o....o..',
      '~~~~~~~~~~~~~~~q~~~~~~~~~~r~~~~~~~~~~q~~~~~~~~~~r~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 2, row: 1 },
  },

  // ==========================================================
  // CASTELO FINAL — fase interativa após vencer o vilão
  // A jogadora entra, caminha até o altar pegar o Pergaminho do
  // Conhecimento, e leva até a Princesa Aprendizagem pra vencer.
  // ==========================================================
  {
    id: 'CASTELO',
    name: 'CASTELO FINAL',
    theme: 'castle',
    bg: 'castle',
    timeOfDay: 'dusk',
    music: 'castle',
    isFinalCastle: true,
    narrative:
      '★ <strong>CASTELO DO CONHECIMENTO</strong> ★<br/>' +
      'Você derrotou o Desengajamento. Agora entre no castelo, pegue o ' +
      '<strong>Pergaminho do Conhecimento</strong> e entregue à ' +
      '<strong>Princesa Aprendizagem</strong> pra libertá-la. ' +
      '<em>O último passo da jornada.</em>',
    lesson:
      'Toda jornada de aprendizagem tem começo, meio e fim. A aprendizagem ' +
      'resgatada não fica guardada: ela se entrega, se multiplica, se ' +
      'compartilha. É assim que a <strong>B42 EdTech</strong> transforma ' +
      'cada curso em uma jornada que vale ser completada.',
    map: [
      '................................................................',
      '................................................................',
      '................................................................',
      '................................................................',
      '........o.........o.........o...................................',
      '......=====.......=====.......=====.............................',
      '................................................................',
      '..............o.........o.........o.............................',
      '............=====.....=====.....=====...........................',
      '..............................*.................................',
      '........o.........o.........o...................................',
      '......=====.......=====.......=====.............................',
      '.P..............................................................',
      '....oo......oo......oo......oo.............................@....',
      'GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
      'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD',
    ],
    playerSpawn: { col: 1, row: 12 },
  },
];

global.LEVELS = LEVELS;

})(typeof window !== 'undefined' ? window : globalThis);
