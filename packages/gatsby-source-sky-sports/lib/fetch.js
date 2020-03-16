const http = require('https');

const fetch = (URL) => new Promise((resolve, reject) => {
    console.log(`fetch: ${URL}`);
    const options = {
        host: 'https://kammy-proxy.herokuapp.com/',
        rejectUnauthorized: false,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Target-Endpoint': URL,
        },
    };
    const req = http.get(URL, options, (res) => {
        if (URL.includes('fixtures')) {
            console.log(res);
        }
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                resolve(json);
            } catch (e) {
                console.log(URL);
                console.log(data);
                throw Error(e);
            }
        });
    });

    req.on('error', (e) => {
        reject(e.message);
    });
});

module.exports = fetch;
