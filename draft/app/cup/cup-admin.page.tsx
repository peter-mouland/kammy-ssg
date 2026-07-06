/* Location: app/cup/cup-admin.page.tsx */

import { Form, useActionData, useLoaderData, useNavigation } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import styles from './cup-admin.module.css';
import type { CupAdminPageData } from './types/cup-page-types';

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

                {data.bracket.length > 0 && (
                    <ul className={styles.bracket}>
                        {data.bracket.map((matchup) => (
                            <li key={`${matchup.stage}-${matchup.tie}`} className={styles.tie}>
                                <span>{matchup.home ?? 'TBC'}</span>
                                <span className={styles.vs}>v</span>
                                <span>{matchup.away ?? 'BYE'}</span>
                                {matchup.winner && <span className={styles.winner}>→ {matchup.winner}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default CupAdminPage;
