// app/admin/libs/progress-store.server.ts

export interface ProgressUpdate {
    jobId: string;
    jobType: 'all' | 'gameweek' | 'gameweeks';
    stage: 'starting' | 'gameweek' | 'division' | 'team' | 'completed' | 'error';
    percentage: number;
    message: string;
    timestamp: number;
    status: 'running' | 'completed' | 'error';
    error?: string;
    details?: {
        currentGameweek?: number;
        totalGameweeks?: number;
        currentDivision?: string;
        totalDivisions?: number;
        currentTeam?: string;
        totalTeams?: number;
        currentPlayer?: string;
        totalPlayers?: number;
    };
}

export interface ProgressSubscriber {
    response: Response;
    controller: ReadableStreamDefaultController;
}

class ProgressStore {
    private jobs = new Map<string, ProgressUpdate>();
    private subscribers = new Map<string, Set<ProgressSubscriber>>();

    updateProgress(jobId: string, update: Partial<ProgressUpdate>): void {
        const existing = this.jobs.get(jobId);
        const fullUpdate: ProgressUpdate = {
            ...existing,
            ...update,
            jobId,
            timestamp: Date.now(),
        } as ProgressUpdate;

        this.jobs.set(jobId, fullUpdate);
        this.notifySubscribers(jobId, fullUpdate);

        if (fullUpdate.status === 'completed' || fullUpdate.status === 'error') {
            setTimeout(() => {
                this.jobs.delete(jobId);
            }, 5000);
        }
    }

    getProgress(jobId: string): ProgressUpdate | undefined {
        return this.jobs.get(jobId);
    }

    subscribe(jobId: string, subscriber: ProgressSubscriber): void {
        if (!this.subscribers.has(jobId)) {
            this.subscribers.set(jobId, new Set());
        }
        this.subscribers.get(jobId)!.add(subscriber);

        // This should send current progress, but let's debug it
        const currentProgress = this.jobs.get(jobId);
        if (currentProgress) {
            this.sendToSubscriber(subscriber, currentProgress);
        }
    }

    unsubscribe(jobId: string, subscriber: ProgressSubscriber): void {
        const jobSubscribers = this.subscribers.get(jobId);
        if (jobSubscribers) {
            jobSubscribers.delete(subscriber);
            if (jobSubscribers.size === 0) {
                this.subscribers.delete(jobId);
            }
        }
    }
    private sendToSubscriber(subscriber: ProgressSubscriber, update: ProgressUpdate): void {
        console.log('🔍 Sending update to subscriber:', {
            jobId: update.jobId,
            stage: update.stage,
            percentage: update.percentage,
        });
        const data = `data: ${JSON.stringify(update)}\n\n`;
        try {
            subscriber.controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
            console.error('❌ Failed to send update to subscriber:', error);
            throw error;
        }
    }

    private notifySubscribers(jobId: string, update: ProgressUpdate): void {
        const jobSubscribers = this.subscribers.get(jobId);
        if (!jobSubscribers) {
            return;
        }

        const subscribersArray = Array.from(jobSubscribers);
        subscribersArray.forEach((subscriber) => {
            try {
                this.sendToSubscriber(subscriber, update);
            } catch (error) {
                console.error('Error sending to subscriber:', error);
                jobSubscribers.delete(subscriber);
            }
        });
    }

    createJob(jobId: string, jobType: ProgressUpdate['jobType']): void {
        const initialUpdate: ProgressUpdate = {
            jobId,
            jobType,
            stage: 'starting',
            percentage: 0,
            message: 'Initializing...',
            timestamp: Date.now(),
            status: 'running',
        };

        this.jobs.set(jobId, initialUpdate);
    }
}

export const progressStore = new ProgressStore();
