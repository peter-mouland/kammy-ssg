import * as React from 'react'
import PropTypes from 'prop-types';

import Warning from '../../../icons/warning.svg';
import Spacer from '../../spacer';
import * as styles from './tarnsfer-warnings.module.css';

const TransferWarnings = ({ warnings }) => {
    if (!warnings.length) return null;
    return (
        <div className={styles.warnings}>
            <h2 className={styles.title}>
                <Warning width={24} height={24} /> Team Warnings
            </h2>
            {warnings.map((message) => (
                <Spacer all={{ vertical: Spacer.spacings.SMALL }} key={message}>
                    {/* eslint-disable-next-line react/no-danger */}
                    <div className="row row--warning" dangerouslySetInnerHTML={{ __html: message }} />
                </Spacer>
            ))}
        </div>
    );
};

TransferWarnings.propTypes = {
    warnings: PropTypes.array,
};

TransferWarnings.defaultProps = {
    warnings: [],
};

export default TransferWarnings;
