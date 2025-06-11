export interface BatchProcessorOptions {
    batchSize?: number;
    maxConcurrent?: number;
    logProgress?: boolean;
}

/**
 * Process an array of items in batches with controlled concurrency
 */
export async function processBatched<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessorOptions = {}
): Promise<R[]> {
    const {
        batchSize = 50,
        maxConcurrent = 10,
        logProgress = false
    } = options;

    const results: R[] = [];

    if (logProgress) {
        console.log(`📦 Processing ${items.length} items in batches of ${batchSize} (max ${maxConcurrent} concurrent)`);
    }

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(items.length / batchSize);

        if (logProgress) {
            console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} items)`);
        }

        // Process batch with limited concurrency
        const chunks = chunkArray(batch, maxConcurrent);

        for (const chunk of chunks) {
            const promises = chunk.map(processor);
            const chunkResults = await Promise.all(promises);
            results.push(...chunkResults);
        }
    }

    return results;
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export interface BatchReadOptions {
    batchSize?: number;
    logProgress?: boolean;
}

/**
 * Process batch reads with controlled batch sizes to avoid payload limits
 */
export async function processBatchedReads<T, R>(
    items: T[],
    reader: (batch: T[]) => Promise<R[]>,
    options: BatchReadOptions = {}
): Promise<R[]> {
    const {
        batchSize = 100,
        logProgress = false
    } = options;

    const results: R[] = [];

    if (logProgress && items.length > batchSize) {
        console.log(`📖 Reading ${items.length} items in batches of ${batchSize}`);
    }

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(items.length / batchSize);

        if (logProgress && items.length > batchSize) {
            console.log(`📖 Reading batch ${batchNum}/${totalBatches} (${batch.length} items)`);
        }

        const batchResults = await reader(batch);
        results.push(...batchResults);
    }

    return results;
}
