import titleToSlug from '.';
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

describe('titleToSlug', () => {
    describe('default', () => {
        it('throws', () => {
            try {
                titleToSlug(undefined);
            } catch (err) {
                expect(err.message).toBe('titleToSlug: string argument expected');
            }
        });

        it('replace whitespaces with replacement', () => {
            expect(titleToSlug('foo bar baz')).toEqual('foo-bar-baz');
        });

        it('remove trailing space if any', () => {
            expect(titleToSlug(' foo bar baz ')).toEqual('foo-bar-baz');
        });

        it.each([
            '-',
            ']',
            '[',
            ',',
            '*',
            '+',
            '~',
            '.',
            '(',
            ')',
            "'",
            '"',
            '!',
            ':',
            '@',
            '^',
            '#',
            '?',
            ';',
            ':',
            '%',
        ])('replaces symbol: %s', (symbol) => {
            expect(titleToSlug(`foo ${symbol} bar baz`)).toEqual(`foo-bar-baz`);
        });
    });

    describe('options', () => {
        it('options.replacement', () => {
            expect(titleToSlug('foo bar baz', { replacement: '_' })).toEqual('foo_bar_baz');
        });
        it('options.remove', () => {
            expect(titleToSlug('foo *+~.() bar \'"!:@ baz', { remove: /[$*_+~.()'"!\-:@]/g })).toEqual('foo-bar-baz');
        });
    });

    describe('Latin', () => {
        it.each(Object.keys(latinCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${latinCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('greek', () => {
        it.each(Object.keys(greekCharMap))('replace char: %s', (ch) => {
            const symbol = `-${greekCharMap[ch].toLowerCase()}`.replace('--', '');
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo${symbol}-bar-baz`);
        });
    });

    describe('turkish', () => {
        it.each(Object.keys(turkishCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${turkishCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('cyrillic', () => {
        it.each(Object.keys(cyrillicCharMap))('replace char: %s', (ch) => {
            const symbol = `-${cyrillicCharMap[ch].toLowerCase()}`.replace('--', '');
            const expected = cyrillicCharMap[ch] ? `foo${symbol}-bar-baz` : 'foo-bar-baz';
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(expected.toLowerCase());
        });
    });

    describe('kazakh cyrillic', () => {
        it.each(Object.keys(kazakhCharMap))('replace char: %s', (ch) => {
            const expected = kazakhCharMap[ch] ? `foo-${kazakhCharMap[ch]}-bar-baz` : 'foo-bar-baz';
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(expected.toLowerCase());
        });
    });

    describe('czech', () => {
        it.each(Object.keys(czechCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${czechCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('polish', () => {
        it.each(Object.keys(polishCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${polishCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('latvian', () => {
        it.each(Object.keys(latvianCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${latvianCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('serbian', () => {
        it.each(Object.keys(serbianCharMap))('replace char: %s', (ch) => {
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${serbianCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('Currencies', () => {
        it.each(Object.keys(currencyCharMap))('replace char: %s', (ch) => {
            currencyCharMap[ch] = currencyCharMap[ch].replace(' ', '-');
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo-${currencyCharMap[ch].toLowerCase()}-bar-baz`);
        });
    });

    describe('Symbols', () => {
        it.each(Object.keys(symbolsCharMap))('replace char: %s', (ch) => {
            const symbol = `-${symbolsCharMap[ch].toLowerCase()}`.replace('--', '');
            expect(titleToSlug(`foo ${ch} bar baz`)).toEqual(`foo${symbol}-bar-baz`);
        });
    });
});
