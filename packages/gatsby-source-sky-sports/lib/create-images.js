const path = require('path');
const fs = require('fs');

const hashContent = require('./hash-content');
const { nodeTypes, mediaTypes } = require('./constants');

const imageDirectory = `../../../src/assets/learn/`;

const getFileTypeFromDataUri = (dataUri) =>
    dataUri
        .split('data:image/')
        .pop()
        .split(';base64')[0];
const getFileDataFromDataUri = (dataUri) => dataUri.replace(/^data:image\/\w+;base64,/, '');

module.exports = ({ pageId, type, image }) => {
    if (!type || !image) {
        return null;
    }
    // hash image content so if a new image is added a new node wil be created
    const imageContentHash = hashContent(image);
    const fileType = getFileTypeFromDataUri(image);
    if (!fileType) return null;

    const fileName = `${imageContentHash}-${type}`;
    const fileData = getFileDataFromDataUri(image);
    const fileBuffer = Buffer.from(fileData, 'base64');
    const saveToDirectory = `${imageDirectory}/${fileName}.${fileType}`;
    fs.writeFileSync(path.resolve(__dirname, saveToDirectory), fileBuffer);

    return {
        resourceId: `adana-image-${fileName}`,
        pageId,
        data: {
            fileName,
            fileType,
        },
        internal: {
            type: nodeTypes.LearnImage,
            description: 'Learn Images',
            mediaType: mediaTypes.IMG(fileType),
        },
    };
};
