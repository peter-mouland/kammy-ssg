import React from 'react';
import PropTypes from 'prop-types';

const PlayerPicker = ({ squad, pendingTransfers, handleChange, picked, playerNumber, ...props }) => (
    <select {...props} onChange={(e) => handleChange(e.target.value, playerNumber)}>
        <option> - </option>
        {squad.players.map(({ code, name }) => (
            <option key={code} disabled={picked.includes(code)}>
                {name}
            </option>
        ))}
        {pendingTransfers.length &&
            [
                <option disabled key="disabled-pending">
                    {' '}
                    - pending transfers -{' '}
                </option>,
            ].concat(
                pendingTransfers.map((player, i) => (
                    <option key={player.transferIn} disabled={picked.includes(player.transferIn)}>
                        {player.transferIn}
                    </option>
                )),
            )}
    </select>
);

PlayerPicker.propTypes = {
    squad: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string,
        }),
    ),
    playerNumber: PropTypes.number.isRequired,
    pendingTransfers: PropTypes.array,
    picked: PropTypes.array,
    handleChange: PropTypes.func.isRequired,
};

PlayerPicker.defaultProps = {
    picked: [],
    pendingTransfers: [],
};

export default PlayerPicker;
