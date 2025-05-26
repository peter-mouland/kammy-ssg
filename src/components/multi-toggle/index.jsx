import * as React from 'react'
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import ContextualHelp from '../contextual-help';
import Interstitial from '../interstitial';
import './multi-toggle.css';

const bem = bemHelper({ block: 'multi-toggle' });

const MultiToggle = ({
    id,
    checked,
    options,
    disabledOptions,
    label,
    loadingMessage,
    className,
    onChange,
    contextualHelp,
    loading,
    ...props
}) => (
    <span className={bem(null, null, className)} id={id} {...props}>
        {label && <span className={bem('label')}>{label}</span>}
        <span className={bem('group')} id={id} {...props}>
            {loading && (
                <div className={bem('interstitial')}>
                    <Interstitial message={loadingMessage} />
                </div>
            )}
            {options.map((option, i) => {
                const optionId = option.id || option;
                const optionLabel = option.label || option;
                const checkedId = checked?.id || checked;
                return (
                    <div className={bem('option')} key={optionId}>
                        <input
                            checked={checkedId === optionId}
                            id={`${id}-${i}`}
                            name={id}
                            type="radio"
                            value={optionId}
                            onChange={disabledOptions.includes(optionId) ? null : () => onChange(optionId)}
                            disabled={disabledOptions.includes(optionId)}
                        />
                        {contextualHelp && (
                            <ContextualHelp
                                body={contextualHelp(optionLabel)}
                                Trigger={
                                    <label className={bem('option-label')} htmlFor={`${id}-${i}`}>
                                        {optionLabel}
                                    </label>
                                }
                            />
                        )}
                        {!contextualHelp && (
                            <label className={bem('option-label')} htmlFor={`${id}-${i}`}>
                                {optionLabel}
                            </label>
                        )}
                    </div>
                );
            })}
        </span>
    </span>
);

MultiToggle.propTypes = {
    onChange: PropTypes.func.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object])),
    disabledOptions: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    className: PropTypes.string,
    checked: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    loadingMessage: PropTypes.string,
    loading: PropTypes.bool,
    contextualHelp: PropTypes.func,
};

MultiToggle.defaultProps = {
    disabledOptions: [],
    options: [],
    className: '',
    checked: null,
    loading: false,
    loadingMessage: null,
    label: null,
    contextualHelp: null,
};

export default MultiToggle;
