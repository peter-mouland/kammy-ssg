function lastSunday(month, year) {
    const d = new Date();
    const lastDayOfMonth = new Date(Date.UTC(year || d.getFullYear(), month + 1, 0));
    const day = lastDayOfMonth.getDay();
    return new Date(Date.UTC(lastDayOfMonth.getFullYear(), lastDayOfMonth.getMonth(), lastDayOfMonth.getDate() - day));
}

function isBST(date) {
    const d = date || new Date();
    const starts = lastSunday(2, d.getFullYear());
    starts.setHours(1);
    const ends = lastSunday(9, d.getFullYear());
    starts.setHours(1);
    return d.getTime() >= starts.getTime() && d.getTime() < ends.getTime();
}

function adjustDate({ date, ms = 0, sec = 0, min = 0, hrs = 0, days = 0 }) {
    const time = date.getTime(); // convert to milliseconds since epoch
    // add time difference
    // eslint-disable-next-line
    const newTime = time + ms + (1000 * sec) + (1000 * 60 * min) + (1000 * 60 * 60 * hrs) + (1000 * 60 * 60 * 24 * days);

    return new Date(newTime); // convert back to date; in this example: 2 hours from right now
}

export function getGmtDate(date) {
    const dateToConvert = date || new Date();
    return (isBST() ? adjustDate({ date: dateToConvert, hrs: 1 }) : dateToConvert).toUTCString();
}

export function getUtcDate(date) {
    const dateToConvert = date || new Date();
    return (isBST() ? adjustDate({ date: dateToConvert, hrs: -1 }) : dateToConvert).toUTCString();
}
