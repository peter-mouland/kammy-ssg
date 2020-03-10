/* eslint-disable id-length */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import BemHelper from '@kammy/bem';

import Caret from './components/Caret';
import Popover from './components/Popover';

import './contextual-help.scss';

const bem = BemHelper({ block: 'contextual-help' });

class Index extends PureComponent {
    static propTypes = {
      /** @type {string} title text content of the popover */
      header: PropTypes.string,
      /** @type {string} body text content of the popover */
      body: PropTypes.node,
      /** @type {number} popover width */
      width: PropTypes.number,
      Trigger: PropTypes.node,
    };

    static defaultProps = {
      width: 250,
    };

    state = {
      isOpen: false,
    };

    open = () => {
      const { x, y } = this.getBoxPosition();
      this.setState({
        isOpen: true, opacity: 1, x, y,
      });
    };

    close = () => {
      this.setState({ isOpen: false, opacity: 0 });
    };

    /**
     * Determine and update the correct position of the popover box so as to ensure it's visibility in the viewport
     */
    getBoxPosition = () => {
      if (!this.boxRef) {
        return {};
      }
      const { width } = this.props;
      const containerElement = this.containerRef.getBoundingClientRect();
      const boxElement = this.boxRef.getBoundingClientRect();

      let x = containerElement.width / 2;
      let y = (boxElement.height + containerElement.height) * -1;

      if ((containerElement.x - (width / 2)) < 0) {
        x = width / 2;
      } else if ((containerElement.x + (width / 2)) > window.innerWidth) {
        x = ((width / 2) * -1) + containerElement.width;
      }

      if (containerElement.y - (boxElement.height + containerElement.height) < 0) {
        y = 0;
      }

      return { x, y };
    };

    caretXTranslate = () => {
      const { x } = this.state;
      const { width } = this.props;

      if (this.containerRef) {
        const w = this.containerRef.getBoundingClientRect().width / 2;
        if (x < 0) { // off right screen
          return (width / 2) - w;
        } if (x > w) { // off left screen
          return ((width / 2) * -1) + w;
        }
      }
      return 0;
    };

    render() {
      const { isOpen, x, y } = this.state;
      const {
        body, header, width, Trigger,
      } = this.props;

      const boxStyle = {
        width: `${isOpen ? width : 0}px`,
        left: `${(width / 2) * -1}px`,
        transform: `translate(${x || 0}px, ${y || 0}px)`,
      };

      return (
        <div
          className={bem(null, { active: isOpen })}
          ref={(node) => { this.containerRef = node; }}
          onMouseOver={this.open}
          onMouseLeave={this.close}
        >
          {Trigger}
          <div className={bem('box', { active: isOpen })} style={boxStyle} ref={(node) => { this.boxRef = node; }}>
            <Caret isUp={y >= 0} x={this.caretXTranslate()} />
            <Popover
              header={header}
              body={body}
              hasShadow
            />
          </div>
        </div>
      );
    }
}

export default Index;
