const fs = require('fs');
const path = require('path');

const logger = require('../lib/log');

const storeData = (data, dir) => {
    try {
        fs.writeFileSync(path.join(process.cwd(), dir), JSON.stringify(data));
    } catch (err) {
        logger.error(err);
    }
};

module.exports = storeData;
