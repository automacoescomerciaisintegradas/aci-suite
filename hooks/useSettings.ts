import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../src/services/apiClient';

export interface Settings {
    telegramBotToken: string;
    telegramChatId: string;
    shopeeAffiliateId: string;
    shopeeDefaultSubId: string;
    amazonAffiliateId: string;
    mercadoLivreAffiliateId: string;
    whatsappWebhookUrl: string;
    whatsappBusinessToken: string;
    whatsappPhoneId: string;
    sendInterval: number;
    weeklyReportEnabled: boolean;
    weeklyReportCron: string;
    weeklyReportWebhook: string;
    instagramClientId: string;
    instagramRedirectUri: string;
    instagramUser: { username: string; profilePictureUrl: string; } | null;
    theme: 'dark' | 'light';
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    aiTextModel: string;
    aiImageModel: string;
    aiTemperature: number;
    aiTopP: number;
    aiTopK: number;
    aiMaxOutputTokens: number;
    credits: number;
    creditBalance: number; // Quantidade atual de créditos
    creditSpent: number; // Créditos já utilizados
    creditTransactions: Array<{ id: string, date: Date, type: 'purchase' | 'usage', amount: number, description: string }>; // Histórico de transações
    n8nWebhookUrl: string; // URL do webhook do n8n
    apiRestBaseUrl: string;
    apiRestToken: string;
    automationEnabled: boolean; // Se as automações estão habilitadas
    webhookTimeout: number; // Timeout para chamadas de webhook em segundos
    webhookRetries: number; // Número de tentativas para chamadas de webhook
    automationCreditsPerExecution: number; // Quantidade de créditos consumidos por execução de automação
    openaiApiKey: string;
    anthropicApiKey: string;
    groqApiKey: string;
    ollamaApiKey: string; // Can be used for Base URL as well
    wordpressUrl: string;
    wordpressUsername: string;
    wordpressAppPassword: string;
    woocommerceUrl: string;
    woocommerceConsumerKey: string;
    woocommerceConsumerSecret: string;
    geminiApiKey: string;
}

const defaultSettings: Settings = {
    telegramBotToken: '',
    telegramChatId: '',
    shopeeAffiliateId: '',
    shopeeDefaultSubId: '45cf61a8-2faa-41dd-b261-8da24e16bf19',
    amazonAffiliateId: '',
    mercadoLivreAffiliateId: '',
    whatsappWebhookUrl: '',
    whatsappBusinessToken: '',
    whatsappPhoneId: '',
    sendInterval: 5,
    weeklyReportEnabled: false,
    weeklyReportCron: '0 9 * * 1',
    weeklyReportWebhook: '',
    instagramClientId: '1089163016219900',
    instagramRedirectUri: 'https://aci.automacoescomerciais.com.br/User/Instagram/Callback',
    instagramUser: null,
    theme: 'dark',
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
    fontFamily: 'Inter',
    aiTextModel: 'gemini-2.0-flash',
    aiImageModel: 'imagen-4.0-generate-001',
    aiTemperature: 0.7,
    aiTopP: 0.95,
    aiTopK: 40,
    aiMaxOutputTokens: 2048,
    credits: 3000,
    creditBalance: 3000,
    creditSpent: 0,
    creditTransactions: [
        {
            id: 'initial_bonus',
            date: new Date(),
            type: 'purchase',
            amount: 3000,
            description: 'Bônus de boas-vindas para novos usuários'
        }
    ],
    n8nWebhookUrl: '',
    apiRestBaseUrl: '',
    apiRestToken: '',
    automationEnabled: false,
    webhookTimeout: 30,
    webhookRetries: 3,
    automationCreditsPerExecution: 5,
    openaiApiKey: '',
    anthropicApiKey: '',
    groqApiKey: '',
    ollamaApiKey: '',
    wordpressUrl: '',
    wordpressUsername: '',
    wordpressAppPassword: '',
    woocommerceUrl: '',
    woocommerceConsumerKey: '',
    woocommerceConsumerSecret: '',
    geminiApiKey: '',
};

const SETTINGS_KEY = 'aci-settings';

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            let merged = defaultSettings;

            try {
                const storedSettings = localStorage.getItem(SETTINGS_KEY);
                if (storedSettings) {
                    const loadedSettings = JSON.parse(storedSettings);
                    merged = { ...defaultSettings, ...loadedSettings };
                    setSettings(merged);
                } else {
                    setSettings(defaultSettings);
                }
            } catch (error) {
                console.error("Failed to load settings from localStorage", error);
            }

            // Fonte primária quando logado: API interna.
            // Mantém localStorage como fallback/offline.
            try {
                const hasToken = !!localStorage.getItem('authToken');
                if (hasToken) {
                    const response = await apiClient.getUserSettings();
                    if (response?.success && response?.data) {
                        const backendMerged = { ...merged, ...response.data };
                        localStorage.setItem(SETTINGS_KEY, JSON.stringify(backendMerged));
                        setSettings(backendMerged);
                    }
                }
            } catch (error) {
                console.warn('Falha ao sincronizar settings via API interna. Mantendo fallback local.', error);
            } finally {
                setIsLoading(false);
            }
        };

        void loadSettings();
    }, []);

    const saveSettings = useCallback((newSettings: Settings) => {
        try {
            // Atualizar o saldo de créditos com base nas transações
            const updatedSettings = {
                ...newSettings,
                creditBalance: newSettings.credits,
                creditSpent: newSettings.creditSpent || 0
            };

            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
            setSettings(updatedSettings);

            // Best-effort: sincroniza no backend quando autenticado.
            const hasToken = !!localStorage.getItem('authToken');
            if (hasToken) {
                void apiClient.saveUserSettings(updatedSettings as unknown as Record<string, any>);
            }
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, []);

    const addCreditTransaction = useCallback((type: 'purchase' | 'usage', amount: number, description: string) => {
        setSettings(prev => {
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newTransaction = {
                id: transactionId,
                date: new Date(),
                type,
                amount,
                description
            };

            const newCreditSpent = type === 'usage' ? prev.creditSpent + amount : prev.creditSpent;
            const newCreditBalance = type === 'purchase' ? prev.creditBalance + amount : prev.creditBalance - amount;

            const updatedSettings = {
                ...prev,
                creditSpent: newCreditSpent,
                credits: newCreditBalance,
                creditBalance: newCreditBalance,
                creditTransactions: [...prev.creditTransactions, newTransaction]
            };

            localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
            return updatedSettings;
        });
    }, []);

    return { settings, saveSettings, addCreditTransaction, isLoading };
};
