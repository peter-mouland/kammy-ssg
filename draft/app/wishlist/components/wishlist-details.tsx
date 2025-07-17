// app/wishlist/components/wishlist-details.tsx

import React from 'react';
import type { Wishlist } from '../types/wishlist-types';
import styles from './wishlist-item.module.css';

interface WishlistDetailsProps {
    wishlist: Wishlist;
    onRemovePlayer: (wishlistId: string, playerCode: number) => void;
    playersByCode: any;
    teamsByCode: any;
}

export function WishlistDetails({ playersByCode, teamsByCode, wishlist, onRemovePlayer }: WishlistDetailsProps) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleRemovePlayer = (playerCode: number) => {
        if (confirm('Remove this player from the wishlist?')) {
            onRemovePlayer(wishlist.id, playerCode);
        }
    };

    return (
        <div className={styles.details}>
            <div className={styles.detailsHeader}>
                <div className={styles.detailsTitle}>
                    <div className={styles.detailsColorDot} style={{ backgroundColor: wishlist.color }} />
                    <h3 className={styles.detailsName}>{wishlist.label}</h3>
                </div>
                {wishlist.description && <p className={styles.detailsDescription}>{wishlist.description}</p>}
                <div className={styles.detailsMeta}>
                    <span className={styles.detailsCount}>
                        {wishlist.playerCodes.length} player{wishlist.playerCodes.length !== 1 ? 's' : ''}
                    </span>
                    <span className={styles.detailsDate}>
                        Last updated: {new Date(wishlist.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {wishlist.playerCodes.length > 0 && (
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search players..."
                        className={styles.searchInput}
                    />
                </div>
            )}

            <div className={styles.playersContainer}>
                {wishlist.playerCodes.length === 0 ? (
                    <div className={styles.emptyPlayers}>
                        <div className={styles.emptyPlayersIcon}>
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <h4 className={styles.emptyPlayersTitle}>No players yet</h4>
                        <p className={styles.emptyPlayersMessage}>
                            Add players to this wishlist from the players page.
                        </p>
                        <a href="/players" className={styles.browseButton}>
                            Browse Players
                        </a>
                    </div>
                ) : (
                    <div className={styles.playersList}>
                        {wishlist.playerCodes.map((playerCode) => (
                            <WishlistPlayerRow
                                key={playerCode}
                                player={playersByCode[playerCode]}
                                teamsByCode={teamsByCode}
                                wishlistId={wishlist.id}
                                searchTerm={searchTerm}
                                onRemove={() => handleRemovePlayer(playerCode)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// components/wishlist-player-row.tsx
interface WishlistPlayerRowProps {
    wishlistId: string;
    searchTerm: string;
    onRemove: () => void;
    player: any;
    teamsByCode: any;
}

function WishlistPlayerRow({ player, teamsByCode, searchTerm, onRemove }: WishlistPlayerRowProps) {
    // In a real app, you'd fetch the player data here
    // For demonstration, showing placeholder data
    const playerName = player.web_name;
    const playerTeam = teamsByCode[player.team_code].name;
    const playerPosition = player.draft.position;

    // Simple search filter
    const matchesSearch =
        !searchTerm ||
        playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playerTeam.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return null;

    return (
        <div className={styles.playerRow}>
            <div className={styles.playerInfo}>
                <div className={styles.playerAvatar}>
                    <span className={styles.playerPosition}>{playerPosition}</span>
                </div>
                <div className={styles.playerDetails}>
                    <h4 className={styles.playerName}>{playerName}</h4>
                    <p className={styles.playerMeta}>{playerTeam}</p>
                </div>
            </div>

            <div className={styles.playerActions}>
                <a href={`/players/${player.code}`} className={styles.viewLink}>
                    View Details
                </a>
                <button type={'button'} onClick={onRemove} className={styles.removeButton} title="Remove from wishlist">
                    <svg className={styles.removeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
