const fetch = require('node-fetch');

exports.handler = async function skySportsScores(event, context) {
    const headers = {
        Accept: 'application/json',
    };

    const { code } = event.queryStringParameters;

    try {
        const response = await fetch(`https://fantasyfootball.skysports.com/cache/json_player_stats_${code}.json`, {
            headers,
        });
        if (!response.ok) {
            // NOT res.status >= 200 && res.status < 300
            return { statusCode: response.status, body: response.statusText };
        }
        const data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (err) {
        console.log(err); // output to netlify function log
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
        };
    }
};