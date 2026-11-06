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
                    Rules doc not configured. Set <code className={styles.code}>GOOGLE_RULES_DOC_PUB_ID</code> to the
                    published Google Doc ID.
                </p>
            )}
        </div>
    );
}
