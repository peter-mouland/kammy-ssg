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
                const presetCol = orderPreset[col];
                const attrA = presetCol ? presetCol.indexOf(prevColKey) : prevColKey;
                const attrB = presetCol ? presetCol.indexOf(currColKey) : currColKey;
                const orderPrev = presetCol && attrA < 0 ? Infinity : attrA;
                const orderCurr = presetCol && attrB < 0 ? Infinity : attrB;
                if (orderPrev > orderCurr) {
                    return dir;
                } else if (orderPrev < orderCurr) {
                    return -dir;
                } else if (attrA === null) {
                    return dir;
                } else if (attrB === null) {
                    return -dir;
                }
                return 0;
            })
            .reduce((prev, curr) => prev || curr, 0);
}

module.exports = sortColumns;
