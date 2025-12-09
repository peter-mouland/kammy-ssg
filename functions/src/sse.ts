// functions/src/index.ts
import * as functions from 'firebase-functions';

// In-memory storage for progress updates and connections
const progressUpdates = new Map<string, any>();
const activeConnections = new Map<string, any[]>();
const keepAliveIntervals = new Map<string, any>();

// SSE endpoint - streams progress updates to clients
export const adminProgress = functions.https.onRequest((req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', 'https://draft-ff.web.app');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Cache-Control, Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).send('Method not allowed');
        return;
    }

    const jobId = req.query.jobId as string;
    if (!jobId) {
        res.status(400).send('Missing jobId parameter');
        return;
    }

    console.log('🔍 New SSE connection for jobId:', jobId);

    // Set SSE headers
    res.set('Content-Type', 'text/event-stream');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');
    res.set('X-Accel-Buffering', 'no');

    // Track this connection
    if (!activeConnections.has(jobId)) {
        activeConnections.set(jobId, []);
    }
    activeConnections.get(jobId)!.push(res);

    console.log(`📡 Total SSE connections for job ${jobId}: ${activeConnections.get(jobId)!.length}`);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
        type: 'connection',
        jobId,
        message: 'Connected to progress stream',
        timestamp: Date.now(),
    })}\n\n`);

    // Send current progress if it exists
    const currentProgress = progressUpdates.get(jobId);
    if (currentProgress) {
        console.log('📤 Sending existing progress to new connection:', currentProgress);
        res.write(`data: ${JSON.stringify(currentProgress)}\n\n`);
    }

    // Create unique key for this connection
    const connectionKey = `${jobId}-${Date.now()}`;

    // Set up keep-alive heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: Date.now(),
            })}\n\n`);
        } catch (error) {
            console.log('❌ Heartbeat failed, connection closed');
            clearInterval(heartbeatInterval);
            keepAliveIntervals.delete(connectionKey);
        }
    }, 30000);

    // Store the interval
    keepAliveIntervals.set(connectionKey, heartbeatInterval);

    // Handle client disconnect
    req.on('close', () => {
        console.log('🔌 Client disconnected from job:', jobId);
        clearInterval(heartbeatInterval);
        keepAliveIntervals.delete(connectionKey);
        removeConnection(jobId, res);
    });

    req.on('end', () => {
        console.log('🔌 Client ended connection for job:', jobId);
        clearInterval(heartbeatInterval);
        keepAliveIntervals.delete(connectionKey);
        removeConnection(jobId, res);
    });
});

// HTTP endpoint - receives progress updates from React Router app
export const updateProgress = functions.https.onRequest((req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', 'https://draft-ff.web.app');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const progressData = req.body;
    const jobId = progressData.jobId;

    console.log('📥 Received progress update for job:', jobId, 'data:', progressData);

    if (!jobId) {
        res.status(400).json({ error: 'Missing jobId' });
        return;
    }

    // Store the progress update
    progressUpdates.set(jobId, progressData);

    // Broadcast to all SSE connections for this job
    const connections = activeConnections.get(jobId) || [];
    console.log(`📡 Broadcasting to ${connections.length} SSE connections for job ${jobId}`);

    if (connections.length > 0) {
        const data = `data: ${JSON.stringify(progressData)}\n\n`;

        connections.forEach((connection, index) => {
            try {
                console.log(`📤 Sending update to connection ${index + 1}`);
                connection.write(data);

                // Close connection if job is complete
                if (progressData.status === 'completed' || progressData.status === 'error') {
                    console.log(`🔚 Closing connection ${index + 1} - job ${progressData.status}`);
                    connection.end();
                }
            } catch (error) {
                console.error(`❌ Error writing to SSE connection ${index + 1}:`, error);
                // Remove broken connection
                connections.splice(index, 1);
            }
        });

        // Remove completed connections
        if (progressData.status === 'completed' || progressData.status === 'error') {
            activeConnections.delete(jobId);
        }
    } else {
        console.log('⚠️ No active SSE connections for job:', jobId);
    }

    // Clean up if job is complete
    if (progressData.status === 'completed' || progressData.status === 'error') {
        setTimeout(() => {
            console.log(`🧹 Cleaning up job ${jobId}`);
            progressUpdates.delete(jobId);
            activeConnections.delete(jobId);

            // Clean up any remaining intervals for this job
            for (const [key, interval] of keepAliveIntervals.entries()) {
                if (key.startsWith(jobId)) {
                    clearInterval(interval);
                    keepAliveIntervals.delete(key);
                }
            }
        }, 5000);
    }

    console.log(`✅ Progress update processed for job ${jobId}`);
    res.json({ success: true });
});

// Helper function to remove a connection
function removeConnection(jobId: string, res: any) {
    const connections = activeConnections.get(jobId);
    if (connections) {
        const index = connections.indexOf(res);
        if (index > -1) {
            connections.splice(index, 1);
        }
        if (connections.length === 0) {
            activeConnections.delete(jobId);
        }
    }
}
