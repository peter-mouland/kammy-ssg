/* Location: app/cup/cup-admin.page.tsx */

import { Form, useActionData, useLoaderData, useNavigation } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import styles from './cup-admin.module.css';
import { nextKnockoutStage } from './lib/knockout';
import type { CupAdminPageData } from './types/cup-page-types';
import type { CupStageId } from './types/cup-types';

interface CupAdminActionData {
    success?: boolean;
    error?: string;
    message?: string;
}

export function CupAdminPage() {
    const data = useLoaderData<CupAdminPageData>();
    const actionData = useActionData<CupAdminActionData>();
    const navigation = useNavigation();
    const config = data.config;
    const isBusy = navigation.state !== 'idle';

    // Stages with every tie resolved that feed a next round.
    const tiesByStage = new Map<CupStageId, { total: number; resolved: number; next: CupStageId }>();
    for (const matchup of data.bracket) {
        const next = nextKnockoutStage(matchup.stage);
        if (!next) continue;
        const entry = tiesByStage.get(matchup.stage) ?? { total: 0, resolved: 0, next };
        entry.total += 1;
        if (matchup.winner) entry.resolved += 1;
        tiesByStage.set(matchup.stage, entry);
    }
    const stagesReady = [...tiesByStage].filter(([, entry]) => entry.total > 0 && entry.total === entry.resolved);

    return (
        <div className={styles.page}>
            <PageHeader title="Cup Admin" />

            {actionData?.error && <p className={styles.error}>{actionData.error}</p>}
            {actionData?.success && <p className={styles.success}>{actionData.message}</p>}

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Stage gameweeks</h2>
                <p className={styles.hint}>
                    Map each cup stage to its FPL gameweek(s). These drive every deadline, submission window and score
                    across the cup. Enter comma-separated gameweeks for the league stage and each two-leg round.
                </p>
                <Form method="post" className={styles.form}>
                    <input type="hidden" name="actionType" value="setConfig" />
                    <label className={styles.field}>
                        <span className={styles.label}>Season</span>
                        <input className={styles.input} name="season" defaultValue={config?.season ?? ''} />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>League gameweeks</span>
                        <input className={styles.input} name="league" defaultValue={config?.league.join(',') ?? ''} />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>Round of 16 (leg 1, leg 2)</span>
                        <input className={styles.input} name="r16" defaultValue={config?.r16.join(',') ?? ''} />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>Quarter final (leg 1, leg 2)</span>
                        <input className={styles.input} name="qf" defaultValue={config?.qf.join(',') ?? ''} />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>Semi final (leg 1, leg 2)</span>
                        <input className={styles.input} name="sf" defaultValue={config?.sf.join(',') ?? ''} />
                    </label>
                    <label className={styles.field}>
                        <span className={styles.label}>Final gameweek</span>
                        <input
                            className={styles.input}
                            name="final"
                            defaultValue={config ? String(config.final) : ''}
                        />
                    </label>
                    <button type="submit" className={styles.button} disabled={isBusy}>
                        Save gameweeks
                    </button>
                </Form>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Round of 16 draw</h2>
                <p className={styles.hint}>
                    {data.qualifiers.length} qualifier{data.qualifiers.length === 1 ? '' : 's'} so far. Generating the
                    draw randomly pairs the top 16 and overwrites any existing bracket.
                </p>
                <Form method="post">
                    <input type="hidden" name="actionType" value="generateDraw" />
                    <button type="submit" className={styles.button} disabled={isBusy || data.qualifiers.length < 2}>
                        Generate R16 draw
                    </button>
                </Form>

                {stagesReady.length > 0 && (
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Advance winners</h2>
                        {stagesReady.map(([stage, entry]) => (
                            <Form method="post" key={stage}>
                                <input type="hidden" name="actionType" value="advanceRound" />
                                <input type="hidden" name="stage" value={stage} />
                                <button type="submit" className={styles.button} disabled={isBusy}>
                                    Advance {stage} winners to {entry.next}
                                </button>
                            </Form>
                        ))}
                    </section>
                )}

                {data.bracket.length > 0 && (
                    <ul className={styles.bracket}>
                        {data.bracket.map((matchup) => (
                            <li key={`${matchup.stage}-${matchup.tie}`} className={styles.tie}>
                                <span>{matchup.home ?? 'TBC'}</span>
                                <span className={styles.vs}>v</span>
                                <span>{matchup.away ?? 'BYE'}</span>
                                {matchup.winner && <span className={styles.winner}>→ {matchup.winner}</span>}
                                <Form method="post">
                                    <input type="hidden" name="actionType" value="resolveTie" />
                                    <input type="hidden" name="stage" value={matchup.stage} />
                                    <input type="hidden" name="tie" value={matchup.tie} />
                                    <button type="submit" className={styles.button} disabled={isBusy}>
                                        Resolve
                                    </button>
                                </Form>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default CupAdminPage;
