const functions = require('firebase-functions');
const fetchr = require('node-fetch');

exports.refreshPlayerCache = functions.pubsub
    .schedule('0 */6 * * *') // Every 6 hours
    .timeZone('Europe/London')
    .onRun(async () => {
        try {
            const token = process.env.CACHE_REFRESH_TOKEN;
            const appUrl = process.env.APP_URL; // Your deployed app URL

            const response = await fetchr(`${appUrl}/api/refresh-cache?token=${token}`, {
                method: 'POST'
            });

            const result = await response.json();
            console.log('Cache refresh result:', result);

            return result;
        } catch (error) {
            console.error('Scheduled cache refresh failed:', error);
            throw error;
        }
    });
