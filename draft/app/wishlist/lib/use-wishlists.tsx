/* Location: app/wishlist/lib/use-wishlists.tsx */

import { createContext, type ReactNode, useCallback, useContext, useEffect, useReducer } from 'react';
import type { Wishlist, WishlistContextType } from '../types/wishlist-types';
import { getWishlistsFromStorage, saveWishlistsToStorage } from './local-storage';

interface WishlistState {
    wishlists: Wishlist[];
    isLoading: boolean;
    error: string | null;
}

const WishlistColors = {
    blue: '#3B82F6',
    green: '#10B981',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899',
    yellow: '#EAB308',
    gray: '#6B7280',
} as Record<string, Wishlist['color']>;

type WishlistAction =
    | { type: 'LOAD_WISHLISTS_START' }
    | { type: 'LOAD_WISHLISTS_SUCCESS'; payload: Wishlist[] }
    | { type: 'LOAD_WISHLISTS_ERROR'; payload: string }
    | { type: 'ADD_WISHLIST'; payload: Wishlist }
    | { type: 'UPDATE_WISHLIST'; payload: Wishlist }
    | { type: 'DELETE_WISHLIST'; payload: string }
    | { type: 'ADD_PLAYER_TO_WISHLIST'; payload: { wishlistId: string; playerCode: number } }
    | { type: 'REMOVE_PLAYER_FROM_WISHLIST'; payload: { wishlistId: string; playerCode: number } };

const initialState: WishlistState = {
    wishlists: [],
    isLoading: false,
    error: null,
};

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
    console.log('🔥 REDUCER ACTION:', action.type, 'Current state length:', state.wishlists.length);

    switch (action.type) {
        case 'LOAD_WISHLISTS_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };

        case 'LOAD_WISHLISTS_SUCCESS':
            console.log('📥 LOAD_WISHLISTS_SUCCESS - Loaded wishlists:', action.payload.length);
            return {
                ...state,
                wishlists: action.payload,
                isLoading: false,
                error: null,
            };

        case 'LOAD_WISHLISTS_ERROR':
            console.error('❌ LOAD_WISHLISTS_ERROR:', action.payload);
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };

        case 'ADD_WISHLIST': {
            const newStateAdd = {
                ...state,
                wishlists: [...state.wishlists, action.payload],
                error: null,
            };
            saveWishlistsToStorage(newStateAdd.wishlists);
            console.log('➕ ADD_WISHLIST - New wishlist added, total now:', newStateAdd.wishlists.length);
            return newStateAdd;
        }

        case 'UPDATE_WISHLIST': {
            const newStateUpdate = {
                ...state,
                wishlists: state.wishlists.map((w) => (w.id === action.payload.id ? action.payload : w)),
                error: null,
            };
            saveWishlistsToStorage(newStateUpdate.wishlists);
            console.log('✏️ UPDATE_WISHLIST - Wishlist updated:', action.payload.id);
            return newStateUpdate;
        }

        case 'DELETE_WISHLIST': {
            const newStateDelete = {
                ...state,
                wishlists: state.wishlists.filter((w) => w.id !== action.payload),
                error: null,
            };
            saveWishlistsToStorage(newStateDelete.wishlists);
            console.log('🗑️ DELETE_WISHLIST - Wishlist removed, total now:', newStateDelete.wishlists.length);
            return newStateDelete;
        }

        case 'ADD_PLAYER_TO_WISHLIST': {
            const newStateAddPlayer = {
                ...state,
                wishlists: state.wishlists.map((wishlist) =>
                    wishlist.id === action.payload.wishlistId
                        ? {
                              ...wishlist,
                              playerCodes: [...wishlist.playerCodes, action.payload.playerCode],
                              updatedAt: new Date().toISOString(),
                          }
                        : wishlist,
                ),
                error: null,
            };
            saveWishlistsToStorage(newStateAddPlayer.wishlists);
            console.log('👤➕ ADD_PLAYER_TO_WISHLIST - Player added to wishlist:', action.payload);
            return newStateAddPlayer;
        }

        case 'REMOVE_PLAYER_FROM_WISHLIST': {
            const newStateRemovePlayer = {
                ...state,
                wishlists: state.wishlists.map((wishlist) =>
                    wishlist.id === action.payload.wishlistId
                        ? {
                              ...wishlist,
                              playerCodes: wishlist.playerCodes.filter((id) => id !== action.payload.playerCode),
                              updatedAt: new Date().toISOString(),
                          }
                        : wishlist,
                ),
                error: null,
            };
            saveWishlistsToStorage(newStateRemovePlayer.wishlists);
            console.log('👤➖ REMOVE_PLAYER_FROM_WISHLIST - Player removed from wishlist:', action.payload);
            return newStateRemovePlayer;
        }

        default:
            return state;
    }
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(wishlistReducer, initialState);

    // Load from localStorage on mount
    useEffect(() => {
        console.log('🔄 WishlistProvider - Initializing...');
        dispatch({ type: 'LOAD_WISHLISTS_START' });

        try {
            const stored = getWishlistsFromStorage();
            console.log('📥 Loaded wishlists from localStorage:', stored);
            dispatch({ type: 'LOAD_WISHLISTS_SUCCESS', payload: stored });
        } catch (error) {
            console.error('❌ Failed to load wishlists:', error);
            dispatch({
                type: 'LOAD_WISHLISTS_ERROR',
                payload: error instanceof Error ? error.message : 'Failed to load wishlists',
            });
        }
    }, []);

    // Debug effect to track all state changes
    useEffect(() => {
        console.log('🔄 WISHLISTS STATE CHANGED:', state.wishlists.length, 'wishlists in React state');
        console.log('📋 Wishlist details:', state.wishlists);
    }, [state.wishlists]);

    // Actions
    const addWishlist = useCallback(
        (wishlistData: Omit<Wishlist, 'id' | 'createdAt' | 'updatedAt' | 'playerCodes'>) => {
            const newWishlist: Wishlist = {
                ...wishlistData,
                playerCodes: [],
                id: `wishlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            console.log('🎯 Context addWishlist called with:', newWishlist.label);
            dispatch({ type: 'ADD_WISHLIST', payload: newWishlist });
        },
        [],
    );

    const updateWishlist = useCallback((wishlist: Wishlist, updates: Partial<Wishlist>) => {
        console.log('🎯 Context updateWishlist called with:', wishlist.id);
        const updatedWishlist = {
            ...wishlist,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        dispatch({ type: 'UPDATE_WISHLIST', payload: updatedWishlist });
    }, []);

    const deleteWishlist = useCallback((id: string) => {
        console.log('🎯 Context deleteWishlist called with:', id);
        dispatch({ type: 'DELETE_WISHLIST', payload: id });
    }, []);

    const addPlayerToWishlist = useCallback((wishlistId: string, playerCode: number) => {
        console.log('🎯 Context addPlayerToWishlist called:', { wishlistId, playerCode });
        dispatch({ type: 'ADD_PLAYER_TO_WISHLIST', payload: { wishlistId, playerCode } });
    }, []);

    const removePlayerFromWishlist = useCallback((wishlistId: string, playerCode: number) => {
        console.log('🎯 Context removePlayerFromWishlist called:', { wishlistId, playerCode });
        dispatch({ type: 'REMOVE_PLAYER_FROM_WISHLIST', payload: { wishlistId, playerCode } });
    }, []);

    // Getters
    const getWishlistById = useCallback(
        (id: string) => {
            return state.wishlists.find((wishlist) => wishlist.id === id);
        },
        [state.wishlists],
    );

    const getWishlistsForPlayer = useCallback(
        (playerCode: number) => {
            return state.wishlists.filter((wishlist) => wishlist.playerCodes.includes(playerCode));
        },
        [state.wishlists],
    );

    const isPlayerInWishlist = useCallback(
        (wishlistId: string, playerCode: number) => {
            const wishlist = getWishlistById(wishlistId);
            return wishlist ? wishlist.playerCodes.includes(playerCode) : false;
        },
        [getWishlistById],
    );

    const getAvailableColors = useCallback(() => {
        const usedColors = new Set(state.wishlists.map((w) => w.color));
        return Object.values(WishlistColors).filter((color) => !usedColors.has(color));
    }, [state.wishlists]);

    const contextValue: WishlistContextType = {
        // State
        wishlists: state.wishlists,
        isLoading: state.isLoading,
        error: state.error,

        // Actions
        addWishlist,
        updateWishlist,
        deleteWishlist,
        addPlayerToWishlist,
        removePlayerFromWishlist,

        // Getters
        getWishlistById,
        getWishlistsForPlayer,
        isPlayerInWishlist,

        // colours
        availableColors: getAvailableColors(),
        allColors: WishlistColors,
    };

    return <WishlistContext.Provider value={contextValue}>{children}</WishlistContext.Provider>;
}

export function useWishlists() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlists must be used within a WishlistProvider');
    }
    return context;
}
