import * as React from 'react'
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

const bem = bemHelper({ block: 'error' });

const Errors = ({ errors }) => (
    <div className={bem()}>
        <p>Error!</p>
        {errors.map((error) => (
            <p key={error.message}>{error.message}</p>
        ))}
    </div>
);

Errors.propTypes = {
    errors: PropTypes.array.isRequired,
};

export default Errors;
