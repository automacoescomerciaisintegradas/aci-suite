
import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../auth';
import { userSettingsService } from '../userSettingsService';

const router = Router();

// Obter configurações salvas do usuário autenticado
router.get('/me', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const userSettings = userSettingsService.getSettings(userId);
        return res.json({ success: true, data: userSettings });
    } catch (error) {
        console.error("Erro ao buscar configurações do usuário:", error);
        return res.status(500).json({ success: false, error: "Erro ao buscar configurações do usuário" });
    }
});

// Endpoint unificado para salvar configurações
router.post('/', authMiddleware, async (req: any, res) => {
    try {
        const userId = req.user.id;
        const settings = req.body; // Objeto Settings completo do frontend

        // 0. Salvar em memória por usuário (funciona mesmo sem tabela de users configurada)
        userSettingsService.saveSettings(userId, {
            geminiApiKey: settings.geminiApiKey?.trim() || '',
            openaiApiKey: settings.openaiApiKey?.trim() || '',
            anthropicApiKey: settings.anthropicApiKey?.trim() || '',
            groqApiKey: settings.groqApiKey?.trim() || '',
            ollamaApiKey: settings.ollamaApiKey?.trim() || '',
            telegramBotToken: settings.telegramBotToken?.trim() || '',
            telegramChatId: settings.telegramChatId?.trim() || '',
            telegramBotUsername: settings.telegramBotUsername?.trim() || '',
            shopeeAffiliateId: settings.shopeeAffiliateId?.trim() || '',
            shopeeDefaultSubId: settings.shopeeDefaultSubId?.trim() || '',
            instagramToken: settings.instagramToken?.trim() || '',
            instagramUsername: settings.instagramUsername?.trim() || '',
            instagramUser: settings.instagramUser || null,
            wordpressUrl: settings.wordpressUrl?.trim() || '',
            wordpressUsername: settings.wordpressUsername?.trim() || '',
            wordpressAppPassword: settings.wordpressAppPassword?.trim() || '',
            woocommerceUrl: settings.woocommerceUrl?.trim() || '',
            woocommerceConsumerKey: settings.woocommerceConsumerKey?.trim() || '',
            woocommerceConsumerSecret: settings.woocommerceConsumerSecret?.trim() || '',
            whatsappWebhookUrl: settings.whatsappWebhookUrl?.trim() || '',
            whatsappBusinessToken: settings.whatsappBusinessToken?.trim() || '',
            whatsappPhoneId: settings.whatsappPhoneId?.trim() || '',
            n8nWebhookUrl: settings.n8nWebhookUrl?.trim() || '',
            apiRestBaseUrl: settings.apiRestBaseUrl?.trim() || '',
            apiRestToken: settings.apiRestToken?.trim() || '',
        });

        // 1. Tentar persistir também no banco (best-effort)
        try {
            // Salvar OpenAI Key (provider existente no enum)
            if (settings.openaiApiKey) {
                await upsertIntegration(userId, 'OPENAI', { apiKey: settings.openaiApiKey });
            }

            // Salvar Telegram
            if (settings.telegramBotToken && settings.telegramChatId) {
                await upsertIntegration(userId, 'TELEGRAM', {
                    botToken: settings.telegramBotToken,
                    chatId: settings.telegramChatId
                });
            }

            // Salvar Shopee (Affiliate)
            if (settings.shopeeAffiliateId) {
                await upsertIntegration(userId, 'SHOPEE', {
                    affiliateId: settings.shopeeAffiliateId
                });
            }
        } catch (dbError) {
            console.warn("⚠️ Não foi possível persistir settings no banco. Mantido em memória por usuário.", dbError);
        }

        res.json({ success: true, message: "Configurações salvas e vinculadas ao usuário" });

    } catch (error: any) {
        console.error("Erro ao salvar configurações:", error);
        res.status(500).json({ success: false, error: "Erro ao salvar configurações" });
    }
});

// Helper para upsert Integration
async function upsertIntegration(userId: string, provider: any, credentials: any) {
    const existing = await prisma.integration.findFirst({
        where: { userId, provider }
    });

    // Criptografar valores sensíveis se necessário (simplificado aqui)
    // const encryptedCredentials = encrypt(JSON.stringify(credentials)); 
    // Por simplicidade, salvando JSON direto, mas em produção deve criptografar tokens.

    if (existing) {
        await prisma.integration.update({
            where: { id: existing.id },
            data: { credentials, updatedAt: new Date() }
        });
    } else {
        await prisma.integration.create({
            data: {
                userId,
                provider,
                credentials,
                status: 'ACTIVE'
            }
        });
    }
}

export default router;
