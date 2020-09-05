const trimRows = (data = []) => {
    try {
        return data.map((keys) =>
            Object.keys(keys).reduce(
                (prev, key) => ({ ...prev, [key]: keys[key].trim ? keys[key].trim() : keys[key] }),
                {},
            ),
        );
    } catch (e) {
        console.error('formatSetup error');
        console.error(e);
        return [];
    }
};

module.exports = trimRows;
