const http = require('https');
// const fs = require('fs');
// const path = require('path');

const fetch = (URL) =>
    new Promise((resolve, reject) => {
        console.log(`fetch: ${URL}`);
        const req = http.get(URL, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // todo:  write to disk at end of each season
                    // fs.writeFileSync(path.join(process.cwd(), 'skydata', URL.replace(/\//g, '-')), data, 'utf-8');
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
