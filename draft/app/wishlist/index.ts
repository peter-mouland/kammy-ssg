/* Location: app/wishlist/index.ts */

/**
 * The wishlist domain's public API.
 *
 * There is no `index.server.ts`: the wishlist is backed by local storage, so none of it
 * touches Firebase, Sheets or `process.env`. If that ever changes, split it the way
 * `draft`, `scoring`, `transfers` and `leagues` are split rather than widening this file.
 */

// --- Wishlist controls -------------------------------------------------------
// Adding a player to a wishlist, and the tags showing which lists they are already on.
// `players` embeds both in its stats table — deciding what a wishlist is remains here.
export { WishlistButton } from './components/wishlist-button';
export { WishlistTags } from './components/wishlist-tags';
