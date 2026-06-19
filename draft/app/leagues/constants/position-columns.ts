import type { PositionColumnConfig } from '../types/league-standings-types';

export const POSITION_COLUMNS: (PositionColumnConfig & { mobileLabel?: string })[] = [
    {
        key: 'gk',
        label: 'GK / Sub',
        mobileLabel: 'GKS',
        slots: ['gk_0', 'sub_0'],
    },
    {
        key: 'cb',
        label: 'CB',
        slots: ['cb_0', 'cb_1'],
    },
    {
        key: 'fb',
        label: 'FB',
        slots: ['fb_0', 'fb_1'],
    },
    {
        key: 'mid',
        label: 'MID',
        slots: ['mid_0', 'mid_1'],
    },
    {
        key: 'wa',
        label: 'WA',
        slots: ['wa_0', 'wa_1'],
    },
    {
        key: 'ca',
        label: 'CA',
        slots: ['ca_0', 'ca_1'],
    },
];
