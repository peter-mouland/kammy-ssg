// components/wishlist-button.tsx
import React, { useState } from 'react';
import { useWishlists } from '../lib/wishlists/use-wishlists';
import { CreateWishlistForm } from './wishlist-form';
import type { FplPlayerData } from '../types';
import styles from './wishlist-button.module.css';

interface WishlistButtonProps {
    player: FplPlayerData;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
}

export function WishlistButton({ player, size = 'medium', showLabel = true }: WishlistButtonProps) {
    const { wishlists, addPlayerToWishlist, removePlayerFromWishlist, getWishlistsForPlayer } = useWishlists();
    const [isOpen, setIsOpen] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const playerWishlists = getWishlistsForPlayer(player.id.toString());
    const hasWishlists = playerWishlists.length > 0;

    const handleToggleWishlist = (wishlistId: string, isCurrentlyInList: boolean) => {
        if (isCurrentlyInList) {
            removePlayerFromWishlist(wishlistId, player.id.toString());
        } else {
            addPlayerToWishlist(wishlistId, player.id.toString());
        }
    };

    const buttonClasses = [
        styles.wishlistButton,
        styles[size],
        hasWishlists ? styles.active : styles.inactive,
        showLabel ? styles.withLabel : ''
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.container}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={buttonClasses}
                title={hasWishlists ? `In ${playerWishlists.length} wishlist(s)` : 'Add to wishlist'}
            >
                <svg
                    className={styles.icon}
                    fill={hasWishlists ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
                {showLabel && (
                    <span className={styles.label}>
            {hasWishlists ? `${playerWishlists.length}` : 'Wishlist'}
          </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className={styles.backdrop}
                        onClick={() => setIsOpen(false)}
                    />

                    <div className={styles.dropdown}>
                        <div className={styles.dropdownContent}>
                            <div className={styles.dropdownHeader}>
                                <h3 className={styles.dropdownTitle}>Add to Wishlist</h3>
                                <button
                                    onClick={() => setShowCreateForm(!showCreateForm)}
                                    className={styles.createButton}
                                >
                                    + New List
                                </button>
                            </div>

                            {showCreateForm && (
                                <CreateWishlistForm
                                    onSuccess={() => setShowCreateForm(false)}
                                    onCancel={() => setShowCreateForm(false)}
                                />
                            )}

                            <div className={styles.wishlistList}>
                                {wishlists.length === 0 ? (
                                    <p className={styles.emptyMessage}>No wishlists yet. Create one above!</p>
                                ) : (
                                    wishlists.map(wishlist => {
                                        const isInList = wishlist.playerIds.includes(player.id.toString());
                                        return (
                                            <label
                                                key={wishlist.id}
                                                className={styles.wishlistItem}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isInList}
                                                    onChange={() => handleToggleWishlist(wishlist.id, isInList)}
                                                    className={styles.checkbox}
                                                />
                                                <div className={styles.wishlistInfo}>
                                                    <div
                                                        className={styles.colorDot}
                                                        style={{ backgroundColor: wishlist.color }}
                                                    />
                                                    <span className={styles.wishlistLabel}>
                            {wishlist.label}
                          </span>
                                                    <span className={styles.playerCount}>
                            ({wishlist.playerIds.length})
                          </span>
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
