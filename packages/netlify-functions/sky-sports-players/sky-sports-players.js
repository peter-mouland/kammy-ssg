const fetch = require('node-fetch');

// eslint-disable-next-line no-unused-vars
exports.handler = async function skySportsScores(event, context) {
    try {
        const response = await fetch('https://fantasyfootball.skysports.com/cache/json_players.json', {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            // NOT res.status >= 200 && res.status < 300
            return { statusCode: response.status, body: response.statusText };
        }
        const data = await response.json();
        const body = JSON.stringify(data);

        return {
            statusCode: 200,
            headers: {
                /* Required for CORS support to work */
                'Access-Control-Allow-Origin': '*',
                /* Required for cookies, authorization headers with HTTPS */
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET',
                'Content-Length': body.length.toString(),
            },
            body,
        };
    } catch (err) {
        console.log(err); // output to netlify function log
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
        };
    }
};
