function path(obj, pathArr) {
    if (arguments.length === 1) {
        return (objHolder) => path(objHolder, pathArr);
    }
    if (obj === null || obj === undefined) {
        return undefined;
    }
    let willReturn = obj;
    let counter = 0;

    const pathArrValue = typeof pathArr === 'string' ? pathArr.split('.') : pathArr;

    while (counter < pathArrValue.length) {
        if (willReturn === null || willReturn === undefined) {
            return undefined;
        }
        willReturn = willReturn[pathArrValue[counter]];
        counter += 1;
    }

    return willReturn;
}

module.exports = path;
