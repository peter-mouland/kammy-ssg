import type { DivisionId } from '../../teams/types/team-types';

export function groupByDivision<TItem extends { divisionId: DivisionId }, TResult = TItem[]>(
    divisions: { id: DivisionId }[],
    items: TItem[],
): Record<DivisionId, TResult> {
    const result = {} as Record<DivisionId, TResult>;

    divisions.forEach(async (division) => {
        const divisionItems = items.filter((item) => item.divisionId === division.id);
        result[division.id] = divisionItems as TResult;
    });

    return result;
}

export async function groupByDivisionCB<TItem extends { divisionId: DivisionId }, TResult = TItem[]>(
    divisions: { id: DivisionId }[],
    items: TItem[],
    callback?: (division: { id: DivisionId }, divisionItems: TItem[]) => Promise<TResult>,
): Promise<Record<DivisionId, TResult>> {
    const result = {} as Record<DivisionId, TResult>;

    const promises = divisions.map(async (division) => {
        const divisionItems = items.filter((item) => item.divisionId === division.id);

        if (callback) {
            result[division.id] = await callback(division, divisionItems);
        } else {
            // Default behavior: return the filtered items
            result[division.id] = divisionItems as TResult;
        }
    });

    await Promise.all(promises);
    return result;
}
