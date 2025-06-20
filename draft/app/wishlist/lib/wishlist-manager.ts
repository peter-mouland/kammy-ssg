/* Location: app/wishlist/lib/wishlist-manager.ts */

import type { Wishlist } from '../types/wishlist-types';

export class WishlistManager {
    private static readonly STORAGE_KEY = 'fantasy-wishlists';
    private static readonly COLORS = {
        blue: '#3B82F6',
        green: '#10B981',
        purple: '#8B5CF6',
        orange: '#F59E0B',
        red: '#EF4444',
        pink: '#EC4899',
        yellow: '#EAB308',
        gray: '#6B7280',
    };

    // Check if we're in a browser environment
    private static get isClient(): boolean {
        return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    }

    static getWishlists(): Wishlist[] {
        if (!WishlistManager.isClient) {
            console.log('Server-side: returning empty wishlists array');
            return [];
        }

        try {
            const stored = localStorage.getItem(WishlistManager.STORAGE_KEY);
            const wishlists = stored ? JSON.parse(stored) : [];
            console.log('Loaded wishlists from localStorage:', wishlists);
            return wishlists;
        } catch (error) {
            console.error('Error loading wishlists:', error);
            return [];
        }
    }

    static saveWishlists(wishlists: Wishlist[]): void {
        if (!WishlistManager.isClient) {
            console.warn('Server-side: cannot save wishlists to localStorage');
            return;
        }

        try {
            localStorage.setItem(WishlistManager.STORAGE_KEY, JSON.stringify(wishlists));
            console.log('Saved wishlists to localStorage:', wishlists);
        } catch (error) {
            console.error('Error saving wishlists:', error);
            throw new Error('Failed to save wishlists');
        }
    }

    static createWishlist(label: string, description?: string, color?: string): Wishlist {
        if (!WishlistManager.isClient) {
            throw new Error('Cannot create wishlist on server-side');
        }

        const wishlists = WishlistManager.getWishlists();
        const usedColors = new Set(wishlists.map((w) => w.color));
        const availableColors = Object.values(WishlistManager.COLORS).filter((c) => !usedColors.has(c));
        const selectedColor = color || availableColors[0] || WishlistManager.COLORS.blue;

        const newWishlist: Wishlist = {
            id: WishlistManager.generateId(),
            label,
            description,
            playerIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            color: selectedColor,
        };

        const updatedWishlists = [...wishlists, newWishlist];
        WishlistManager.saveWishlists(updatedWishlists);
        return newWishlist;
    }

    static updateWishlist(id: string, updates: Partial<Omit<Wishlist, 'id' | 'createdAt'>>): boolean {
        if (!WishlistManager.isClient) {
            console.warn('Server-side: cannot update wishlist');
            return false;
        }

        const wishlists = WishlistManager.getWishlists();
        const index = wishlists.findIndex((w) => w.id === id);

        if (index === -1) return false;

        wishlists[index] = {
            ...wishlists[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        WishlistManager.saveWishlists(wishlists);
        return true;
    }

    static deleteWishlist(id: string): boolean {
        if (!WishlistManager.isClient) {
            console.warn('Server-side: cannot delete wishlist');
            return false;
        }

        const wishlists = WishlistManager.getWishlists();
        const filtered = wishlists.filter((w) => w.id !== id);

        if (filtered.length === wishlists.length) return false;

        WishlistManager.saveWishlists(filtered);
        return true;
    }

    static addPlayerToWishlist(wishlistId: string, playerId: number): boolean {
        if (!WishlistManager.isClient) {
            console.warn('Server-side: cannot add player to wishlist');
            return false;
        }

        const wishlists = WishlistManager.getWishlists();
        const wishlist = wishlists.find((w) => w.id === wishlistId);

        if (!wishlist || wishlist.playerIds.includes(playerId)) return false;

        wishlist.playerIds.push(playerId);
        wishlist.updatedAt = new Date().toISOString();

        WishlistManager.saveWishlists(wishlists);
        return true;
    }

    static removePlayerFromWishlist(wishlistId: string, playerId: number): boolean {
        if (!WishlistManager.isClient) {
            console.warn('Server-side: cannot remove player from wishlist');
            return false;
        }

        const wishlists = WishlistManager.getWishlists();
        const wishlist = wishlists.find((w) => w.id === wishlistId);

        if (!wishlist) return false;

        const initialLength = wishlist.playerIds.length;
        wishlist.playerIds = wishlist.playerIds.filter((id) => id !== playerId);

        if (wishlist.playerIds.length === initialLength) return false;

        wishlist.updatedAt = new Date().toISOString();
        WishlistManager.saveWishlists(wishlists);
        return true;
    }

    static getPlayerWishlists(playerId: number): Wishlist[] {
        return WishlistManager.getWishlists().filter((wishlist) => wishlist.playerIds.includes(playerId));
    }

    static isPlayerInWishlist(playerId: number, wishlistId: string): boolean {
        const wishlist = WishlistManager.getWishlists().find((w) => w.id === wishlistId);
        return wishlist?.playerIds.includes(playerId) || false;
    }

    static getAvailableColors(): string[] {
        if (!WishlistManager.isClient) {
            return Object.values(WishlistManager.COLORS);
        }

        const usedColors = new Set(WishlistManager.getWishlists().map((w) => w.color));
        return Object.values(WishlistManager.COLORS).filter((color) => !usedColors.has(color));
    }

    static getAllColors() {
        return WishlistManager.COLORS;
    }

    private static generateId(): string {
        return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export const wishlistManager = new WishlistManager();
