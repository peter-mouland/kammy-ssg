import * as React from 'react'
import PropTypes from 'prop-types';
import cx from 'classnames';

import ChevronDownIcon from '../../icons/chevron.svg';
import * as styles from './accordion.module.css';
import { types } from './constants';
import AccordionContent from './components/accordion-content';

const toKebabCase = (value) => value.toLowerCase().replace(/ /g, '-');

const Accordion = ({ title, description, icon, children, type, dataId, isDisabled, onToggle, isInitialExpanded }) => {
    const [isExpanded, setIsExpanded] = React.useState(isInitialExpanded);
    const formattedAriaTitle = toKebabCase(title);
    const Icon = icon;

    return (
        <div
            className={cx(styles.component, {
                [styles.isTypePrimary]: type === types.PRIMARY,
                [styles.isTypeSecondary]: type === types.SECONDARY,
            })}
            data-qa="accordion"
            data-id={dataId}
        >
            <h3>
                <button
                    id={formattedAriaTitle}
                    className={cx(styles.accordionToggle, {
                        [styles.isDisabled]: isDisabled,
                    })}
                    data-qa="accordion-toggle"
                    aria-disabled={isDisabled}
                    aria-expanded={isExpanded}
                    aria-controls={`${formattedAriaTitle}-content`}
                    onClick={() => {
                        setIsExpanded(!isExpanded);
                        if (onToggle) onToggle({ isExpanded: !isExpanded });
                    }}
                    type="button"
                    disabled={isDisabled}
                >
                    <div className={styles.header}>
                        <div className={styles.leftSection}>
                            {icon ? (
                                <span className={styles.icon}>
                                    <Icon />
                                </span>
                            ) : null}
                            <div className={styles.details}>
                                <span data-qa="accordion-title" className={styles.title}>
                                    {title}
                                </span>
                                {description ? (
                                    <span className={styles.description}>
                                        <p>{description}</p>
                                    </span>
                                ) : null}
                            </div>
                        </div>
                        {!isDisabled ? (
                            <span
                                className={cx(styles.chevron, {
                                    [styles.isExpanded]: isExpanded,
                                })}
                            >
                                <ChevronDownIcon height="18" width="18" />
                            </span>
                        ) : null}
                    </div>
                </button>
            </h3>
            <div
                id={`${formattedAriaTitle}-content`}
                data-qa="accordion-content"
                aria-labelledby={title}
                role="region"
                hidden={!isExpanded}
            >
                {children}
            </div>
        </div>
    );
};

Accordion.types = types;

Accordion.propTypes = {
    children: PropTypes.node.isRequired,
    dataId: PropTypes.string,
    description: PropTypes.node,
    icon: PropTypes.func,
    isDisabled: PropTypes.bool,
    isInitialExpanded: PropTypes.bool,
    onToggle: PropTypes.func,
    type: PropTypes.oneOf(Object.values(types)),
    title: PropTypes.string.isRequired,
};

Accordion.defaultProps = {
    dataId: null,
    description: null,
    icon: null,
    isDisabled: false,
    isInitialExpanded: false,
    onToggle: null,
    type: types.PRIMARY,
};

Accordion.Content = AccordionContent;

export default Accordion;
