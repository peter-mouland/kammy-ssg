import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import './toggle.scss';

const bem = bemHelper({ block: 'toggle' });

const Toggle = ({ id, checked, label, className, onClick, ...props }) => (
    <span className={className}>
        <input
            className={bem(null, 'ios')}
            id={id}
            type="checkbox"
            defaultChecked={checked}
            onClick={onClick}
            {...props}
        />
        <label className={bem('label')} htmlFor={id}>
            {label}
            <span className={bem('btn')} />
        </label>
    </span>
);

Toggle.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    checked: PropTypes.bool,
};

Toggle.defaultProps = {
    checked: false,
    className: '',
};

export default Toggle;
