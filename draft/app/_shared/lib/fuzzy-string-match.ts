export function fuzzyStringMatch(
    str1: string,
    str2: string,
    options: {
        ignoreCase?: boolean;
        ignoreAccents?: boolean;
        locale?: string;
    } = {},
): boolean {
    const { ignoreCase = true, ignoreAccents = true, locale = 'en' } = options;

    let a = str1;
    let b = str2;

    if (ignoreCase) {
        a = a.toLowerCase();
        b = b.toLowerCase();
    }

    if (ignoreAccents) {
        a = a.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        b = b.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    return a.includes(b);
    //     a.localeCompare(b, locale, {
    //         sensitivity: ignoreCase && ignoreAccents ? 'base' : 'accent',
    //     }) === 0
    // );
}
