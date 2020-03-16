const http = require('https');

const fetch = (URL) => new Promise((resolve, reject) => {
    console.log(`fetch: ${URL}`);
    const req = http.get(URL, (res) => {
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
