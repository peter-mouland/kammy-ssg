
// types/wishlist.ts
export interface Wishlist {
    id: string;
    name: string;
    playerIds: number[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WishlistPlayer {
    id: number;
    name: string;
    position: string;
    team: string;
    price: number;
}
