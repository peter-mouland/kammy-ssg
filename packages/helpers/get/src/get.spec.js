/* eslint-env jest */
import get from './get';

describe('get', () => {
  it('resolves a single value', () => {
    const data = {
      foo: {
        bar: 'hello',
        baz: 'goodbye',
      },
    };
    expect(get(data, 'foo.bar')).toEqual('hello');
  });

  it('returns undefined if not found', () => {
    const data = {
      foo: {
        bar: 'hello',
        baz: 'goodbye',
      },
    };
    expect(get(data, 'foo.bar.baz')).toEqual(undefined);
  });
});
