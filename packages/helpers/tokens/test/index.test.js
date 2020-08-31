import * as tokens from '../src';

describe('tokens lib', () => {
    it('should contain correct tokens', () => {
        const tokenNames = Object.keys(tokens);
        expect(tokenNames).toEqual(
            expect.arrayContaining([
                'borderRadius',
                'borderWidth',
                'colour',
                'fontFamily',
                'fontSize',
                'fontWeight',
                'lineHeight',
                'mediaQuery',
                'shadow',
                'spacing',
                'timing',
                'zIndex',
            ]),
        );
    });

    it.each`
        tokenName         | prefix
        ${'borderRadius'} | ${'rnb-border-radius-'}
        ${'borderWidth'}  | ${'rnb-border-width-'}
        ${'colour'}       | ${'rnb-colour-'}
        ${'fontFamily'}   | ${'rnb-font-family-'}
        ${'fontSize'}     | ${'rnb-font-size-'}
        ${'fontWeight'}   | ${'rnb-font-weight-'}
        ${'lineHeight'}   | ${'rnb-line-height-'}
        ${'mediaQuery'}   | ${'rnb-mq-'}
        ${'shadow'}       | ${'rnb-shadow-'}
        ${'spacing'}      | ${'rnb-spacing-'}
        ${'timing'}       | ${'rnb-timing-'}
        ${'zIndex'}       | ${'rnb-zindex-'}
    `('should prefix $tokenName tokens with $prefix', ({ tokenName, prefix }) => {
        Object.keys(tokens[tokenName]).forEach((token) => {
            expect(token).toEqual(expect.stringMatching(new RegExp(`^${prefix}.+`)));
        });
    });
});
