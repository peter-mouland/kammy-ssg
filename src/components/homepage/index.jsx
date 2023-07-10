import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy/bem';

import DivisionRankings from '../division-rankings';
import './styles.css';
import Spacer from '../spacer';
import NamedLink from '../named-link';

const bem = bemHelper({ block: 'home-page' });

const Homepage = ({ gameWeekDates, divisions, statsByDivision }) => {
    if (!gameWeekDates) return null;
    return (
        <section id="home-page" className={bem()}>
            {divisions.map(({ label, key }) => (
                <div data-b-layout="container" key={key}>
                    <Spacer all={{ bottom: Spacer.spacings.SMALL }}>
                        <h2>
                            <NamedLink to={`${key}-rankings`}>{label}</NamedLink>
                        </h2>
                    </Spacer>
                    <DivisionRankings
                        key={key}
                        stats={statsByDivision[key]}
                        showGameWeekSwitcher={false}
                        showWeekly={false}
                    />
                </div>
            ))}
        </section>
    );
};

Homepage.propTypes = {
    gameWeekDates: PropTypes.object,
    statsByDivision: PropTypes.object,
    divisions: PropTypes.array,
};

Homepage.defaultProps = {
    statsByDivision: {},
    divisions: [],
    gameWeekDates: null,
};

export default Homepage;
