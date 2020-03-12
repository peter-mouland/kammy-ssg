import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import FormattedGameWeekDate from '../gameweek-date';
import MultiToggle from '../multi-toggle';
import './gameweek-switcher.scss';

const bem = bemHelper({ block: 'game-week-switcher' });
const INITIAL_GW_COUNT = 4;

class GameweekSwitcher extends React.Component {
  state = {
    maxGameWeeks: INITIAL_GW_COUNT,
  }

  componentDidMount() {
    const { fetchGameWeeks, gameWeeksLoaded, gameWeeksLoading } = this.props;
    if (!gameWeeksLoaded && !gameWeeksLoading) fetchGameWeeks();
  }

  showAll = () => {
    const { maxGameWeeks } = this.state;
    const { gameWeeks } = this.props;
    this.setState({ maxGameWeeks: INITIAL_GW_COUNT === maxGameWeeks ? gameWeeks.length : INITIAL_GW_COUNT });
  }

  updateGameWeek = (intGameWeek) => {
    this.props.handleUpdate(intGameWeek);
  }

  render() {
    const { gameWeeks, currentGameWeek, selectedGameWeek } = this.props;
    const gameWeek = selectedGameWeek || currentGameWeek;
    const { maxGameWeeks } = this.state;
    const gwToInt = (gw) => parseInt(gw.gameWeek, 10);
    const limitedGameWeeks = [...gameWeeks].slice(0, currentGameWeek + 1 + 1).map(gwToInt);
    const options = limitedGameWeeks.length > maxGameWeeks
      ? limitedGameWeeks.slice(limitedGameWeeks.length - maxGameWeeks, currentGameWeek + 1 + 1)
      : limitedGameWeeks;
    const buttonText = maxGameWeeks === INITIAL_GW_COUNT ? 'Show all' : 'Hide';

    return (
      <section id="gameweek-switcher" className={bem()}>
        <MultiToggle
          label={'GameWeek'}
          id={'GameWeek'}
          checked={gameWeek}
          options={options}
          disabledOptions={[currentGameWeek + 1]}
          onChange={this.updateGameWeek}
          contextualHelp={(value) => (
            gameWeeks[value] && <FormattedGameWeekDate gameWeek={gameWeeks[value]}/>
          )}
        />
        {options.length > maxGameWeeks && <button onClick={this.showAll}>{buttonText}</button>}
      </section>
    );
  }
}

GameweekSwitcher.propTypes = {
  handleUpdate: PropTypes.func.isRequired,
  fetchGameWeeks: PropTypes.func.isRequired,
  currentGameWeek: PropTypes.number.isRequired,
  selectedGameWeek: PropTypes.number,
  gameWeeks: PropTypes.array,
  gameWeeksLoading: PropTypes.bool,
  gameWeeksLoaded: PropTypes.bool,
};

GameweekSwitcher.defaultProps = {
  selectedGameWeek: null,
  gameWeeksLoading: false,
  gameWeeksLoaded: false,
  gameWeeks: [],
  gameWeeksCount: null,
};

export default GameweekSwitcher;
