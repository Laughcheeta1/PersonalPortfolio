export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'zh'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

const FALLBACK_LOCALE: Locale = 'en';
const LOCALE_STORAGE_KEY = 'portfolio.locale.v1';

type TranslationValues = Record<string, string | number>;

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    'language.label': 'Language',
    'language.en': 'English',
    'language.es': 'Spanish',
    'language.fr': 'French',
    'language.zh': 'Chinese',
    'space.canvasAria': 'Interactive 3D portfolio scene',
    'space.loading.title': 'Loading 3D Portfolio',
    'space.loading.mobilePortrait': 'For the best experience, rotate your phone to landscape.',
    'space.loading.mobileLandscape': 'Landscape mode gives the best viewing experience on mobile.',
    'space.cardHint.tip': 'Tip: click a card to open full details.',
    'space.cardHint.hideAria': 'Hide card click tip permanently',
    'space.cardHint.hide': 'Hide',
    'space.music.on': 'Music: On',
    'space.music.off': 'Music: Off',
    'space.sources.show': 'Show Sources',
    'space.sources.hide': 'Hide Sources',
    'space.subcategoryPanel.aria': 'Selected model subcategory filters',
    'space.subcategoryPanel.title': '{category} Subcategories',
    'chat.aria': 'Portfolio chatbot',
    'chat.title': 'Panda Monk',
    'chat.suggested.aria': 'Suggested questions',
    'chat.prompt.tour': 'Hello, please give me a tour around the page',
    'chat.prompt.work': "Hello, please tell me about Santiago's work experience",
    'chat.prompt.profile': 'Hello, who is Santiago Yepes?',
    'chat.sender.you': 'You',
    'chat.sender.bot': 'Panda Monk',
    'chat.thinking.aria': 'Panda Monk is thinking',
    'chat.input.placeholder': 'Ask a question...',
    'chat.send': 'Send',
    'chat.error.generic': 'Something went wrong while contacting the chatbot. Please try again.',
    'chat.error.rateLimit':
      'Due to many concurrent requests at the moment, for security (money) reasons, I cannot give you an answer at the moment, if you wait me one minute I can help you. In the meantime you can still look at the porfolio manually.',
    'chat.error.creditLimit':
      'Way too many people entered the web page and asked too many questions, therefore due to spending limits I cannot give you an answer right now, I am very sorry. You can still explore the project yourself though',
    'assetCredits.title': 'Asset Credits',
    'assetCredits.music': 'Music:',
    'assetCredits.hdri': 'HDRI:',
    'assetCredits.models': '3D Models:',
    'assetCredits.unknownAuthor': 'Unknown',
    'common.close': 'Close',
    'info.link.repository': 'Repository',
    'info.link.liveDemo': 'Live Demo',
    'info.link.external': 'External Link',
    'runtime.loading.preparingScene': 'Preparing scene...',
    'runtime.loading.failedScene': 'Failed to load scene. Please refresh.',
    'runtime.loading.preparingRenderer': 'Preparing renderer...',
    'runtime.loading.environmentReady': 'Environment ready. Loading models...',
    'runtime.loading.loadingModel': 'Loading model {loaded}/{total}: {model}',
    'runtime.loading.loadingAvatar': 'Loading portfolio guide avatar...',
    'runtime.loading.sceneReady': 'Scene ready',
    'category.work': 'Work',
    'category.education': 'Education',
    'category.projects': 'Projects',
    'category.honors': 'Honors',
    'category.skills': 'Skills',
    'category.personal': 'Personal',
    'subcategory.companies': 'Companies',
    'subcategory.entrepreneurship': 'Entrepreneurship',
    'subcategory.independent-work': 'Independent Work',
    'subcategory.university': 'University',
    'subcategory.courses': 'Courses',
    'subcategory.personal-projects': 'Personal Projects',
    'subcategory.work-projects': 'Work Projects',
    'subcategory.awards': 'Awards',
    'subcategory.honors': 'Honors',
    'subcategory.skills-list': 'Skills',
    'subcategory.profile': 'Profile',
    'subcategory.hobbies': 'Hobbies',
    'subcategory.languages': 'Languages',
    'model.0': 'Golden Retriever Sitting',
    'model.1': 'Cosmonaut On A Rocket',
    'model.2': 'Artificial Neural Network',
    'model.3': 'Nixon Burnout Car',
    'model.4': 'Death Earth',
    'model.5': 'Smurf Castle',
  },
  es: {
    'language.label': 'Idioma',
    'language.en': 'Inglés',
    'language.es': 'Español',
    'language.fr': 'Francés',
    'language.zh': 'Chino',
    'space.canvasAria': 'Escena interactiva 3D del portafolio',
    'space.loading.title': 'Cargando portafolio 3D',
    'space.loading.mobilePortrait': 'Para una mejor experiencia, gira tu teléfono a horizontal.',
    'space.loading.mobileLandscape': 'El modo horizontal ofrece la mejor experiencia en móvil.',
    'space.cardHint.tip': 'Consejo: haz clic en una tarjeta para abrir todos los detalles.',
    'space.cardHint.hideAria': 'Ocultar permanentemente la sugerencia de tarjetas',
    'space.cardHint.hide': 'Ocultar',
    'space.music.on': 'Música: Encendida',
    'space.music.off': 'Música: Apagada',
    'space.sources.show': 'Mostrar fuentes',
    'space.sources.hide': 'Ocultar fuentes',
    'space.subcategoryPanel.aria': 'Filtros de subcategorías del modelo seleccionado',
    'space.subcategoryPanel.title': 'Subcategorías de {category}',
    'chat.aria': 'Chatbot del portafolio',
    'chat.title': 'Panda Monk',
    'chat.suggested.aria': 'Preguntas sugeridas',
    'chat.prompt.tour': 'Hola, por favor dame un recorrido por la página',
    'chat.prompt.work': 'Hola, por favor cuéntame sobre la experiencia laboral de Santiago',
    'chat.prompt.profile': 'Hola, ¿quién es Santiago Yepes?',
    'chat.sender.you': 'Tú',
    'chat.sender.bot': 'Panda Monk',
    'chat.thinking.aria': 'Panda Monk está pensando',
    'chat.input.placeholder': 'Haz una pregunta...',
    'chat.send': 'Enviar',
    'chat.error.generic': 'Ocurrió un error al contactar al chatbot. Inténtalo de nuevo.',
    'chat.error.rateLimit':
      'Debido a muchas solicitudes concurrentes en este momento, por razones de seguridad (dinero), no puedo darte una respuesta ahora mismo; si me esperas un minuto, puedo ayudarte. Mientras tanto, puedes revisar el portafolio manualmente.',
    'chat.error.creditLimit':
      'Entraron demasiadas personas a la página web e hicieron demasiadas preguntas; por lo tanto, debido a límites de gasto, no puedo darte una respuesta ahora mismo. Lo siento mucho. Aun así, puedes explorar el proyecto por tu cuenta.',
    'assetCredits.title': 'Créditos de recursos',
    'assetCredits.music': 'Música:',
    'assetCredits.hdri': 'HDRI:',
    'assetCredits.models': 'Modelos 3D:',
    'assetCredits.unknownAuthor': 'Desconocido',
    'common.close': 'Cerrar',
    'info.link.repository': 'Repositorio',
    'info.link.liveDemo': 'Demo en vivo',
    'info.link.external': 'Enlace externo',
    'runtime.loading.preparingScene': 'Preparando escena...',
    'runtime.loading.failedScene': 'No se pudo cargar la escena. Actualiza la página.',
    'runtime.loading.preparingRenderer': 'Preparando renderizador...',
    'runtime.loading.environmentReady': 'Entorno listo. Cargando modelos...',
    'runtime.loading.loadingModel': 'Cargando modelo {loaded}/{total}: {model}',
    'runtime.loading.loadingAvatar': 'Cargando avatar guía del portafolio...',
    'runtime.loading.sceneReady': 'Escena lista',
    'category.work': 'Trabajo',
    'category.education': 'Educación',
    'category.projects': 'Proyectos',
    'category.honors': 'Honores',
    'category.skills': 'Habilidades',
    'category.personal': 'Personal',
    'subcategory.companies': 'Empresas',
    'subcategory.entrepreneurship': 'Emprendimiento',
    'subcategory.independent-work': 'Trabajo independiente',
    'subcategory.university': 'Universidad',
    'subcategory.courses': 'Cursos',
    'subcategory.personal-projects': 'Proyectos personales',
    'subcategory.work-projects': 'Proyectos de trabajo',
    'subcategory.awards': 'Premios',
    'subcategory.honors': 'Honores',
    'subcategory.skills-list': 'Habilidades',
    'subcategory.profile': 'Perfil',
    'subcategory.hobbies': 'Pasatiempos',
    'subcategory.languages': 'Idiomas',
    'model.0': 'Golden Retriever sentado',
    'model.1': 'Cosmonauta en un cohete',
    'model.2': 'Red neuronal artificial',
    'model.3': 'Auto de derrape Nixon',
    'model.4': 'Tierra de la muerte',
    'model.5': 'Castillo de los Pitufos',
  },
  fr: {
    'language.label': 'Langue',
    'language.en': 'Anglais',
    'language.es': 'Espagnol',
    'language.fr': 'Français',
    'language.zh': 'Chinois',
    'space.canvasAria': 'Scène de portfolio 3D interactive',
    'space.loading.title': 'Chargement du portfolio 3D',
    'space.loading.mobilePortrait':
      'Pour une meilleure expérience, faites pivoter votre téléphone en mode paysage.',
    'space.loading.mobileLandscape':
      'Le mode paysage offre la meilleure expérience visuelle sur mobile.',
    'space.cardHint.tip': 'Astuce : cliquez sur une carte pour ouvrir tous les détails.',
    'space.cardHint.hideAria': 'Masquer définitivement l’astuce des cartes',
    'space.cardHint.hide': 'Masquer',
    'space.music.on': 'Musique : Activée',
    'space.music.off': 'Musique : Désactivée',
    'space.sources.show': 'Afficher les sources',
    'space.sources.hide': 'Masquer les sources',
    'space.subcategoryPanel.aria': 'Filtres de sous-catégories du modèle sélectionné',
    'space.subcategoryPanel.title': 'Sous-catégories de {category}',
    'chat.aria': 'Chatbot du portfolio',
    'chat.title': 'Panda Monk',
    'chat.suggested.aria': 'Questions suggérées',
    'chat.prompt.tour': 'Bonjour, peux-tu me faire une visite de la page',
    'chat.prompt.work': "Bonjour, parle-moi de l'expérience professionnelle de Santiago",
    'chat.prompt.profile': 'Bonjour, qui est Santiago Yepes ?',
    'chat.sender.you': 'Vous',
    'chat.sender.bot': 'Panda Monk',
    'chat.thinking.aria': 'Panda Monk réfléchit',
    'chat.input.placeholder': 'Posez une question...',
    'chat.send': 'Envoyer',
    'chat.error.generic':
      "Une erreur s'est produite lors du contact avec le chatbot. Veuillez réessayer.",
    'chat.error.rateLimit':
      'En raison de nombreuses requêtes simultanées en ce moment, pour des raisons de sécurité (coût), je ne peux pas répondre pour l’instant ; si vous attendez une minute, je pourrai vous aider. En attendant, vous pouvez explorer le portfolio manuellement.',
    'chat.error.creditLimit':
      'Trop de personnes sont entrées sur la page web et ont posé trop de questions ; en raison des limites de dépenses, je ne peux pas vous répondre pour le moment. Je suis vraiment désolé. Vous pouvez toutefois explorer le projet par vous-même.',
    'assetCredits.title': 'Crédits des ressources',
    'assetCredits.music': 'Musique :',
    'assetCredits.hdri': 'HDRI :',
    'assetCredits.models': 'Modèles 3D :',
    'assetCredits.unknownAuthor': 'Inconnu',
    'common.close': 'Fermer',
    'info.link.repository': 'Dépôt',
    'info.link.liveDemo': 'Démo en direct',
    'info.link.external': 'Lien externe',
    'runtime.loading.preparingScene': 'Préparation de la scène...',
    'runtime.loading.failedScene': 'Échec du chargement de la scène. Veuillez actualiser.',
    'runtime.loading.preparingRenderer': 'Préparation du moteur de rendu...',
    'runtime.loading.environmentReady': 'Environnement prêt. Chargement des modèles...',
    'runtime.loading.loadingModel': 'Chargement du modèle {loaded}/{total} : {model}',
    'runtime.loading.loadingAvatar': 'Chargement de l’avatar guide du portfolio...',
    'runtime.loading.sceneReady': 'Scène prête',
    'category.work': 'Travail',
    'category.education': 'Éducation',
    'category.projects': 'Projets',
    'category.honors': 'Distinctions',
    'category.skills': 'Compétences',
    'category.personal': 'Personnel',
    'subcategory.companies': 'Entreprises',
    'subcategory.entrepreneurship': 'Entrepreneuriat',
    'subcategory.independent-work': 'Travail indépendant',
    'subcategory.university': 'Université',
    'subcategory.courses': 'Cours',
    'subcategory.personal-projects': 'Projets personnels',
    'subcategory.work-projects': 'Projets professionnels',
    'subcategory.awards': 'Prix',
    'subcategory.honors': 'Distinctions',
    'subcategory.skills-list': 'Compétences',
    'subcategory.profile': 'Profil',
    'subcategory.hobbies': 'Loisirs',
    'subcategory.languages': 'Langues',
    'model.0': 'Golden Retriever assis',
    'model.1': 'Cosmonaute sur une fusée',
    'model.2': 'Réseau neuronal artificiel',
    'model.3': 'Voiture drift Nixon',
    'model.4': 'Terre morte',
    'model.5': 'Château des Schtroumpfs',
  },
  zh: {
    'language.label': '语言',
    'language.en': '英语',
    'language.es': '西班牙语',
    'language.fr': '法语',
    'language.zh': '中文',
    'space.canvasAria': '交互式 3D 作品集场景',
    'space.loading.title': '正在加载 3D 作品集',
    'space.loading.mobilePortrait': '为了获得最佳体验，请将手机横屏。',
    'space.loading.mobileLandscape': '在移动端横屏可获得最佳浏览体验。',
    'space.cardHint.tip': '提示：点击卡片可查看完整详情。',
    'space.cardHint.hideAria': '永久隐藏卡片点击提示',
    'space.cardHint.hide': '隐藏',
    'space.music.on': '音乐：开启',
    'space.music.off': '音乐：关闭',
    'space.sources.show': '显示来源',
    'space.sources.hide': '隐藏来源',
    'space.subcategoryPanel.aria': '已选模型子分类筛选',
    'space.subcategoryPanel.title': '{category} 子分类',
    'chat.aria': '作品集聊天机器人',
    'chat.title': 'Panda Monk',
    'chat.suggested.aria': '推荐问题',
    'chat.prompt.tour': '你好，请带我浏览一下这个页面',
    'chat.prompt.work': '你好，请介绍一下 Santiago 的工作经历',
    'chat.prompt.profile': '你好，Santiago Yepes 是谁？',
    'chat.sender.you': '你',
    'chat.sender.bot': 'Panda Monk',
    'chat.thinking.aria': 'Panda Monk 正在思考',
    'chat.input.placeholder': '请输入问题...',
    'chat.send': '发送',
    'chat.error.generic': '联系聊天机器人时出错。请重试。',
    'chat.error.rateLimit':
      '当前并发请求过多，出于安全（费用）原因，我暂时无法回答你的问题。如果你等待一分钟，我可以继续帮助你。同时你仍可手动浏览作品集。',
    'chat.error.creditLimit':
      '进入页面并提问的人太多了，因此由于预算上限，我现在无法回答你的问题，非常抱歉。你仍然可以自行浏览项目内容。',
    'assetCredits.title': '素材鸣谢',
    'assetCredits.music': '音乐：',
    'assetCredits.hdri': 'HDRI：',
    'assetCredits.models': '3D 模型：',
    'assetCredits.unknownAuthor': '未知',
    'common.close': '关闭',
    'info.link.repository': '代码仓库',
    'info.link.liveDemo': '在线演示',
    'info.link.external': '外部链接',
    'runtime.loading.preparingScene': '正在准备场景...',
    'runtime.loading.failedScene': '场景加载失败，请刷新页面。',
    'runtime.loading.preparingRenderer': '正在准备渲染器...',
    'runtime.loading.environmentReady': '环境已就绪，正在加载模型...',
    'runtime.loading.loadingModel': '正在加载模型 {loaded}/{total}: {model}',
    'runtime.loading.loadingAvatar': '正在加载作品集向导头像...',
    'runtime.loading.sceneReady': '场景已就绪',
    'category.work': '工作',
    'category.education': '教育',
    'category.projects': '项目',
    'category.honors': '荣誉',
    'category.skills': '技能',
    'category.personal': '个人',
    'subcategory.companies': '公司',
    'subcategory.entrepreneurship': '创业',
    'subcategory.independent-work': '独立工作',
    'subcategory.university': '大学',
    'subcategory.courses': '课程',
    'subcategory.personal-projects': '个人项目',
    'subcategory.work-projects': '工作项目',
    'subcategory.awards': '奖项',
    'subcategory.honors': '荣誉',
    'subcategory.skills-list': '技能',
    'subcategory.profile': '简介',
    'subcategory.hobbies': '爱好',
    'subcategory.languages': '语言',
    'model.0': '坐姿金毛犬',
    'model.1': '火箭上的宇航员',
    'model.2': '人工神经网络',
    'model.3': 'Nixon 漂移车',
    'model.4': '死亡地球',
    'model.5': '蓝精灵城堡',
  },
};

export function getLocaleMessages(locale: Locale): Readonly<Record<string, string>> {
  return TRANSLATIONS[locale];
}

function normalizeLocaleTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function toSupportedLocale(tag: string): Locale | null {
  const normalized = normalizeLocaleTag(tag);
  const base = normalized.split('-')[0];
  if ((SUPPORTED_LOCALES as readonly string[]).includes(base)) {
    return base as Locale;
  }
  return null;
}

export function resolvePreferredLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved) {
      const savedLocale = toSupportedLocale(saved);
      if (savedLocale) {
        return savedLocale;
      }
    }
  }

  if (typeof navigator !== 'undefined') {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') {
        continue;
      }
      const locale = toSupportedLocale(candidate);
      if (locale) {
        return locale;
      }
    }
  }

  return FALLBACK_LOCALE;
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function translate(locale: Locale, key: string, values?: TranslationValues): string {
  const template = TRANSLATIONS[locale][key] ?? TRANSLATIONS[FALLBACK_LOCALE][key] ?? key;
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, variable: string) => {
    const value = values[variable];
    return value === undefined ? `{${variable}}` : String(value);
  });
}
