import * as React from 'react'
import cx from 'classnames';

import { useElements } from '../../hooks/use-fpl';
import * as Player from '../player';
import * as styles from './index.module.css';

export const PlayerHeader = ({ player }) => {
    const elementQuery = useElements(player.code);
    return (
        <div className={styles.player}>
            <div className={styles.gridImage}>
                <Player.Image code={player.code} large liveQuery={elementQuery} />
            </div>

            <div className={styles.gridSquadPos}>
                <Player.Pos position={player.position} />
            </div>

            <div className={styles.gridClub}>
                <Player.Club>{player.club}</Player.Club>
            </div>
            <div className={styles.gridName}>
                <Player.Name to={player.url}>
                    {player.rawData.first_name} {player.rawData.second_name}
                </Player.Name>
            </div>
            <div className={styles.gridNews}>
                <Player.News>{elementQuery.data?.news}</Player.News>
            </div>
            <div className={cx(styles.gridStats, styles.stats)}>
                <div style={{ gridArea: 'form' }} className={styles.statsLabel}>
                    FPL Form
                </div>
                <div style={{ gridArea: 'formStats' }} className={styles.statsValue}>
                    <span>{player.rawData.form}</span>
                    <small className={styles.small}>{player.rawData.form_rank}</small>
                </div>
                <div style={{ gridArea: 'creativity' }} className={styles.statsLabel}>
                    Creativity
                </div>
                <div style={{ gridArea: 'creativityStats' }} className={styles.statsValue}>
                    <span>{Math.floor(player.rawData.creativity)}</span>
                    <small className={styles.small}>{player.rawData.creativity_rank}</small>
                </div>
                <div style={{ gridArea: 'influence' }} className={styles.statsLabel}>
                    Influence
                </div>
                <div style={{ gridArea: 'influenceStats' }} className={styles.statsValue}>
                    <span>{Math.floor(player.rawData.influence)}</span>
                    <small className={styles.small}>{player.rawData.influence_rank}</small>
                </div>
                <div style={{ gridArea: 'setPlays' }} className={styles.statsLabel}>
                    Set Play Order
                </div>
                <div style={{ gridArea: 'setPlaysStats' }} className={styles.statsValue}>
                    {player.rawData.corners_and_indirect_freekicks_order}
                </div>
            </div>
        </div>
    );
};

export const Thead = ({ children }) => (
    <thead>
        <tr>{children}</tr>
    </thead>
);

export const Th = ({ colspan, children }) => (
    <th className={styles.cell} colSpan={colspan}>
        {children}
    </th>
);
export const Td = ({ colspan, children }) => (
    <td className={styles.cell} colSpan={colspan}>
        {children}
    </td>
);

export const Tr = ({ children, light }) => <tr className={light ? styles.light : ''}>{children}</tr>;

export const Tbody = ({ children }) => <tbody>{children}</tbody>;
export const Tfooter = ({ children }) => (
    <tfoot>
        <tr>{children}</tr>
    </tfoot>
);

export const HomeFixture = ({ fixture }) => (
    <div className={styles.home}>
        {fixture.homeGame ? <strong>{fixture.homeTeam.name}</strong> : fixture.homeTeam.name}{' '}
        <span style={{ color: 'grey' }}>{fixture.team_h_score}</span>
    </div>
);
export const AwayFixture = ({ fixture }) => (
    <div className={styles.away}>
        <span style={{ color: 'grey' }}>{fixture.team_a_score}</span>{' '}
        {!fixture.homeGame ? <strong>{fixture.awayTeam.name}</strong> : fixture.awayTeam.name}
    </div>
);

export const Table = ({ children }) => <table className={styles.table}>{children}</table>;
