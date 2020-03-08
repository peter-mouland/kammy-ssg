const hashContent = require('./hash-content');

describe('hashContent', () => {
    it('returns unique hash from unique data', () => {
        expect(hashContent('hello')).toEqual('5deaee1c1332199e5b5bc7c5e4f7f0c2');
        expect(hashContent('hello')).toEqual('5deaee1c1332199e5b5bc7c5e4f7f0c2');
        expect(hashContent('goodbye')).toEqual('5823a0403c4e34bab2bab01bdde06303');
    });
});
