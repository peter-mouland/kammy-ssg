// app/routes/wishlists.tsx
import { type MetaFunction, useLoaderData } from 'react-router';
import { useState, useMemo } from "react";
import { useWishlists } from "../lib/wishlists/use-wishlists";
import { CreateWishlistForm } from "../components/wishlist-form";
import { WishlistItem } from "../components/wishlist-item";
import { WishlistDetails } from "../components/wishlist-details";
import { PageHeader } from '../components/page-header';
import type { WishlistData } from "../lib/wishlists/wishlist-manager";
import styles from './wishlists.module.css';
import { fplApiCache } from './server/fpl/api-cache';

export const meta: MetaFunction = () => {
    return [
        { title: "My Wishlists - Fantasy Football Draft" },
        { name: "description", content: "Manage your player wishlists and track your favorite players" },
    ];
};

export const loader = async () => {
    const playersById = await fplApiCache.getPlayersById();
    const teamsByCode = await fplApiCache.getTeamsByCode();
    return { playersById, teamsByCode }
}

export default function Wishlists() {
    const {
        wishlists,
        loading,
        deleteWishlist,
        updateWishlist,
        removePlayerFromWishlist,
    } = useWishlists();
    const { playersById, teamsByCode } = useLoaderData()

    const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingWishlist, setEditingWishlist] = useState<string | null>(null);

    const totalPlayers = useMemo(() => {
        return wishlists.reduce((total, wishlist) => total + wishlist.playerIds?.length || 0, 0);
    }, [wishlists]);

    const handleCreateSuccess = async () => {
        await setShowCreateForm(false);
    };

    const handleDeleteWishlist = async (wishlistId: string) => {
        if (confirm('Are you sure you want to delete this wishlist? This action cannot be undone.')) {
            await deleteWishlist(wishlistId);
            if (selectedWishlist === wishlistId) {
                setSelectedWishlist(null);
            }
        }
    };

    const handleEditWishlist = async (wishlist: WishlistData, updates: Partial<WishlistData>) => {
        await updateWishlist(wishlist.id, updates);
        setEditingWishlist(null);
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
                <p className={styles.loadingText}>Loading your wishlists...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="My Wishlists"
                subTitle={`${wishlists.length} lists • ${totalPlayers} total players`}
                actions={
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className={styles.createButton}
                    >
                        <svg className={styles.createIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Wishlist
                    </button>
                }
            />

            <div className={styles.layout}>
                {/* Wishlists Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarHeader}>
                            <h3 className={styles.sidebarTitle}>Your Wishlists</h3>
                        </div>

                        {showCreateForm && (
                            <div className={styles.createFormContainer}>
                                <CreateWishlistForm
                                    onSuccess={() => handleCreateSuccess(false)}
                                    onCancel={() => handleCreateSuccess(false)}
                                />
                            </div>
                        )}

                        <div className={styles.wishlistsList}>
                            {wishlists.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className={styles.emptyTitle}>No wishlists yet</h3>
                                    <p className={styles.emptyMessage}>Create your first wishlist to start tracking players.</p>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className={styles.emptyButton}
                                    >
                                        Create Wishlist
                                    </button>
                                </div>
                            ) : (
                                wishlists.map(wishlist => (
                                    <WishlistItem
                                        key={wishlist.id}
                                        wishlist={wishlist}
                                        isSelected={selectedWishlist === wishlist.id}
                                        isEditing={editingWishlist === wishlist.id}
                                        onSelect={() => setSelectedWishlist(wishlist.id)}
                                        onEdit={() => setEditingWishlist(wishlist.id)}
                                        onSave={(updates) => handleEditWishlist(wishlist, updates)}
                                        onCancel={() => setEditingWishlist(null)}
                                        onDelete={() => handleDeleteWishlist(wishlist.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Wishlist Details */}
                <div className={styles.main}>
                    {selectedWishlist ? (
                        <WishlistDetails
                            playersById={playersById}
                            teamsByCode={teamsByCode}
                            wishlist={wishlists.find(w => w.id === selectedWishlist)!}
                            onRemovePlayer={removePlayerFromWishlist}
                        />
                    ) : (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderContent}>
                                <div className={styles.placeholderIcon}>
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h3 className={styles.placeholderTitle}>Select a wishlist</h3>
                                <p className={styles.placeholderMessage}>Choose a wishlist from the sidebar to view and manage your saved players.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
