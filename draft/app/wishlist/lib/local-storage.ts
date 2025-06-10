const WISHLISTS_STORAGE_KEY = 'fantasy-wishlists';

export function getWishlistsFromStorage(): Wishlist[] {
    try {
        const stored = localStorage.getItem(WISHLISTS_STORAGE_KEY);
        if (!stored) return [];

        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        return parsed.map((wishlist: any) => ({
            ...wishlist,
            createdAt: new Date(wishlist.createdAt),
            updatedAt: new Date(wishlist.updatedAt)
        }));
    } catch (error) {
        console.error('Error loading wishlists from localStorage:', error);
        return [];
    }
}

export function saveWishlistsToStorage(wishlists: Wishlist[]): void {
    try {
        localStorage.setItem(WISHLISTS_STORAGE_KEY, JSON.stringify(wishlists));
        console.log('💾 Saved wishlists to localStorage:', wishlists);
    } catch (error) {
        console.error('Error saving wishlists to localStorage:', error);
    }
}
