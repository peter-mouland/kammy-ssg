import React, { Component } from 'react';
import PropTypes from 'prop-types';

import NamedLink from '../../named-link';
import './nav-item.scss';

const propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]).isRequired,
    label: PropTypes.string,
    className: PropTypes.string,
    to: PropTypes.string,
};

const defaultProps = {
    openOnClick: false,
};

export default class NavItem extends Component {
  static propTypes = propTypes;

  static defaultProps = defaultProps;

  state = {
      open: null,
  }

  close = () => {
      this.setState({
          open: null,
      });
  }

  toggle = (label) => {
      const currentOpen = this.state.open;
      this.setState({
          open: currentOpen === label ? null : label,
      });
  }

  render() {
      const {
          label, children, className = '', to,
      } = this.props;
      const { open } = this.state;

      const links = Array.isArray(children) ? children : [children];
      const isOpenClassName = open === label ? 'nav-item--open' : '';
      return (
          <div className={`nav-item ${className} ${isOpenClassName}`}>
              {label && to && <NamedLink className='nav-item__label' to={to}>{label}</NamedLink>}
              {label && !to && <div className='nav-item__label' onClick={() => this.toggle(label)} onMouseLeave={this.close}>{label}</div>}
              {links.length === 1 && (links[0])}
              {links.length > 1 && (
                  <div className='nav-item__children'>
                      {links.map((child, i) => (
                          <div key={i} className='nav-item__child'>{child}</div>
                      ))}
                  </div>
              )}
          </div>
      );
  }
}
