import * as React from 'react'
import PropTypes from 'prop-types';

import * as styles from './accordion-content.module.css';

const AccordionContent = ({ children }) => <div className={styles.component}>{children}</div>;

AccordionContent.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AccordionContent;
