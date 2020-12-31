const getEmoji = (status = '') => {
    switch (status.toLowerCase()) {
        case 'tbc':
            return '&#129300;'; // thinking
        case 'e':
            return '&#129324;'; // angry
        case 'y':
            return '&#129303;'; // happy
        default:
            return '';
    }
};

export default getEmoji;
