import fs from 'fs/promises';
import path from 'path';

export class PersistentStore<T extends object> {
    private state: T;

    constructor(private readonly filePath: string, private readonly initialState: T) {
        this.state = structuredClone(initialState);
    }

    async load(): Promise<T> {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            const raw = await fs.readFile(this.filePath, 'utf-8');
            const parsed = JSON.parse(raw) as T;
            this.state = parsed;
        } catch (error: any) {
            if (error?.code !== 'ENOENT') throw error;
            await this.flush();
        }
        return this.state;
    }

    get(): T {
        return this.state;
    }

    async set(nextState: T): Promise<void> {
        this.state = nextState;
        await this.flush();
    }

    async update(mutator: (current: T) => T): Promise<T> {
        const next = mutator(this.state);
        this.state = next;
        await this.flush();
        return this.state;
    }

    private async flush(): Promise<void> {
        await fs.writeFile(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    }
}
