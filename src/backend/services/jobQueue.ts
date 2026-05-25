import path from 'path';
import { PersistentStore } from './persistentStore';

export type QueueJobStatus = 'pending' | 'running' | 'retrying' | 'failed' | 'completed';

export type QueueJob = {
    id: string;
    type: string;
    payload: Record<string, any>;
    status: QueueJobStatus;
    attempts: number;
    retryLimit: number;
    nextRunAt: string;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
};

type QueueState = {
    jobs: QueueJob[];
};

type QueueOptions = {
    retryLimit?: number;
    retryBackoffMs?: number;
};

export class PersistentJobQueue {
    private readonly store: PersistentStore<QueueState>;
    private readonly retryLimit: number;
    private readonly retryBackoffMs: number;

    constructor(filePath: string, opts: QueueOptions = {}) {
        this.store = new PersistentStore<QueueState>(filePath, { jobs: [] });
        this.retryLimit = opts.retryLimit ?? 3;
        this.retryBackoffMs = opts.retryBackoffMs ?? 5000;
    }

    async load(): Promise<void> {
        await this.store.load();
    }

    async enqueue(type: string, payload: Record<string, any>, retryLimit?: number): Promise<QueueJob> {
        const now = new Date().toISOString();
        const job: QueueJob = {
            id: `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type,
            payload,
            status: 'pending',
            attempts: 0,
            retryLimit: retryLimit ?? this.retryLimit,
            nextRunAt: now,
            createdAt: now,
            updatedAt: now,
        };
        await this.store.update((state) => ({ jobs: [job, ...state.jobs] }));
        return job;
    }

    getJob(id: string): QueueJob | undefined {
        return this.store.get().jobs.find((job) => job.id === id);
    }

    listJobs(limit = 100): QueueJob[] {
        return this.store.get().jobs.slice(0, Math.max(1, limit));
    }

    getStats() {
        const jobs = this.store.get().jobs;
        return {
            total: jobs.length,
            pending: jobs.filter((j) => j.status === 'pending').length,
            running: jobs.filter((j) => j.status === 'running').length,
            retrying: jobs.filter((j) => j.status === 'retrying').length,
            failed: jobs.filter((j) => j.status === 'failed').length,
            completed: jobs.filter((j) => j.status === 'completed').length,
        };
    }

    async processDueJobs(handler: (job: QueueJob) => Promise<void>): Promise<number> {
        const snapshot = this.store.get().jobs;
        const nowMs = Date.now();
        const due = snapshot.filter((job) =>
            (job.status === 'pending' || job.status === 'retrying') &&
            new Date(job.nextRunAt).getTime() <= nowMs
        );

        for (const job of due) {
            await this.transition(job.id, (current) => ({
                ...current,
                status: 'running',
                updatedAt: new Date().toISOString(),
            }));

            try {
                await handler(job);
                await this.transition(job.id, (current) => ({
                    ...current,
                    status: 'completed',
                    attempts: current.attempts + 1,
                    completedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastError: undefined,
                }));
            } catch (error: any) {
                await this.transition(job.id, (current) => {
                    const attempts = current.attempts + 1;
                    const exhausted = attempts > current.retryLimit;
                    const delay = this.retryBackoffMs * attempts;
                    return {
                        ...current,
                        attempts,
                        status: exhausted ? 'failed' : 'retrying',
                        nextRunAt: exhausted ? current.nextRunAt : new Date(Date.now() + delay).toISOString(),
                        lastError: error?.message || 'unknown',
                        updatedAt: new Date().toISOString(),
                    };
                });
            }
        }

        return due.length;
    }

    private async transition(id: string, mutator: (job: QueueJob) => QueueJob): Promise<void> {
        await this.store.update((state) => ({
            jobs: state.jobs.map((job) => (job.id === id ? mutator(job) : job)),
        }));
    }
}

const queueFile = path.resolve(process.cwd(), 'storage', 'queue', 'jobs.json');
export const jobQueue = new PersistentJobQueue(queueFile);
