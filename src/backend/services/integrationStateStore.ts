import path from 'path';
import { PersistentStore } from './persistentStore';

export type SessionRecord = {
    id: string;
    userId: string;
    userAgent: string;
    ipAddress?: string;
    startedAt: string;
    lastActivityAt: string;
    endedAt?: string;
    isActive: boolean;
};

export type ApiKeyRecord = {
    id: string;
    userId: string;
    service: string;
    key_name: string;
    api_key: string;
    created_at: string;
    updated_at: string;
};

export type WordPressConnectionRecord = {
    id: string;
    userId: string;
    name: string;
    site_url: string;
    username: string;
    application_password: string;
    created_at: string;
    updated_at: string;
};

export type ProfileOverride = {
    full_name?: string;
    display_name?: string;
    phone?: string;
    avatar_url?: string;
};

type IntegrationState = {
    profiles: Record<string, ProfileOverride>;
    avatarUrls: Record<string, string>;
    apiKeys: ApiKeyRecord[];
    sessions: SessionRecord[];
    wordpressConnections: WordPressConnectionRecord[];
};

class IntegrationStateStore {
    private readonly store = new PersistentStore<IntegrationState>(
        path.resolve(process.cwd(), 'storage', 'state', 'integrations.json'),
        {
            profiles: {},
            avatarUrls: {},
            apiKeys: [],
            sessions: [],
            wordpressConnections: [],
        }
    );

    async load() {
        await this.store.load();
    }

    getProfile(userId: string): ProfileOverride {
        return this.store.get().profiles[userId] || {};
    }

    async updateProfile(userId: string, partial: ProfileOverride): Promise<ProfileOverride> {
        await this.store.update((state) => ({
            ...state,
            profiles: {
                ...state.profiles,
                [userId]: {
                    ...(state.profiles[userId] || {}),
                    ...partial,
                },
            },
        }));
        return this.getProfile(userId);
    }

    getAvatarUrl(userId: string): string | undefined {
        return this.store.get().avatarUrls[userId];
    }

    async setAvatarUrl(userId: string, url: string): Promise<void> {
        await this.store.update((state) => ({
            ...state,
            avatarUrls: {
                ...state.avatarUrls,
                [userId]: url,
            },
            profiles: {
                ...state.profiles,
                [userId]: {
                    ...(state.profiles[userId] || {}),
                    avatar_url: url,
                },
            },
        }));
    }

    getApiKeys(userId: string): ApiKeyRecord[] {
        return this.store.get().apiKeys.filter((item) => item.userId === userId);
    }

    async addApiKey(record: ApiKeyRecord): Promise<void> {
        await this.store.update((state) => ({
            ...state,
            apiKeys: [record, ...state.apiKeys],
        }));
    }

    getSessions(userId: string): SessionRecord[] {
        return this.store.get().sessions.filter((item) => item.userId === userId).slice(0, 20);
    }

    async addSession(record: SessionRecord): Promise<void> {
        await this.store.update((state) => ({
            ...state,
            sessions: [record, ...state.sessions].slice(0, 5000),
        }));
    }

    async touchSession(sessionId: string): Promise<boolean> {
        let found = false;
        await this.store.update((state) => ({
            ...state,
            sessions: state.sessions.map((item) => {
                if (item.id !== sessionId) return item;
                found = true;
                return { ...item, lastActivityAt: new Date().toISOString() };
            }),
        }));
        return found;
    }

    async endSession(sessionId: string): Promise<boolean> {
        let found = false;
        await this.store.update((state) => ({
            ...state,
            sessions: state.sessions.map((item) => {
                if (item.id !== sessionId) return item;
                found = true;
                return {
                    ...item,
                    isActive: false,
                    endedAt: new Date().toISOString(),
                };
            }),
        }));
        return found;
    }

    getWordPressConnections(userId: string): WordPressConnectionRecord[] {
        return this.store.get().wordpressConnections.filter((item) => item.userId === userId);
    }

    async addWordPressConnection(record: WordPressConnectionRecord): Promise<void> {
        await this.store.update((state) => ({
            ...state,
            wordpressConnections: [record, ...state.wordpressConnections],
        }));
    }

    async removeWordPressConnection(userId: string, connectionId: string): Promise<void> {
        await this.store.update((state) => ({
            ...state,
            wordpressConnections: state.wordpressConnections.filter(
                (item) => !(item.userId === userId && item.id === connectionId)
            ),
        }));
    }
}

export const integrationStateStore = new IntegrationStateStore();
