import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PersistentStore } from './persistentStore';

describe('PersistentStore', () => {
    it('persiste dados em disco e recarrega em nova instancia', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aci-store-'));
        const filePath = path.join(tempDir, 'store.json');

        const storeA = new PersistentStore<{ counter: number; items: string[] }>(filePath, {
            counter: 0,
            items: [],
        });
        await storeA.load();
        await storeA.update((state) => ({
            ...state,
            counter: state.counter + 1,
            items: [...state.items, 'first'],
        }));

        const storeB = new PersistentStore<{ counter: number; items: string[] }>(filePath, {
            counter: 0,
            items: [],
        });
        await storeB.load();
        const state = storeB.get();

        expect(state.counter).toBe(1);
        expect(state.items).toEqual(['first']);
    });
});
