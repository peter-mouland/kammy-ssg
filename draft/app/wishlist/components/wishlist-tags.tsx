/* Location: app/wishlist/components/wishlist-tags.tsx */

// components/wishlist-tags.tsx
import { useWishlists } from '../lib/use-wishlists';
import styles from './wishlist-tags.module.css';

interface WishlistTagsProps {
    playerId: number;
    maxVisible?: number;
}

export function WishlistTags({ playerId, maxVisible = 3 }: WishlistTagsProps) {
    const { getWishlistsForPlayer } = useWishlists();
    const playerWishlists = getWishlistsForPlayer(playerId);
    console.log({ playerId, playerWishlists, t: typeof playerId });
    if (playerWishlists.length === 0) return null;

    const visibleWishlists = playerWishlists.slice(0, maxVisible);
    const hiddenCount = playerWishlists.length - maxVisible;
    console.log(visibleWishlists);
    return (
        <div className={styles.container}>
            {visibleWishlists.map((wishlist) => (
                <span
                    key={wishlist.id}
                    className={styles.tag}
                    style={{ backgroundColor: wishlist.color }}
                    title={`${wishlist.label}${wishlist.description ? ` - ${wishlist.description}` : ''}`}
                >
                    <div className={styles.dot} />
                    {wishlist.label}
                </span>
            ))}
            {hiddenCount > 0 && <span className={styles.moreTag}>+{hiddenCount} more</span>}
        </div>
    );
}
