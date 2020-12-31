import { MAX_SWAPS } from '../consts';

export default ({ managerSwaps }) => ({
    error: managerSwaps.length >= MAX_SWAPS,
    message: `
        It appears you have already made two <strong>swaps</strong> during this game week,
        so this move may exceed your limit
    `,
    rule: `You can gave a maximum of <strong>${MAX_SWAPS}</strong> per game-week.`,
    remaining: `You have <strong>${MAX_SWAPS - managerSwaps.length} swaps</strong> remaining`,
});
