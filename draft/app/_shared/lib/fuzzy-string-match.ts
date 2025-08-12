export function fuzzyStringMatch(
    str1: string,
    str2: string,
    options: {
        ignoreCase?: boolean;
        ignoreAccents?: boolean;
        locale?: string;
    } = {},
): boolean {
    const { ignoreCase = true, ignoreAccents = true } = options;

    let a = str1;
    let b = str2;

    if (ignoreCase) {
        a = a.toLowerCase();
        b = b.toLowerCase();
    }

    if (ignoreAccents) {
        a = removeAccents(a);
        b = removeAccents(b);
    }

    return a.includes(b);
}

/**
 * More comprehensive accent removal that handles special characters like Ø, Æ, etc.
 */
function removeAccents(str: string): string {
    // First try NFD normalization for combining diacritics
    let result = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Manual replacements for characters that don't decompose with NFD
    const replacements: Record<string, string> = {
        // Latin characters with stroke/slash
        ø: 'o',
        Ø: 'O',
        đ: 'd',
        Đ: 'D',
        ł: 'l',
        Ł: 'L',
        ħ: 'h',
        Ħ: 'H',
        ŧ: 't',
        Ŧ: 'T',

        // Latin ligatures and special characters
        æ: 'ae',
        Æ: 'AE',
        œ: 'oe',
        Œ: 'OE',
        ß: 'ss',
        ĳ: 'ij',
        Ĳ: 'IJ',

        // Icelandic
        þ: 'th',
        Þ: 'TH',
        ð: 'd',
        Ð: 'D',

        // Additional common cases
        ə: 'e',
        Ə: 'E', // Schwa
    };

    // Apply manual replacements
    for (const [accented, plain] of Object.entries(replacements)) {
        result = result.replaceAll(accented, plain);
    }

    return result;
}
