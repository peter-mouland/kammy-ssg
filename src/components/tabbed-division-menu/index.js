import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import NamedLink from '../named-link';
// import DraftIcon from '../icons/draft.svg';
import GroupIcon from '../icons/group.svg';
import PlayersIcon from '../icons/players.svg';
import TransfersIcon from '../icons/transfers.svg';
import TableIcon from '../icons/table.svg';
import Spacer from '../spacer';
import * as styles from './index.module.css';

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
        id: 'players',
        label: 'Players',
        Icon: PlayersIcon,
    },
    {
        id: 'transfers',
        label: 'Transfers',
        Icon: TransfersIcon,
    },
];

const TabbedDivisionMenu = ({ division, selected }) => (
    <div className={styles.container}>
        <Spacer tag="ul" all={{ stackH: Spacer.spacings.MEDIUM }} className={styles.tabs}>
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
);

TabbedDivisionMenu.propTypes = {
    division: PropTypes.string.isRequired,
    selected: PropTypes.string.isRequired,
};

export default TabbedDivisionMenu;
