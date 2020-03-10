/* eslint-env jest */
import Chance from 'chance';

import Cache from './Cache';

const chance = new Chance();

let cache;
let cacheId;
let Use;
let Symbol;

describe('Cache', () => {
  beforeEach(() => {
    cache = new Cache();
    cacheId = chance.word();
    Use = chance.word();
    Symbol = chance.word();
  });

  it('has an add method which is used to add new svgs to the cache', () => {
    expect(cache.add).toBeDefined();
  });

  it('has an use method which returns a single svg use', () => {
    expect(cache.use).toBeDefined();
  });

  it('has an symbol method which returns a single svg symbol', () => {
    expect(cache.symbol).toBeDefined();
  });

  it('has an symbols method which is used to return all previously added symbols', () => {
    expect(cache.symbols).toBeDefined();
  });

  it('has an subscribe method which is used to notify the cache provider when the cahce has been updated', () => {
    expect(cache.subscribe).toBeDefined();
  });

  it('will return what was added', () => {
    cache.add({ cacheId, Symbol, Use });
    cache.add({ cacheId: chance.word(), Symbol, Use });
    expect(cache.use({ cacheId })).toBe(Use);
    expect(cache.symbol({ cacheId })).toBe(Symbol);
    expect(cache.symbols()).toBe(Symbol + Symbol);
  });

  it('will return undefined if not use found', () => {
    expect(cache.use({ cacheId })).toBe(undefined);
  });

  it('will return undefined if not symbol found', () => {
    expect(cache.symbol({ cacheId })).toBe(undefined);
  });

  it('will call subscribe when an svg is added', () => {
    const subscription = jest.fn();
    cache.subscribe(() => subscription());
    cache.add({ cacheId, Symbol, Use });
    expect(subscription.mock.calls).toHaveLength(1);
  });
});
