import React from 'react';
import PropTypes from 'prop-types';

import NamedLink from '../named-link';
import DraftIcon from '../icons/draft.svg';
import GroupIcon from '../icons/group.svg';
import PlayersIcon from '../icons/players.svg';
import TransfersIcon from '../icons/transfers.svg';
import TableIcon from '../icons/table.svg';
import Spacer from '../spacer';
import styles from './index.module.css';
import appConfig from '../../config/config';

const Index = ({ division, selected }) => (
    <Spacer tag={'ul'} all={{ stackH: Spacer.spacings.MEDIUM }} className={styles.tabs}>
        <li className={styles.tab}>
            <Spacer phablet={{ right: Spacer.spacings.SMALL }}>
                <div className={styles.iconContainer}><TableIcon width="26px" height="26px" /></div>
            </Spacer>
            <Spacer phablet={{ right: Spacer.spacings.LARGE }}>
                <NamedLink to={`${division}-rankings`} className={styles.label} />
            </Spacer>
        </li>
        <li className={styles.tab}>
            <Spacer phablet={{ right: Spacer.spacings.SMALL }}>
                <div className={styles.iconContainer}><GroupIcon width="26px" height="26px" /></div>
            </Spacer>
            <Spacer phablet={{ right: Spacer.spacings.LARGE }}>
                <NamedLink to={`${division}-teams`} className={styles.label} />
            </Spacer>
        </li>
        <li className={styles.tab}>
            <Spacer phablet={{ right: Spacer.spacings.SMALL }}>
                <div className={styles.iconContainer}><PlayersIcon width="26px" height="26px" /></div>
            </Spacer>
            <Spacer phablet={{ right: Spacer.spacings.LARGE }}>
                <NamedLink to={`${division}-players`} className={styles.label} />
            </Spacer>
        </li>
        <li className={styles.tab}>
            <Spacer phablet={{ right: Spacer.spacings.SMALL }}>
                <div className={styles.iconContainer}><TransfersIcon width="26px" height="26px" /></div>
            </Spacer>
            <Spacer phablet={{ right: Spacer.spacings.LARGE }}>
                <NamedLink to={`${division}-transfers`} className={styles.label} />
            </Spacer>
        </li>
        <li className={styles.tab}>
            <Spacer phablet={{ right: Spacer.spacings.SMALL }}>
                <div className={styles.iconContainer}><DraftIcon width="26px" height="26px" /></div>
            </Spacer>
            <Spacer phablet={{ right: Spacer.spacings.LARGE }}>
                <NamedLink to={`${division}-draft`} className={styles.label} />
            </Spacer>
        </li>
    </Spacer>
);

Index.propTypes = {
    division: PropTypes.string.isRequired,
};

export default Index;
