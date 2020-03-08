const crypto = require('crypto');

// create hash as a unique content ID so when it changes Gatsby knows to create a new node
module.exports = (hashData) => {
    const nodeContent = JSON.stringify(hashData);
    return crypto
        .createHash('md5')
        .update(nodeContent)
        .digest('hex');
};
