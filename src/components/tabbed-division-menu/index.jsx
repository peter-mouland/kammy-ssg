import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

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

const TabbedDivisionMenu = ({ division, selected, selectedGameWeek }) => {
    const { gameWeeks } = useGameWeeks();
    return (
        <div>
            <div className={styles.container}>
                <Spacer tag="ul" all={{ stackH: Spacer.spacings.MEDIUM }} className={styles.tabs}>
                    {selectedGameWeek ? (
                        <GameWeekSwitcher url={`/${division}/${selected}`} selectedGameWeek={selectedGameWeek} />
                    ) : null}
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
            <div>
                <GameWeekFixtures {...gameWeeks[selectedGameWeek]} />
                <GameWeekFixtures {...gameWeeks[selectedGameWeek + 1]} />
            </div>
        </div>
    );
};

TabbedDivisionMenu.propTypes = {
    division: PropTypes.string.isRequired,
    selected: PropTypes.string.isRequired,
};

export default TabbedDivisionMenu;
