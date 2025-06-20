// app/wishlist/types/wishlist-types.ts

export interface Wishlist {
    id: string;
    label: string;
    description?: string;
    color: string;
    playerIds: number[];
    createdAt: string; // iso Date;
    updatedAt: string; // iso Date;
}

export interface WishlistContextType {
    // State
    wishlists: Wishlist[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addWishlist: (wishlist: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt' | 'playerIds'>) => void;
    updateWishlist: (wishlist: Wishlist, updates: Partial<Wishlist>) => void;
    deleteWishlist: (id: Wishlist['id']) => void;
    addPlayerToWishlist: (wishlistId: string, playerId: number) => void;
    removePlayerFromWishlist: (wishlistId: string, playerId: number) => void;

    // Getters
    getWishlistById: (id: string) => Wishlist | undefined;
    getWishlistsForPlayer: (playerId: number) => Wishlist[];
    isPlayerInWishlist: (wishlistId: string, playerId: number) => boolean;
    availableColors: Wishlist['color'][];
    allColors: Record<string, Wishlist['color']>;
}
