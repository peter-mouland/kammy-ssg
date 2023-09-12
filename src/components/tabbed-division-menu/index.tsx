import React from 'react';
import cx from 'classnames';

import Button from '../button';
import NamedLink from '../named-link';
import GameWeekFixtures from '../gameweek-fixtures';
import GroupIcon from '../../icons/group.svg';
import PlayersIcon from '../../icons/players.svg';
import TransfersIcon from '../../icons/transfers.svg';
import TableIcon from '../../icons/table.svg';
import Spacer from '../spacer';
import * as styles from './index.module.css';
import GameWeekSwitcher from '../gameweek-switcher';
import useGameWeeks from '../../hooks/use-game-weeks';

type DivisionID = 'leagueOne' | 'championship' | 'premierLeague';
type TabId = 'rankings' | 'teams' | 'transfers' | 'players';
type SelectedGameWeek = number;
type TabbedMenuProps = {
    divisionId: DivisionID;
    selected: TabId;
    selectedGameWeek?: SelectedGameWeek;
    showGWSwitcher?: boolean;
};

type Tabs = {
    id: TabId;
    label: string;
    Icon: SVGIcon;
};

const tabs: Tabs[] = [
    {
        id: 'rankings',
        label: 'Standings',
        Icon: TableIcon,
    },
    {
        id: 'teams',
        label: 'Teams',
        Icon: GroupIcon,
    },
    {
        id: 'transfers',
        label: 'Transfers',
        Icon: TransfersIcon,
    },
    {
        id: 'players',
        label: 'Players',
        Icon: PlayersIcon,
    },
];

type TabProps = {
    to: string;
    isActive: boolean;
    Icon: SVGIcon;
    children: React.ReactNode;
};
const Tab: React.FC<TabProps> = ({ to, isActive, Icon, children }) => (
    <NamedLink to={to} className={cx(styles.cta, { [styles.isActive]: isActive })}>
        <Spacer medium={{ right: Spacer.spacings.SMALL }}>
            <div className={styles.iconContainer}>
                <Icon width="26px" height="26px" />
            </div>
        </Spacer>
        {children}
    </NamedLink>
);

type GameWeekNavProps = {
    divisionId: DivisionID;
    selected: TabId;
    selectedGameWeek?: SelectedGameWeek;
};
export const GameWeekNav: React.FC<GameWeekNavProps> = ({ divisionId, selected, selectedGameWeek }) => {
    const { gameWeeks, currentGameWeek } = useGameWeeks();
    const displayGW = selectedGameWeek ?? currentGameWeek.id;
    const [showFixture, onShowFixture] = React.useState<string | null>(null);
    const fixtures = {
        thisWeek: gameWeeks[displayGW],
        nextWeek: gameWeeks[displayGW + 1],
    };
    return (
        <div>
            <div className={styles.gwContainer}>
                <span>
                    <GameWeekSwitcher to={`${divisionId}-${selected}`} selectedGameWeek={displayGW} />
                </span>
                <span>
                    <Button
                        type="TERTIARY"
                        onClick={() => onShowFixture(showFixture === 'thisWeek' ? null : 'thisWeek')}
                    >
                        {showFixture ? 'Hide' : 'Show'} Fixtures
                    </Button>
                </span>
            </div>

            {showFixture ? (
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <Spacer all={{ top: Spacer.spacings.SMALL, bottom: Spacer.spacings.MICRO }}>
                        <h3>
                            This Game Week <span style={{ fontSize: '0.8em', color: '#666' }}>{displayGW}</span>
                        </h3>
                    </Spacer>
                    <GameWeekFixtures {...fixtures.thisWeek} />
                    <Spacer all={{ top: Spacer.spacings.SMALL, bottom: Spacer.spacings.MICRO }}>
                        <h3>
                            Next Game week <span style={{ fontSize: '0.8em', color: '#666' }}>{displayGW + 1}</span>
                        </h3>
                    </Spacer>
                    <GameWeekFixtures {...fixtures.nextWeek} />
                </div>
            ) : null}
        </div>
    );
};

const TabbedMenu: React.FC<TabbedMenuProps> = ({ divisionId, selected, selectedGameWeek, showGWSwitcher }) => (
    <div className={styles.container}>
        <ul className={styles.tabs}>
            {tabs.map(({ id, label, Icon }) => (
                <li className={cx(styles.tab)}>
                    <Tab key={id} to={`${divisionId}-${id}`} isActive={id === selected} Icon={Icon}>
                        {label}
                    </Tab>
                </li>
            ))}
        </ul>
        {showGWSwitcher ? (
            <GameWeekNav selectedGameWeek={selectedGameWeek} divisionId={divisionId} selected={selected} />
        ) : null}
    </div>
);

export default TabbedMenu;
