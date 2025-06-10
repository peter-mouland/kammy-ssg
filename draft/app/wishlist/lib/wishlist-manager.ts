import type { WishlistData, WishlistColors } from './types';

export class WishlistManager {
    private static readonly STORAGE_KEY = 'fantasy-wishlists';
    private static readonly COLORS: WishlistColors = {
        blue: '#3B82F6',
        green: '#10B981',
        purple: '#8B5CF6',
        orange: '#F59E0B',
        red: '#EF4444',
        pink: '#EC4899',
        yellow: '#EAB308',
        gray: '#6B7280'
    };

    // Check if we're in a browser environment
    private static get isClient(): boolean {
        return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }

    static getWishlists(): WishlistData[] {
        if (!this.isClient) {
            console.log('Server-side: returning empty wishlists array');
            return [];
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const wishlists = stored ? JSON.parse(stored) : [];
            console.log('Loaded wishlists from localStorage:', wishlists);
            return wishlists;
        } catch (error) {
            console.error('Error loading wishlists:', error);
            return [];
        }
    }

    static saveWishlists(wishlists: WishlistData[]): void {
        if (!this.isClient) {
            console.warn('Server-side: cannot save wishlists to localStorage');
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(wishlists));
            console.log('Saved wishlists to localStorage:', wishlists);
        } catch (error) {
            console.error('Error saving wishlists:', error);
            throw new Error('Failed to save wishlists');
        }
    }

    static createWishlist(label: string, description?: string, color?: string): WishlistData {
        if (!this.isClient) {
            throw new Error('Cannot create wishlist on server-side');
        }

        const wishlists = this.getWishlists();
        const usedColors = new Set(wishlists.map(w => w.color));
        const availableColors = Object.values(this.COLORS).filter(c => !usedColors.has(c));
        const selectedColor = color || availableColors[0] || this.COLORS.blue;

        const newWishlist: WishlistData = {
            id: this.generateId(),
            label,
            description,
            playerIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            color: selectedColor
        };

        const updatedWishlists = [...wishlists, newWishlist];
        this.saveWishlists(updatedWishlists);
        return newWishlist;
    }

    static updateWishlist(id: string, updates: Partial<Omit<WishlistData, 'id' | 'createdAt'>>): boolean {
        if (!this.isClient) {
            console.warn('Server-side: cannot update wishlist');
            return false;
        }

        const wishlists = this.getWishlists();
        const index = wishlists.findIndex(w => w.id === id);

        if (index === -1) return false;

        wishlists[index] = {
            ...wishlists[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveWishlists(wishlists);
        return true;
    }

    static deleteWishlist(id: string): boolean {
        if (!this.isClient) {
            console.warn('Server-side: cannot delete wishlist');
            return false;
        }

        const wishlists = this.getWishlists();
        const filtered = wishlists.filter(w => w.id !== id);

        if (filtered.length === wishlists.length) return false;

        this.saveWishlists(filtered);
        return true;
    }

    static addPlayerToWishlist(wishlistId: string, playerId: string): boolean {
        if (!this.isClient) {
            console.warn('Server-side: cannot add player to wishlist');
            return false;
        }

        const wishlists = this.getWishlists();
        const wishlist = wishlists.find(w => w.id === wishlistId);

        if (!wishlist || wishlist.playerIds.includes(playerId)) return false;

        wishlist.playerIds.push(playerId);
        wishlist.updatedAt = new Date().toISOString();

        this.saveWishlists(wishlists);
        return true;
    }

    static removePlayerFromWishlist(wishlistId: string, playerId: string): boolean {
        if (!this.isClient) {
            console.warn('Server-side: cannot remove player from wishlist');
            return false;
        }

        const wishlists = this.getWishlists();
        const wishlist = wishlists.find(w => w.id === wishlistId);

        if (!wishlist) return false;

        const initialLength = wishlist.playerIds.length;
        wishlist.playerIds = wishlist.playerIds.filter(id => id !== playerId);

        if (wishlist.playerIds.length === initialLength) return false;

        wishlist.updatedAt = new Date().toISOString();
        this.saveWishlists(wishlists);
        return true;
    }

    static getPlayerWishlists(playerId: string): WishlistData[] {
        return this.getWishlists().filter(wishlist =>
            wishlist.playerIds.includes(playerId)
        );
    }

    static isPlayerInWishlist(playerId: string, wishlistId: string): boolean {
        const wishlist = this.getWishlists().find(w => w.id === wishlistId);
        return wishlist?.playerIds.includes(playerId) || false;
    }

    static getAvailableColors(): string[] {
        if (!this.isClient) {
            return Object.values(this.COLORS);
        }

        const usedColors = new Set(this.getWishlists().map(w => w.color));
        return Object.values(this.COLORS).filter(color => !usedColors.has(color));
    }

    static getAllColors(): WishlistColors {
        return this.COLORS;
    }

    private static generateId(): string {
        return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const wishlistManager = new WishlistManager()
