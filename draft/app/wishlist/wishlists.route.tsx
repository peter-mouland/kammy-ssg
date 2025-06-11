// app/routes/wishlists.tsx
import { type MetaFunction } from 'react-router';
import { fplApiCache } from '../_shared/lib/fpl/api-cache';

import { WishlistsPage } from './wishlists.page'

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

export default WishlistsPage
