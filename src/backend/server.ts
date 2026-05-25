import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { loadEnvFile } from "process";
import multer from "multer";

// Carregar variáveis de ambiente do arquivo .env
try {
    loadEnvFile();
} catch (error) {
    console.warn("⚠️ Arquivo .env não encontrado ou não pôde ser carregado.");
}

import cors from "cors";
import axios from "axios";
import { generateToken } from "./auth";
import { authMiddleware } from "./auth";
import { costGuard } from "./costGuard";
import { creditService } from "../../services/simpleCreditService";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./emailService";
import { generateResetToken, validateResetToken, markTokenAsUsed } from "./passwordResetService";
import { userSettingsService } from "./userSettingsService";
import paymentsRoutes from "./routes/payments";
import { integrationStateStore, type ApiKeyRecord, type SessionRecord, type WordPressConnectionRecord } from "./services/integrationStateStore";
import { saveAvatarFile, ensureAvatarStorage, getAvatarAbsolutePath } from "./services/avatarStorage";
import { metricsService } from "./services/metrics";
import { logger } from "./services/logger";
import { jobQueue } from "./services/jobQueue";
import { testWordPressConnection } from "./lib/wordpress";
import { testWooCommerceConnection } from "./lib/woocommerce";
// import { performanceMonitoringMiddleware, systemMonitor, logger, performanceMonitor } from '../../services/monitoringService';

const app = express();

const safeUserSegment = (input: string): string =>
    input.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'U';

const resolveUserId = (req: any): string | null => {
    const fromAuth = String(req.user?.id || '').trim();
    if (fromAuth) return fromAuth;
    const fromQuery = String(req.query?.userId || req.query?.id || '').trim();
    if (fromQuery) return fromQuery;
    const fromBody = String(req.body?.userId || '').trim();
    if (fromBody) return fromBody;
    return null;
};

const hasValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
    return Boolean(value);
};

const computeStatus = (required: unknown[]): 'connected' | 'partial' | 'disconnected' => {
    const checks = required.map(hasValue);
    if (checks.every(Boolean)) return 'connected';
    if (checks.some(Boolean)) return 'partial';
    return 'disconnected';
};
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://aci.automacoescomerciais.com.br",
    process.env.FRONTEND_URL || "",
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin não permitida por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
    const startedAt = Date.now();
    const requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    res.setHeader("x-request-id", requestId);
    res.on("finish", () => {
        const durationMs = Date.now() - startedAt;
        const routeKey = `${req.method} ${req.path}`;
        metricsService.record(routeKey, res.statusCode, durationMs);
        logger.info({
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs,
        }, "http_request");
    });
    next();
});

// Adicionar middleware de monitoramento
// app.use(performanceMonitoringMiddleware(performanceMonitor));

// Iniciar monitoramento de recursos do sistema
// systemMonitor.startResourceMonitoring(60000); // A cada minuto

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos do Frontend (Pasta dist)
app.use(express.static(path.join(__dirname, "../../dist")));
app.use("/uploads", express.static(path.resolve(process.cwd(), "storage", "uploads")));

const upload = multer({
    dest: path.resolve(process.cwd(), "storage", "tmp"),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Formato de imagem não suportado"));
        }
        cb(null, true);
    },
});

// Rotas de Pagamentos (Mercado Pago)
app.use("/api/payments", paymentsRoutes);

// Public route – health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Compatibilidade com clientes legados que usam /api/health
app.get("/api/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
});

// Compatibilidade com clientes que usam /api/packages
app.get("/api/packages", (_req, res) => {
    res.redirect(307, "/api/payments/packages");
});

const decodeHtml = (input: string): string =>
    input
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

const extractMetaTag = (html: string, key: string): string => {
    const patterns = [
        new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, 'i'),
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match?.[1]) return decodeHtml(match[1]);
    }
    return '';
};

// Resolve links públicos da Shopee sem depender de IA
app.get("/api/shopee/resolve", async (req, res) => {
    const rawUrl = String(req.query.url || '').trim();
    if (!rawUrl) {
        return res.status(400).json({ success: false, error: "Parâmetro 'url' é obrigatório." });
    }

    try {
        const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        const url = new URL(candidate);
        if (!url.hostname.includes('shopee.com.br')) {
            return res.status(400).json({ success: false, error: "URL inválida. Use um link da Shopee Brasil." });
        }

        const response = await axios.get(url.toString(), {
            maxRedirects: 8,
            timeout: 20000,
            validateStatus: (status) => status >= 200 && status < 400,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
            }
        });

        const finalUrl =
            (response?.request as any)?.res?.responseUrl ||
            response.config?.url ||
            url.toString();

        const html = String(response.data || '');
        const title =
            extractMetaTag(html, 'og:title') ||
            extractMetaTag(html, 'twitter:title') ||
            (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'Produto Shopee');

        const imageUrl =
            extractMetaTag(html, 'og:image') ||
            extractMetaTag(html, 'twitter:image') ||
            '';

        const priceRaw =
            extractMetaTag(html, 'product:price:amount') ||
            extractMetaTag(html, 'og:price:amount') ||
            '';

        let price = 'Preço indisponível';
        if (priceRaw) {
            const normalized = priceRaw.replace(',', '.').replace(/[^\d.]/g, '');
            const value = Number(normalized);
            if (!Number.isNaN(value) && value > 0) {
                price = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        }

        return res.json({
            success: true,
            data: {
                title: decodeHtml(title),
                price,
                image_url: imageUrl,
                product_url: finalUrl
            }
        });
    } catch (error: any) {
        console.error("Erro ao resolver URL da Shopee:", error?.message || error);
        return res.status(500).json({
            success: false,
            error: "Não foi possível resolver o link da Shopee no momento."
        });
    }
});

// Endpoint de métricas de performance (apenas admin)
/*app.get("/api/metrics/performance", authMiddleware, (req: any, res) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const stats = performanceMonitor.getOverallStats(24);
    const systemInfo = systemMonitor.getSystemInfo();
    
    res.json({
        performance: stats,
        system: systemInfo,
        timestamp: new Date().toISOString()
    });
});*/

// Endpoint de estatísticas do cache
app.get("/api/metrics/cache", authMiddleware, (req: any, res) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }

    // TODO: Implementar quando o cacheService estiver integrado
    res.json({
        message: 'Cache metrics endpoint - implementation pending',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.post("/api/auth/login", (req, res) => {
    // Stub login – accepts any email, returns token
    const { email, password } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, error: "email required" });
    }
    if (!password) {
        return res.status(400).json({ success: false, error: "password required" });
    }

    // Admin emails list
    const ADMIN_EMAILS = [

        'automacoescomerciais@gmail.com',
        'contato@automacoescomerciais.com.br',
        'admin@automacoescomerciais.com.br',
        'suporte@automacoescomerciais.com.br'
    ];
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    const token = generateToken({ id: email, email, role: isAdmin ? 'admin' : 'user' });
    const userSettings = userSettingsService.getSettings(email);
    res.json({
        success: true,
        token,
        user: {
            id: email,
            email,
            full_name: email.split('@')[0],
            display_name: email.split('@')[0],
            role: isAdmin ? 'admin' : 'user',
            avatar_url: ''
        },
        userSettings
    });
});

// Signup route
app.post("/api/auth/signup", async (req, res) => {
    const { email, password, metadata } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: "email required" });
    }
    if (!password) {
        return res.status(400).json({ success: false, error: "password required" });
    }

    // Validação básica de senha
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    // BÔNUS DE BOAS-VINDAS: R$ 3,00 = 3000 créditos
    const WELCOME_BONUS = 3000;
    creditService.addCredits(email, WELCOME_BONUS, 'Bônus de boas-vindas', { source: 'signup' });
    console.log(`✅ Novo usuário ${email} recebeu bônus de ${WELCOME_BONUS} créditos!`);

    // Envia e-mail de boas-vindas
    const userName = metadata?.full_name || email.split('@')[0];
    sendWelcomeEmail(email, userName).catch(err => {
        console.error('❌ Erro ao enviar e-mail de boas-vindas:', err);
    });

    const token = generateToken({ id: email, email, role: metadata?.role || 'user' });
    const userSettings = userSettingsService.getSettings(email);
    res.json({
        success: true,
        token,
        user: {
            id: email,
            email,
            full_name: metadata?.full_name || email.split('@')[0],
            display_name: metadata?.full_name || email.split('@')[0],
            phone: metadata?.phone || '',
            role: metadata?.role || 'user',
            avatar_url: '',
            credits: WELCOME_BONUS
        },
        userSettings,
        message: `🎉 Bem-vindo! Você ganhou R$ 3,00 de bônus para começar!`
    });
});

// Password reset routes
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, error: 'Email é obrigatório' });
    }

    try {
        // Gera token de recuperação
        const resetToken = generateResetToken(email);

        // LOG PARA DEBUG (COPIE O LINK DAQUI SE O EMAIL NÃO CHEGAR)
        const debugLink = `http://localhost:3000/reset-password?token=${resetToken}`;
        console.log('\n==================================================');
        console.log('🔑 LINK DE RECUPERAÇÃO (DEBUG):');
        console.log(debugLink);
        console.log('==================================================\n');

        // Envia e-mail
        const emailSent = await sendPasswordResetEmail(email, resetToken);

        if (!emailSent) {
            console.error('❌ Falha ao enviar e-mail de recuperação para:', email);
            return res.status(500).json({
                success: false,
                error: 'Erro ao enviar e-mail. Verifique as configurações SMTP.'
            });
        }

        console.log('✅ E-mail de recuperação enviado para:', email);

        return res.json({
            success: true,
            message: 'E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.'
        });
    } catch (error) {
        console.error('❌ Erro no processo de recuperação de senha:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao processar solicitação'
        });
    }
});

// Endpoint para validar token de reset
app.post('/api/auth/validate-reset-token', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, error: 'Token é obrigatório' });
    }

    const validation = validateResetToken(token);

    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    return res.json({ success: true, email: validation.email });
});

// Endpoint para resetar a senha
app.post('/api/auth/reset-password', (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Token e nova senha são obrigatórios'
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'A senha deve ter no mínimo 6 caracteres'
        });
    }

    const validation = validateResetToken(token);

    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    // Marca o token como usado
    markTokenAsUsed(token);

    // TODO: Aqui você salvaria a nova senha no banco de dados
    // Por enquanto, apenas retornamos sucesso
    console.log(`✅ Senha resetada com sucesso para: ${validation.email}`);

    return res.json({
        success: true,
        message: 'Senha alterada com sucesso! Você já pode fazer login.'
    });
});

// Register Routers BEFORE global authMiddleware if they handle public callbacks
// Note: Each router already uses authMiddleware internally for protected routes
import blogsRouter from './routes/blogs';
import instagramRouter from './routes/instagram';
import instagramBrowserRouter from './routes/instagram-browser';
import settingsRouter from './routes/settings';
import woocommerceRouter from './routes/woocommerce';

app.use('/api/blogs', blogsRouter);
app.use('/api/integrations/instagram', instagramRouter);
app.use('/api/instagram-browser', instagramBrowserRouter);
app.use('/api/integrations/woocommerce', woocommerceRouter);
app.use('/api/settings', settingsRouter);

// Compatibilidade de WordPress com contratos legados do worker
app.get('/api/wordpress/connections', authMiddleware, (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const connections = integrationStateStore.getWordPressConnections(userId);
    return res.json({ success: true, connections });
});

app.post('/api/wordpress/connection', authMiddleware, async (req: any, res) => {
    const userId = resolveUserId(req);
    const { name, site_url, username, application_password } = req.body || {};

    if (!userId || !name || !site_url || !username || !application_password) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const now = new Date().toISOString();
    const record: WordPressConnectionRecord = {
        id: `wp_${Date.now()}`,
        userId,
        name: String(name),
        site_url: String(site_url),
        username: String(username),
        application_password: String(application_password),
        created_at: now,
        updated_at: now,
    };

    await integrationStateStore.addWordPressConnection(record);
    return res.json({ success: true, connection: record });
});

app.post('/api/wordpress/connect', authMiddleware, async (req: any, res) => {
    const userId = resolveUserId(req);
    const { siteUrl, username, password } = req.body || {};
    if (!userId || !siteUrl || !username || !password) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const now = new Date().toISOString();
    const record: WordPressConnectionRecord = {
        id: `wp_${Date.now()}`,
        userId,
        name: String(siteUrl),
        site_url: String(siteUrl),
        username: String(username),
        application_password: String(password),
        created_at: now,
        updated_at: now,
    };

    await integrationStateStore.addWordPressConnection(record);
    return res.json({ success: true, connection: record });
});

app.delete('/api/wordpress/disconnect', authMiddleware, async (req: any, res) => {
    const userId = resolveUserId(req);
    const connectionId = String(req.query.connectionId || '').trim();
    if (!userId || !connectionId) {
        return res.status(400).json({ success: false, error: 'connectionId e userId são obrigatórios' });
    }
    await integrationStateStore.removeWordPressConnection(userId, connectionId);
    return res.json({ success: true });
});

app.post('/api/wordpress/publish', authMiddleware, (_req: any, res) => {
    return res.status(501).json({
        success: false,
        error: 'Use /api/blogs/:id/publish para publicação WordPress no backend Express canônico.',
    });
});

// Compatibilidade de Instagram com contratos legados do worker
app.get('/api/instagram/accounts', authMiddleware, (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }
    return res.json({ success: true, accounts: [] });
});

app.post('/api/instagram/connect', authMiddleware, (_req: any, res) => {
    return res.status(501).json({
        success: false,
        error: 'Use /api/integrations/instagram/auth para iniciar OAuth com Meta.',
    });
});

app.delete('/api/instagram/disconnect', authMiddleware, (_req: any, res) => {
    return res.json({ success: true });
});

app.post('/api/instagram/post', authMiddleware, (_req: any, res) => {
    return res.status(501).json({
        success: false,
        error: 'Use /api/integrations/instagram/post com integrationId válido.',
    });
});

// Redirecionar rotas do Frontend para o index.html (SPA) - DEVE VIR DEPOIS DAS ROTAS DA API
app.get("*", (req, res, next) => {
    // Se a rota começar com /api ou /health, deixa passar para as rotas abaixo
    if (req.path.startsWith("/api") || req.path === "/health") {
        return next();
    }
    // Caso contrário, serve o index.html do frontend
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

// Middleware de Autenticação - Apenas para o que vem abaixo (APIs protegidas genéricas)
app.use(authMiddleware);

app.get('/api/auth/user', (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const localPart = userId.includes('@') ? userId.split('@')[0] : userId;
    const overrides = integrationStateStore.getProfile(userId);
    return res.json({
        success: true,
        user: {
            id: userId,
            email: userId.includes('@') ? userId : `${userId}@example.com`,
            full_name: overrides.full_name || localPart,
            display_name: overrides.display_name || localPart,
            phone: overrides.phone || '',
            role: req.user?.role || 'user',
            avatar_url: overrides.avatar_url || integrationStateStore.getAvatarUrl(userId) || '',
        },
    });
});

app.put('/api/auth/profile', async (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const next = await integrationStateStore.updateProfile(userId, {
        ...(req.body?.full_name ? { full_name: String(req.body.full_name) } : {}),
        ...(req.body?.display_name ? { display_name: String(req.body.display_name) } : {}),
        ...(req.body?.phone ? { phone: String(req.body.phone) } : {}),
        ...(req.body?.avatar_url ? { avatar_url: String(req.body.avatar_url) } : {}),
    });

    return res.json({
        success: true,
        profile: {
            userId,
            ...next,
        },
    });
});

app.get('/api/credits/transactions', async (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    try {
        const transactions = await creditService.getTransactionHistory(userId, 50, 0);
        return res.json({ success: true, transactions });
    } catch (error) {
        console.error('Erro ao obter transações:', error);
        return res.status(500).json({ success: false, error: 'Erro ao obter transações' });
    }
});

app.get('/api/keys', (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    return res.json({
        success: true,
        keys: integrationStateStore.getApiKeys(userId),
    });
});

app.post('/api/keys', async (req: any, res) => {
    const userId = resolveUserId(req);
    const { service, key_name, api_key } = req.body || {};
    if (!userId || !service || !key_name || !api_key) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios ausentes' });
    }

    const now = new Date().toISOString();
    const record: ApiKeyRecord = {
        id: `key_${Date.now()}`,
        userId,
        service: String(service),
        key_name: String(key_name),
        api_key: String(api_key),
        created_at: now,
        updated_at: now,
    };
    await integrationStateStore.addApiKey(record);
    return res.json({ success: true, key: record });
});

app.post('/api/avatar/upload', upload.single('file'), async (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Arquivo de avatar obrigatório' });
    }
    try {
        const avatarUrl = await saveAvatarFile(userId, req.file);
        await integrationStateStore.setAvatarUrl(userId, avatarUrl);
        await integrationStateStore.updateProfile(userId, { avatar_url: avatarUrl });
        return res.json({ success: true, avatarUrl, message: 'Avatar atualizado com sucesso' });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error?.message || 'Erro no upload do avatar' });
    }
});

app.get('/api/avatar/:id', (req: any, res) => {
    const userId = String(req.params.id || '').trim();
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const explicitAvatar = integrationStateStore.getAvatarUrl(userId);
    if (explicitAvatar) {
        return res.sendFile(getAvatarAbsolutePath(explicitAvatar));
    }

    const initials = safeUserSegment(userId);
    res.type('image/svg+xml');
    return res.send(
        `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#1E293B"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#F8FAFC">${initials}</text></svg>`
    );
});

app.get('/api/sessions', (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    return res.json({
        success: true,
        sessions: integrationStateStore.getSessions(userId),
    });
});

app.post('/api/sessions', async (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const now = new Date().toISOString();
    const record: SessionRecord = {
        id: `sess_${Date.now()}`,
        userId,
        userAgent: String(req.body?.userAgent || req.get('user-agent') || 'unknown'),
        ipAddress: String(req.body?.ipAddress || req.ip || ''),
        startedAt: now,
        lastActivityAt: now,
        isActive: true,
    };
    await integrationStateStore.addSession(record);
    return res.json({ success: true, session: record });
});

app.put('/api/sessions/activity', async (req: any, res) => {
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    const found = await integrationStateStore.touchSession(sessionId);
    if (!found) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.json({ success: true });
});

app.put('/api/sessions/end', async (req: any, res) => {
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    const found = await integrationStateStore.endSession(sessionId);
    if (!found) return res.status(404).json({ success: false, error: 'Session not found' });
    return res.json({ success: true });
});

app.get('/api/settings/user', (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }
    const userSettings = userSettingsService.getSettings(userId);
    return res.json({ success: true, data: userSettings });
});

app.put('/api/settings/update', (req: any, res) => {
    const userId = resolveUserId(req);
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }
    userSettingsService.saveSettings(userId, req.body || {});
    return res.json({ success: true, message: 'Configurações atualizadas' });
});

app.get('/api/integrations/status', async (req: any, res) => {
    const userId = resolveUserId(req) || req.user?.id;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const deepCheck = String(req.query?.deep || '').toLowerCase() === 'true';
    const settings = (userSettingsService.getSettings(userId) || {}) as Record<string, any>;
    const apiKeys = integrationStateStore.getApiKeys(userId);
    const wpConnections = integrationStateStore.getWordPressConnections(userId);
    const hasInstagramProfile = hasValue(settings.instagramUser?.username) || hasValue(settings.instagramUsername);

    const telegramStatus = computeStatus([settings.telegramBotToken, settings.telegramChatId]);
    const wordpressStatusBySettings = computeStatus([settings.wordpressUrl, settings.wordpressUsername, settings.wordpressAppPassword]);
    const wordpressStatus = wpConnections.length > 0 ? 'connected' : wordpressStatusBySettings;
    const woocommerceStatus = computeStatus([settings.woocommerceUrl, settings.woocommerceConsumerKey, settings.woocommerceConsumerSecret]);
    const shopeeStatus = computeStatus([settings.shopeeAffiliateId]);
    const instagramStatus = hasInstagramProfile ? 'connected' : 'disconnected';

    const officialWhatsappToken =
        settings.whatsappBusinessToken ||
        settings.whatsappApiToken ||
        apiKeys.find((item) => item.service === 'whatsapp')?.api_key ||
        '';
    const officialWhatsappPhoneId = settings.whatsappPhoneId || settings.whatsappBusinessPhoneId || '';
    const whatsappOfficialStatus = computeStatus([officialWhatsappToken, officialWhatsappPhoneId]);
    const whatsappUnofficialStatus = computeStatus([settings.whatsappWebhookUrl]);
    const apiRestStatus = computeStatus([settings.apiRestBaseUrl, settings.apiRestToken]);
    const n8nStatus = computeStatus([settings.n8nWebhookUrl]);

    const integrations: Record<string, any> = {
        telegram: {
            id: 'telegram',
            status: telegramStatus,
            source: 'backend',
            details: telegramStatus === 'connected' ? 'Bot e chat configurados' : 'Configure token e chat id',
        },
        wordpress: {
            id: 'wordpress',
            status: wordpressStatus,
            source: 'backend',
            details: wpConnections.length > 0 ? `${wpConnections.length} conexão(ões) registrada(s)` : 'Configure URL, usuário e senha de app',
        },
        instagram: {
            id: 'instagram',
            status: instagramStatus,
            source: 'backend',
            details: hasInstagramProfile ? 'Conta registrada no backend' : 'Conta ainda não vinculada',
        },
        woocommerce: {
            id: 'woocommerce',
            status: woocommerceStatus,
            source: 'backend',
            details: woocommerceStatus === 'connected' ? 'Credenciais presentes' : 'Configure URL + Consumer Key + Consumer Secret',
        },
        shopee: {
            id: 'shopee',
            status: shopeeStatus,
            source: 'backend',
            details: shopeeStatus === 'connected' ? 'Afiliado configurado' : 'Configure seu ID de afiliado',
        },
        whatsapp_official: {
            id: 'whatsapp_official',
            status: whatsappOfficialStatus,
            source: 'backend',
            details: whatsappOfficialStatus === 'connected' ? 'Token e phone_id da Cloud API configurados' : 'Configure token e phone_id oficiais',
        },
        whatsapp_unofficial: {
            id: 'whatsapp_unofficial',
            status: whatsappUnofficialStatus,
            source: 'backend',
            details: whatsappUnofficialStatus === 'connected' ? 'Webhook não-oficial configurado' : 'Configure webhook de automação',
        },
        api: {
            id: 'api',
            status: apiRestStatus,
            source: 'backend',
            details: apiRestStatus === 'connected' ? 'Base URL e token configurados' : 'Configure API base URL e token',
        },
        n8n: {
            id: 'n8n',
            status: n8nStatus,
            source: 'backend',
            details: n8nStatus === 'connected' ? 'Webhook n8n configurado' : 'Configure webhook do n8n',
        },
    };

    if (deepCheck) {
        // Validações remotas opcionais para retry/manual refresh.
        try {
            if (integrations.telegram.status === 'connected') {
                const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/getMe`);
                if (!response.ok) {
                    integrations.telegram.status = 'partial';
                    integrations.telegram.details = 'Token inválido ou API Telegram indisponível';
                }
            }
        } catch {
            integrations.telegram.status = 'partial';
            integrations.telegram.details = 'Falha de rede ao validar Telegram';
        }

        try {
            if (integrations.wordpress.status === 'connected' && hasValue(settings.wordpressUrl) && hasValue(settings.wordpressUsername) && hasValue(settings.wordpressAppPassword)) {
                const result = await testWordPressConnection({
                    url: String(settings.wordpressUrl),
                    username: String(settings.wordpressUsername),
                    password: String(settings.wordpressAppPassword),
                });
                if (!result.success) {
                    integrations.wordpress.status = 'partial';
                    integrations.wordpress.details = result.message;
                }
            }
        } catch {
            integrations.wordpress.status = 'partial';
            integrations.wordpress.details = 'Falha ao validar WordPress remotamente';
        }

        try {
            if (integrations.woocommerce.status === 'connected') {
                const result = await testWooCommerceConnection({
                    url: String(settings.woocommerceUrl),
                    consumerKey: String(settings.woocommerceConsumerKey),
                    consumerSecret: String(settings.woocommerceConsumerSecret),
                });
                if (!result.success) {
                    integrations.woocommerce.status = 'partial';
                    integrations.woocommerce.details = result.message;
                }
            }
        } catch {
            integrations.woocommerce.status = 'partial';
            integrations.woocommerce.details = 'Falha ao validar WooCommerce remotamente';
        }
    }

    return res.json({
        success: true,
        userId,
        updatedAt: new Date().toISOString(),
        integrations,
    });
});

app.get('/api/metrics/summary', (req: any, res) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' });
    }
    return res.json({
        success: true,
        metrics: metricsService.snapshot(),
        queue: jobQueue.getStats(),
        uptimeSeconds: Math.floor(process.uptime()),
    });
});

app.post('/api/scheduler/jobs', async (req: any, res) => {
    const userId = resolveUserId(req) || req.user?.id;
    const { type, payload, runAt, retryLimit } = req.body || {};
    if (!type) {
        return res.status(400).json({ success: false, error: 'type é obrigatório' });
    }

    const job = await jobQueue.enqueue(
        String(type),
        {
            userId,
            ...(payload || {}),
            ...(runAt ? { runAt } : {}),
        },
        typeof retryLimit === 'number' ? retryLimit : undefined
    );
    return res.json({ success: true, job });
});

app.get('/api/scheduler/jobs/:id', (req: any, res) => {
    const job = jobQueue.getJob(String(req.params.id || ''));
    if (!job) {
        return res.status(404).json({ success: false, error: 'Job não encontrado' });
    }
    return res.json({ success: true, job });
});

app.get('/api/scheduler/jobs', (req: any, res) => {
    const limit = Number(req.query.limit || 100);
    return res.json({
        success: true,
        jobs: jobQueue.listJobs(Number.isFinite(limit) ? limit : 100),
    });
});

app.get("/api/credits/balance", async (req: any, res) => {
    const userId = resolveUserId(req) || req.user.id;
    try {
        const credits = await creditService.getBalance(userId);
        res.json({ success: true, balance: credits?.balance || 0, credits });
    } catch (error) {
        console.error('Erro ao obter saldo:', error);
        res.status(500).json({ error: 'Erro ao obter saldo' });
    }
});

app.post("/api/credits/add", async (req: any, res) => {
    const userId = req.user.id;
    const { amount } = req.body;
    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
    }
    try {
        await creditService.addCredits(userId, amount, 'Adição manual de créditos');
        const credits = await creditService.getBalance(userId);
        res.json({ balance: credits?.balance || 0 });
    } catch (error) {
        console.error('Erro ao adicionar créditos:', error);
        res.status(500).json({ error: 'Erro ao adicionar créditos' });
    }
});

// Example protected action that costs credits – uses costGuard middleware
app.post("/api/actions/generate", costGuard(5), (req: any, res) => {
    // Here you would call AI worker etc.
    res.json({ message: "Action executed, 5 credits deducted" });
});

app.get('/api/facebook/test', async (req: any, res: any) => {
    const { id, token, path, fields } = req.query;

    if (!id || !token) {
        return res.status(400).json({ error: 'ID e Token são obrigatórios. Use ?id=...&token=...' });
    }

    try {
        const pathParam = path ? `/${path}` : '';
        const fieldsParam = fields ? `?fields=${fields}` : '?fields=status';
        // Ensure clean URL construction
        const url = `https://graph.facebook.com/v24.0/${id}${pathParam}${fieldsParam}`;

        console.log(`🔍 Testando Facebook API: ${url}`);

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Sucesso no teste do Facebook:', response.data);
        res.json(response.data);
    } catch (error: any) {
        console.error('❌ Erro no teste do Facebook:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: 'Erro ao conectar com Facebook',
            details: error.response?.data || error.message
        });
    }
});

import { cronService } from './cronService';
const QUEUE_POLL_INTERVAL_MS = 5000;

function startQueueWorker() {
    setInterval(async () => {
        try {
            const processed = await jobQueue.processDueJobs(async (job) => {
                logger.info({ jobId: job.id, type: job.type, attempts: job.attempts + 1 }, 'job_started');
                // Dispatcher simplificado: integrações reais entram aqui por tipo.
                if (job.type === 'publish-wordpress' && !job.payload?.blogId) {
                    throw new Error('payload.blogId é obrigatório para publish-wordpress');
                }
                if (job.type === 'publish-instagram' && !job.payload?.integrationId) {
                    throw new Error('payload.integrationId é obrigatório para publish-instagram');
                }
                logger.info({ jobId: job.id, type: job.type }, 'job_completed');
            });
            if (processed > 0) {
                logger.info({ processed }, 'queue_tick_processed');
            }
        } catch (error: any) {
            logger.error({ err: error?.message || error }, 'queue_tick_failed');
        }
    }, QUEUE_POLL_INTERVAL_MS);
}

app.use((error: any, _req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, error: `Upload inválido: ${error.message}` });
    }
    if (error?.message === 'Formato de imagem não suportado') {
        return res.status(400).json({ success: false, error: error.message });
    }
    return next(error);
});

const PORT = process.env.PORT || 4001;

async function bootstrap() {
    try {
        await Promise.all([
            integrationStateStore.load(),
            ensureAvatarStorage(),
            jobQueue.load(),
        ]);
        logger.info('state_stores_loaded');
    } catch (error: any) {
        logger.error({ err: error?.message || error }, 'state_store_init_failed');
    }

    app.listen(PORT, () => {
        logger.info({ port: PORT }, "server_started");
        startQueueWorker();
        cronService.start();
    });
}

void bootstrap();
