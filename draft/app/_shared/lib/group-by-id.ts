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
