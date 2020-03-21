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
    nameFilters, posFilters, clubFilters, player, showHidden, showNew, customFilter, customFilterChecked,
}) => {
    const customFiltered = !customFilter || !customFilterChecked || customFilter.fn(player);
    const nameFiltered = !nameFilters.length || nameFilters.includes(player.name);
    const posFiltered = !posFilters.length || (posFilters.includes(player.pos));
    const hiddenFiltered = player.isHidden === showHidden;
    const newFiltered = !showNew || player.new === showNew;
    const clubFiltered = !clubFilters.length || (clubFilters.includes(player.club));
    // || (clubFilters === MY_TEAM && myTeam && [player.code])
    return nameFiltered && posFiltered && clubFiltered && hiddenFiltered && newFiltered && customFiltered;
};

export default class PlayersFilters extends React.Component {
  static propTypes = {
      players: PropTypes.array.isRequired,
      positions: PropTypes.array.isRequired,
      children: PropTypes.func.isRequired,
      myTeam: PropTypes.object,
      customFilter: PropTypes.object,
      selectedPosition: PropTypes.string,
      showHiddenToggle: PropTypes.bool,
      showNewToggle: PropTypes.bool,
  };

  static defaultProps = {
      myTeam: null,
      customFilter: null,
      selectedPosition: null,
      showHiddenToggle: false,
      showNewToggle: false,
  };

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
          showNew: false,
          isSaving: false,
          customFilterChecked: false,
          showHiddenChecked: false,
          posFilters: props.selectedPosition ? [props.selectedPosition] : [],
          nameFilters: [],
          clubFilters: [],
          selectFilters: [],
      };
  }

  componentWillReceiveProps(nextProps) {
      this.options.clubs = setClubs(nextProps);
      if (nextProps.selectedPosition !== this.state.selectedPosition) {
          this.setState({ posFilter: nextProps.selectedPosition });
      }
  }

  showNew = (e) => {
      this.setState({ showNew: e.target.checked });
  }

  showHidden = (e) => {
      this.setState({ showHidden: e.target.checked });
  }

  customFilter = (e) => {
      this.setState({ customFilterChecked: e.target.checked });
  }

  addFilter = (options) => {
      const posFilters = [];
      const clubFilters = [];
      const nameFilters = [];

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
      });
      this.setState({
          selectedFilters: options, posFilters, nameFilters, clubFilters,
      });
  }

  onFilter = () => {
      const {
          players, myTeam, customFilter,
      } = this.props;
      const {
          selectedFilters, posFilters, clubFilters, nameFilters, showHidden, showNew, customFilterChecked,
      } = this.state;
      const teamPlayers = myTeam
          ? (Object.keys(myTeam))
              .reduce((prev, curr) => myTeam[curr]
          && ({ ...prev, [myTeam[curr].code]: { ...myTeam[curr], teamPos: curr } }), {})
          : {};

      const filtered = players.filter((player) => applyFilters({
          selectedFilters,
          player,
          nameFilters,
          posFilters,
          clubFilters,
          customFilter,
          customFilterChecked,
          myTeam: teamPlayers,
          showHidden,
          showNew,
      }));
      return filtered;
  }

  render() {
      const {
          customFilter, showHiddenToggle, showNewToggle, players,
      } = this.props;
      const {
          customFilterChecked, showHidden, showNew,
      } = this.state;
      const { clubs, positions } = this.options;
      // if the user cant show hidden players,  don't show hidden players in the select box
      const filteredPlayers = showHiddenToggle ? players : players.filter((player) => player.isHidden === showHidden);

      return (
          <div className={ bem() }>
              <div className={ bem('filters') }>
                  <div className={ bem('group')}>
                      {customFilter && (
                          <div>
                              <Toggle
                                  label={customFilter.label}
                                  id={'custom-filter'}
                                  onClick={this.customFilter}
                                  checked={customFilterChecked}
                              />
                          </div>
                      )}
                      {showNewToggle && (
                          <div>
                              <Toggle
                                  label={'New Players'}
                                  id={'new-filter'}
                                  onClick={this.showNew}
                                  checked={showNew}
                              />
                          </div>
                      )}
                      {showHiddenToggle && (
                          <div>
                              <Toggle
                                  label={'Hidden Players'}
                                  id={'hidden-filter'}
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
                                      label: 'Positions',
                                      options: positions.map((position) => ({ value: position, label: position, group: 'position' })),
                                  },
                                  {
                                      label: 'Clubs',
                                      options: clubs.map((club) => ({ value: club, label: club, group: 'club' })),
                                  },
                                  {
                                      label: 'Players',
                                      options: filteredPlayers.map(({ name }) => ({ value: name, label: name, group: 'player' })),
                                  },
                              ]}
                              isMulti
                              name={'playersFiltersOut'}
                              onChange={this.addFilter}
                          />
                      </div>
                  </div>
              </div>
              <div className={ bem('contents') }>
                  {this.props.children(this.onFilter())}
              </div>
          </div>
      );
  }
}
