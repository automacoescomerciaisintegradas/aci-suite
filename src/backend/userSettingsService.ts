import fs from 'fs';
import path from 'path';

type InstagramUserSettings = {
    username?: string;
    profilePictureUrl?: string;
} | null;

interface UserSettings {
    shopeeAffiliateId?: string;
    shopeeDefaultSubId?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    telegramBotUsername?: string;
    instagramToken?: string;
    instagramUsername?: string;
    instagramUser?: InstagramUserSettings;
    wordpressUrl?: string;
    wordpressUsername?: string;
    wordpressAppPassword?: string;
    woocommerceUrl?: string;
    woocommerceConsumerKey?: string;
    woocommerceConsumerSecret?: string;
    whatsappWebhookUrl?: string;
    whatsappBusinessToken?: string;
    whatsappPhoneId?: string;
    n8nWebhookUrl?: string;
    apiRestBaseUrl?: string;
    apiRestToken?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
    anthropicApiKey?: string;
    groqApiKey?: string;
    ollamaApiKey?: string;
}

type PersistedState = Record<string, UserSettings>;

const SETTINGS_FILE = path.resolve(process.cwd(), 'storage', 'state', 'user-settings.json');

class UserSettingsService {
    private settings = new Map<string, UserSettings>();
    private persistQueue: Promise<void> = Promise.resolve();

    constructor() {
        this.hydrateFromDisk();
    }

    private hydrateFromDisk() {
        try {
            if (!fs.existsSync(SETTINGS_FILE)) return;
            const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            if (!raw.trim()) return;
            const parsed = JSON.parse(raw) as PersistedState;
            Object.entries(parsed || {}).forEach(([userId, value]) => {
                this.settings.set(userId, value || {});
            });
        } catch (error) {
            console.error('❌ Erro ao carregar user-settings persistido:', error);
        }
    }

    private schedulePersist() {
        const snapshot: PersistedState = {};
        this.settings.forEach((value, key) => {
            snapshot[key] = value;
        });

        this.persistQueue = this.persistQueue
            .then(async () => {
                await fs.promises.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
                await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
            })
            .catch((error) => {
                console.error('❌ Erro ao persistir user-settings:', error);
            });
    }

    // Obter configurações do usuário
    getSettings(userId: string): UserSettings {
        return this.settings.get(userId) || {};
    }

    // Salvar configurações genéricas do usuário (merge)
    saveSettings(userId: string, partial: Partial<UserSettings>): boolean {
        try {
            const currentSettings = this.getSettings(userId);
            const nextSettings: UserSettings = {
                ...currentSettings,
                ...partial
            };

            this.settings.set(userId, nextSettings);
            this.schedulePersist();
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar configurações do usuário:', error);
            return false;
        }
    }

    // Salvar ID de Afiliado Shopee
    saveShopeeAffiliateId(userId: string, affiliateId: string): boolean {
        const ok = this.saveSettings(userId, { shopeeAffiliateId: affiliateId });
        if (ok) console.log(`✅ ID de Afiliado Shopee salvo para ${userId}: ${affiliateId}`);
        return ok;
    }

    // Validar ID de Afiliado Shopee
    validateShopeeAffiliateId(affiliateId: string): { valid: boolean; error?: string } {
        if (!affiliateId || affiliateId.trim() === '') {
            return { valid: false, error: 'ID de afiliado não pode estar vazio' };
        }

        if (affiliateId.length < 5) {
            return { valid: false, error: 'ID de afiliado muito curto (mínimo 5 caracteres)' };
        }

        if (!/^[a-zA-Z0-9]+$/.test(affiliateId)) {
            return { valid: false, error: 'ID de afiliado deve conter apenas letras e números' };
        }

        return { valid: true };
    }

    // Salvar configurações do Telegram
    saveTelegramSettings(userId: string, botToken: string, botUsername: string): boolean {
        const ok = this.saveSettings(userId, {
            telegramBotToken: botToken,
            telegramBotUsername: botUsername,
        });
        if (ok) console.log(`✅ Configurações do Telegram salvas para ${userId}`);
        return ok;
    }

    // Salvar configurações do Instagram
    saveInstagramSettings(userId: string, token: string, username: string): boolean {
        const ok = this.saveSettings(userId, {
            instagramToken: token,
            instagramUsername: username,
        });
        if (ok) console.log(`✅ Configurações do Instagram salvas para ${userId}`);
        return ok;
    }
}

export const userSettingsService = new UserSettingsService();

