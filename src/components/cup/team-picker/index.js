import React from 'react';
import PropTypes from 'prop-types';
import '@kammy/bootstrap';

import Spacer from '../../spacer';
import Button from '../../button';
import PlayerPicker from '../player-picker';

const TeamPicker = ({ team, pendingTransfers, manager, handleChange, handleSubmit, picked, isSaving }) => (
    <section>
        {[1, 2, 3, 4].map((index) => {
            const id = `manager-${manager}-player-${index}`;
            return (
                <div key={id}>
                    <label htmlFor={id}>
                        <span>Player {index}: </span>
                        <PlayerPicker
                            playerNumber={index - 1}
                            pendingTransfers={pendingTransfers}
                            picked={picked}
                            id={id}
                            team={team}
                            handleChange={handleChange}
                        />
                    </label>
                </div>
            );
        })}
        <div>
            <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                <strong>Important</strong>: The order in which you pick your players matters!
            </Spacer>
            <Spacer all={{ vertical: Spacer.spacings.MEDIUM }}>
                In the event of tied scores, Player 1&apos;s score will be used as a tie break. If that fails to
                separate teams, Player 2&apos;s score will be used... and so on until there is a clear winner.
            </Spacer>
            <Button onClick={handleSubmit} isLoading={isSaving} isDisabled={isSaving}>
                Save Cup Team
            </Button>
        </div>
    </section>
);

TeamPicker.propTypes = {
    manager: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    team: PropTypes.arrayOf(
        PropTypes.shape({
            playerName: PropTypes.string.isRequired,
        }),
    ).isRequired,
    isSaving: PropTypes.bool,
    picked: PropTypes.array,
    pendingTransfers: PropTypes.array,
};

TeamPicker.defaultProps = {
    isSaving: false,
    picked: [],
    pendingTransfers: [],
};

export default TeamPicker;
