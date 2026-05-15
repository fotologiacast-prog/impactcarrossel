type IconMode = 'emoji' | 'lucide';

type IconEntry = {
  emoji: string;
  lucide?: string;
};

type IconCandidate = {
  icon: string;
  score: number;
};

type ItemLike = {
  title: string;
  text?: string;
};

const FALLBACK_ICON: Record<IconMode, string> = {
  emoji: '📌',
  lucide: 'CircleDot',
};

const ICON_DICTIONARY: Record<string, IconEntry> = {
  'dinheiro': { emoji: '💰', lucide: 'DollarSign' },
  'receita': { emoji: '💰', lucide: 'DollarSign' },
  'faturamento': { emoji: '💰', lucide: 'DollarSign' },
  'lucro': { emoji: '💰', lucide: 'DollarSign' },
  'investimento': { emoji: '💰', lucide: 'DollarSign' },
  'investir': { emoji: '💰', lucide: 'DollarSign' },
  'custo': { emoji: '💸', lucide: 'TrendingDown' },
  'economia': { emoji: '💸', lucide: 'PiggyBank' },
  'economizar': { emoji: '💸', lucide: 'PiggyBank' },
  'barato': { emoji: '💸', lucide: 'PiggyBank' },
  'caro': { emoji: '💸', lucide: 'DollarSign' },
  'preco': { emoji: '🏷️', lucide: 'Tag' },
  'preço': { emoji: '🏷️', lucide: 'Tag' },
  'orcamento': { emoji: '📊', lucide: 'Calculator' },
  'orçamento': { emoji: '📊', lucide: 'Calculator' },
  'venda': { emoji: '🛒', lucide: 'ShoppingCart' },
  'vendas': { emoji: '🛒', lucide: 'ShoppingCart' },
  'compra': { emoji: '🛍️', lucide: 'ShoppingBag' },
  'comprar': { emoji: '🛍️', lucide: 'ShoppingBag' },
  'pagamento': { emoji: '💳', lucide: 'CreditCard' },
  'pagar': { emoji: '💳', lucide: 'CreditCard' },

  'crescimento': { emoji: '📈', lucide: 'TrendingUp' },
  'crescer': { emoji: '📈', lucide: 'TrendingUp' },
  'escalar': { emoji: '🚀', lucide: 'Rocket' },
  'escala': { emoji: '🚀', lucide: 'Rocket' },
  'resultado': { emoji: '📊', lucide: 'BarChart3' },
  'resultados': { emoji: '📊', lucide: 'BarChart3' },
  'metrica': { emoji: '📊', lucide: 'BarChart3' },
  'métrica': { emoji: '📊', lucide: 'BarChart3' },
  'metricas': { emoji: '📊', lucide: 'BarChart3' },
  'métricas': { emoji: '📊', lucide: 'BarChart3' },
  'kpi': { emoji: '📊', lucide: 'BarChart3' },
  'performance': { emoji: '⚡', lucide: 'Zap' },
  'desempenho': { emoji: '⚡', lucide: 'Zap' },
  'meta': { emoji: '🎯', lucide: 'Target' },
  'metas': { emoji: '🎯', lucide: 'Target' },
  'objetivo': { emoji: '🎯', lucide: 'Target' },
  'roi': { emoji: '📈', lucide: 'TrendingUp' },
  'conversao': { emoji: '🔄', lucide: 'Repeat' },
  'conversão': { emoji: '🔄', lucide: 'Repeat' },
  'converter': { emoji: '🔄', lucide: 'Repeat' },
  'taxa': { emoji: '📉', lucide: 'Percent' },
  'aumento': { emoji: '📈', lucide: 'TrendingUp' },
  'aumentar': { emoji: '📈', lucide: 'TrendingUp' },
  'reducao': { emoji: '📉', lucide: 'TrendingDown' },
  'redução': { emoji: '📉', lucide: 'TrendingDown' },
  'reduzir': { emoji: '📉', lucide: 'TrendingDown' },
  'queda': { emoji: '📉', lucide: 'TrendingDown' },
  'triplicar': { emoji: '🔥', lucide: 'Flame' },

  'marketing': { emoji: '📣', lucide: 'Megaphone' },
  'campanha': { emoji: '📣', lucide: 'Megaphone' },
  'marca': { emoji: '✨', lucide: 'Sparkles' },
  'branding': { emoji: '✨', lucide: 'Sparkles' },
  'conteudo': { emoji: '📝', lucide: 'FileText' },
  'conteúdo': { emoji: '📝', lucide: 'FileText' },
  'post': { emoji: '📱', lucide: 'Smartphone' },
  'publicacao': { emoji: '📱', lucide: 'Smartphone' },
  'publicação': { emoji: '📱', lucide: 'Smartphone' },
  'blog': { emoji: '📝', lucide: 'FileText' },
  'artigo': { emoji: '📄', lucide: 'FileText' },
  'seo': { emoji: '🔍', lucide: 'Search' },
  'trafego': { emoji: '🌐', lucide: 'Globe' },
  'tráfego': { emoji: '🌐', lucide: 'Globe' },
  'organico': { emoji: '🌱', lucide: 'Sprout' },
  'orgânico': { emoji: '🌱', lucide: 'Sprout' },
  'anuncio': { emoji: '📢', lucide: 'Volume2' },
  'anúncio': { emoji: '📢', lucide: 'Volume2' },
  'ads': { emoji: '📢', lucide: 'Volume2' },
  'midia': { emoji: '📺', lucide: 'Monitor' },
  'mídia': { emoji: '📺', lucide: 'Monitor' },
  'funil': { emoji: '🔽', lucide: 'Filter' },
  'lead': { emoji: '🧲', lucide: 'Magnet' },
  'leads': { emoji: '🧲', lucide: 'Magnet' },
  'engajamento': { emoji: '💬', lucide: 'MessageCircle' },
  'alcance': { emoji: '📡', lucide: 'Radio' },
  'viral': { emoji: '🔥', lucide: 'Flame' },
  'audiencia': { emoji: '👥', lucide: 'Users' },
  'audiência': { emoji: '👥', lucide: 'Users' },

  'instagram': { emoji: '📸', lucide: 'Instagram' },
  'linkedin': { emoji: '💼', lucide: 'Linkedin' },
  'youtube': { emoji: '▶️', lucide: 'Youtube' },
  'tiktok': { emoji: '🎵', lucide: 'Music' },
  'twitter': { emoji: '🐦', lucide: 'MessageCircle' },
  'rede social': { emoji: '📱', lucide: 'Share2' },
  'redes sociais': { emoji: '📱', lucide: 'Share2' },
  'seguidor': { emoji: '👤', lucide: 'UserPlus' },
  'seguidores': { emoji: '👥', lucide: 'Users' },
  'curtida': { emoji: '❤️', lucide: 'Heart' },
  'like': { emoji: '❤️', lucide: 'Heart' },
  'compartilhar': { emoji: '🔗', lucide: 'Share2' },

  'tempo': { emoji: '⏰', lucide: 'Clock' },
  'hora': { emoji: '🕐', lucide: 'Clock' },
  'horas': { emoji: '🕐', lucide: 'Clock' },
  'minuto': { emoji: '⏱️', lucide: 'Timer' },
  'minutos': { emoji: '⏱️', lucide: 'Timer' },
  'dia': { emoji: '📅', lucide: 'Calendar' },
  'dias': { emoji: '📅', lucide: 'Calendar' },
  'semana': { emoji: '📅', lucide: 'CalendarDays' },
  'mes': { emoji: '📅', lucide: 'Calendar' },
  'mês': { emoji: '📅', lucide: 'Calendar' },
  'ano': { emoji: '📅', lucide: 'Calendar' },
  'rapido': { emoji: '⚡', lucide: 'Zap' },
  'rápido': { emoji: '⚡', lucide: 'Zap' },
  'velocidade': { emoji: '⚡', lucide: 'Zap' },
  'prazo': { emoji: '⏳', lucide: 'Timer' },
  'deadline': { emoji: '⏳', lucide: 'Timer' },
  'urgente': { emoji: '🚨', lucide: 'AlertTriangle' },
  'agora': { emoji: '⏰', lucide: 'Clock' },
  'hoje': { emoji: '📌', lucide: 'Pin' },
  'agenda': { emoji: '📅', lucide: 'Calendar' },
  'rotina': { emoji: '🔄', lucide: 'Repeat' },

  'equipe': { emoji: '👥', lucide: 'Users' },
  'time': { emoji: '👥', lucide: 'Users' },
  'pessoa': { emoji: '👤', lucide: 'User' },
  'pessoas': { emoji: '👥', lucide: 'Users' },
  'cliente': { emoji: '🤝', lucide: 'Handshake' },
  'clientes': { emoji: '🤝', lucide: 'Handshake' },
  'usuario': { emoji: '👤', lucide: 'User' },
  'usuário': { emoji: '👤', lucide: 'User' },
  'parceiro': { emoji: '🤝', lucide: 'Handshake' },
  'parceria': { emoji: '🤝', lucide: 'Handshake' },
  'lider': { emoji: '👑', lucide: 'Crown' },
  'líder': { emoji: '👑', lucide: 'Crown' },
  'lideranca': { emoji: '👑', lucide: 'Crown' },
  'liderança': { emoji: '👑', lucide: 'Crown' },
  'mentor': { emoji: '🧭', lucide: 'Compass' },
  'comunidade': { emoji: '🏘️', lucide: 'Users' },
  'networking': { emoji: '🔗', lucide: 'Link' },
  'contato': { emoji: '📞', lucide: 'Phone' },

  'tecnologia': { emoji: '💻', lucide: 'Laptop' },
  'software': { emoji: '💻', lucide: 'Laptop' },
  'aplicativo': { emoji: '📱', lucide: 'Smartphone' },
  'app': { emoji: '📱', lucide: 'Smartphone' },
  'site': { emoji: '🌐', lucide: 'Globe' },
  'website': { emoji: '🌐', lucide: 'Globe' },
  'plataforma': { emoji: '🖥️', lucide: 'Monitor' },
  'ferramenta': { emoji: '🔧', lucide: 'Wrench' },
  'ferramentas': { emoji: '🔧', lucide: 'Wrench' },
  'automacao': { emoji: '🤖', lucide: 'Bot' },
  'automação': { emoji: '🤖', lucide: 'Bot' },
  'automatizar': { emoji: '🤖', lucide: 'Bot' },
  'automatize': { emoji: '🤖', lucide: 'Bot' },
  'inteligencia': { emoji: '🧠', lucide: 'Brain' },
  'inteligência': { emoji: '🧠', lucide: 'Brain' },
  'ia': { emoji: '🧠', lucide: 'Brain' },
  'dados': { emoji: '📊', lucide: 'Database' },
  'banco de dados': { emoji: '🗄️', lucide: 'Database' },
  'api': { emoji: '🔌', lucide: 'Plug' },
  'integracao': { emoji: '🔌', lucide: 'Plug' },
  'integração': { emoji: '🔌', lucide: 'Plug' },
  'codigo': { emoji: '👨‍💻', lucide: 'Code' },
  'código': { emoji: '👨‍💻', lucide: 'Code' },
  'programacao': { emoji: '👨‍💻', lucide: 'Code' },
  'programação': { emoji: '👨‍💻', lucide: 'Code' },
  'sistema': { emoji: '⚙️', lucide: 'Settings' },
  'cloud': { emoji: '☁️', lucide: 'Cloud' },
  'nuvem': { emoji: '☁️', lucide: 'Cloud' },
  'digital': { emoji: '📲', lucide: 'Smartphone' },

  'aprender': { emoji: '📚', lucide: 'BookOpen' },
  'aprendizado': { emoji: '📚', lucide: 'BookOpen' },
  'estudo': { emoji: '📖', lucide: 'Book' },
  'estudar': { emoji: '📖', lucide: 'Book' },
  'curso': { emoji: '🎓', lucide: 'GraduationCap' },
  'aula': { emoji: '📝', lucide: 'Pencil' },
  'treinamento': { emoji: '🏋️', lucide: 'Dumbbell' },
  'conhecimento': { emoji: '🧠', lucide: 'Brain' },
  'dica': { emoji: '💡', lucide: 'Lightbulb' },
  'dicas': { emoji: '💡', lucide: 'Lightbulb' },
  'ideia': { emoji: '💡', lucide: 'Lightbulb' },
  'ideias': { emoji: '💡', lucide: 'Lightbulb' },
  'insight': { emoji: '💡', lucide: 'Lightbulb' },
  'estrategia': { emoji: '♟️', lucide: 'Puzzle' },
  'estratégia': { emoji: '♟️', lucide: 'Puzzle' },
  'metodo': { emoji: '📋', lucide: 'ClipboardList' },
  'método': { emoji: '📋', lucide: 'ClipboardList' },
  'passo': { emoji: '👣', lucide: 'Footprints' },
  'passos': { emoji: '👣', lucide: 'Footprints' },
  'processo': { emoji: '⚙️', lucide: 'Settings' },
  'framework': { emoji: '🏗️', lucide: 'Blocks' },

  'qualidade': { emoji: '✨', lucide: 'Sparkles' },
  'excelencia': { emoji: '🏆', lucide: 'Trophy' },
  'excelência': { emoji: '🏆', lucide: 'Trophy' },
  'sucesso': { emoji: '🏆', lucide: 'Trophy' },
  'conquista': { emoji: '🏆', lucide: 'Trophy' },
  'vitoria': { emoji: '🏆', lucide: 'Trophy' },
  'vitória': { emoji: '🏆', lucide: 'Trophy' },
  'melhor': { emoji: '⭐', lucide: 'Star' },
  'top': { emoji: '⭐', lucide: 'Star' },
  'premium': { emoji: '💎', lucide: 'Gem' },
  'exclusivo': { emoji: '💎', lucide: 'Gem' },
  'erro': { emoji: '❌', lucide: 'XCircle' },
  'erros': { emoji: '❌', lucide: 'XCircle' },
  'problema': { emoji: '⚠️', lucide: 'AlertTriangle' },
  'problemas': { emoji: '⚠️', lucide: 'AlertTriangle' },
  'solucao': { emoji: '✅', lucide: 'CheckCircle' },
  'solução': { emoji: '✅', lucide: 'CheckCircle' },
  'resolver': { emoji: '✅', lucide: 'CheckCircle' },
  'risco': { emoji: '⚠️', lucide: 'AlertTriangle' },
  'oportunidade': { emoji: '🔓', lucide: 'Unlock' },
  'importante': { emoji: '❗', lucide: 'AlertCircle' },
  'essencial': { emoji: '❗', lucide: 'AlertCircle' },
  'segredo': { emoji: '🔑', lucide: 'Key' },
  'chave': { emoji: '🔑', lucide: 'Key' },
  'diferencial': { emoji: '💎', lucide: 'Gem' },
  'inovacao': { emoji: '🚀', lucide: 'Rocket' },
  'inovação': { emoji: '🚀', lucide: 'Rocket' },
  'simples': { emoji: '✨', lucide: 'Sparkles' },
  'facil': { emoji: '✨', lucide: 'Sparkles' },
  'fácil': { emoji: '✨', lucide: 'Sparkles' },
  'dificil': { emoji: '🧗', lucide: 'Mountain' },
  'difícil': { emoji: '🧗', lucide: 'Mountain' },
  'desafio': { emoji: '🧗', lucide: 'Mountain' },

  'comunicacao': { emoji: '💬', lucide: 'MessageCircle' },
  'comunicação': { emoji: '💬', lucide: 'MessageCircle' },
  'mensagem': { emoji: '✉️', lucide: 'Mail' },
  'email': { emoji: '📧', lucide: 'Mail' },
  'e mail': { emoji: '📧', lucide: 'Mail' },
  'conversa': { emoji: '💬', lucide: 'MessageCircle' },
  'feedback': { emoji: '💬', lucide: 'MessageSquare' },
  'apresentacao': { emoji: '📊', lucide: 'Presentation' },
  'apresentação': { emoji: '📊', lucide: 'Presentation' },
  'reuniao': { emoji: '📋', lucide: 'Clipboard' },
  'reunião': { emoji: '📋', lucide: 'Clipboard' },
  'call': { emoji: '📞', lucide: 'Phone' },
  'ligacao': { emoji: '📞', lucide: 'Phone' },
  'ligação': { emoji: '📞', lucide: 'Phone' },

  'seguranca': { emoji: '🔒', lucide: 'Lock' },
  'segurança': { emoji: '🔒', lucide: 'Lock' },
  'seguro': { emoji: '🛡️', lucide: 'Shield' },
  'protecao': { emoji: '🛡️', lucide: 'Shield' },
  'proteção': { emoji: '🛡️', lucide: 'Shield' },
  'privacidade': { emoji: '🔒', lucide: 'Lock' },
  'confianca': { emoji: '🤝', lucide: 'ShieldCheck' },
  'confiança': { emoji: '🤝', lucide: 'ShieldCheck' },
  'garantia': { emoji: '✅', lucide: 'BadgeCheck' },
  'credibilidade': { emoji: '🏅', lucide: 'Award' },
  'autoridade': { emoji: '🏅', lucide: 'Award' },
  'prova social': { emoji: '⭐', lucide: 'Star' },
  'depoimento': { emoji: '💬', lucide: 'MessageCircle' },

  'criar': { emoji: '🎨', lucide: 'Palette' },
  'construir': { emoji: '🏗️', lucide: 'Hammer' },
  'lancar': { emoji: '🚀', lucide: 'Rocket' },
  'lançar': { emoji: '🚀', lucide: 'Rocket' },
  'lancamento': { emoji: '🚀', lucide: 'Rocket' },
  'lançamento': { emoji: '🚀', lucide: 'Rocket' },
  'comecar': { emoji: '▶️', lucide: 'Play' },
  'começar': { emoji: '▶️', lucide: 'Play' },
  'iniciar': { emoji: '▶️', lucide: 'Play' },
  'parar': { emoji: '⏹️', lucide: 'Square' },
  'evitar': { emoji: '🚫', lucide: 'Ban' },
  'focar': { emoji: '🎯', lucide: 'Target' },
  'foco': { emoji: '🎯', lucide: 'Target' },
  'planejar': { emoji: '📋', lucide: 'ClipboardList' },
  'organizar': { emoji: '📂', lucide: 'Folder' },
  'analisar': { emoji: '🔎', lucide: 'Search' },
  'analise': { emoji: '🔎', lucide: 'Search' },
  'análise': { emoji: '🔎', lucide: 'Search' },
  'testar': { emoji: '🧪', lucide: 'FlaskConical' },
  'teste': { emoji: '🧪', lucide: 'FlaskConical' },
  'validar': { emoji: '✅', lucide: 'CheckCircle' },
  'otimizar': { emoji: '⚡', lucide: 'Zap' },
  'melhorar': { emoji: '📈', lucide: 'TrendingUp' },
  'transformar': { emoji: '🔄', lucide: 'RefreshCw' },
  'conectar': { emoji: '🔗', lucide: 'Link' },
  'salvar': { emoji: '💾', lucide: 'Save' },
  'baixar': { emoji: '⬇️', lucide: 'Download' },
  'enviar': { emoji: '📤', lucide: 'Send' },
  'configurar': { emoji: '⚙️', lucide: 'Settings' },
  'personalizar': { emoji: '🎨', lucide: 'Palette' },
  'acompanhar': { emoji: '👁️', lucide: 'Eye' },
  'monitorar': { emoji: '👁️', lucide: 'Eye' },

  'saude': { emoji: '❤️', lucide: 'HeartPulse' },
  'saúde': { emoji: '❤️', lucide: 'HeartPulse' },
  'exercicio': { emoji: '🏋️', lucide: 'Dumbbell' },
  'exercício': { emoji: '🏋️', lucide: 'Dumbbell' },
  'treino': { emoji: '🏋️', lucide: 'Dumbbell' },
  'alimentacao': { emoji: '🥗', lucide: 'Apple' },
  'alimentação': { emoji: '🥗', lucide: 'Apple' },
  'dieta': { emoji: '🥗', lucide: 'Apple' },
  'sono': { emoji: '😴', lucide: 'Moon' },
  'dormir': { emoji: '😴', lucide: 'Moon' },
  'mental': { emoji: '🧠', lucide: 'Brain' },
  'estresse': { emoji: '😤', lucide: 'Frown' },
  'energia': { emoji: '⚡', lucide: 'BatteryCharging' },

  'medico': { emoji: '🩺', lucide: 'Stethoscope' },
  'médico': { emoji: '🩺', lucide: 'Stethoscope' },
  'medica': { emoji: '🩺', lucide: 'Stethoscope' },
  'médica': { emoji: '🩺', lucide: 'Stethoscope' },
  'medicina': { emoji: '🩺', lucide: 'Stethoscope' },
  'clinica': { emoji: '🏥', lucide: 'Building2' },
  'clínica': { emoji: '🏥', lucide: 'Building2' },
  'consultorio': { emoji: '🏥', lucide: 'Building2' },
  'consultório': { emoji: '🏥', lucide: 'Building2' },
  'consulta': { emoji: '🗓️', lucide: 'ClipboardPlus' },
  'consultas': { emoji: '🗓️', lucide: 'ClipboardPlus' },
  'paciente': { emoji: '🧑‍⚕️', lucide: 'UserRound' },
  'pacientes': { emoji: '🧑‍⚕️', lucide: 'Users' },
  'prontuario': { emoji: '📋', lucide: 'ClipboardPlus' },
  'prontuário': { emoji: '📋', lucide: 'ClipboardPlus' },
  'diagnostico': { emoji: '🔎', lucide: 'ScanEye' },
  'diagnóstico': { emoji: '🔎', lucide: 'ScanEye' },
  'exame': { emoji: '🧪', lucide: 'ScanEye' },
  'exames': { emoji: '🧪', lucide: 'ScanEye' },
  'tratamento': { emoji: '💊', lucide: 'PillBottle' },
  'tratamentos': { emoji: '💊', lucide: 'PillBottle' },
  'procedimento': { emoji: '🩹', lucide: 'Syringe' },
  'procedimentos': { emoji: '🩹', lucide: 'Syringe' },
  'cirurgia': { emoji: '🩹', lucide: 'Syringe' },
  'cirurgico': { emoji: '🩹', lucide: 'Syringe' },
  'cirúrgico': { emoji: '🩹', lucide: 'Syringe' },
  'anamnese': { emoji: '📝', lucide: 'ClipboardPlus' },
  'bioseguranca': { emoji: '🛡️', lucide: 'ShieldPlus' },
  'biosegurança': { emoji: '🛡️', lucide: 'ShieldPlus' },
  'odontologia': { emoji: '🦷', lucide: 'SmilePlus' },
  'odontologica': { emoji: '🦷', lucide: 'SmilePlus' },
  'odontologico': { emoji: '🦷', lucide: 'SmilePlus' },
  'odontológica': { emoji: '🦷', lucide: 'SmilePlus' },
  'dentista': { emoji: '🦷', lucide: 'SmilePlus' },
  'dentistas': { emoji: '🦷', lucide: 'SmilePlus' },
  'dente': { emoji: '🦷', lucide: 'Smile' },
  'dentes': { emoji: '🦷', lucide: 'Smile' },
  'sorriso': { emoji: '😁', lucide: 'Smile' },
  'clareamento': { emoji: '✨', lucide: 'Sparkles' },
  'ortodontia': { emoji: '🦷', lucide: 'SmilePlus' },
  'endodontia': { emoji: '🦷', lucide: 'SmilePlus' },
  'periodontia': { emoji: '🦷', lucide: 'SmilePlus' },
  'implante': { emoji: '🦷', lucide: 'SmilePlus' },
  'implantes': { emoji: '🦷', lucide: 'SmilePlus' },
  'protese': { emoji: '🦷', lucide: 'SmilePlus' },
  'prótese': { emoji: '🦷', lucide: 'SmilePlus' },
  'lente': { emoji: '✨', lucide: 'Sparkles' },
  'faceta': { emoji: '✨', lucide: 'Sparkles' },
  'bucal': { emoji: '🦷', lucide: 'Smile' },
  'oral': { emoji: '🦷', lucide: 'Smile' },

  'local': { emoji: '📍', lucide: 'MapPin' },
  'lugar': { emoji: '📍', lucide: 'MapPin' },
  'mapa': { emoji: '🗺️', lucide: 'Map' },
  'casa': { emoji: '🏠', lucide: 'Home' },
  'escritorio': { emoji: '🏢', lucide: 'Building' },
  'escritório': { emoji: '🏢', lucide: 'Building' },
  'empresa': { emoji: '🏢', lucide: 'Building2' },
  'loja': { emoji: '🏪', lucide: 'Store' },
  'mundo': { emoji: '🌎', lucide: 'Globe' },
  'global': { emoji: '🌎', lucide: 'Globe' },
};

const CATEGORY_FALLBACKS: Array<{
  keywords: string[];
  fallbackEmoji: string;
  fallbackLucide: string;
}> = [
  { keywords: ['fazer', 'criar', 'desenvolver', 'implementar', 'executar', 'produzir', 'gerar'], fallbackEmoji: '⚡', fallbackLucide: 'Zap' },
  { keywords: ['entender', 'compreender', 'saber', 'descobrir', 'identificar', 'perceber', 'notar'], fallbackEmoji: '🔍', fallbackLucide: 'Search' },
  { keywords: ['falar', 'dizer', 'contar', 'mostrar', 'explicar', 'apresentar', 'demonstrar'], fallbackEmoji: '💬', fallbackLucide: 'MessageCircle' },
  { keywords: ['nao', 'não', 'nunca', 'evite', 'pare', 'cuidado', 'atencao', 'atenção', 'sem'], fallbackEmoji: '⚠️', fallbackLucide: 'AlertTriangle' },
  { keywords: ['medico', 'medica', 'clinica', 'consulta', 'paciente', 'diagnostico', 'tratamento'], fallbackEmoji: '🩺', fallbackLucide: 'Stethoscope' },
  { keywords: ['dentista', 'odontologia', 'dente', 'dentes', 'sorriso', 'implante', 'protese', 'clareamento'], fallbackEmoji: '🦷', fallbackLucide: 'SmilePlus' },
  { keywords: ['mais', 'maior', 'principal', 'primeiro', 'fundamental', 'crucial'], fallbackEmoji: '⭐', fallbackLucide: 'Star' },
  { keywords: ['primeiro', 'segundo', 'terceiro', 'quarto', 'quinto'], fallbackEmoji: '📌', fallbackLucide: 'Pin' },
];

export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTokens(text: string): string[] {
  const normalized = normalizeForSearch(text);
  const words = normalized.split(' ').filter((word) => word.length > 1);
  const tokens: string[] = [];

  for (let index = 0; index < words.length - 1; index += 1) {
    tokens.push(`${words[index]} ${words[index + 1]}`);
  }

  tokens.push(...words);
  return tokens;
}

export function simpleStem(word: string): string {
  return normalizeForSearch(word)
    .replace(/(coes|ções|cao|ção|mente|dade|idade|ismo|ista|avel|ável|ivel|ível|oso|osa|eiro|eira)$/u, '')
    .replace(/(ando|endo|indo|ado|ido|ar|er|ir|ou)$/u, '')
    .replace(/(s|es|ns)$/u, '');
}

function candidateIcon(entry: IconEntry, mode: IconMode) {
  return mode === 'lucide' && entry.lucide ? entry.lucide : entry.emoji;
}

function pushCandidate(
  candidates: IconCandidate[],
  icon: string,
  score: number,
) {
  const existing = candidates.find((candidate) => candidate.icon === icon);
  if (existing) {
    existing.score = Math.max(existing.score, score);
    return;
  }
  candidates.push({ icon, score });
}

function getCategoryFallback(text: string, mode: IconMode): string | null {
  const normalized = normalizeForSearch(text);

  for (const category of CATEGORY_FALLBACKS) {
    if (category.keywords.some((keyword) => normalized.includes(keyword))) {
      return mode === 'lucide' ? category.fallbackLucide : category.fallbackEmoji;
    }
  }

  return null;
}

function collectCandidates(text: string, mode: IconMode): IconCandidate[] {
  const tokens = extractTokens(text);
  const candidates: IconCandidate[] = [];

  for (const token of tokens) {
    const entry = ICON_DICTIONARY[token];
    if (entry) pushCandidate(candidates, candidateIcon(entry, mode), 100);
  }

  for (const token of tokens) {
    for (const [keyword, entry] of Object.entries(ICON_DICTIONARY)) {
      if (token.includes(keyword) || keyword.includes(token)) {
        pushCandidate(candidates, candidateIcon(entry, mode), 60);
      }
    }
  }

  for (const token of tokens) {
    const stem = simpleStem(token);
    for (const [keyword, entry] of Object.entries(ICON_DICTIONARY)) {
      if (simpleStem(keyword) === stem) {
        pushCandidate(candidates, candidateIcon(entry, mode), 40);
      }
    }
  }

  const categoryFallback = getCategoryFallback(text, mode);
  if (categoryFallback) pushCandidate(candidates, categoryFallback, 20);

  return candidates.sort((left, right) => right.score - left.score);
}

export function resolveIcon(text: string, mode: IconMode = 'emoji'): string {
  const candidates = collectCandidates(text, mode);
  if (candidates.length > 0) return candidates[0].icon;
  return FALLBACK_ICON[mode];
}

function resolveIconWithExclusions(
  text: string,
  mode: IconMode,
  excluded: Set<string>,
): string {
  const candidates = collectCandidates(text, mode);

  for (const candidate of candidates) {
    if (!excluded.has(candidate.icon)) return candidate.icon;
  }

  if (candidates.length > 0) return candidates[0].icon;
  return FALLBACK_ICON[mode];
}

export function resolveIconsForList(
  items: ItemLike[],
  mode: IconMode = 'emoji',
): string[] {
  const usedIcons = new Set<string>();

  return items.map((item) => {
    const fullText = [item.title, item.text].filter(Boolean).join(' ');
    const icon = resolveIconWithExclusions(fullText, mode, usedIcons);
    usedIcons.add(icon);
    return icon;
  });
}

export function resolveIconsWithContext(
  items: ItemLike[],
  slideTitle: string,
  mode: IconMode = 'emoji',
): string[] {
  const individuallyResolved = resolveIconsForList(items, mode);
  const fallbackIcon = FALLBACK_ICON[mode];
  const fallbackCount = individuallyResolved.filter((icon) => icon === fallbackIcon).length;

  if (fallbackCount <= items.length * 0.4) {
    return individuallyResolved;
  }

  const contextIcon = resolveIcon(slideTitle, mode);
  if (contextIcon === fallbackIcon) {
    return individuallyResolved;
  }

  const usedIcons = new Set<string>();

  return items.map((item, index) => {
    const current = individuallyResolved[index];
    if (current !== fallbackIcon) {
      usedIcons.add(current);
      return current;
    }

    const enrichedText = `${slideTitle} ${item.title} ${item.text || ''}`.trim();
    const resolved = resolveIconWithExclusions(enrichedText, mode, usedIcons);
    usedIcons.add(resolved);
    return resolved;
  });
}
