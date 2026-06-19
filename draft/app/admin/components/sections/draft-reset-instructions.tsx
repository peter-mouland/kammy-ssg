// app/admin/components/sections/draft-reset-instructions.tsx

import * as Icons from '../icons/admin-icons';
import { AdminSection } from '../layout/admin-section';
import styles from './draft-reset-instructions.module.css';

export const DraftResetInstructions = () => {
    return (
        <AdminSection
            title="🔄 How to Reset Draft"
            icon={<Icons.AlertIcon />}
            description="Complete procedure to reset a draft from scratch. Follow these steps in order."
        >
            <div className={styles.container}>
                <div className={styles.warningBox}>
                    <div className={styles.warningHeader}>
                        <Icons.AlertIcon />
                        <span>⚠️ Complete Draft Reset Procedure</span>
                    </div>
                    <p className={styles.warningText}>
                        Use this procedure when you need to completely restart a draft. This will clear all picks and reset the draft state.
                    </p>
                </div>

                <div className={styles.stepsContainer}>
                    <div className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Clear Google Sheets Data</h3>
                            <p className={styles.stepDescription}>
                                Manually update the Google Sheets to reset the draft state:
                            </p>
                            <ul className={styles.stepList}>
                                <li>
                                    <strong>DraftState sheet:</strong> Set "active: false" with no start/end dates and no current user
                                </li>
                                <li>
                                    <strong>Draft sheet:</strong> Delete all player rows (keep headers)
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Invalidate Caches</h3>
                            <p className={styles.stepDescription}>
                                Go to <strong>Cache + Data</strong> section and click <strong>"Invalidate All Caches"</strong>
                            </p>
                            <div className={styles.stepNote}>
                                This ensures the system picks up the fresh Google Sheets data
                            </div>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Sync Draft Status</h3>
                            <p className={styles.stepDescription}>
                                In the <strong>Firebase ↔ Sheets Sync Status</strong> section above, click <strong>"Sync"</strong> for the relevant division
                            </p>
                            <div className={styles.stepNote}>
                                This synchronizes Firebase with the cleared Google Sheets data
                            </div>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>4</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Start Fresh Draft</h3>
                            <p className={styles.stepDescription}>
                                Click <strong>"🟢️ Start Draft"</strong> button for the division you want to restart
                            </p>
                            <div className={styles.stepNote}>
                                This will initialize a new draft with pick #1
                            </div>
                        </div>
                    </div>

                    <div className={styles.step}>
                        <div className={styles.stepNumber}>5</div>
                        <div className={styles.stepContent}>
                            <h3 className={styles.stepTitle}>Final Cache Invalidation</h3>
                            <p className={styles.stepDescription}>
                                Go to <strong>Cache + Data</strong> section again and click <strong>"Invalidate All Caches"</strong> one more time
                            </p>
                            <div className={styles.stepNote}>
                                This ensures all users see the fresh draft state immediately
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.successBox}>
                    <div className={styles.successHeader}>
                        <Icons.CheckIcon />
                        <span>✅ Draft Reset Complete</span>
                    </div>
                    <p className={styles.successText}>
                        The draft should now be reset and ready for a fresh start. All users will see the new draft state within 30 seconds.
                    </p>
                </div>
            </div>
        </AdminSection>
    );
};
