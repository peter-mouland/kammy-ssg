import React from 'react';
import PropTypes from 'prop-types';

import DataListInput from './DataList';

const playerOptions = (players) => (
    players.map((player) => (
        {
            value: player.name,
            label: player.name,
            key: player.name,
            img: `${`https://fantasyfootball.skysports.com/assets/img/players/${player.code}.png`}`,
            additional: (
                <small>
                    {` ${player.pos}`}
                    {player.teamPos && player.pos !== player.teamPos ? ' (sub)' : null}
                    {player.isTransfer ? <em> (pending transfer request)</em> : null}
                    {player.manager ? <em> ({player.manager})</em> : null}
                </small>
            ),
        }
    ))
);

// eslint-disable-next-line react/prop-types
const NoPlayersMessage = ({ children = '' }) => (
    <div data-b-layout='col pad'><em><p><strong>wtf. no players?</strong></p><p>{children}</p></em></div>
);

class Players extends React.Component {
  shouldComponentUpdate = (nextProps) => (
      JSON.stringify(nextProps.playersArray) !== JSON.stringify(this.props.playersArray)
  )

  render() {
      const {
          onSelect, playersArray, emptyStateMessage,
      } = this.props;
      const items = playerOptions(playersArray);
      if (!items) return null;

      return (
          <div className='transfer-player__input'>
              <DataListInput
                  emptyStateMessage={<NoPlayersMessage>{emptyStateMessage}</NoPlayersMessage>}
                  placeholder={'Search by player name...'}
                  alwaysShowItems
                  items={items}
                  onSelect={onSelect}
              />
          </div>
      );
  }
}

Players.propTypes = {
    playersArray: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    emptyStateMessage: PropTypes.string,
};

Players.defaultProps = {
    emptyStateMessage: null,
    playersFilter: null,
};

export default Players;
