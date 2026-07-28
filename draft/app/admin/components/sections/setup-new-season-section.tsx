/* Location: app/admin/components/sections/setup-new-season-section.tsx */

import { Link } from 'react-router';
import * as Icons from '../icons/admin-icons';
import { AdminContainer } from '../layout/admin-container';
import { AdminSection } from '../layout/admin-section';
import styles from './setup-new-season-section.module.css';

const CLEAR_TABS = [
    { tab: 'Draft', action: 'Delete all pick rows (keep headers)' },
    { tab: 'DraftState', action: 'Reset to inactive: no current user/pick; clear start/end dates' },
    { tab: 'DraftOrder', action: "Clear or replace with the new season's draft order once known" },
    { tab: 'premierLeague-transfers', action: 'Delete all transfer rows' },
    { tab: 'championship-transfers', action: 'Delete all transfer rows' },
    { tab: 'leagueOne-transfers', action: 'Delete all transfer rows' },
    { tab: 'Cup', action: 'Delete all submission rows' },
    { tab: 'CupBracket', action: 'Delete all bracket rows' },
    { tab: 'player-gw-points', action: 'Delete all data rows' },
] as const;

const UPDATE_TABS = [
    { tab: 'Divisions', action: 'Confirm the three divisions are correct (rarely needs change)' },
    {
        tab: 'UserTeams',
        action: 'Apply promotion/relegation; add/remove managers; fix team names, user IDs, division assignments',
    },
    {
        tab: 'Players',
        action: 'Refresh the draft pool for the new PL season (codes, positions, hidden flags). Re-apply new flags as needed',
    },
    {
        tab: 'CupConfig',
        action: 'Update season (e.g. 2627) and gameweek mappings for league / knockout stages when known',
    },
] as const;

export function SetupNewSeasonSection() {
    return (
        <AdminContainer>
            <AdminSection
                title="Setup New Season"
                icon={<Icons.CalendarIcon />}
                description="Step-by-step checklist to roll the site into a new season. Follow these steps in order."
            >
                <div className={styles.container}>
                    <div className={styles.warningBox}>
                        <div className={styles.warningHeader}>
                            <Icons.AlertIcon />
                            <span>Policy</span>
                        </div>
                        <ul className={styles.policyList}>
                            <li className={styles.policyItem}>
                                <strong>Reuse the same live Google Sheet</strong> for the website. Do not change{' '}
                                <span className={styles.tableCode}>GOOGLE_SHEETS_ID</span> or redeploy for a new
                                spreadsheet.
                            </li>
                            <li className={styles.policyItem}>
                                <strong>Clone the sheet first</strong> as a historic archive (put the season in that
                                copy's title, e.g. Draft FF 25/26).
                            </li>
                            <li className={styles.policyItem}>
                                <strong>Do not rename tabs</strong> (Draft, UserTeams, premierLeague-transfers, etc.) —
                                those names are required by the app.
                            </li>
                        </ul>
                        <p className={styles.warningText}>
                            Rosters are rebuilt from draft picks + transfers into Firebase/Firestore. Old Firebase data
                            is not cleared by cloning the sheet — a database/cache reset is still required.
                        </p>
                    </div>

                    <div className={styles.steps}>
                        <div className={styles.step}>
                            <div className={styles.stepNumber}>1</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Archive last season</h3>
                                <ol className={styles.stepList}>
                                    <li className={styles.stepListItem}>Open the live Google Sheet.</li>
                                    <li className={styles.stepListItem}>
                                        <strong>File → Make a copy</strong>.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Name the copy with the season, e.g. Draft FF 25/26 (archive).
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Leave that copy alone — it is the historic record. Do not point the website at
                                        it.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>2</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Clear transactional data on the live sheet</h3>
                                <p className={styles.stepDescription}>
                                    Delete <strong>data rows</strong> on these tabs.{' '}
                                    <strong>Keep the header row</strong> on each.
                                </p>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.tableHeaderCell}>Tab</th>
                                                <th className={styles.tableHeaderCell}>What to do</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {CLEAR_TABS.map((row) => (
                                                <tr key={row.tab}>
                                                    <td className={styles.tableCell}>
                                                        <span className={styles.tableCode}>{row.tab}</span>
                                                    </td>
                                                    <td className={styles.tableCell}>{row.action}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={styles.stepNote}>
                                    Leftover approved transfers or draft picks will be applied when the new season
                                    rebuilds team docs. A missed clear here is the main way a reused sheet corrupts the
                                    new season.
                                </div>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>3</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Update league / player setup</h3>
                                <p className={styles.stepDescription}>
                                    These tabs are usually <strong>edited</strong>, not emptied.
                                </p>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th className={styles.tableHeaderCell}>Tab</th>
                                                <th className={styles.tableHeaderCell}>What to do</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {UPDATE_TABS.map((row) => (
                                                <tr key={row.tab}>
                                                    <td className={styles.tableCell}>
                                                        <span className={styles.tableCode}>{row.tab}</span>
                                                    </td>
                                                    <td className={styles.tableCell}>{row.action}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>4</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Reset Firebase / Firestore + caches</h3>
                                <p className={styles.stepDescription}>
                                    Old gameweek team docs are not keyed by season. Clear them even though the Google
                                    Sheet ID is unchanged.
                                </p>
                                <ol className={styles.stepList}>
                                    <li className={styles.stepListItem}>
                                        Go to{' '}
                                        <Link className={styles.inlineLink} to="/admin/settings">
                                            Cache + Data
                                        </Link>
                                        .
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Click <strong>Reset Database</strong> and confirm when prompted.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Click <strong>Invalidate All Caches</strong>.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Go to{' '}
                                        <Link className={styles.inlineLink} to="/admin/draft">
                                            Draft Management
                                        </Link>{' '}
                                        and click <strong>Sync</strong> for each division so Firebase matches the
                                        cleared sheets.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Confirm draft status looks empty / inactive before starting anything.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>5</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Run the new season draft</h3>
                                <ol className={styles.stepList}>
                                    <li className={styles.stepListItem}>
                                        Confirm <span className={styles.tableCode}>DraftOrder</span> is correct for each
                                        division.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        <strong>Start Draft</strong> per division from{' '}
                                        <Link className={styles.inlineLink} to="/admin/draft">
                                            Draft Management
                                        </Link>
                                        .
                                    </li>
                                    <li className={styles.stepListItem}>Run the draft as usual.</li>
                                    <li className={styles.stepListItem}>
                                        After a division completes, <strong>commit teams</strong> to Firestore if
                                        auto-commit did not run.
                                    </li>
                                    <li className={styles.stepListItem}>
                                        Invalidate caches once more if the site still shows stale draft/team data.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className={styles.step}>
                            <div className={styles.stepNumber}>6</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>Smoke checks before going live</h3>
                                <ul className={styles.checklist}>
                                    <li className={styles.checklistItem}>
                                        Archive copy exists and is clearly named with the old season
                                    </li>
                                    <li className={styles.checklistItem}>
                                        Spreadsheet URL/ID unchanged (still the live sheet, not the archive)
                                    </li>
                                    <li className={styles.checklistItem}>Transfer tabs are empty (headers only)</li>
                                    <li className={styles.checklistItem}>
                                        Draft empty; DraftState inactive until you start
                                    </li>
                                    <li className={styles.checklistItem}>
                                        UserTeams divisions match promotion/relegation
                                    </li>
                                    <li className={styles.checklistItem}>
                                        Players list looks right for the new PL season
                                    </li>
                                    <li className={styles.checklistItem}>
                                        Admin system health can talk to Google Sheets
                                    </li>
                                    <li className={styles.checklistItem}>
                                        No last-season standings / rosters visible after cache reset
                                    </li>
                                    <li className={styles.checklistItem}>
                                        Draft start works for one division in a dry run if needed
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className={styles.successBox}>
                        <div className={styles.successHeader}>
                            <Icons.CheckIcon />
                            <span>What you do not need to do</span>
                        </div>
                        <ul className={styles.avoidList}>
                            <li className={styles.avoidItem}>Create a brand-new Google Sheet for the website</li>
                            <li className={styles.avoidItem}>
                                Change <span className={styles.tableCode}>GOOGLE_SHEETS_ID</span> in env, Firebase, or
                                GitHub secrets
                            </li>
                            <li className={styles.avoidItem}>Redeploy solely because of a season rollover</li>
                            <li className={styles.avoidItem}>
                                Re-share the sheet with the service account (same file keeps existing access)
                            </li>
                            <li className={styles.avoidItem}>Rename any tabs</li>
                        </ul>
                    </div>
                </div>
            </AdminSection>

            <AdminSection
                title="If something looks wrong"
                icon={<Icons.AlertIcon />}
                description="Quick recovery checks when last-season data still appears."
            >
                <ol className={styles.stepList}>
                    <li className={styles.stepListItem}>
                        Confirm you're editing the <strong>live</strong> sheet, not the archive copy.
                    </li>
                    <li className={styles.stepListItem}>Re-check transfer / draft tabs for leftover rows.</li>
                    <li className={styles.stepListItem}>
                        <Link className={styles.inlineLink} to="/admin/settings">
                            Cache + Data
                        </Link>{' '}
                        → <strong>Invalidate All Caches</strong>.
                    </li>
                    <li className={styles.stepListItem}>
                        <Link className={styles.inlineLink} to="/admin/draft">
                            Draft Management
                        </Link>{' '}
                        → <strong>Sync</strong> for the affected division.
                    </li>
                    <li className={styles.stepListItem}>
                        If team pages still show last season, confirm <strong>Reset Database</strong> was run —
                        sheet-only clears are not enough.
                    </li>
                </ol>
            </AdminSection>
        </AdminContainer>
    );
}
