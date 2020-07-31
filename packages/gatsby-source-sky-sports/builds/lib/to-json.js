const fs = require('fs');
const path = require('path');

const storeData = (data, dir) => {
    try {
        fs.writeFileSync(path.join(process.cwd(), dir), JSON.stringify(data));
    } catch (err) {
        console.error(err);
    }
}

module.exports = storeData;
