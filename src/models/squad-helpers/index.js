import validateClub from './validate-club';
import validatePositions from './validate-pos';
import validatePlayer from './validate-player';
import validateNewPlayers from './validate-new-player';

const warnings = (Squads) => {
    const newPlayers = validateNewPlayers(Squads) || [];
    const duplicatePlayers = validatePlayer(Squads) || [];
    const clubWarnings = validateClub(Squads.all);
    const posWarnings = validatePositions(Squads.all);
    const allClubWarnings = Object.keys(clubWarnings).map((manager) => ({
        manager,
        message: clubWarnings[manager].join(', '),
    }));
    const allPosWarnings = Object.keys(posWarnings).map((manager) => ({
        manager,
        message: posWarnings[manager].join(', '),
    }));
    const hasWarnings = duplicatePlayers.length || allClubWarnings.length || allPosWarnings.length || newPlayers.length;
    return {
        newPlayers,
        duplicatePlayers,
        clubWarnings,
        posWarnings,
        allClubWarnings,
        allPosWarnings,
        hasWarnings,
    };
};

export default warnings;
