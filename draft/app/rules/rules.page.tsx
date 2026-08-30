/* Location: app/rules/rules.page.tsx */

import { Link, useLoaderData } from 'react-router';
import { PageHeader } from '../_shared/components/page-header';
import styles from './rules.module.css';
import type { RulesLoaderData, RulesView } from './rules.route';

function ViewToggle({ view }: { view: RulesView }) {
    return (
        <div className={styles.viewToggle} role="tablist" aria-label="Rules display mode">
            <Link
                to="/rules?view=embed"
                role="tab"
                aria-selected={view === 'embed'}
                className={`${styles.viewTab} ${view === 'embed' ? styles.active : ''}`}
            >
                Embed
            </Link>
            <Link
                to="/rules?view=native"
                role="tab"
                aria-selected={view === 'native'}
                className={`${styles.viewTab} ${view === 'native' ? styles.active : ''}`}
            >
                Native
            </Link>
        </div>
    );
}

export function RulesPage() {
    const data = useLoaderData<RulesLoaderData>();

    return (
        <div className={styles.page}>
            <PageHeader
                title="Rules"
                subTitle="League rulebook (spike: compare Embed vs Native rendering)"
                actions={<ViewToggle view={data.view} />}
            />

            {data.pubId ? (
                <>
                    {data.pubUrl ? (
                        <p className={styles.openLinkRow}>
                            <a className={styles.openLink} href={data.pubUrl} target="_blank" rel="noopener noreferrer">
                                Open in Google Docs
                            </a>
                        </p>
                    ) : null}

                    {data.view === 'embed' && data.embedUrl ? (
                        <div className={styles.embedFrame}>
                            <iframe className={styles.iframe} src={data.embedUrl} title="League rules" />
                        </div>
                    ) : null}

                    {data.view === 'native' ? (
                        data.nativeError ? (
                            <p className={styles.error}>{data.nativeError}</p>
                        ) : data.nativeHtml ? (
                            <div
                                className={styles.nativeContent}
                                // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted published Google Doc HTML; scripts stripped server-side
                                // biome-ignore lint/style/useNamingConvention: __html is the required React API for dangerouslySetInnerHTML
                                dangerouslySetInnerHTML={{ __html: data.nativeHtml }}
                            />
                        ) : (
                            <p className={styles.notice}>No rules content available.</p>
                        )
                    ) : null}
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
