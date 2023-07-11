import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Button from '../button';
import NamedLink from '../named-link';
import GameWeekFixtures from '../gameweek-fixtures';
import GroupIcon from '../icons/group.svg';
import PlayersIcon from '../icons/players.svg';
import TransfersIcon from '../icons/transfers.svg';
import TableIcon from '../icons/table.svg';
import Spacer from '../spacer';
import * as styles from './index.module.css';
import GameWeekSwitcher from '../gameweek-switcher';
import useGameWeeks from '../../hooks/use-game-weeks';

const tabs = [
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

const TabbedMenu = ({ division, selected, selectedGameWeek }) => {
    const { gameWeeks, currentGameWeek } = useGameWeeks();
    const displayGW = selectedGameWeek || currentGameWeek.gameWeek;
    const [showFixture, onShowFixture] = React.useState(null);
    const fixtures = {
        thisWeek: gameWeeks[displayGW],
        nextWeek: gameWeeks[displayGW + 1],
    };

    return (
        <div>
            <div className={styles.container}>
                <Spacer tag="ul" all={{ stackH: Spacer.spacings.MEDIUM }} className={styles.tabs}>
                    <GameWeekSwitcher
                        to={selectedGameWeek ? `${division}-${selected}` : null}
                        selectedGameWeek={displayGW}
                    />
                    {tabs.map(({ id, label, Icon }) => (
                        <li key={id} className={cx(styles.tab)}>
                            <NamedLink
                                to={`${division}-${id}`}
                                className={cx(styles.cta, { [styles.isActive]: id === selected })}
                            >
                                <Spacer medium={{ right: Spacer.spacings.SMALL }}>
                                    <div className={styles.iconContainer}>
                                        <Icon width="26px" height="26px" />
                                    </div>
                                </Spacer>
                                {label}
                            </NamedLink>
                        </li>
                    ))}
                </Spacer>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    maxWidth: '408px',
                    margin: '0 auto',
                    background: '#eee',
                    borderRadius: '0 0 5px 5px',
                }}
            >
                <Spacer all={{ horizontal: Spacer.spacings.SMALL }} tag="div">
                    <Button
                        type="TERTIARY"
                        onClick={() => onShowFixture(showFixture === 'thisWeek' ? null : 'thisWeek')}
                    >
                        GW Fixtures
                    </Button>
                </Spacer>
                <Spacer all={{ horizontal: Spacer.spacings.SMALL }} tag="div">
                    <Button
                        type="TERTIARY"
                        onClick={() => onShowFixture(showFixture === 'nextWeek' ? null : 'nextWeek')}
                    >
                        Next GW Fixtures
                    </Button>
                </Spacer>
            </div>

            {showFixture ? (
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <GameWeekFixtures {...fixtures[showFixture]} />
                </div>
            ) : null}
        </div>
    );
};

TabbedMenu.propTypes = {
    selectedGameWeek: PropTypes.number.isRequired,
    division: PropTypes.string.isRequired,
    selected: PropTypes.string.isRequired,
};

export default TabbedMenu;
