/* ============================================================
   B42 QUEST — INTERNACIONALIZAÇÃO (i18n)
   Traduções de TODA a UI shell. Conteúdo de fases (narrativas,
   lições) permanece em PT-BR por enquanto — pode ser estendido.

   Uso:
     I18N.t('menu.start')          → string traduzida
     I18N.setLang('en')            → muda idioma e salva
     I18N.applyTo(rootEl)          → aplica em [data-i18n] do DOM
   ============================================================ */
(function (global) {
'use strict';

const STORAGE_KEY = 'b42-quest-lang';

const LANGS = {
  'pt-BR': { name: 'Português', flag: '🇧🇷', code: 'pt-BR' },
  'en':    { name: 'English',   flag: '🇬🇧', code: 'en' },
  'es':    { name: 'Español',   flag: '🇪🇸', code: 'es' },
  'fr':    { name: 'Français',  flag: '🇫🇷', code: 'fr' },
  'zh':    { name: '中文',       flag: '🇨🇳', code: 'zh' },
  'ja':    { name: '日本語',      flag: '🇯🇵', code: 'ja' },
  'ko':    { name: '한국어',      flag: '🇰🇷', code: 'ko' },
  'ru':    { name: 'Русский',   flag: '🇷🇺', code: 'ru' },
};

const STRINGS = {
  // ============ pt-BR ============
  'pt-BR': {
    'lang.title':              'ESCOLHA O IDIOMA',
    'lang.subtitle':           'Selecione seu idioma para começar a jornada',
    'lang.confirm':            '► CONFIRMAR',

    'menu.brand':              'B42 EDTECH ⚔ APRESENTA',
    'menu.subtitle':           'UMA AVENTURA 2D PELO REINO DO CONHECIMENTO',
    'menu.start':              '⚔ INICIAR JORNADA',
    'menu.select':             'ESCOLHER REINO',
    'menu.controls':           'GUIA DO HERÓI',
    'menu.ranking':            'RANKING',
    'menu.admin':              '♛ CÂMARA REAL',
    'menu.reset':              'REFAZER A JORNADA',
    'menu.credit':             'Forjado por',

    'hud.heroine':             '⚔ HEROÍNA',
    'hud.knowledge':           'CONHECIMENTO',
    'hud.world':               'REINO',
    'hud.energy':              'VIGOR',
    'hud.lives':               'VIDAS',
    'hud.power':               'ARTEFATO',

    'auth.login.title':        '⚔ ENTRAR NO REINO',
    'auth.login.name':         'NOME DA CAVALEIRA',
    'auth.login.namePh':       'Seu nome de batalha',
    'auth.login.pass':         'SENHA SECRETA',
    'auth.login.passPh':       'Sua senha',
    'auth.login.submit':       '► ENTRAR',
    'auth.login.connecting':   'CONECTANDO...',
    'auth.login.toRegister':   'FORJAR NOVA CONTA',
    'auth.login.guest':        'PARTIR COMO ANDARILHO',

    'auth.register.title':     '⚔ FORJAR NOVA CAVALEIRA',
    'auth.register.name':      'NOME DE JOGADOR',
    'auth.register.namePh':    'Escolha um nome único',
    'auth.register.email':     'EMAIL',
    'auth.register.emailPh':   'seu@email.com',
    'auth.register.phone':     'TELEFONE (WHATSAPP)',
    'auth.register.phonePh':   '(11) 91234-5678',
    'auth.register.phoneHint': 'Use somente para contato relacionado ao jogo.',
    'auth.register.pass':      'SENHA',
    'auth.register.passPh':    'Mínimo 4 caracteres',
    'auth.register.pass2':     'CONFIRMAR SENHA',
    'auth.register.pass2Ph':   'Repita a senha',
    'auth.register.terms':     'Li e aceito os',
    'auth.register.termsLink': 'Termos de Uso',
    'auth.register.lgpd':      'Autorizo o tratamento dos meus dados conforme a',
    'auth.register.lgpdLink':  'Política de Privacidade (LGPD)',
    'auth.register.submit':    '► CRIAR CONTA',
    'auth.register.saving':    'SALVANDO NO SERVIDOR...',
    'auth.register.toLogin':   'JÁ TENHO CONTA',

    'controls.title':          '⚔ GUIA DO HERÓI ⚔',
    'controls.back':           '◄ VOLTAR',
    'select.title':            '♛ ESCOLHER REINO ♛',
    'select.hint':             'Reinos selados se abrem conforme você avança na jornada.',

    'pause.title':             '⌛ JORNADA PAUSADA',
    'pause.resume':            'RETOMAR',
    'pause.restart':           'RECOMEÇAR REINO',
    'pause.menu':              'SALÃO PRINCIPAL',

    'gameover.title':          '✝ TOMBASTE EM BATALHA ✝',
    'gameover.score':          'HONRA',
    'gameover.coins':          'CONHECIMENTO',
    'gameover.retry':          '⚔ REERGUER A ESPADA',
    'gameover.menu':           'SALÃO PRINCIPAL',

    'complete.title':          '♛ REINO LIBERTADO! ♛',
    'complete.next':           'PRÓXIMO REINO ►',
    'complete.menu':           'SALÃO PRINCIPAL',

    'victory.title':           '⚔ MISSÃO CUMPRIDA ⚔',
    'victory.menu':            '► SALÃO PRINCIPAL',
    'victory.devCredits':      'UM PROJETO DE',
    'victory.pressEnter':      '> PRESSIONE ENTER',

    'terms.title':             'TERMOS DE USO',
    'terms.understood':        '► ENTENDI',
    'lgpd.title':              'POLÍTICA DE PRIVACIDADE (LGPD)',

    'admin.title':             'PAINEL DE ADMINISTRAÇÃO',
    'admin.players':           'JOGADORES',
    'admin.source':            'FONTE',
    'admin.updated':           'ATUALIZADO',
    'admin.searchPh':          'Buscar por nome ou e-mail...',
    'admin.refresh':           '↻ ATUALIZAR',
    'admin.col.player':        'JOGADOR',
    'admin.col.email':         'EMAIL',
    'admin.col.phone':         'TELEFONE',
    'admin.col.levels':        'FASES',
    'admin.col.score':         'SCORE',
    'admin.col.actions':       'AÇÕES',

    'rotate.title':            'GIRE O APARELHO',
    'rotate.sub':              'Este jogo é melhor jogado na horizontal',

    'press.touch':             '> TOQUE OU PRESSIONE ENTER',
    'press.continue':          '> TOQUE OU PRESSIONE ENTER PRA CONTINUAR',
  },

  // ============ EN ============
  'en': {
    'lang.title':              'CHOOSE YOUR LANGUAGE',
    'lang.subtitle':           'Select your language to begin the journey',
    'lang.confirm':            '► CONFIRM',

    'menu.brand':              'B42 EDTECH ⚔ PRESENTS',
    'menu.subtitle':           'A 2D ADVENTURE THROUGH THE REALM OF KNOWLEDGE',
    'menu.start':              '⚔ START JOURNEY',
    'menu.select':             'CHOOSE REALM',
    'menu.controls':           'HERO\'S GUIDE',
    'menu.ranking':            'RANKING',
    'menu.admin':              '♛ ROYAL CHAMBER',
    'menu.reset':              'RESTART JOURNEY',
    'menu.credit':             'Forged by',

    'hud.heroine':             '⚔ HEROINE',
    'hud.knowledge':           'KNOWLEDGE',
    'hud.world':               'REALM',
    'hud.energy':              'VIGOR',
    'hud.lives':               'LIVES',
    'hud.power':               'ARTIFACT',

    'auth.login.title':        '⚔ ENTER THE REALM',
    'auth.login.name':         'KNIGHT\'S NAME',
    'auth.login.namePh':       'Your battle name',
    'auth.login.pass':         'SECRET PASSWORD',
    'auth.login.passPh':       'Your password',
    'auth.login.submit':       '► ENTER',
    'auth.login.connecting':   'CONNECTING...',
    'auth.login.toRegister':   'FORGE NEW ACCOUNT',
    'auth.login.guest':        'WANDER AS A TRAVELER',

    'auth.register.title':     '⚔ FORGE NEW KNIGHT',
    'auth.register.name':      'PLAYER NAME',
    'auth.register.namePh':    'Choose a unique name',
    'auth.register.email':     'EMAIL',
    'auth.register.emailPh':   'your@email.com',
    'auth.register.phone':     'PHONE (WHATSAPP)',
    'auth.register.phonePh':   '+1 (555) 123-4567',
    'auth.register.phoneHint': 'Used only for game-related contact.',
    'auth.register.pass':      'PASSWORD',
    'auth.register.passPh':    'Minimum 4 characters',
    'auth.register.pass2':     'CONFIRM PASSWORD',
    'auth.register.pass2Ph':   'Repeat password',
    'auth.register.terms':     'I read and accept the',
    'auth.register.termsLink': 'Terms of Use',
    'auth.register.lgpd':      'I authorize processing my data per the',
    'auth.register.lgpdLink':  'Privacy Policy (GDPR)',
    'auth.register.submit':    '► CREATE ACCOUNT',
    'auth.register.saving':    'SAVING TO SERVER...',
    'auth.register.toLogin':   'I HAVE AN ACCOUNT',

    'controls.title':          '⚔ HERO\'S GUIDE ⚔',
    'controls.back':           '◄ BACK',
    'select.title':            '♛ CHOOSE REALM ♛',
    'select.hint':             'Sealed realms unlock as you progress.',

    'pause.title':             '⌛ JOURNEY PAUSED',
    'pause.resume':            'RESUME',
    'pause.restart':           'RESTART REALM',
    'pause.menu':              'MAIN HALL',

    'gameover.title':          '✝ FALLEN IN BATTLE ✝',
    'gameover.score':          'HONOR',
    'gameover.coins':          'KNOWLEDGE',
    'gameover.retry':          '⚔ RAISE THE SWORD',
    'gameover.menu':           'MAIN HALL',

    'complete.title':          '♛ REALM LIBERATED! ♛',
    'complete.next':           'NEXT REALM ►',
    'complete.menu':           'MAIN HALL',

    'victory.title':           '⚔ MISSION COMPLETE ⚔',
    'victory.menu':            '► MAIN HALL',
    'victory.devCredits':      'A PROJECT BY',
    'victory.pressEnter':      '> PRESS ENTER',

    'terms.title':             'TERMS OF USE',
    'terms.understood':        '► UNDERSTOOD',
    'lgpd.title':              'PRIVACY POLICY (GDPR)',

    'admin.title':             'ADMIN PANEL',
    'admin.players':           'PLAYERS',
    'admin.source':            'SOURCE',
    'admin.updated':           'UPDATED',
    'admin.searchPh':          'Search by name or email...',
    'admin.refresh':           '↻ REFRESH',
    'admin.col.player':        'PLAYER',
    'admin.col.email':         'EMAIL',
    'admin.col.phone':         'PHONE',
    'admin.col.levels':        'STAGES',
    'admin.col.score':         'SCORE',
    'admin.col.actions':       'ACTIONS',

    'rotate.title':            'ROTATE YOUR DEVICE',
    'rotate.sub':              'This game is best played in landscape mode',

    'press.touch':             '> TAP OR PRESS ENTER',
    'press.continue':          '> TAP OR PRESS ENTER TO CONTINUE',
  },

  // ============ ES ============
  'es': {
    'lang.title':              'ELIGE TU IDIOMA',
    'lang.subtitle':           'Selecciona tu idioma para comenzar el viaje',
    'lang.confirm':            '► CONFIRMAR',

    'menu.brand':              'B42 EDTECH ⚔ PRESENTA',
    'menu.subtitle':           'UNA AVENTURA 2D POR EL REINO DEL CONOCIMIENTO',
    'menu.start':              '⚔ INICIAR VIAJE',
    'menu.select':             'ELEGIR REINO',
    'menu.controls':           'GUÍA DEL HÉROE',
    'menu.ranking':            'RANKING',
    'menu.admin':              '♛ CÁMARA REAL',
    'menu.reset':              'REINICIAR VIAJE',
    'menu.credit':             'Forjado por',

    'hud.heroine':             '⚔ HEROÍNA',
    'hud.knowledge':           'CONOCIMIENTO',
    'hud.world':               'REINO',
    'hud.energy':              'VIGOR',
    'hud.lives':               'VIDAS',
    'hud.power':               'ARTEFACTO',

    'auth.login.title':        '⚔ ENTRAR AL REINO',
    'auth.login.name':         'NOMBRE DE LA CABALLERA',
    'auth.login.namePh':       'Tu nombre de batalla',
    'auth.login.pass':         'CONTRASEÑA SECRETA',
    'auth.login.passPh':       'Tu contraseña',
    'auth.login.submit':       '► ENTRAR',
    'auth.login.connecting':   'CONECTANDO...',
    'auth.login.toRegister':   'FORJAR NUEVA CUENTA',
    'auth.login.guest':        'IR COMO ERRANTE',

    'auth.register.title':     '⚔ FORJAR NUEVA CABALLERA',
    'auth.register.name':      'NOMBRE DE JUGADOR',
    'auth.register.namePh':    'Elige un nombre único',
    'auth.register.email':     'CORREO',
    'auth.register.emailPh':   'tu@correo.com',
    'auth.register.phone':     'TELÉFONO (WHATSAPP)',
    'auth.register.phonePh':   '+34 612 345 678',
    'auth.register.phoneHint': 'Solo para contacto relacionado con el juego.',
    'auth.register.pass':      'CONTRASEÑA',
    'auth.register.passPh':    'Mínimo 4 caracteres',
    'auth.register.pass2':     'CONFIRMAR CONTRASEÑA',
    'auth.register.pass2Ph':   'Repite la contraseña',
    'auth.register.terms':     'Leí y acepto los',
    'auth.register.termsLink': 'Términos de Uso',
    'auth.register.lgpd':      'Autorizo el tratamiento de mis datos según la',
    'auth.register.lgpdLink':  'Política de Privacidad',
    'auth.register.submit':    '► CREAR CUENTA',
    'auth.register.saving':    'GUARDANDO EN EL SERVIDOR...',
    'auth.register.toLogin':   'YA TENGO CUENTA',

    'controls.title':          '⚔ GUÍA DEL HÉROE ⚔',
    'controls.back':           '◄ VOLVER',
    'select.title':            '♛ ELEGIR REINO ♛',
    'select.hint':             'Los reinos sellados se abren al avanzar.',

    'pause.title':             '⌛ VIAJE PAUSADO',
    'pause.resume':            'CONTINUAR',
    'pause.restart':           'REINICIAR REINO',
    'pause.menu':              'SALÓN PRINCIPAL',

    'gameover.title':          '✝ CAÍDO EN BATALLA ✝',
    'gameover.score':          'HONOR',
    'gameover.coins':          'CONOCIMIENTO',
    'gameover.retry':          '⚔ ALZAR LA ESPADA',
    'gameover.menu':           'SALÓN PRINCIPAL',

    'complete.title':          '♛ ¡REINO LIBERADO! ♛',
    'complete.next':           'PRÓXIMO REINO ►',
    'complete.menu':           'SALÓN PRINCIPAL',

    'victory.title':           '⚔ MISIÓN COMPLETADA ⚔',
    'victory.menu':            '► SALÓN PRINCIPAL',
    'victory.devCredits':      'UN PROYECTO DE',
    'victory.pressEnter':      '> PULSA ENTER',

    'terms.title':             'TÉRMINOS DE USO',
    'terms.understood':        '► ENTENDIDO',
    'lgpd.title':              'POLÍTICA DE PRIVACIDAD',

    'admin.title':             'PANEL DE ADMINISTRACIÓN',
    'admin.players':           'JUGADORES',
    'admin.source':            'FUENTE',
    'admin.updated':           'ACTUALIZADO',
    'admin.searchPh':          'Buscar por nombre o correo...',
    'admin.refresh':           '↻ ACTUALIZAR',
    'admin.col.player':        'JUGADOR',
    'admin.col.email':         'CORREO',
    'admin.col.phone':         'TELÉFONO',
    'admin.col.levels':        'NIVELES',
    'admin.col.score':         'PUNTOS',
    'admin.col.actions':       'ACCIONES',

    'rotate.title':            'GIRA EL DISPOSITIVO',
    'rotate.sub':              'Este juego se juega mejor en horizontal',

    'press.touch':             '> TOCA O PULSA ENTER',
    'press.continue':          '> TOCA O PULSA ENTER PARA CONTINUAR',
  },

  // ============ FR ============
  'fr': {
    'lang.title':              'CHOISISSEZ VOTRE LANGUE',
    'lang.subtitle':           'Sélectionnez votre langue pour commencer',
    'lang.confirm':            '► CONFIRMER',

    'menu.brand':              'B42 EDTECH ⚔ PRÉSENTE',
    'menu.subtitle':           'UNE AVENTURE 2D AU ROYAUME DU SAVOIR',
    'menu.start':              '⚔ COMMENCER',
    'menu.select':             'CHOISIR ROYAUME',
    'menu.controls':           'GUIDE DU HÉROS',
    'menu.ranking':            'CLASSEMENT',
    'menu.admin':              '♛ CHAMBRE ROYALE',
    'menu.reset':              'RECOMMENCER',
    'menu.credit':             'Forgé par',

    'hud.heroine':             '⚔ HÉROÏNE',
    'hud.knowledge':           'SAVOIR',
    'hud.world':               'ROYAUME',
    'hud.energy':              'VIGUEUR',
    'hud.lives':               'VIES',
    'hud.power':               'ARTEFACT',

    'auth.login.title':        '⚔ ENTRER AU ROYAUME',
    'auth.login.name':         'NOM DE LA CHEVALIÈRE',
    'auth.login.namePh':       'Votre nom de bataille',
    'auth.login.pass':         'MOT DE PASSE SECRET',
    'auth.login.passPh':       'Votre mot de passe',
    'auth.login.submit':       '► ENTRER',
    'auth.login.connecting':   'CONNEXION...',
    'auth.login.toRegister':   'CRÉER UN COMPTE',
    'auth.login.guest':        'PARTIR EN VOYAGEUR',

    'auth.register.title':     '⚔ FORGER UNE CHEVALIÈRE',
    'auth.register.name':      'NOM DE JOUEUR',
    'auth.register.namePh':    'Choisissez un nom unique',
    'auth.register.email':     'EMAIL',
    'auth.register.emailPh':   'votre@email.com',
    'auth.register.phone':     'TÉLÉPHONE (WHATSAPP)',
    'auth.register.phonePh':   '+33 6 12 34 56 78',
    'auth.register.phoneHint': 'Utilisé uniquement pour le jeu.',
    'auth.register.pass':      'MOT DE PASSE',
    'auth.register.passPh':    'Au moins 4 caractères',
    'auth.register.pass2':     'CONFIRMER MOT DE PASSE',
    'auth.register.pass2Ph':   'Répétez le mot de passe',
    'auth.register.terms':     'J\'ai lu et j\'accepte les',
    'auth.register.termsLink': 'Conditions d\'Utilisation',
    'auth.register.lgpd':      'J\'autorise le traitement de mes données selon la',
    'auth.register.lgpdLink':  'Politique de Confidentialité (RGPD)',
    'auth.register.submit':    '► CRÉER LE COMPTE',
    'auth.register.saving':    'ENREGISTREMENT...',
    'auth.register.toLogin':   'J\'AI DÉJÀ UN COMPTE',

    'controls.title':          '⚔ GUIDE DU HÉROS ⚔',
    'controls.back':           '◄ RETOUR',
    'select.title':            '♛ CHOISIR ROYAUME ♛',
    'select.hint':             'Les royaumes scellés s\'ouvrent en progressant.',

    'pause.title':             '⌛ PAUSE',
    'pause.resume':            'REPRENDRE',
    'pause.restart':           'RECOMMENCER ROYAUME',
    'pause.menu':              'GRAND HALL',

    'gameover.title':          '✝ TOMBÉE AU COMBAT ✝',
    'gameover.score':          'HONNEUR',
    'gameover.coins':          'SAVOIR',
    'gameover.retry':          '⚔ REPRENDRE L\'ÉPÉE',
    'gameover.menu':           'GRAND HALL',

    'complete.title':          '♛ ROYAUME LIBÉRÉ ! ♛',
    'complete.next':           'ROYAUME SUIVANT ►',
    'complete.menu':           'GRAND HALL',

    'victory.title':           '⚔ MISSION ACCOMPLIE ⚔',
    'victory.menu':            '► GRAND HALL',
    'victory.devCredits':      'UN PROJET DE',
    'victory.pressEnter':      '> APPUYEZ SUR ENTRÉE',

    'terms.title':             'CONDITIONS D\'UTILISATION',
    'terms.understood':        '► COMPRIS',
    'lgpd.title':              'POLITIQUE DE CONFIDENTIALITÉ',

    'admin.title':             'PANNEAU D\'ADMIN',
    'admin.players':           'JOUEURS',
    'admin.source':            'SOURCE',
    'admin.updated':           'MIS À JOUR',
    'admin.searchPh':          'Rechercher par nom ou email...',
    'admin.refresh':           '↻ ACTUALISER',
    'admin.col.player':        'JOUEUR',
    'admin.col.email':         'EMAIL',
    'admin.col.phone':         'TÉLÉPHONE',
    'admin.col.levels':        'NIVEAUX',
    'admin.col.score':         'SCORE',
    'admin.col.actions':       'ACTIONS',

    'rotate.title':            'TOURNEZ L\'APPAREIL',
    'rotate.sub':              'Ce jeu se joue mieux en mode paysage',

    'press.touch':             '> TAPEZ OU APPUYEZ SUR ENTRÉE',
    'press.continue':          '> TAPEZ OU APPUYEZ SUR ENTRÉE POUR CONTINUER',
  },

  // ============ ZH ============
  'zh': {
    'lang.title':              '选择您的语言',
    'lang.subtitle':           '选择语言开始旅程',
    'lang.confirm':            '► 确认',

    'menu.brand':              'B42 EDTECH ⚔ 呈献',
    'menu.subtitle':           '一段穿越知识王国的2D冒险',
    'menu.start':              '⚔ 开始旅程',
    'menu.select':             '选择王国',
    'menu.controls':           '英雄指南',
    'menu.ranking':            '排行榜',
    'menu.admin':              '♛ 王室密室',
    'menu.reset':              '重新开始',
    'menu.credit':             '由以下成员打造',

    'hud.heroine':             '⚔ 女主',
    'hud.knowledge':           '知识',
    'hud.world':               '王国',
    'hud.energy':              '体力',
    'hud.lives':               '生命',
    'hud.power':               '神器',

    'auth.login.title':        '⚔ 进入王国',
    'auth.login.name':         '骑士姓名',
    'auth.login.namePh':       '您的战斗名',
    'auth.login.pass':         '密码',
    'auth.login.passPh':       '您的密码',
    'auth.login.submit':       '► 进入',
    'auth.login.connecting':   '连接中...',
    'auth.login.toRegister':   '创建新账号',
    'auth.login.guest':        '作为游客出发',

    'auth.register.title':     '⚔ 打造新骑士',
    'auth.register.name':      '玩家名',
    'auth.register.namePh':    '选择独特的名字',
    'auth.register.email':     '邮箱',
    'auth.register.emailPh':   'your@email.com',
    'auth.register.phone':     '电话(WhatsApp)',
    'auth.register.phonePh':   '+86 138 0000 0000',
    'auth.register.phoneHint': '仅用于游戏相关联系。',
    'auth.register.pass':      '密码',
    'auth.register.passPh':    '至少4个字符',
    'auth.register.pass2':     '确认密码',
    'auth.register.pass2Ph':   '重复密码',
    'auth.register.terms':     '我已阅读并同意',
    'auth.register.termsLink': '使用条款',
    'auth.register.lgpd':      '我授权按照',
    'auth.register.lgpdLink':  '隐私政策处理我的数据',
    'auth.register.submit':    '► 创建账号',
    'auth.register.saving':    '正在保存到服务器...',
    'auth.register.toLogin':   '我已有账号',

    'controls.title':          '⚔ 英雄指南 ⚔',
    'controls.back':           '◄ 返回',
    'select.title':            '♛ 选择王国 ♛',
    'select.hint':             '随着您的进展,封闭的王国将解锁。',

    'pause.title':             '⌛ 旅程暂停',
    'pause.resume':            '继续',
    'pause.restart':           '重启王国',
    'pause.menu':              '主大厅',

    'gameover.title':          '✝ 战死沙场 ✝',
    'gameover.score':          '荣誉',
    'gameover.coins':          '知识',
    'gameover.retry':          '⚔ 再次拿起剑',
    'gameover.menu':           '主大厅',

    'complete.title':          '♛ 王国解放! ♛',
    'complete.next':           '下一个王国 ►',
    'complete.menu':           '主大厅',

    'victory.title':           '⚔ 任务完成 ⚔',
    'victory.menu':            '► 主大厅',
    'victory.devCredits':      '项目成员',
    'victory.pressEnter':      '> 按 ENTER',

    'terms.title':             '使用条款',
    'terms.understood':        '► 我已了解',
    'lgpd.title':              '隐私政策',

    'admin.title':             '管理面板',
    'admin.players':           '玩家',
    'admin.source':            '来源',
    'admin.updated':           '更新于',
    'admin.searchPh':          '按姓名或邮箱搜索...',
    'admin.refresh':           '↻ 刷新',
    'admin.col.player':        '玩家',
    'admin.col.email':         '邮箱',
    'admin.col.phone':         '电话',
    'admin.col.levels':        '关卡',
    'admin.col.score':         '分数',
    'admin.col.actions':       '操作',

    'rotate.title':            '请旋转设备',
    'rotate.sub':              '此游戏在横向模式下体验最佳',

    'press.touch':             '> 点击或按 ENTER',
    'press.continue':          '> 点击或按 ENTER 继续',
  },

  // ============ JA ============
  'ja': {
    'lang.title':              '言語を選択',
    'lang.subtitle':           '冒険を始めるには言語を選んでください',
    'lang.confirm':            '► 確認',

    'menu.brand':              'B42 EDTECH ⚔ 提供',
    'menu.subtitle':           '知識の王国を巡る2Dアドベンチャー',
    'menu.start':              '⚔ 旅をはじめる',
    'menu.select':             '王国を選ぶ',
    'menu.controls':           '英雄の手引き',
    'menu.ranking':            'ランキング',
    'menu.admin':              '♛ 王室の間',
    'menu.reset':              'やり直す',
    'menu.credit':             '制作',

    'hud.heroine':             '⚔ 主人公',
    'hud.knowledge':           '知識',
    'hud.world':               '王国',
    'hud.energy':              '気力',
    'hud.lives':               'ライフ',
    'hud.power':               'アーティファクト',

    'auth.login.title':        '⚔ 王国に入る',
    'auth.login.name':         '騎士の名前',
    'auth.login.namePh':       'あなたの戦闘名',
    'auth.login.pass':         'パスワード',
    'auth.login.passPh':       'パスワード',
    'auth.login.submit':       '► 入る',
    'auth.login.connecting':   '接続中...',
    'auth.login.toRegister':   '新規アカウント作成',
    'auth.login.guest':        '旅人として出発',

    'auth.register.title':     '⚔ 新しい騎士を作る',
    'auth.register.name':      'プレイヤー名',
    'auth.register.namePh':    '一意の名前を選んでください',
    'auth.register.email':     'メール',
    'auth.register.emailPh':   'your@email.com',
    'auth.register.phone':     '電話(WhatsApp)',
    'auth.register.phonePh':   '+81 90-1234-5678',
    'auth.register.phoneHint': 'ゲーム関連の連絡にのみ使用。',
    'auth.register.pass':      'パスワード',
    'auth.register.passPh':    '最低4文字',
    'auth.register.pass2':     'パスワード確認',
    'auth.register.pass2Ph':   'パスワードを再入力',
    'auth.register.terms':     '以下を読み同意します',
    'auth.register.termsLink': '利用規約',
    'auth.register.lgpd':      'データ処理を以下に従い承認します',
    'auth.register.lgpdLink':  'プライバシーポリシー',
    'auth.register.submit':    '► アカウント作成',
    'auth.register.saving':    'サーバーに保存中...',
    'auth.register.toLogin':   '既にアカウントあり',

    'controls.title':          '⚔ 英雄の手引き ⚔',
    'controls.back':           '◄ 戻る',
    'select.title':            '♛ 王国を選ぶ ♛',
    'select.hint':             '進むと封印された王国が開きます。',

    'pause.title':             '⌛ 一時停止',
    'pause.resume':            '再開',
    'pause.restart':           '王国を再開',
    'pause.menu':              'メインホール',

    'gameover.title':          '✝ 戦いに散る ✝',
    'gameover.score':          '名誉',
    'gameover.coins':          '知識',
    'gameover.retry':          '⚔ 剣を取り直す',
    'gameover.menu':           'メインホール',

    'complete.title':          '♛ 王国解放! ♛',
    'complete.next':           '次の王国 ►',
    'complete.menu':           'メインホール',

    'victory.title':           '⚔ ミッション完了 ⚔',
    'victory.menu':            '► メインホール',
    'victory.devCredits':      '制作メンバー',
    'victory.pressEnter':      '> ENTER を押してください',

    'terms.title':             '利用規約',
    'terms.understood':        '► 了解',
    'lgpd.title':              'プライバシーポリシー',

    'admin.title':             '管理パネル',
    'admin.players':           'プレイヤー',
    'admin.source':            'ソース',
    'admin.updated':           '更新',
    'admin.searchPh':          '名前またはメールで検索...',
    'admin.refresh':           '↻ 更新',
    'admin.col.player':        'プレイヤー',
    'admin.col.email':         'メール',
    'admin.col.phone':         '電話',
    'admin.col.levels':        'ステージ',
    'admin.col.score':         'スコア',
    'admin.col.actions':       '操作',

    'rotate.title':            '端末を回転',
    'rotate.sub':              'このゲームは横向きでお楽しみください',

    'press.touch':             '> タップまたは ENTER',
    'press.continue':          '> タップまたは ENTER で続行',
  },

  // ============ KO ============
  'ko': {
    'lang.title':              '언어 선택',
    'lang.subtitle':           '여정을 시작하려면 언어를 선택하세요',
    'lang.confirm':            '► 확인',

    'menu.brand':              'B42 EDTECH ⚔ 제공',
    'menu.subtitle':           '지식 왕국을 통한 2D 어드벤처',
    'menu.start':              '⚔ 여정 시작',
    'menu.select':             '왕국 선택',
    'menu.controls':           '영웅의 안내서',
    'menu.ranking':            '랭킹',
    'menu.admin':              '♛ 왕실의 방',
    'menu.reset':              '다시 시작',
    'menu.credit':             '제작',

    'hud.heroine':             '⚔ 여주인공',
    'hud.knowledge':           '지식',
    'hud.world':               '왕국',
    'hud.energy':              '활력',
    'hud.lives':               '생명',
    'hud.power':               '유물',

    'auth.login.title':        '⚔ 왕국 입장',
    'auth.login.name':         '기사의 이름',
    'auth.login.namePh':       '전투 이름',
    'auth.login.pass':         '비밀번호',
    'auth.login.passPh':       '비밀번호',
    'auth.login.submit':       '► 입장',
    'auth.login.connecting':   '연결 중...',
    'auth.login.toRegister':   '새 계정 만들기',
    'auth.login.guest':        '여행자로 출발',

    'auth.register.title':     '⚔ 새 기사 만들기',
    'auth.register.name':      '플레이어 이름',
    'auth.register.namePh':    '고유한 이름 선택',
    'auth.register.email':     '이메일',
    'auth.register.emailPh':   'your@email.com',
    'auth.register.phone':     '전화(WhatsApp)',
    'auth.register.phonePh':   '+82 10-1234-5678',
    'auth.register.phoneHint': '게임 관련 연락에만 사용됩니다.',
    'auth.register.pass':      '비밀번호',
    'auth.register.passPh':    '최소 4자',
    'auth.register.pass2':     '비밀번호 확인',
    'auth.register.pass2Ph':   '비밀번호 재입력',
    'auth.register.terms':     '읽고 동의합니다',
    'auth.register.termsLink': '이용 약관',
    'auth.register.lgpd':      '다음에 따라 데이터 처리를 승인합니다',
    'auth.register.lgpdLink':  '개인정보 처리방침',
    'auth.register.submit':    '► 계정 만들기',
    'auth.register.saving':    '서버에 저장 중...',
    'auth.register.toLogin':   '이미 계정 있음',

    'controls.title':          '⚔ 영웅의 안내서 ⚔',
    'controls.back':           '◄ 뒤로',
    'select.title':            '♛ 왕국 선택 ♛',
    'select.hint':             '진행할수록 봉인된 왕국이 열립니다.',

    'pause.title':             '⌛ 일시 정지',
    'pause.resume':            '계속',
    'pause.restart':           '왕국 재시작',
    'pause.menu':              '메인 홀',

    'gameover.title':          '✝ 전투에서 쓰러짐 ✝',
    'gameover.score':          '명예',
    'gameover.coins':          '지식',
    'gameover.retry':          '⚔ 다시 칼을 들다',
    'gameover.menu':           '메인 홀',

    'complete.title':          '♛ 왕국 해방! ♛',
    'complete.next':           '다음 왕국 ►',
    'complete.menu':           '메인 홀',

    'victory.title':           '⚔ 임무 완료 ⚔',
    'victory.menu':            '► 메인 홀',
    'victory.devCredits':      '프로젝트 팀',
    'victory.pressEnter':      '> ENTER를 누르세요',

    'terms.title':             '이용 약관',
    'terms.understood':        '► 이해했습니다',
    'lgpd.title':              '개인정보 처리방침',

    'admin.title':             '관리자 패널',
    'admin.players':           '플레이어',
    'admin.source':            '출처',
    'admin.updated':           '업데이트',
    'admin.searchPh':          '이름 또는 이메일 검색...',
    'admin.refresh':           '↻ 새로 고침',
    'admin.col.player':        '플레이어',
    'admin.col.email':         '이메일',
    'admin.col.phone':         '전화',
    'admin.col.levels':        '스테이지',
    'admin.col.score':         '점수',
    'admin.col.actions':       '작업',

    'rotate.title':            '기기를 회전하세요',
    'rotate.sub':              '이 게임은 가로 모드에서 가장 좋습니다',

    'press.touch':             '> 탭 또는 ENTER',
    'press.continue':          '> 탭 또는 ENTER로 계속',
  },

  // ============ RU ============
  'ru': {
    'lang.title':              'ВЫБЕРИТЕ ЯЗЫК',
    'lang.subtitle':           'Выберите язык, чтобы начать путешествие',
    'lang.confirm':            '► ПОДТВЕРДИТЬ',

    'menu.brand':              'B42 EDTECH ⚔ ПРЕДСТАВЛЯЕТ',
    'menu.subtitle':           '2D-ПРИКЛЮЧЕНИЕ ПО КОРОЛЕВСТВУ ЗНАНИЙ',
    'menu.start':              '⚔ НАЧАТЬ ПУТЬ',
    'menu.select':             'ВЫБРАТЬ КОРОЛЕВСТВО',
    'menu.controls':           'РУКОВОДСТВО ГЕРОЯ',
    'menu.ranking':            'РЕЙТИНГ',
    'menu.admin':              '♛ КОРОЛЕВСКАЯ ПАЛАТА',
    'menu.reset':              'ПЕРЕЗАПУСТИТЬ ПУТЬ',
    'menu.credit':             'Создано',

    'hud.heroine':             '⚔ ГЕРОИНЯ',
    'hud.knowledge':           'ЗНАНИЯ',
    'hud.world':               'КОРОЛЕВСТВО',
    'hud.energy':              'СИЛА',
    'hud.lives':               'ЖИЗНИ',
    'hud.power':               'АРТЕФАКТ',

    'auth.login.title':        '⚔ ВОЙТИ В КОРОЛЕВСТВО',
    'auth.login.name':         'ИМЯ РЫЦАРЯ',
    'auth.login.namePh':       'Ваше боевое имя',
    'auth.login.pass':         'СЕКРЕТНЫЙ ПАРОЛЬ',
    'auth.login.passPh':       'Ваш пароль',
    'auth.login.submit':       '► ВОЙТИ',
    'auth.login.connecting':   'ПОДКЛЮЧЕНИЕ...',
    'auth.login.toRegister':   'СОЗДАТЬ АККАУНТ',
    'auth.login.guest':        'ИДТИ КАК СТРАННИК',

    'auth.register.title':     '⚔ СОЗДАТЬ НОВОГО РЫЦАРЯ',
    'auth.register.name':      'ИМЯ ИГРОКА',
    'auth.register.namePh':    'Выберите уникальное имя',
    'auth.register.email':     'EMAIL',
    'auth.register.emailPh':   'your@email.com',
    'auth.register.phone':     'ТЕЛЕФОН (WHATSAPP)',
    'auth.register.phonePh':   '+7 912 345 67 89',
    'auth.register.phoneHint': 'Используется только для игры.',
    'auth.register.pass':      'ПАРОЛЬ',
    'auth.register.passPh':    'Минимум 4 символа',
    'auth.register.pass2':     'ПОДТВЕРДИТЕ ПАРОЛЬ',
    'auth.register.pass2Ph':   'Повторите пароль',
    'auth.register.terms':     'Я прочитал и принимаю',
    'auth.register.termsLink': 'Условия использования',
    'auth.register.lgpd':      'Я разрешаю обработку моих данных согласно',
    'auth.register.lgpdLink':  'Политике конфиденциальности',
    'auth.register.submit':    '► СОЗДАТЬ АККАУНТ',
    'auth.register.saving':    'СОХРАНЕНИЕ НА СЕРВЕРЕ...',
    'auth.register.toLogin':   'У МЕНЯ ЕСТЬ АККАУНТ',

    'controls.title':          '⚔ РУКОВОДСТВО ГЕРОЯ ⚔',
    'controls.back':           '◄ НАЗАД',
    'select.title':            '♛ ВЫБРАТЬ КОРОЛЕВСТВО ♛',
    'select.hint':             'Запечатанные королевства открываются по мере прогресса.',

    'pause.title':             '⌛ ПУТЕШЕСТВИЕ НА ПАУЗЕ',
    'pause.resume':            'ПРОДОЛЖИТЬ',
    'pause.restart':           'ПЕРЕЗАПУСТИТЬ',
    'pause.menu':              'ГЛАВНЫЙ ЗАЛ',

    'gameover.title':          '✝ ПАЛ В БИТВЕ ✝',
    'gameover.score':          'ЧЕСТЬ',
    'gameover.coins':          'ЗНАНИЯ',
    'gameover.retry':          '⚔ ПОДНЯТЬ МЕЧ',
    'gameover.menu':           'ГЛАВНЫЙ ЗАЛ',

    'complete.title':          '♛ КОРОЛЕВСТВО ОСВОБОЖДЕНО! ♛',
    'complete.next':           'СЛЕДУЮЩЕЕ КОРОЛЕВСТВО ►',
    'complete.menu':           'ГЛАВНЫЙ ЗАЛ',

    'victory.title':           '⚔ МИССИЯ ВЫПОЛНЕНА ⚔',
    'victory.menu':            '► ГЛАВНЫЙ ЗАЛ',
    'victory.devCredits':      'ПРОЕКТ КОМАНДЫ',
    'victory.pressEnter':      '> НАЖМИТЕ ENTER',

    'terms.title':             'УСЛОВИЯ ИСПОЛЬЗОВАНИЯ',
    'terms.understood':        '► ПОНЯТНО',
    'lgpd.title':              'ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ',

    'admin.title':             'ПАНЕЛЬ АДМИНА',
    'admin.players':           'ИГРОКИ',
    'admin.source':            'ИСТОЧНИК',
    'admin.updated':           'ОБНОВЛЕНО',
    'admin.searchPh':          'Поиск по имени или email...',
    'admin.refresh':           '↻ ОБНОВИТЬ',
    'admin.col.player':        'ИГРОК',
    'admin.col.email':         'EMAIL',
    'admin.col.phone':         'ТЕЛЕФОН',
    'admin.col.levels':        'УРОВНИ',
    'admin.col.score':         'ОЧКИ',
    'admin.col.actions':       'ДЕЙСТВИЯ',

    'rotate.title':            'ПОВЕРНИТЕ УСТРОЙСТВО',
    'rotate.sub':              'Лучше играть в горизонтальном режиме',

    'press.touch':             '> НАЖМИТЕ ИЛИ ENTER',
    'press.continue':          '> НАЖМИТЕ ИЛИ ENTER ДЛЯ ПРОДОЛЖЕНИЯ',
  },
};

let currentLang = 'pt-BR';

function getStoredLang() {
  try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
}

function setLang(code) {
  if (!STRINGS[code]) code = 'pt-BR';
  currentLang = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
  applyTo(document);
  document.documentElement.lang = LANGS[code].code;
  // dispara evento pra outras partes do código reagirem
  try { window.dispatchEvent(new CustomEvent('b42:langChanged', { detail: { lang: code } })); } catch (e) {}
}

function getLang() { return currentLang; }
function hasStoredLang() { return !!getStoredLang(); }
function getLangs() { return LANGS; }

function t(key, fallback) {
  const dict = STRINGS[currentLang] || STRINGS['pt-BR'];
  if (dict[key] != null) return dict[key];
  if (STRINGS['pt-BR'][key] != null) return STRINGS['pt-BR'][key];
  return fallback != null ? fallback : key;
}

// Aplica traduções em elementos com [data-i18n="key"], placeholders
// com [data-i18n-ph="key"] e títulos com [data-i18n-title="key"].
function applyTo(root) {
  if (!root) return;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
}

// Inicializa: lê do storage, define currentLang e aplica.
function init() {
  const stored = getStoredLang();
  if (stored && STRINGS[stored]) {
    currentLang = stored;
  } else {
    currentLang = 'pt-BR';
  }
  document.documentElement.lang = LANGS[currentLang].code;
  // Aguarda DOM se ainda não estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyTo(document));
  } else {
    applyTo(document);
  }
}

global.I18N = {
  setLang, getLang, hasStoredLang, getLangs,
  t, applyTo, init, STRINGS,
};

// Auto-init
init();

})(typeof window !== 'undefined' ? window : globalThis);
