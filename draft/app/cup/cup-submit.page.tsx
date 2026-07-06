/* Location: app/cup/cup-submit.page.tsx */

import { useState } from 'react';
import { Form, Link, useActionData, useLoaderData, useNavigation, useSearchParams } from 'react-router';
import { SelectUser } from '../_shared/components/select-user';
import { setUserSelection } from '../_shared/features/user-selection/user-selection.utils';
import styles from './cup-submit.module.css';
import { CUP_STAGES } from './lib/cup-rules';
import type { CupSubmitPageData } from './types/cup-page-types';

interface CupActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export function CupSubmitPage() {
    const data = useLoaderData<CupSubmitPageData>();
    const actionData = useActionData<CupActionData>();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [selected, setSelected] = useState<number[]>(data.existingPlayers);

    const required = data.round?.playersRequired ?? 0;
    const usedPlayers = new Set(data.usedPlayers);
    const isSubmitting = navigation.state === 'submitting';

    function toggle(code: number) {
        setSelected((current) => {
            if (current.includes(code)) return current.filter((c) => c !== code);
            if (current.length >= required) return current; // enforce the cap client-side
            return [...current, code];
        });
    }

    function handleUserChange(userId: string) {
        setUserSelection(userId, false);
        const next = new URLSearchParams(searchParams);
        next.set('userId', userId);
        setSearchParams(next);
    }

    const managerPicker = (
        <SelectUser users={data.userTeams} selectedUser={data.selectedUserId} handleUserChange={handleUserChange} />
    );

    function handleGameweekChange(gameweek: string) {
        const next = new URLSearchParams(searchParams);
        next.set('gameweek', gameweek);
        setSearchParams(next);
    }

    const gameweekPicker =
        data.gameweekOptions.length > 0 ? (
            <label className={styles.selector}>
                <span className={styles.label}>Round</span>
                <select
                    className={styles.select}
                    value={data.selectedGameweek}
                    onChange={(event) => handleGameweekChange(event.target.value)}
                >
                    {data.gameweekOptions.map((option) => (
                        <option key={option.gameweek} value={option.gameweek}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </label>
        ) : null;

    if (!data.selectedUserId) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Submit Cup Team</h1>
                <p className={styles.notice}>Pick your manager to load your squad:</p>
                {managerPicker}
                <Link to="/cup" className={styles.backLink}>
                    Back to cup
                </Link>
            </div>
        );
    }

    if (!data.hasConfig || !data.round) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Submit Cup Team</h1>
                <p className={styles.notice}>No cup round in that gameweek — pick a round to submit for:</p>
                <div className={styles.pickers}>
                    {gameweekPicker}
                    {managerPicker}
                </div>
                <Link to="/cup" className={styles.backLink}>
                    Back to cup
                </Link>
            </div>
        );
    }

    const stageLabel = CUP_STAGES[data.round.stage].label;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Submit Cup Team</h1>
                    <span className={styles.roundLabel}>
                        {stageLabel}
                        {data.round.twoLegged ? ` · Leg ${data.round.leg}` : ''}
                    </span>
                </div>
                <div className={styles.pickers}>
                    {gameweekPicker}
                    {managerPicker}
                </div>
            </div>

            <div className={styles.deadline}>
                <span className={styles.deadlineLabel}>Deadline:</span>
                <span className={styles.deadlineValue}>{data.deadline}</span>
                {data.submissionOpen ? (
                    <span className={styles.open}>✓ Open</span>
                ) : (
                    <span className={styles.closed}>✗ Closed</span>
                )}
            </div>

            {actionData?.error && <p className={styles.error}>{actionData.error}</p>}
            {actionData?.success && <p className={styles.success}>{actionData.message}</p>}

            <p className={styles.counter}>
                Selected {selected.length} / {required}
            </p>

            <Form method="post">
                <input type="hidden" name="manager" value={data.selectedUserId} />
                <input type="hidden" name="division" value={data.division ?? ''} />
                <input type="hidden" name="gameweek" value={data.round.gameweek} />
                <input type="hidden" name="players" value={selected.join(',')} />

                <div className={styles.squad}>
                    {data.squad.map((player) => {
                        const isUsed = usedPlayers.has(player.code);
                        const isChecked = selected.includes(player.code);
                        return (
                            <button
                                type="button"
                                key={player.code}
                                className={`${styles.player} ${isChecked ? styles.selected : ''} ${isUsed ? styles.used : ''}`}
                                disabled={isUsed || !data.submissionOpen}
                                onClick={() => toggle(player.code)}
                            >
                                <span className={styles.playerName}>{player.name}</span>
                                <span className={styles.playerPosition}>{player.position}</span>
                                {player.isPending && <span className={styles.pendingBadge}>pending</span>}
                                {isUsed && <span className={styles.usedBadge}>used in leg 1</span>}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="submit"
                    className={styles.submit}
                    disabled={isSubmitting || selected.length !== required || !data.submissionOpen}
                >
                    {isSubmitting ? 'Submitting…' : 'Submit team'}
                </button>
            </Form>

            <Link to="/cup" className={styles.backLink}>
                Back to cup
            </Link>
        </div>
    );
}

export default CupSubmitPage;
