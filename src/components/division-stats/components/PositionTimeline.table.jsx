import React from 'react';
import PropTypes from 'prop-types';
import bemHelper from '@kammy-ui/bem';

import { StatsHeaders, StatsCells } from './tableHelpers';
import './positionTimeline.scss';

const bem = bemHelper({ block: 'position-timeline' });

const PositionTimelineTable = ({ gameWeeks, season }) => (
  <table className={'table'}>
    <thead>
      <tr>
        <th className={'cell'} colSpan={5} />
        <StatsHeaders colspan={1} />
      </tr>
    </thead>
    <tbody>
      {
        gameWeeks.map((gameWeek, gw) => (
          gameWeek.gameWeekFixtures.map((fixture, i) => (
            <tr key={`${fixture.event}`}>
              <th>{i === 0 && gw}</th>
              <td>{gameWeek.name}</td>
              <td className={bem('team', {
                home: true,
                'my-team': gameWeek.club === fixture.hTname,
              })}>{fixture.hTname} {fixture.hScore}</td>
              <td>vs</td>
              <td className={bem('team', {
                away: true,
                'my-team': gameWeek.club === fixture.aTname,
              })}>{fixture.aScore} {fixture.aTname}</td>
              <StatsCells seasonToGameWeek={fixture.stats} />
            </tr>
          ))
        ))
      }
    </tbody>
    {season && (
      <tfoot>
        <tr>
          <th colSpan={5} />
          <StatsCells seasonToGameWeek={season} />
        </tr>
      </tfoot>
    )}
  </table>
);

PositionTimelineTable.propTypes = {
  season: PropTypes.object.isRequired,
  gameWeeks: PropTypes.array.isRequired,
};

export default PositionTimelineTable;
