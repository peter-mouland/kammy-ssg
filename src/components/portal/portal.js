import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import canUseDom from '@kammy/helpers.can-use-dom';

const Portal = ({ children, className }) => {
    const elRef = useRef(canUseDom() ? document.createElement('div') : null);

    useEffect(() => {
        const el = elRef.current;
        el.classList.add(className);
        document.body.appendChild(el);
        return () => document.body.removeChild(el);
    }, [className, elRef]);

    return canUseDom() ? ReactDOM.createPortal(children, elRef.current) : null;
};

Portal.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

Portal.defaultProps = {
    className: 'react-portal',
};

export default Portal;
