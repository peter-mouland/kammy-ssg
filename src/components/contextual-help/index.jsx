/* eslint-disable id-length */
import * as React from 'react'
import PropTypes from 'prop-types';

import Caret from './components/Caret';
import Popover from './components/Popover';
import * as styles from './contextual-help.module.css';

class ContextualHelp extends React.PureComponent {
    state = {
        isOpen: false,
    };

    open = () => {
        const { x, y } = this.getBoxPosition();
        this.setState({ isOpen: true, x, y });
    };

    close = () => {
        this.setState({ isOpen: false });
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
        let y = (boxElement.height + 8) * -1;

        if (containerElement.x - width / 2 < 0) {
            x = width / 2;
        } else if (containerElement.x + width / 2 > window.innerWidth) {
            x = (width / 2) * -1 + containerElement.width;
        }

        if (containerElement.y - (boxElement.height + containerElement.height) < 0) {
            y = containerElement.height + 8;
        }

        return { x, y };
    };

    caretXTranslate = () => {
        const { x } = this.state;
        const { width } = this.props;

        if (this.containerRef) {
            const w = this.containerRef.getBoundingClientRect().width / 2;
            if (x < 0) {
                // off right screen
                return width / 2 - w;
            }
            if (x > w) {
                // off left screen
                return (width / 2) * -1 + w;
            }
        }
        return 0;
    };

    render() {
        const { isOpen, x, y } = this.state;
        const { body, header, width, Trigger } = this.props;

        const boxStyle = {
            width: `${isOpen ? width : 0}px`,
            left: `${(width / 2) * -1}px`,
            transform: `translate(${x || 0}px, ${y || 0}px)`,
        };

        return (
            <div
                className={`${styles.contextualHelp} ${isOpen ? styles.active : ''}`}
                ref={(node) => {
                    this.containerRef = node;
                }}
                onFocus={body ? this.open : null}
                onMouseOver={body ? this.open : null}
                onMouseLeave={body ? this.close : null}
            >
                {Trigger}
                <div
                    className={`${styles.box} ${isOpen ? styles.active : ''}`}
                    style={boxStyle}
                    ref={(node) => {
                        this.boxRef = node;
                    }}
                >
                    <Caret isUp={y >= 0} x={this.caretXTranslate()} />
                    <Popover header={header} body={body} hasShadow />
                </div>
            </div>
        );
    }
}

ContextualHelp.propTypes = {
    Trigger: PropTypes.node,
    /** @type {string} body text content of the popover */
    body: PropTypes.node.isRequired,
    /** @type {string} title text content of the popover */
    header: PropTypes.string,
    /** @type {number} popover width */
    width: PropTypes.number,
};

ContextualHelp.defaultProps = {
    body: '',
    header: '',
    width: 250,
};

export default ContextualHelp;
