import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import './data-list.scss';
import styles from './tags.module.css';

const indexOfMatch = (searchTerm, item) => item.label.toUpperCase().indexOf(searchTerm.toUpperCase());
const match = (searchTerm, item) => indexOfMatch(searchTerm, item) > -1;

const labelWithBoldText = (item, searchTerm) => {
    const i = indexOfMatch(searchTerm, item);
    return (
        <span>
            {item.label.substr(0, i)}
            <strong>{item.label.substr(i, searchTerm.length)}</strong>
            {item.label.substr(i + searchTerm.length)}
        </span>
    );
};

const ArrivingTag = ({ item }) =>
    item.isPendingTransferIn ? <span className={cx(styles.tag, styles.arrivingTag)}>pending</span> : null;
const ExitTag = ({ item }) =>
    item.isPendingTransferOut ? <span className={cx(styles.tag, styles.exitTag)}>pending exit</span> : null;
const ManagerTag = ({ item }) =>
    item.manager ? <span className={cx(styles.tag, styles.managerTag)}>{item.manager}</span> : null;
const Tags = ({ item }) => (
    <span className={styles.tags}>
        <ExitTag item={item} /> <ArrivingTag item={item} /> <ManagerTag item={item} />
    </span>
);

const Item = ({ item, index, focusIndex, onSelect, searchTerm, selectedItem }) => {
    const buttonClassName = 'datalist-button';
    const isActive = focusIndex === index || (selectedItem && selectedItem.key === item.key);
    const label = indexOfMatch(searchTerm, item) < 0 ? item.label : labelWithBoldText(item, searchTerm);
    const buttonClass = isActive ? `${buttonClassName} ${buttonClassName}--active` : buttonClassName;

    return (
        <button className={`datalist-item ${buttonClass}`} key={item.key} onClick={() => onSelect(item)} type="button">
            <Tags item={item} />
            {item.img && <img src={item.img} className="datalist-item__img" loading="lazy" alt="" />}
            <span className="datalist-item__label">
                {label}
                <p className="datalist-item__club">{item.club}</p>
            </span>
            <span className="datalist-item__additional">{item.additional}</span>
        </button>
    );
};

Item.propTypes = {
    item: PropTypes.shape({
        key: PropTypes.string,
        img: PropTypes.string,
        label: PropTypes.string,
        club: PropTypes.string,
        isPendingTransferIn: PropTypes.bool,
        isPendingTransferOut: PropTypes.bool,
        additional: PropTypes.node,
    }).isRequired,
    selectedItem: PropTypes.shape({ key: PropTypes.string, label: PropTypes.string }),
    index: PropTypes.number.isRequired,
    focusIndex: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
};

Item.defaultProps = {
    selectedItem: null,
};

class DataListInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            /*  last valid item that was selected from the drop down menu */
            selectedItem: null,
            /* current input text */
            searchTerm: '',
            /* current set of matching items */
            matchingItems: [],
            /* visibility property of the drop down menu */
            visible: props.alwaysShowItems,
            /* index of the currently focused item in the drop down menu */
            focusIndex: -1,
        };
    }

    /**
     * gets called when someone starts to write in the input field
     * @param event
     */
    onHandleInput = (event) => {
        const searchTerm = event.target.value;
        const matchingItems =
            searchTerm === '' ? [] : this.props.items.filter((item) => this.props.match(searchTerm, item));

        this.setState({
            searchTerm,
            matchingItems,
            focusIndex: -1,
            visible: true,
        });
    };

    /**
     * handle key events
     * @param event
     */
    onHandleKeydown = (event) => {
        // only do something if drop-down div is visible
        if (!this.state.visible) return;
        let currentFocusIndex = this.state.focusIndex;
        if (event.keyCode === 40 || event.keyCode === 9) {
            // If the arrow DOWN key or tab is pressed increase the currentFocus variable:
            currentFocusIndex += 1;
            if (currentFocusIndex >= this.state.matchingItems.length) currentFocusIndex = 0;
            this.setState({
                focusIndex: currentFocusIndex,
            });
            // prevent tab to jump to the next input field if drop down is still open
            event.preventDefault();
        } else if (event.keyCode === 38) {
            // If the arrow UP key is pressed, decrease the currentFocus variable:
            currentFocusIndex -= 1;
            if (currentFocusIndex <= -2) currentFocusIndex = this.state.matchingItems.length - 1;
            this.setState({
                focusIndex: currentFocusIndex,
            });
        } else if (event.keyCode === 13) {
            // Enter pressed, similar to onClickItem
            if (this.state.focusIndex > -2) {
                // Simulate a click on the "active" item:
                const selectedItem = this.state.matchingItems[currentFocusIndex];
                this.onSelect(selectedItem);
            }
        }
    };

    /**
     * onSelect is called onClickItem and onEnter upon an option of the drop down menu
     * does nothing if the key has not changed since the last onSelect event
     * @param selectedItem
     */
    onSelect = (input) => {
        // (this.state.selectedItem !== undefined && selectedItem.key === this.state.selectedItem.key)
        const selectedItem = this.state.selectedItem && input.key === this.state.selectedItem.key ? null : input;
        this.setState({
            selectedItem,
            visible: false,
            focusIndex: -2,
        });

        this.props.onSelect(selectedItem);
    };

    render() {
        const { items, emptyStateMessage } = this.props;
        const { matchingItems, searchTerm, visible, selectedItem, focusIndex } = this.state;
        const { placeholder, alwaysShowItems } = this.props;
        const dataListClassName = alwaysShowItems || visible ? 'datalist datalist--on' : 'datalist';
        const itemsClassName = alwaysShowItems || visible ? 'datalist-items datalist-items--on' : 'datalist-items';
        const itemsToShow = matchingItems.length === 0 && searchTerm.length === 0 ? items : matchingItems;

        return (
            <div className={dataListClassName}>
                <input
                    onKeyDown={this.onHandleKeydown}
                    onChange={this.onHandleInput}
                    type="search"
                    className="datalist__input"
                    placeholder={placeholder}
                    value={searchTerm}
                />
                <div className={itemsClassName}>
                    {items.length === 0 && emptyStateMessage}
                    {itemsToShow.map((item, i) => (
                        <Item
                            key={item.key}
                            item={item}
                            focusIndex={focusIndex}
                            index={i}
                            onSelect={this.onSelect}
                            searchTerm={searchTerm}
                            selectedItem={selectedItem}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

DataListInput.propTypes = {
    items: PropTypes.array.isRequired,
    emptyStateMessage: PropTypes.node,
    placeholder: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    match: PropTypes.func,
    alwaysShowItems: PropTypes.bool,
};

DataListInput.defaultProps = {
    match,
    placeholder: null,
    emptyStateMessage: null,
    alwaysShowItems: false,
};

export default DataListInput;
