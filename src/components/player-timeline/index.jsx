import React from 'react';

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

            <div className={styles.gridTeamPos}>
                <Player.Pos position={player.positionId} />
            </div>

            <div className={styles.gridClub}>
                <Player.Club>{player.club}</Player.Club>
            </div>
            <div className={styles.gridName}>
                <Player.Name to={player.url}>{player.name}</Player.Name>
            </div>
            <div className={styles.gridNews}>
                <Player.News>{elementQuery.data?.news}</Player.News>
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

export const Tbody = ({ children }) => <tbody>{children}</tbody>;
export const Tfooter = ({ children }) => (
    <tfoot>
        <tr>{children}</tr>
    </tfoot>
);

export const HomeFixture = ({ fixture }) => (
    <div className={styles.home}>
        {fixture.homeGame ? <strong>{fixture.hTname}</strong> : fixture.hTname}{' '}
        <span style={{ color: 'grey' }}>{fixture.hScore}</span>
    </div>
);
export const AwayFixture = ({ fixture }) => (
    <div className={styles.away}>
        <span style={{ color: 'grey' }}>{fixture.aScore}</span>{' '}
        {!fixture.homeGame ? <strong>{fixture.aTname}</strong> : fixture.aTname}
    </div>
);

export const Table = ({ children }) => <table className={styles.table}>{children}</table>;
