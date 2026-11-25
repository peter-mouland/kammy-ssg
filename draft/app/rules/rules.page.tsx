/* Location: app/rules/rules.page.tsx */

import { useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import styles from './rules.module.css';
import type { RulesLoaderData } from './rules.route';

export function RulesPage() {
    const data = useLoaderData<RulesLoaderData>();

    return (
        <div className={styles.page}>
            <PageHeader title="Rules" />

            {data.pubId && data.embedUrl ? (
                <>
                    {data.pubUrl ? (
                        <p className={styles.openLinkRow}>
                            <a className={styles.openLink} href={data.pubUrl} target="_blank" rel="noopener noreferrer">
                                Open in Google Docs
                            </a>
                        </p>
                    ) : null}

                    <div className={styles.embedFrame}>
                        <iframe className={styles.iframe} src={data.embedUrl} title="League rules" />
                    </div>
                </>
            ) : (
                <p className={styles.notice}>
                    Rules doc not configured. In the league spreadsheet, add a{' '}
                    <code className={styles.code}>Rules Settings</code> tab with a{' '}
                    <code className={styles.code}>rulesDocPubId</code> row set to the published Google Doc ID.
                </p>
            )}
        </div>
    );
}
