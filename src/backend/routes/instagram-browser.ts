/**
 * ============================================================
 * Rotas: Instagram Browser Automation
 * ============================================================
 * REST API para o módulo de automação via Browser Use Cloud.
 * Todas as rotas são protegidas por authMiddleware.
 */

import { Router } from 'express';
import { authMiddleware } from '../auth';
import { instagramBrowserService } from '../../../services/instagramBrowserService';
import type { BrowserTaskRequest, CreateProfileRequest, CampaignRequest } from '../../types/instagram-browser.types';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// -----------------------------------------------------------
// PERFIS DE SESSÃO
// -----------------------------------------------------------

/**
 * POST /api/instagram-browser/profiles
 * Cria um novo perfil de sessão (vincular conta Instagram)
 */
router.post('/profiles', async (req: any, res) => {
  try {
    const { instagramUsername }: CreateProfileRequest = req.body;
    const userId: string = req.user.id;

    if (!instagramUsername) {
      return res.status(400).json({ success: false, error: 'instagramUsername é obrigatório' });
    }

    const profile = await instagramBrowserService.createProfile(userId, instagramUsername);

    res.json({ success: true, data: profile });
  } catch (error: any) {
    console.error('❌ Erro ao criar perfil browser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/instagram-browser/profiles
 * Lista todos os perfis do usuário autenticado
 */
router.get('/profiles', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const profiles = instagramBrowserService.getProfilesByUser(userId);

    res.json({ success: true, data: { profiles } });
  } catch (error: any) {
    console.error('❌ Erro ao listar perfis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/instagram-browser/profiles/:id
 * Remove um perfil de sessão
 */
router.delete('/profiles/:id', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const profileId = req.params.id;

    await instagramBrowserService.deleteProfile(userId, profileId);

    res.json({ success: true, message: 'Perfil removido com sucesso' });
  } catch (error: any) {
    console.error('❌ Erro ao deletar perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------
// AUTENTICAÇÃO HUMAN-IN-THE-LOOP
// -----------------------------------------------------------

/**
 * POST /api/instagram-browser/auth-session
 * Inicia sessão de autenticação — retorna liveUrl para o usuário fazer login
 */
router.post('/auth-session', async (req: any, res) => {
  try {
    const { instagramUsername }: CreateProfileRequest = req.body;
    const userId: string = req.user.id;

    if (!instagramUsername) {
      return res.status(400).json({ success: false, error: 'instagramUsername é obrigatório' });
    }

    const authSession = await instagramBrowserService.startAuthSession(userId, instagramUsername);

    res.json({ success: true, data: authSession });
  } catch (error: any) {
    console.error('❌ Erro ao iniciar sessão de auth:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/instagram-browser/auth-session/complete
 * Confirma que o usuário fez login — salva cookies e marca perfil como autenticado
 */
router.post('/auth-session/complete', async (req: any, res) => {
  try {
    const { profileId, sessionId } = req.body;

    if (!profileId || !sessionId) {
      return res.status(400).json({ success: false, error: 'profileId e sessionId são obrigatórios' });
    }

    const profile = await instagramBrowserService.completeAuthSession(profileId, sessionId);

    res.json({ success: true, data: profile, message: 'Conta autenticada com sucesso! 🎉' });
  } catch (error: any) {
    console.error('❌ Erro ao completar auth:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------
// TASKS (AÇÕES DE AUTOMAÇÃO)
// -----------------------------------------------------------

/**
 * POST /api/instagram-browser/tasks
 * Executa uma ação de automação (deduz créditos e inicia agente)
 */
router.post('/tasks', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const taskRequest: BrowserTaskRequest = req.body;

    if (!taskRequest.action || !taskRequest.profileId) {
      return res.status(400).json({ success: false, error: 'action e profileId são obrigatórios' });
    }

    const task = await instagramBrowserService.runTask(userId, taskRequest);

    res.json({
      success: true,
      data: task,
      message: `✅ Tarefa iniciada! Créditos deduzidos: ${task.creditsUsed}`,
    });
  } catch (error: any) {
    console.error('❌ Erro ao executar task:', error);

    // Erros de crédito insuficiente
    if (error.message?.includes('Saldo insuficiente')) {
      return res.status(402).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/instagram-browser/tasks
 * Lista histórico de tasks do usuário
 */
router.get('/tasks', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = instagramBrowserService.getTasksByUser(userId, limit, offset);

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Erro ao listar tasks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/instagram-browser/tasks/:taskId
 * Obtém status e output de uma task específica
 */
router.get('/tasks/:taskId', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const { taskId } = req.params;

    const task = await instagramBrowserService.getTaskStatus(taskId, userId);

    res.json({ success: true, data: task });
  } catch (error: any) {
    console.error('❌ Erro ao buscar task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/instagram-browser/tasks/:taskId
 * Cancela uma task em andamento
 */
router.delete('/tasks/:taskId', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const { taskId } = req.params;

    const task = await instagramBrowserService.cancelTask(taskId, userId);

    res.json({ success: true, data: task, message: 'Task cancelada com sucesso' });
  } catch (error: any) {
    console.error('❌ Erro ao cancelar task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------
// CAMPANHAS
// -----------------------------------------------------------

/**
 * POST /api/instagram-browser/campaigns
 * Executa uma campanha sequencial de múltiplas ações
 */
router.post('/campaigns', async (req: any, res) => {
  try {
    const userId: string = req.user.id;
    const campaign: CampaignRequest = req.body;

    if (!campaign.profileId || !campaign.items?.length) {
      return res.status(400).json({ success: false, error: 'profileId e items são obrigatórios' });
    }

    const task = await instagramBrowserService.runCampaign(userId, campaign);

    res.json({
      success: true,
      data: task,
      message: `🚀 Campanha iniciada com ${campaign.items.length} ações!`,
    });
  } catch (error: any) {
    console.error('❌ Erro ao executar campanha:', error);

    if (error.message?.includes('Saldo insuficiente')) {
      return res.status(402).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
