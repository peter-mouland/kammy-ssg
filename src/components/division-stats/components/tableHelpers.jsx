import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

export const StatsHeaders = ({ colspan }) => (
  <Fragment>
    <th className={'cell cell--points'} colSpan={colspan}>Points</th>
    <th className={'cell cell--apps show-450'} colSpan={colspan}>Apps</th>
    <th className={'cell cell--subs show-550'} colSpan={colspan}>Subs</th>
    <th className={'cell cell--gls'} colSpan={colspan}>Gls</th>
    <th className={'cell cell--asts'} colSpan={colspan}>Asts</th>
    <th className={'cell cell--cs show-550'} colSpan={colspan}>Cs</th>
    <th className={'cell cell--con'} colSpan={colspan}>Con</th>
    <th className={'cell cell--pensv show-550'} colSpan={colspan}>Pen-svd</th>
    <th className={'cell cell--ycard show-625'} colSpan={colspan}>Y card</th>
    <th className={'cell cell--rcard show-625'} colSpan={colspan}>R card</th>
    <th className={'cell cell--rcard hide-625'} colSpan={colspan}>Cards</th>
    <th className={'cell cell--tb show-625'} colSpan={colspan}>Tb</th>
    <th className={'cell cell--sb show-625'} colSpan={colspan}>Sb</th>
    <th className={'cell cell--sb hide-625'} colSpan={colspan}>b</th>
  </Fragment>
);

StatsHeaders.propTypes = {
  colspan: PropTypes.number,
};

StatsHeaders.defaultProps = {
  colspan: 2,
};

export const StatsCells = ({ seasonToGameWeek, gameWeekStats }) => (
  <Fragment>
    {seasonToGameWeek && <td className={'cell cell--points'}>{seasonToGameWeek.points}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--points'}>{gameWeekStats.points}</td>}
    {seasonToGameWeek && <td className={'cell cell--apps show-450'}>{seasonToGameWeek.apps}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--apps show-450'}>{gameWeekStats.apps}</td>}
    {seasonToGameWeek && <td className={'cell cell--subs show-550'}>{seasonToGameWeek.subs}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--subs show-550'}>{gameWeekStats.subs}</td>}
    {seasonToGameWeek && <td className={'cell cell--gls'}>{seasonToGameWeek.gls}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--gls'}>{gameWeekStats.gls}</td>}
    {seasonToGameWeek && <td className={'cell cell--asts'}>{seasonToGameWeek.asts}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--asts'}>{gameWeekStats.asts}</td>}
    {seasonToGameWeek && <td className={'cell cell--cs show-550'}>{seasonToGameWeek.cs}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--cs show-550'}>{gameWeekStats.cs}</td>}
    {seasonToGameWeek && <td className={'cell cell--con'}>{seasonToGameWeek.con}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--con'}>{gameWeekStats.con}</td>}
    {seasonToGameWeek && <td className={'cell cell--pensv show-550'}>{seasonToGameWeek.pensv}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--pensv show-550'}>{gameWeekStats.pensv}</td>}
    {seasonToGameWeek && <td className={'cell cell--ycard show-625'}>{seasonToGameWeek.ycard}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--ycard show-625'}>{gameWeekStats.ycard}</td>}
    {seasonToGameWeek && <td className={'cell cell--rcard show-625'}>{seasonToGameWeek.rcard}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--rcard show-625'}>{gameWeekStats.rcard}</td>}
    {seasonToGameWeek && <td className={'cell cell--card hide-625'}>{seasonToGameWeek.ycard + seasonToGameWeek.rcard}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--card hide-625'}>{gameWeekStats.ycard + gameWeekStats.rcard}</td>}
    {seasonToGameWeek && <td className={'cell cell--tb show-625'}>{seasonToGameWeek.tb}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--tb show-625'}>{gameWeekStats.tb}</td>}
    {seasonToGameWeek && <td className={'cell cell--sb show-625'}>{seasonToGameWeek.sb}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--sb show-625'}>{gameWeekStats.sb}</td>}
    {seasonToGameWeek && <td className={'cell cell--sb hide-625'}>{seasonToGameWeek.sb + seasonToGameWeek.tb}</td>}
    {gameWeekStats && <td className={'cell cell--pair cell--sb hide-625'}>{gameWeekStats.sb + gameWeekStats.tb}</td>}
  </Fragment>
);

StatsCells.propTypes = {
  seasonToGameWeek: PropTypes.object,
  gameWeekStats: PropTypes.object,
};

StatsCells.defaultProps = {
  seasonToGameWeek: null,
  gameWeekStats: null,
};
