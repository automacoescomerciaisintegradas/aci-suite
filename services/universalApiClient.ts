/**
 * =========================================
 * ACI - Cliente API Compatível Universal
 * =========================================
 * 
 * Cliente API que funciona tanto no frontend quanto no backend
 * Evita dependências específicas de ambiente
 */

// URL da API:
// - No navegador, prefere VITE_API_URL; sem ela usa mesma origem (com proxy no Vite).
// - Fora do navegador (SSR/scripts), usa API_URL ou localhost:4001.
const API_BASE_URL = (() => {
    const envApiUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL?.trim() : '';
    const sanitize = (url: string) => url.replace(/\/+$/, '');
    const isLocalhostHost = (host: string) => host === 'localhost' || host === '127.0.0.1';
    const isLocalApiUrl = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(sanitize(url));

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (isLocalhostHost(hostname) && envApiUrl && !isLocalApiUrl(envApiUrl)) {
            // Em dev local, evita CORS usando proxy do Vite quando VITE_API_URL aponta para ambiente remoto.
            return '';
        }
        return envApiUrl ? sanitize(envApiUrl) : '';
    }

    return sanitize(process.env.API_URL || 'http://localhost:4001');
})();

// Debug: mostrar qual URL está sendo usada
console.log('🔧 API URL:', API_BASE_URL || '(mesma origem)');

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    [key: string]: any;
}

class UniversalApiClient {
    private baseUrl: string;
    private userId: string | null = null;
    private token: string | null = null;

    // Storage handling (works in both frontend and backend)
    private getStorage(): Storage | null {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
        // Mock storage for backend
        return {
            getItem: (key: string) => {
                if (key === 'authToken') return this.token;
                if (key === 'userId') return this.userId;
                return null;
            },
            setItem: (key: string, value: string) => {
                if (key === 'authToken') this.token = value;
                if (key === 'userId') this.userId = value;
            },
            removeItem: (key: string) => {
                if (key === 'authToken') this.token = null;
                if (key === 'userId') this.userId = null;
            },
            clear: () => {
                this.token = null;
                this.userId = null;
            },
            length: 0,
            key: (index: number) => null
        } as Storage;
    }

    // Token handling
    private getToken(): string | null {
        return this.getStorage()?.getItem('authToken') || null;
    }

    private setToken(token: string | null) {
        const storage = this.getStorage();
        if (token) {
            storage?.setItem('authToken', token);
        } else {
            storage?.removeItem('authToken');
        }
    }

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        // Recuperar userId do storage se existir
        this.userId = this.getStorage()?.getItem('userId') || null;
    }

    setUserId(userId: string | null) {
        this.userId = userId;
        const storage = this.getStorage();
        if (userId) {
            storage?.setItem('userId', userId);
        } else {
            storage?.removeItem('userId');
        }
    }

    getUserId(): string | null {
        return this.userId;
    }

    private async isLocalBackendAvailable(): Promise<boolean> {
        if (typeof window === 'undefined') return true;
        try {
            const response = await fetch('http://localhost:4001/health', { method: 'GET' });
            return response.ok;
        } catch {
            return false;
        }
    }


    private async request<T = any>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const token = this.getToken();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(this.userId ? { 'X-User-Id': this.userId } : {}),
            ...options.headers,
        };

        try {
            // console.log('🔵 Request:', { url, method: options.method || 'GET', body: options.body });

            const response = await fetch(url, {
                ...options,
                headers,
            });
            const rawBody = await response.text();
            let data: any = null;

            if (rawBody) {
                try {
                    data = JSON.parse(rawBody);
                } catch {
                    data = null;
                }
            }

            // console.log('🟢 Response:', { status: response.status, ok: response.ok, data });

            if (!response.ok) {
                if (
                    response.status === 500 &&
                    !rawBody &&
                    typeof window !== 'undefined' &&
                    this.baseUrl === ''
                ) {
                    const backendUp = await this.isLocalBackendAvailable();
                    if (!backendUp) {
                        throw new Error('Backend local indisponivel em http://localhost:4001. Inicie com `npm run server` (ou `npm run dev`).');
                    }
                }

                const snippet = rawBody ? ` - ${rawBody.slice(0, 180)}` : '';
                const message = data?.error || `HTTP ${response.status}${snippet}`;
                throw new Error(message);
            }

            if (!rawBody) {
                return {} as T;
            }

            if (data === null) {
                throw new Error(`Resposta inválida da API (esperado JSON). HTTP ${response.status}`);
            }

            return data as T;
        } catch (error: any) {
            if (
                typeof window !== 'undefined' &&
                this.baseUrl === '' &&
                error instanceof TypeError &&
                /fetch/i.test(error.message || '')
            ) {
                const backendUp = await this.isLocalBackendAvailable();
                if (!backendUp) {
                    throw new Error('Backend local indisponivel em http://localhost:4001. Inicie com `npm run server` (ou `npm run dev`).');
                }
            }
            console.error('API request error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async signup(email: string, password: string, metadata?: {
        full_name?: string;
        phone?: string;
        role?: 'user' | 'admin';
    }) {
        const response = await this.request('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, metadata }),
        });

        if (response.success && response.user) {
            this.setUserId(response.user.id);
            // Salvar token JWT no storage
            if (response.token) {
                this.setToken(response.token);
            }
        }

        return response;
    }

    async login(email: string, password: string) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.success && response.user) {
            this.setUserId(response.user.id);
            // Salvar token JWT no storage
            if (response.token) {
                this.setToken(response.token);
            }
        }

        return response;
    }

    async getUser(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/auth/user?id=${id}`);
    }

    async updateProfile(data: {
        full_name?: string;
        display_name?: string;
        phone?: string;
        avatar_url?: string;
    }) {
        if (!this.userId) throw new Error('User not logged in');

        return await this.request('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ userId: this.userId, ...data }),
        });
    }

    logout() {
        this.setUserId(null);
        this.setToken(null);
    }

    // Password Reset endpoints
    async forgotPassword(email: string) {
        return await this.request('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async verifyResetToken(token: string) {
        return await this.request('/api/auth/validate-reset-token', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async resetPassword(token: string, newPassword: string) {
        return await this.request('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    }

    // Credits endpoints
    async getCredits(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/credits/balance?userId=${id}`);
    }

    async getCreditTransactions(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/credits/transactions?userId=${id}`);
    }

    // Packages endpoints
    async getPackages() {
        return await this.request('/api/packages');
    }

    // WordPress endpoints
    async getWordPressConnections(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/wordpress/connections?userId=${id}`);
    }

    async connectWordPress(data: {
        siteUrl: string;
        username: string;
        password: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/wordpress/connect', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    async disconnectWordPress(connectionId: string, userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/wordpress/disconnect?connectionId=${connectionId}&userId=${id}`, {
            method: 'DELETE',
        });
    }

    async publishToWordPress(data: {
        connectionId: string;
        postTitle: string;
        postContent: string;
        postStatus?: 'draft' | 'publish';
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/wordpress/publish', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    // Instagram endpoints
    async getInstagramAccounts(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/instagram/accounts?userId=${id}`);
    }

    async connectInstagram(data: {
        accessToken: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/instagram/connect', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    async disconnectInstagram(accountId: string, userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/instagram/disconnect?accountId=${accountId}&userId=${id}`, {
            method: 'DELETE',
        });
    }

    async postToInstagram(data: {
        accountId: string;
        caption: string;
        imageUrl: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/instagram/post', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    // Payments endpoints
    async createPaymentIntent(data: {
        amount: number;
        currency?: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/payments/create-intent', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    async confirmPayment(data: {
        paymentIntentId: string;
        paymentMethodId: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/payments/confirm', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    async getPaymentHistory(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/payments/history?userId=${id}`);
    }

    // Settings endpoints
    async getUserSettings(userId?: string) {
        const id = userId || this.userId;
        if (!id) throw new Error('User ID not available');

        return await this.request(`/api/settings/me?userId=${id}`);
    }

    async updateUserSettings(data: {
        notifications?: boolean;
        emailNotifications?: boolean;
        smsNotifications?: boolean;
        theme?: 'light' | 'dark';
        language?: string;
        userId?: string;
    }) {
        const userId = data.userId || this.userId;
        if (!userId) throw new Error('User ID not available');

        return await this.request('/api/settings', {
            method: 'POST',
            body: JSON.stringify({ ...data, userId }),
        });
    }

    async getIntegrationsStatus(options?: { deep?: boolean; userId?: string }) {
        const params = new URLSearchParams();
        if (options?.deep) params.set('deep', 'true');
        if (options?.userId || this.userId) params.set('userId', options?.userId || this.userId || '');
        const query = params.toString();
        return await this.request(`/api/integrations/status${query ? `?${query}` : ''}`);
    }
}

// Exportar instância singleton
export const apiClient = new UniversalApiClient();

export default apiClient;
