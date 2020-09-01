export default (string) => {
    if (string && string.split) {
        return string
            .split(/_|-| /)
            .map((part) => part[0].toUpperCase() + part.substr(1).toLowerCase())
            .join('');
    }

    return string;
};
