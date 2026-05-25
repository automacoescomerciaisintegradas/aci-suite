/**
 * ============================================================
 * Instagram Browser Automation Service
 * ============================================================
 * Wrapper sobre o browser-use-sdk para automações no Instagram
 * via browser real. Integrado ao sistema de créditos do ACI.
 *
 * Documentação SDK: https://docs.browser-use.com/cloud/quickstart
 */

import type {
  BrowserActionType,
  BrowserTask,
  BrowserTaskRequest,
  BrowserSessionProfile,
  CampaignRequest,
  AuthSession,
} from '../src/types/instagram-browser.types';
import { BROWSER_ACTION_COSTS } from '../src/types/instagram-browser.types';
import { creditService } from './simpleCreditService';

// -----------------------------------------------------------
// Configuração do SDK
// -----------------------------------------------------------

const API_KEY = process.env.BROWSER_USE_API_KEY || '';
const BASE_URL = 'https://api.browser-use.com/api/v3';

// Storage em memória para profiles e tasks (substituir por DB em produção)
const profileStore = new Map<string, BrowserSessionProfile>();
const taskStore = new Map<string, BrowserTask>();

// -----------------------------------------------------------
// Prompts de automação por ação
// -----------------------------------------------------------

function buildPrompt(action: BrowserActionType, target?: string, message?: string, quantity?: number): string {
  const qty = quantity || 1;

  switch (action) {
    case 'follow':
      return `Vá para o perfil do Instagram @${target} e clique no botão Seguir. Confirme que está seguindo e retorne sucesso.`;

    case 'unfollow':
      return `Vá para o perfil do Instagram @${target}. Clique no botão "Seguindo" e confirme o unfollow. Retorne sucesso.`;

    case 'like':
      return `Vá para o post do Instagram em ${target}. Curta o post clicando no ícone de coração. Confirme que curtiu e retorne sucesso.`;

    case 'comment':
      return `Vá para o post do Instagram em ${target}. Clique na seção de comentários e escreva o seguinte comentário: "${message}". Publique o comentário e retorne sucesso.`;

    case 'dm':
      return `Vá para o Direct Message do Instagram com o usuário @${target}. Escreva a seguinte mensagem: "${message}". Envie a mensagem e retorne sucesso.`;

    case 'story':
      return `No Instagram, crie um novo Story. Use a imagem em ${target} e adicione o texto: "${message}". Publique o Story e retorne sucesso.`;

    case 'hashtag_scrape':
      return `Vá para a página da hashtag #${target} no Instagram. Colete os ${qty} posts mais recentes incluindo: URL do post, username do autor, número de curtidas, número de comentários e legenda (primeiros 200 caracteres). Retorne os dados em formato JSON.`;

    case 'campaign':
      return `Execute as seguintes ações em sequência no Instagram: ${message}. Aguarde pelo menos 30 segundos entre cada ação para parecer orgânico. Retorne um relatório de quais ações foram concluídas com sucesso.`;

    default:
      return `Execute a ação no Instagram: ${message || target}`;
  }
}

// -----------------------------------------------------------
// Cliente HTTP simples para o Browser Use API
// -----------------------------------------------------------

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'X-Browser-Use-API-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Browser Use API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

// -----------------------------------------------------------
// Tipos internos do Browser Use Cloud
// -----------------------------------------------------------

interface BUSession {
  id: string;
  status: string;
  output?: string;
  live_url?: string;
}

interface BUProfile {
  id: string;
  name: string;
}

// -----------------------------------------------------------
// Serviço principal
// -----------------------------------------------------------

class InstagramBrowserService {

  // =========================================================
  // GERENCIAMENTO DE PERFIS DE SESSÃO
  // =========================================================

  /**
   * Cria ou recupera um perfil de sessão Browser Use para uma
   * conta Instagram. Na 1ª vez, o usuário faz login manualmente
   * via live view (human-in-the-loop) e os cookies são salvos.
   */
  async createProfile(
    userId: string,
    instagramUsername: string
  ): Promise<BrowserSessionProfile> {
    // Verificar se já existe para este usuário + username
    const existing = this.findProfile(userId, instagramUsername);
    if (existing) return existing;

    // Criar perfil no Browser Use Cloud
    const buProfile = await apiRequest<BUProfile>('POST', '/profiles', {
      name: `aci-${userId}-${instagramUsername}`,
    });

    const profile: BrowserSessionProfile = {
      id: `prof_${Date.now()}`,
      userId,
      instagramUsername,
      browserProfileId: buProfile.id,
      isAuthenticated: false,
      createdAt: new Date().toISOString(),
    };

    profileStore.set(profile.id, profile);
    return profile;
  }

  /**
   * Inicia uma sessão de autenticação (human-in-the-loop).
   * Retorna a liveUrl para o usuário fazer login manualmente.
   */
  async startAuthSession(
    userId: string,
    instagramUsername: string
  ): Promise<AuthSession> {
    const profile = await this.createProfile(userId, instagramUsername);

    // Criar sessão no Browser Use para o usuário fazer login
    const session = await apiRequest<BUSession>('POST', '/sessions', {
      task: `Vá para https://www.instagram.com/accounts/login/ . Aguarde o usuário fazer login manualmente. Quando o usuário estiver logado e na página inicial do Instagram, retorne "login_complete".`,
      profile_id: profile.browserProfileId,
      keep_alive: true,
    });

    return {
      sessionId: session.id,
      liveUrl: session.live_url || '',
      profileId: profile.id,
      instagramUsername,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Finaliza a sessão de autenticação e marca o perfil como autenticado.
   * Os cookies ficam salvos no Browser Use Cloud profile.
   */
  async completeAuthSession(
    profileId: string,
    sessionId: string
  ): Promise<BrowserSessionProfile> {
    // Parar sessão para salvar cookies no profile
    await apiRequest('POST', `/sessions/${sessionId}/stop`, {});

    const profile = profileStore.get(profileId);
    if (!profile) throw new Error('Perfil não encontrado');

    profile.isAuthenticated = true;
    profile.lastUsedAt = new Date().toISOString();
    profileStore.set(profileId, profile);

    return profile;
  }

  /**
   * Lista todos os perfis de um usuário
   */
  getProfilesByUser(userId: string): BrowserSessionProfile[] {
    return Array.from(profileStore.values()).filter(p => p.userId === userId);
  }

  /**
   * Remove um perfil
   */
  async deleteProfile(userId: string, profileId: string): Promise<void> {
    const profile = profileStore.get(profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error('Perfil não encontrado ou sem permissão');
    }

    // Deletar profile no Browser Use Cloud
    try {
      await apiRequest('DELETE', `/profiles/${profile.browserProfileId}`);
    } catch (e) {
      console.error('Aviso: não foi possível deletar profile no Browser Use:', e);
    }

    profileStore.delete(profileId);
  }

  // =========================================================
  // EXECUÇÃO DE TAREFAS
  // =========================================================

  /**
   * Executa uma ação de automação no Instagram.
   * Deduz créditos antes de executar.
   */
  async runTask(
    userId: string,
    request: BrowserTaskRequest
  ): Promise<BrowserTask> {
    const profile = profileStore.get(request.profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    if (profile.userId !== userId) throw new Error('Sem permissão para usar este perfil');
    if (!profile.isAuthenticated) throw new Error('Perfil não autenticado. Faça login primeiro.');

    const creditCost = BROWSER_ACTION_COSTS[request.action];

    // Deduzir créditos antes de executar
    await creditService.spendCredits(
      userId,
      creditCost,
      `Instagram Browser: ${request.action} em ${request.target || 'Instagram'}`,
      'instagram-browser',
      { action: request.action, target: request.target, profileId: request.profileId }
    );

    // Montar prompt baseado na ação
    const prompt = buildPrompt(
      request.action,
      request.target,
      request.message,
      request.quantity
    );

    // Criar sessão no Browser Use Cloud
    const session = await apiRequest<BUSession>('POST', '/sessions', {
      task: prompt,
      profile_id: profile.browserProfileId,
      model: 'claude-sonnet-4.6',
      enable_recording: true,
    });

    const task: BrowserTask = {
      id: `task_${Date.now()}`,
      userId,
      sessionId: session.id,
      profileId: profile.id,
      instagramUsername: profile.instagramUsername,
      action: request.action,
      status: 'running',
      target: request.target,
      message: request.message,
      liveUrl: session.live_url,
      creditsUsed: creditCost,
      createdAt: new Date().toISOString(),
    };

    taskStore.set(task.id, task);
    profile.lastUsedAt = new Date().toISOString();
    profileStore.set(profile.id, profile);

    return task;
  }

  /**
   * Verifica o status de uma task e atualiza o store local.
   */
  async getTaskStatus(taskId: string, userId: string): Promise<BrowserTask> {
    const task = taskStore.get(taskId);
    if (!task) throw new Error('Task não encontrada');
    if (task.userId !== userId) throw new Error('Sem permissão');

    // Se já finalizada, retornar diretamente
    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return task;
    }

    // Consultar status no Browser Use Cloud
    const session = await apiRequest<BUSession>('GET', `/sessions/${task.sessionId}`);

    const statusMap: Record<string, BrowserTask['status']> = {
      running:   'running',
      idle:      'completed',
      stopped:   'completed',
      error:     'failed',
      timed_out: 'failed',
    };

    task.status = statusMap[session.status] || task.status;

    if (session.output) {
      task.output = session.output;
    }

    if (['completed', 'failed'].includes(task.status)) {
      task.completedAt = new Date().toISOString();

      // Buscar URL de gravação se disponível
      try {
        const recs = await apiRequest<{ urls: string[] }>(
          'GET',
          `/sessions/${task.sessionId}/recording`
        );
        if (recs?.urls?.length) {
          task.recordingUrl = recs.urls[0];
        }
      } catch {
        // Gravação pode não estar disponível ainda
      }
    }

    taskStore.set(task.id, task);
    return task;
  }

  /**
   * Cancela uma task em andamento
   */
  async cancelTask(taskId: string, userId: string): Promise<BrowserTask> {
    const task = taskStore.get(taskId);
    if (!task) throw new Error('Task não encontrada');
    if (task.userId !== userId) throw new Error('Sem permissão');

    if (task.status === 'running') {
      await apiRequest('POST', `/sessions/${task.sessionId}/stop`, {
        strategy: 'task',
      });
      task.status = 'cancelled';
      task.completedAt = new Date().toISOString();
      taskStore.set(task.id, task);
    }

    return task;
  }

  /**
   * Lista tasks de um usuário com paginação
   */
  getTasksByUser(
    userId: string,
    limit = 50,
    offset = 0
  ): { tasks: BrowserTask[]; total: number } {
    const all = Array.from(taskStore.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      tasks: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  // =========================================================
  // CAMPANHA SEQUENCIAL
  // =========================================================

  /**
   * Executa uma campanha de múltiplas ações em sequência.
   * Usa um único agente com prompt composto.
   */
  async runCampaign(userId: string, campaign: CampaignRequest): Promise<BrowserTask> {
    const profile = profileStore.get(campaign.profileId);
    if (!profile) throw new Error('Perfil não encontrado');
    if (profile.userId !== userId) throw new Error('Sem permissão');
    if (!profile.isAuthenticated) throw new Error('Perfil não autenticado');

    const cost = BROWSER_ACTION_COSTS.campaign;
    await creditService.spendCredits(
      userId,
      cost,
      `Instagram Browser: Campanha "${campaign.name || 'sem nome'}" (${campaign.items.length} ações)`,
      'instagram-browser',
      { campaign: campaign.name, itemCount: campaign.items.length }
    );

    const delay = campaign.delaySeconds || 30;
    const actionsText = campaign.items
      .map((item, i) =>
        `${i + 1}. ${item.action === 'follow' ? `Seguir @${item.target}` :
          item.action === 'like' ? `Curtir post: ${item.target}` :
          item.action === 'comment' ? `Comentar em ${item.target}: "${item.message}"` :
          item.action === 'dm' ? `DM para @${item.target}: "${item.message}"` :
          `${item.action} em ${item.target}`
        }`
      )
      .join('\n');

    const prompt = `Execute as seguintes ações no Instagram em sequência, aguardando ${delay} segundos entre cada uma para parecer orgânico:\n\n${actionsText}\n\nApós cada ação, registre se foi bem-sucedida. Ao final, retorne um JSON com o resultado de cada ação.`;

    const session = await apiRequest<BUSession>('POST', '/sessions', {
      task: prompt,
      profile_id: profile.browserProfileId,
      model: 'claude-sonnet-4.6',
      enable_recording: true,
    });

    const task: BrowserTask = {
      id: `task_${Date.now()}`,
      userId,
      sessionId: session.id,
      profileId: profile.id,
      instagramUsername: profile.instagramUsername,
      action: 'campaign',
      status: 'running',
      target: campaign.name,
      message: actionsText,
      liveUrl: session.live_url,
      creditsUsed: cost,
      createdAt: new Date().toISOString(),
    };

    taskStore.set(task.id, task);
    return task;
  }

  // =========================================================
  // UTILITÁRIOS PRIVADOS
  // =========================================================

  private findProfile(userId: string, instagramUsername: string): BrowserSessionProfile | undefined {
    return Array.from(profileStore.values()).find(
      p => p.userId === userId && p.instagramUsername === instagramUsername
    );
  }
}

// Singleton
export const instagramBrowserService = new InstagramBrowserService();
export default instagramBrowserService;
