/**
 * ============================================================
 * Instagram Browser Automation — Tipos TypeScript
 * ============================================================
 * Definições de tipos para o módulo que usa o Browser Use Cloud
 * para automações no Instagram via browser real (sem API oficial).
 */

// -----------------------------------------------------------
// Tipos de ação suportadas
// -----------------------------------------------------------

export type BrowserActionType =
  | 'follow'           // Seguir um perfil
  | 'unfollow'         // Deixar de seguir
  | 'like'             // Curtir um post
  | 'comment'          // Comentar em um post
  | 'dm'               // Enviar Direct Message
  | 'story'            // Postar Story
  | 'hashtag_scrape'   // Scraping de posts por hashtag
  | 'campaign';        // Campanha sequencial automatizada

// -----------------------------------------------------------
// Custo em créditos por ação
// -----------------------------------------------------------

export const BROWSER_ACTION_COSTS: Record<BrowserActionType, number> = {
  follow:         5,
  unfollow:       3,
  like:           2,
  comment:        8,
  dm:             10,
  story:          20,
  hashtag_scrape: 15,
  campaign:       50,
};

export const BROWSER_ACTION_LABELS: Record<BrowserActionType, string> = {
  follow:         'Seguir Perfil',
  unfollow:       'Deixar de Seguir',
  like:           'Curtir Post',
  comment:        'Comentar Post',
  dm:             'Enviar DM',
  story:          'Postar Story',
  hashtag_scrape: 'Scraping de Hashtag',
  campaign:       'Campanha Sequencial',
};

export const BROWSER_ACTION_EMOJIS: Record<BrowserActionType, string> = {
  follow:         '👤',
  unfollow:       '👋',
  like:           '❤️',
  comment:        '💬',
  dm:             '📩',
  story:          '📸',
  hashtag_scrape: '#️⃣',
  campaign:       '🚀',
};

// -----------------------------------------------------------
// Perfil de sessão (conta Instagram vinculada ao Browser Use)
// -----------------------------------------------------------

export interface BrowserSessionProfile {
  id: string;
  userId: string;
  instagramUsername: string;
  browserProfileId: string;      // ID do profile no Browser Use Cloud
  isAuthenticated: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

// -----------------------------------------------------------
// Task / Job de automação
// -----------------------------------------------------------

export type BrowserTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BrowserTask {
  id: string;
  userId: string;
  sessionId: string;              // Browser Use Cloud session ID
  profileId: string;              // BrowserSessionProfile.id
  instagramUsername: string;
  action: BrowserActionType;
  status: BrowserTaskStatus;
  target?: string;                // username, post URL, hashtag, etc.
  message?: string;               // texto para DM / comentário / legenda
  output?: string;                // resposta final do agente
  liveUrl?: string;               // URL para embed ao vivo (iframe)
  recordingUrl?: string;          // URL do MP4 gravado
  creditsUsed: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// -----------------------------------------------------------
// Requisição de criação de task
// -----------------------------------------------------------

export interface BrowserTaskRequest {
  action: BrowserActionType;
  profileId: string;              // BrowserSessionProfile.id
  target?: string;
  message?: string;
  quantity?: number;              // para campanhas em lote
  hashtagList?: string[];         // para hashtag_scrape
  storyImageUrl?: string;         // para story
}

// -----------------------------------------------------------
// Requisição de criação de perfil de sessão
// -----------------------------------------------------------

export interface CreateProfileRequest {
  instagramUsername: string;
}

// -----------------------------------------------------------
// Respostas da API
// -----------------------------------------------------------

export interface BrowserApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TaskListResponse {
  tasks: BrowserTask[];
  total: number;
}

export interface ProfileListResponse {
  profiles: BrowserSessionProfile[];
}

// -----------------------------------------------------------
// Estado da sessão de autenticação (human-in-the-loop)
// -----------------------------------------------------------

export interface AuthSession {
  sessionId: string;
  liveUrl: string;
  profileId: string;              // ID temporário, salvo após stop()
  instagramUsername: string;
  expiresAt: string;
}

// -----------------------------------------------------------
// Item de campanha
// -----------------------------------------------------------

export interface CampaignItem {
  target: string;
  action: BrowserActionType;
  message?: string;
}

export interface CampaignRequest {
  profileId: string;
  items: CampaignItem[];
  delaySeconds?: number;          // intervalo entre ações (default: 30s)
  name?: string;
}
