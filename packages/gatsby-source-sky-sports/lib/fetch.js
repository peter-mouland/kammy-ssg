const http = require('https');

const fetch = (URL) => new Promise((resolve, reject) => {
  console.log(`fetch: ${URL}`)
  const req = http.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const json = JSON.parse(data);
      resolve(json);
    });
  });

  req.on('error', (e) => {
    reject(e.message);
  });
});

module.exports = fetch;
