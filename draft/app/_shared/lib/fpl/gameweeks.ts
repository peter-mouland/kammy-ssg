import type { EventData, GameWeekData } from './fpl-types';

export const getGameweekData = (fplEvents: EventData[]): GameWeekData[] => {
    let hasHadCurrent = false;
    let isNext = false;
    const results: GameWeekData[] = fplEvents.map((event, i) => {
        const start = new Date(fplEvents[i - 1]?.deadline_time || '2023-07-30T11:00:00.000Z');
        const end = new Date(event.deadline_time);
        const isCurrent = new Date() < end && new Date() > start;

        const data = {
            fplEvent: {
                deadline_time: event.deadline_time,
                finished: event.finished,
                id: event.id,
                is_current: event.is_current,
                is_next: event.is_next,
                name: event.name,
            },
            gameWeekIndex: i,
            start,
            end,
            isCurrent,
            isNext,
            hasPassed: !hasHadCurrent && !isCurrent,
        };
        isNext = isCurrent;
        hasHadCurrent = isCurrent || hasHadCurrent;
        return data;
    });
    return results;
};
