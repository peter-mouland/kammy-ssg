/* Location: app/cup/cup-submit.page.tsx */

import { useState } from 'react';
import { Form, Link, useActionData, useLoaderData, useNavigation } from 'react-router';
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

    if (!data.selectedUserId) {
        return (
            <div className={styles.page}>
                <h1 className={styles.title}>Submit Cup Team</h1>
                <p className={styles.notice}>Pick your manager from the menu first, then come back to submit.</p>
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
                <p className={styles.notice}>There's no cup round open this gameweek.</p>
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
                <h1 className={styles.title}>Submit Cup Team</h1>
                <span className={styles.roundLabel}>
                    {stageLabel}
                    {data.round.twoLegged ? ` · Leg ${data.round.leg}` : ''}
                </span>
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
