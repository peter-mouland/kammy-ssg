class SvgCache {
  constructor() {
    this.cache = {};
    this.subscriptions = [];
  }

  add({ cacheId, Use, Symbol }) {
    this.cache[cacheId] = { Use, Symbol };
    this.subscriptions.forEach((func) => func());
  }

  use({ cacheId }) {
    return this.cache[cacheId] && this.cache[cacheId].Use;
  }

  symbol({ cacheId }) {
    return this.cache[cacheId] && this.cache[cacheId].Symbol;
  }

  symbols() {
    return Object.keys(this.cache).map((cacheId) => this.symbol({ cacheId })).join('');
  }

  subscribe(func) {
    this.subscriptions.push(func);
  }
}

export default SvgCache;
