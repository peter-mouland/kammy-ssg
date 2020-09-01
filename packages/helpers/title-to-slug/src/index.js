import latinCharMap from './lib/latin';
import turkishCharMap from './lib/turkish';
import cyrillicCharMap from './lib/cyrillic';
import currencyCharMap from './lib/currency';
import greekCharMap from './lib/greek';
import symbolsCharMap from './lib/symbols';
import kazakhCharMap from './lib/kazakh';
import czechCharMap from './lib/czech';
import polishCharMap from './lib/polish';
import latvianCharMap from './lib/latvian';
import serbianCharMap from './lib/serbian';

const charMap = {
    ...serbianCharMap,
    ...latvianCharMap,
    ...latinCharMap,
    ...turkishCharMap,
    ...cyrillicCharMap,
    ...currencyCharMap,
    ...greekCharMap,
    ...symbolsCharMap,
    ...kazakhCharMap,
    ...czechCharMap,
    ...polishCharMap,
};
const locales = JSON.parse('{"vi":{"Đ":"D","đ":"d"}}');

function titleToSlug(string, { replacement = '-', locale, remove = /[\^“”‘’,*_+~.()'"!:;@?#%]/g } = {}) {
    if (typeof string !== 'string') {
        throw new Error('titleToSlug: string argument expected');
    }

    const lcl = locales[locale] || {};

    return string
        .split('')
        .reduce(
            (result, ch) =>
                result + (lcl[ch] || charMap[ch] || ch).replace(remove, '').replace('[', '').replace(']', ''),
            '',
        )
        .trim() // trim leading/trailing spaces
        .replace(/[-\s]+/g, replacement) // convert spaces
        .toLowerCase();
}

export default titleToSlug;
