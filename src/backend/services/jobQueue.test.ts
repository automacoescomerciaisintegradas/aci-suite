import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { PersistentJobQueue } from './jobQueue';

describe('PersistentJobQueue', () => {
    it('reprocessa com retry e conclui job apos falha inicial', async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aci-queue-'));
        const filePath = path.join(tempDir, 'jobs.json');

        const queue = new PersistentJobQueue(filePath, {
            retryLimit: 2,
            retryBackoffMs: 1,
        });
        await queue.load();

        const created = await queue.enqueue('publish', { title: 'A' });
        let attempts = 0;
        await queue.processDueJobs(async () => {
            attempts += 1;
            if (attempts === 1) {
                throw new Error('first fail');
            }
        });
        await queue.processDueJobs(async () => {
            attempts += 1;
        });

        const finalJob = queue.getJob(created.id);
        expect(finalJob).toBeTruthy();
        expect(finalJob?.status).toBe('completed');
        expect(finalJob?.attempts).toBe(2);
    });
});
