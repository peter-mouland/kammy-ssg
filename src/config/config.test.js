/* eslint-env jest */

describe('Config', () => {
    describe('in order to prevent firewall errors', () => {
        it('should have a defined PORT other than 8080', () => {
            jest.resetModules();
            const config = require('./config');
            expect(config.PORT).not.toBe(8080);
        });
    });
});
