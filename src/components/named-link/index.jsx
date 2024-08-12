import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'gatsby';
import bemHelper from '@kammy/bem';

import appConfig from '../../config/config';

const bem = bemHelper({ block: 'named-link' });

export const findRoute = ({ to }) => appConfig.routes.find((rt) => rt.name === to);
const isPartiallyActive =
    (className) =>
    ({ isPartiallyCurrent }) =>
        isPartiallyCurrent
            ? { className: bem(null, null, `${className} isActive`) }
            : { className: bem(null, null, className) };

const NamedLink = ({ className = '', to, children = null }) => {
    const route = findRoute({ to });
    if (!route) throw new Error(`Route to '${to}' not found`);
    const { path, label } = route;
    return (
        <Link to={path} getProps={isPartiallyActive(className)}>
            {children || label}
        </Link>
    );
};

NamedLink.contextTypes = {
    appConfig: PropTypes.object,
};

export default NamedLink;
