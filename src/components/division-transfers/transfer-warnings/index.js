import React from 'react';
import PropTypes from 'prop-types';

import Warning from '../../icons/warning.svg';
import Spacer from '../../spacer';
import getTransferWarnings from '../lib/get-transfer-warnings';
import styles from './tarnsfer-warnings.module.css';

const TransferWarnings = ({ playerIn, playerOut, teams, manager, changeType, transfers }) => {
    // todo: move warnings into transfer hook,
    // assign warning 'types'
    // check transfer for existing warnings,
    // if no warnings assume it's valid, take it into account for the following transfers
    // if warnings assume it's invalid, and ignore it for the following transfers
    const warnings = getTransferWarnings({ playerIn, playerOut, teams, manager, changeType, transfers });
    if (!warnings.length) return null;

    return (
        <div className={styles.warnings}>
            <h2 className={styles.title}>
                <Warning width={24} height={24} /> Team Warnings
            </h2>
            {warnings.map((message) => (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }}>
                    {/* eslint-disable-next-line react/no-danger */}
                    <div className="row row--warning" dangerouslySetInnerHTML={{ __html: message }} />
                </Spacer>
            ))}
        </div>
    );
};

TransferWarnings.propTypes = {
    playerIn: PropTypes.object.isRequired,
    playerOut: PropTypes.object.isRequired,
    manager: PropTypes.string.isRequired,
    changeType: PropTypes.string.isRequired,
    teams: PropTypes.object,
    transfers: PropTypes.array,
};

TransferWarnings.defaultProps = {
    teams: {},
    transfers: [],
};

export default TransferWarnings;
