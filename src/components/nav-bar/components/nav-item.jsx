import React, { useState } from 'react';
import PropTypes from 'prop-types';

import NamedLink from '../../named-link';
import './nav-item.scss';

const NavItem = ({ label, children, className = '', to }) => {
    const [open, toggleOpen] = useState(false);
    const toggle = (toggleLabel) => toggleOpen(open === toggleLabel ? null : toggleLabel);
    const close = () => toggleOpen(null);

    const links = Array.isArray(children) ? children : [children];
    const isOpenClassName = open === label ? 'nav-item--open' : '';
    return (
        <div className={`nav-item ${className} ${isOpenClassName}`}>
            {label && to && (
                <NamedLink className="nav-item__label" to={to}>
                    {label}
                </NamedLink>
            )}
            {label && !to && (
                <div className="nav-item__label" onClick={() => toggle(label)} onMouseLeave={close}>
                    {label}
                </div>
            )}
            {links.length === 1 && links[0]}
            {links.length > 1 && (
                <div className="nav-item__children">
                    {links.map((child) => (
                        <div key={child} className="nav-item__child">
                            {child}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

NavItem.propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
    label: PropTypes.string,
    className: PropTypes.string,
    to: PropTypes.string,
};

NavItem.defaultProps = {
    label: '',
    className: '',
    to: '',
};

export default NavItem;
