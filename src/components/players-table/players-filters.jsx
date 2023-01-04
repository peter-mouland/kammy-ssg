/* eslint-disable react/no-deprecated */
import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';
import Select from 'react-select';

import Toggle from '../toggle';
import './players-filters.scss';

const bem = bemHelper({ block: 'players-filters' });
const MY_TEAM = 'My Team';

const setClubs = ({ players = [], myTeam }) => {
    const clubs = new Set();
    players.forEach((player) => clubs.add(player.club));
    const clubsArr = [...clubs.keys()].sort();
    if (myTeam) clubsArr.unshift(MY_TEAM);
    return clubsArr.filter((item) => item);
};

const applyFilters = ({
    nameFilters,
    posFilters,
    clubFilters,
    player,
    showHidden,
    miscFilters,
    customFilter,
    customFilterChecked,
}) => {
    const customFiltered = !customFilter || !customFilterChecked || customFilter.fn(player);
    const nameFiltered = !nameFilters.length || nameFilters.includes(player.name);
    const posFiltered = !posFilters.length || posFilters.includes(player.pos);
    const miscFiltered =
        !miscFilters.length ||
        (miscFilters.includes('isNew') && player.new) ||
        (miscFilters.includes('isAvail') && player.isAvailable);
    const hiddenFiltered = player.isHidden === showHidden;
    const clubFiltered = !clubFilters.length || clubFilters.includes(player.club);
    // || (clubFilters === MY_TEAM && myTeam && [player.code])

    return nameFiltered && posFiltered && clubFiltered && hiddenFiltered && miscFiltered && customFiltered;
};

export default class PlayersFilters extends React.Component {
    options = {
        clubs: [],
        positions: [],
    };

    constructor(props) {
        super(props);
        this.options.clubs = setClubs(props);
        this.options.positions = props.positions;
        this.state = {
            showHidden: false,
            customFilterChecked: false,
            posFilters: props.selectedPosition ? [props.selectedPosition] : [],
            nameFilters: [],
            clubFilters: [],
            miscFilters: [],
        };
    }

    componentWillReceiveProps(nextProps) {
        this.options.clubs = setClubs(nextProps);
    }

    showHidden = (e) => {
        this.setState({ showHidden: e.target.checked });
    };

    customFilter = (e) => {
        this.setState({ customFilterChecked: e.target.checked });
    };

    addFilter = (options) => {
        const posFilters = [];
        const clubFilters = [];
        const nameFilters = [];
        const miscFilters = [];

        (options || []).forEach(({ group, value }) => {
            if (group === 'position') {
                posFilters.push(value);
            }
            if (group === 'club') {
                clubFilters.push(value);
            }
            if (group === 'player') {
                nameFilters.push(value);
            }
            if (group === 'misc') {
                miscFilters.push(value);
            }
        });
        this.setState({
            selectedFilters: options,
            posFilters,
            nameFilters,
            clubFilters,
            miscFilters,
        });
    };

    onFilter = () => {
        const { players, myTeam, customFilter } = this.props;
        const { selectedFilters, posFilters, clubFilters, nameFilters, showHidden, customFilterChecked, miscFilters } =
            this.state;
        const teamPlayers = myTeam
            ? Object.keys(myTeam).reduce(
                  (prev, curr) => myTeam[curr] && { ...prev, [myTeam[curr].code]: { ...myTeam[curr], teamPos: curr } },
                  {},
              )
            : {};

        const filtered = players.filter((player) =>
            applyFilters({
                selectedFilters,
                player,
                nameFilters,
                posFilters,
                clubFilters,
                customFilter,
                customFilterChecked,
                myTeam: teamPlayers,
                miscFilters,
                showHidden,
            }),
        );
        return filtered;
    };

    render() {
        const { customFilter, showHiddenToggle, players } = this.props;
        const { customFilterChecked, showHidden } = this.state;
        const { clubs, positions } = this.options;
        // if the user cant show hidden players,  don't show hidden players in the select box
        const filteredPlayers = showHiddenToggle ? players : players.filter((player) => player.isHidden === showHidden);

        return (
            <div className={bem()}>
                <div className={bem('filters')}>
                    <div className={bem('group')}>
                        {customFilter && (
                            <div>
                                <Toggle
                                    label={customFilter.label}
                                    id="custom-filter"
                                    onClick={this.customFilter}
                                    checked={customFilterChecked}
                                />
                            </div>
                        )}
                        {showHiddenToggle && (
                            <div>
                                <Toggle
                                    label="Hidden Players"
                                    id="hidden-filter"
                                    onClick={this.showHidden}
                                    checked={showHidden}
                                />
                            </div>
                        )}
                        <div>
                            <Select
                                placeholder="filter..."
                                options={[
                                    {
                                        label: 'Misc',
                                        options: [
                                            { value: 'isNew', label: 'New Players', group: 'misc' },
                                            // { value: 'isSub', label: 'Sub(s)', group: 'misc' },
                                            // { value: 'isPending', label: 'Pending transfers', group: 'misc' },
                                            { value: 'isAvail', label: 'Available', group: 'misc' },
                                        ],
                                    },
                                    {
                                        label: 'Positions',
                                        options: positions.map((position) => ({
                                            value: position,
                                            label: position,
                                            group: 'position',
                                        })),
                                    },
                                    {
                                        label: 'Clubs',
                                        options: clubs.map((club) => ({ value: club, label: club, group: 'club' })),
                                    },
                                    {
                                        label: 'Players',
                                        options: filteredPlayers.map(({ name }) => ({
                                            value: name,
                                            label: name,
                                            group: 'player',
                                        })),
                                    },
                                ]}
                                isMulti
                                name="playersFiltersOut"
                                onChange={this.addFilter}
                            />
                        </div>
                    </div>
                </div>
                <div className={bem('contents')}>{this.props.children(this.onFilter())}</div>
            </div>
        );
    }
}

PlayersFilters.propTypes = {
    players: PropTypes.array.isRequired,
    positions: PropTypes.array.isRequired,
    children: PropTypes.func.isRequired,
    myTeam: PropTypes.object,
    customFilter: PropTypes.object,
    selectedPosition: PropTypes.string,
    showHiddenToggle: PropTypes.bool,
};

PlayersFilters.defaultProps = {
    myTeam: null,
    customFilter: null,
    selectedPosition: null,
    showHiddenToggle: false,
};
