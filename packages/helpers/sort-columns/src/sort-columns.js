function getNestedKey(obj, key) {
    const isNestedKey = key.indexOf('.') > -1;
    if (!isNestedKey) return obj[key];
    return key.split('.').reduce((prev, curr) => prev[curr], obj);
}

function sortColumns(fields, orderPreset = {}) {
    return (prevRow, currRow) =>
        fields
            .map((field) => {
                const desc = field[0] === '-';
                const dir = desc ? -1 : 1;
                const col = desc ? field.substring(1) : field;
                const prevColKey = getNestedKey(prevRow, col);
                const currColKey = getNestedKey(currRow, col);
                const attrA = orderPreset[col] ? orderPreset[col].indexOf(prevColKey) : prevColKey;
                const attrB = orderPreset[col] ? orderPreset[col].indexOf(currColKey) : currColKey;
                const orderPrev = attrA < 0 ? Infinity : attrA;
                const orderCurr = attrB < 0 ? Infinity : attrB;
                if (orderPrev > orderCurr) return dir;
                if (orderPrev === null) return dir;
                if (orderCurr === null) return -dir;
                return orderPrev < orderCurr ? -dir : 0;
            })
            .reduce((prev, curr) => prev || curr, 0);
}

module.exports = sortColumns;
