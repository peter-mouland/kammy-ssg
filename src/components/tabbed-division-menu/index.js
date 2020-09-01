import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import NamedLink from '../named-link';
import DraftIcon from '../icons/draft.svg';
import GroupIcon from '../icons/group.svg';
import PlayersIcon from '../icons/players.svg';
import TransfersIcon from '../icons/transfers.svg';
import TableIcon from '../icons/table.svg';
import Spacer from '../spacer';
import styles from './index.module.css';

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
    {
        id: 'draft',
        label: 'Draft',
        Icon: DraftIcon,
    },
];

const Index = ({ division, label: title, selected }) => (
    <Spacer all={{ bottom: Spacer.spacings.MEDIUM, top: Spacer.spacings.LARGE }}>
        <div className={styles.container}>
            <Spacer
                all={{ right: Spacer.spacings.MEDIUM, bottom: Spacer.spacings.MEDIUM }}
                phablet={{ bottom: Spacer.spacings.TINY }}
            >
                <h1>{title}</h1>
            </Spacer>
            <Spacer tag={'ul'} all={{ stackH: Spacer.spacings.MEDIUM }} className={styles.tabs}>
                {tabs.map(({ id, label, Icon }) => (
                    <li key={id} className={cx(styles.tab)}>
                        <NamedLink
                            to={`${division}-${id}`}
                            className={cx(styles.cta, { [styles.isActive]: id === selected })}
                        >
                            <Spacer medium={{ right: Spacer.spacings.SMALL }}>
                                <div className={styles.iconContainer}><Icon width="26px" height="26px" /></div>
                            </Spacer>
                            {label}
                        </NamedLink>
                    </li>
                ))}
            </Spacer>
        </div>
    </Spacer>
);

Index.propTypes = {
    division: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    selected: PropTypes.string.isRequired,
};

export default Index;
