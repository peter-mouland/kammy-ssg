/* eslint-disable react/prop-types */
import React from 'react';
import cx from 'classnames';

import Spacer from '../../../spacer';
import Arrow from '../../../icons/arrow-circle-right.svg';
import * as styles from './accordion.module.css';

const Accordion = ({ count, rules, highlights, title, children }) => {
    const [isShown, setIsShown] = React.useState(false);
    return (
        <div
            className={cx(styles.accordionContainer, {
                [styles.expand]: isShown && !rules.error,
                [styles.disabled]: rules.error,
            })}
        >
            <h3>
                <button type="button" onClick={() => setIsShown(!isShown)} className={styles.accordionCta}>
                    <Arrow height={20} width={20} />
                    <span className={styles.titleText}>{title}</span>
                    <span className={styles.count}>({count})</span>
                </button>
            </h3>
            <Spacer all={{ stack: Spacer.spacings.SMALL }} className={styles.rules}>
                {/* eslint-disable-next-line react/no-danger */}
                {rules.remaining && <li dangerouslySetInnerHTML={{ __html: rules.remaining }} />}
                {highlights.map((Content) => (
                    <li>{Content}</li>
                ))}
            </Spacer>
            <section className={cx(styles.playerTable)}>
                <Spacer all={{ stack: Spacer.spacings.MEDIUM }}>{children}</Spacer>
            </section>
        </div>
    );
};
export default Accordion;
