import React from 'react';

import styles from '../division-teams/styles.module.css';
import usePlayers from '../../hooks/use-players';

const onShowPositionTimeline = () => {};
const onShowPlayerTimeline = () => {};

const Player = ({ teamPos, name }) => {
    const { playersByName } = usePlayers();
    const player = playersByName[name] || {};
    const img = `https://fantasyfootball.skysports.com/assets/img/players/${player.code}.png`;
    const { pos, club } = player
    return (
        <div className={styles.player}>
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    onShowPositionTimeline({
                        position: pos,
                        gameWeeks: player.gameWeeks,
                        season: player.seasonStats,
                    });
                }}
                title={`Show ${teamPos} timeline`}
                className={styles.playerPosition}
            >
                {pos === teamPos || !teamPos ? (
                    <div>{pos}</div>
                ) : (
                    <div>
                        {teamPos}
                        <div>
                            <small> ({pos.toLowerCase()})</small>
                        </div>
                    </div>
                )}
            </a>
            <div className={styles.playerImage}>
                <img src={img} loading="lazy" alt="" />
            </div>
            <div className={styles.playerName}>
                {/*<a*/}
                {/*    href="#"*/}
                {/*    onClick={(e) => {*/}
                {/*        e.preventDefault();*/}
                {/*        onShowPlayerTimeline({ player });*/}
                {/*    }}*/}
                {/*    title={`Show ${teamPos} timeline`}*/}
                {/*>*/}
                    <p>
                        <span className="show-625">{name}</span>
                        <span className="hide-625">{name.split(',')[0]}</span>
                    </p>
                {/*</a>*/}
                <div className={styles.playerClub}>
                    <span className="show-550">{club}</span>
                    <span className="hide-550">
                    {club.split(' ')[0]} {(club.split(' ')[1] || '').charAt(0)}
                </span>
                </div>
            </div>
        </div>
    );
}

export default Player;
