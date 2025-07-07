// app/admin/server/services/real-system-health.service.ts

// Type definitions for health check results
interface HealthCheckResult {
    success: boolean;
    message: string;
    data?: SystemHealthData;
}

interface SystemHealthData {
    fplApi: 'healthy' | 'warning' | 'critical' | 'unknown';
    firebase: 'connected' | 'error' | 'unknown';
    googleSheets: 'connected' | 'error' | 'unknown';
    timestamp: string;
    details: {
        fplApiDetails: any;
        firebaseDetails: any;
        googleSheetsDetails: any;
    };
    issues: string[];
    recommendations: string[];
    overallHealth?: 'healthy' | 'warning' | 'critical';
    error?: string;
}

interface ComponentHealth {
    status: string;
    issues: string[];
    recommendations: string[];
    details: any;
}

/**
 * Real system health check implementation
 * Integrates with existing FPL API cache and other system components
 */
export class RealSystemHealthService {
    /**
     * Execute comprehensive system health check
     */
    async executeSystemHealthCheck(): Promise<HealthCheckResult> {
        try {
            console.log('🔄 Starting real system health check...');

            const healthReport = {
                fplApi: 'unknown' as 'healthy' | 'warning' | 'critical' | 'unknown',
                firebase: 'unknown' as 'connected' | 'error' | 'unknown',
                googleSheets: 'unknown' as 'connected' | 'error' | 'unknown',
                timestamp: new Date().toISOString(),
                details: {
                    fplApiDetails: null as any,
                    firebaseDetails: null as any,
                    googleSheetsDetails: null as any,
                },
                issues: [] as string[],
                recommendations: [] as string[],
            };

            // Check FPL API health using existing cache system
            const fplHealth = await this.checkFplApiHealth();
            healthReport.fplApi = fplHealth.status;
            healthReport.details.fplApiDetails = fplHealth.details;

            if (fplHealth.issues.length > 0) {
                healthReport.issues.push(...fplHealth.issues);
                healthReport.recommendations.push(...fplHealth.recommendations);
            }

            // Check Firebase connectivity
            const firebaseHealth = await this.checkFirebaseHealth();
            healthReport.firebase = firebaseHealth.status;
            healthReport.details.firebaseDetails = firebaseHealth.details;

            if (firebaseHealth.issues.length > 0) {
                healthReport.issues.push(...firebaseHealth.issues);
                healthReport.recommendations.push(...firebaseHealth.recommendations);
            }

            // Check Google Sheets connectivity
            const sheetsHealth = await this.checkGoogleSheetsHealth();
            healthReport.googleSheets = sheetsHealth.status;
            healthReport.details.googleSheetsDetails = sheetsHealth.details;

            if (sheetsHealth.issues.length > 0) {
                healthReport.issues.push(...sheetsHealth.issues);
                healthReport.recommendations.push(...sheetsHealth.recommendations);
            }

            // Determine overall health
            const overallHealth = this.determineOverallHealth(healthReport);

            console.log(`✅ System health check completed - Status: ${overallHealth}`);

            return {
                success: true,
                message: `System health check completed - Status: ${overallHealth}`,
                data: {
                    ...healthReport,
                    overallHealth,
                } as SystemHealthData,
            };
        } catch (error) {
            console.error('❌ System health check failed:', error);
            return {
                success: false,
                message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: {
                    fplApi: 'critical',
                    firebase: 'error',
                    googleSheets: 'error',
                    timestamp: new Date().toISOString(),
                    details: {
                        fplApiDetails: {},
                        firebaseDetails: {},
                        googleSheetsDetails: {},
                    },
                    issues: ['Health check system failure'],
                    recommendations: ['Check system logs and restart services'],
                    overallHealth: 'critical',
                    error: error instanceof Error ? error.message : 'Unknown error',
                } as SystemHealthData,
            };
        }
    }

    /**
     * Check FPL API health using existing cache system
     */
    private async checkFplApiHealth() {
        try {
            console.log('🔄 Checking FPL API health...');

            // Use existing fplApiCache.getCacheHealth() method
            const { fplApiCache } = await import('../../../_shared/lib/fpl/api-cache');
            const cacheHealth = await fplApiCache.getCacheHealth();

            console.log('📊 FPL Cache Health:', cacheHealth.health?.overall);

            // Map existing health status to our format
            let status: 'healthy' | 'warning' | 'critical' = 'healthy';
            const issues: string[] = [];
            const recommendations: string[] = [];

            if (cacheHealth.health?.overall === 'critical') {
                status = 'critical';
            } else if (cacheHealth.health?.overall === 'warning') {
                status = 'warning';
            }

            // Add issues and recommendations from existing system
            if (cacheHealth.health?.issues) {
                issues.push(...cacheHealth.health.issues);
            }

            if (cacheHealth.health?.recommendations) {
                recommendations.push(...cacheHealth.health.recommendations);
            }

            return {
                status,
                issues,
                recommendations,
                details: {
                    completionPercentage: cacheHealth.completionPercentage,
                    counts: cacheHealth.counts,
                    missing: cacheHealth.missing,
                    lastUpdated: cacheHealth.lastUpdated,
                    rawHealth: cacheHealth.health,
                },
            };
        } catch (error) {
            console.error('❌ FPL API health check failed:', error);
            return {
                status: 'critical' as const,
                issues: ['Failed to check FPL API status'],
                recommendations: ['Check FPL API connectivity and try refreshing cache'],
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            };
        }
    }

    /**
     * Check Firebase connectivity
     */
    private async checkFirebaseHealth() {
        try {
            console.log('🔄 Checking Firebase health...');

            // Use your existing Firebase admin instance
            const { getFirestoreInstance } = await import('../../../_shared/lib/firestore-cache/firebase.admin');
            const db = getFirestoreInstance();

            // Test Firebase connectivity with a simple read/write
            const testRef = db.collection('health-check').doc('system-test');
            const testData = {
                timestamp: new Date(),
                testId: `health-check-${Date.now()}`,
            };

            // Write test data
            await testRef.set(testData);

            // Read it back to verify connectivity
            const doc = await testRef.get();
            const readData = doc.data();

            // Cleanup test document
            await testRef.delete();

            if (readData?.testId === testData.testId) {
                console.log('✅ Firebase connectivity verified');
                return {
                    status: 'connected' as const,
                    issues: [],
                    recommendations: [],
                    details: {
                        readWriteTest: 'passed',
                        responseTime: 'normal',
                        database: 'draft', // Your custom database name
                    },
                };
            } else {
                throw new Error('Firebase read/write test failed');
            }
        } catch (error) {
            console.error('❌ Firebase health check failed:', error);
            return {
                status: 'error' as const,
                issues: ['Firebase connectivity failed'],
                recommendations: ['Check Firebase configuration and network connectivity'],
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            };
        }
    }

    /**
     * Check Google Sheets connectivity
     */
    private async checkGoogleSheetsHealth() {
        try {
            console.log('🔄 Checking Google Sheets health...');

            // Use existing sheets functionality to test connectivity
            const { readDivisions } = await import('../../../_shared/lib/sheets/divisions');
            const divisions = await readDivisions();

            console.log(`📊 Google Sheets test: Found ${divisions.length} divisions`);

            if (divisions.length > 0) {
                // Test additional sheet access
                const { readUserTeams } = await import('../../../_shared/lib/sheets/user-teams');
                const userTeams = await readUserTeams();

                console.log(`📊 Google Sheets test: Found ${userTeams.length} user teams`);

                return {
                    status: 'connected' as const,
                    issues: [],
                    recommendations: [],
                    details: {
                        divisionsFound: divisions.length,
                        userTeamsFound: userTeams.length,
                        sheetsAccess: 'verified',
                    },
                };
            } else {
                return {
                    status: 'error' as const,
                    issues: ['No divisions found in Google Sheets'],
                    recommendations: ['Check Google Sheets permissions and data'],
                    details: {
                        divisionsFound: 0,
                        sheetsAccess: 'limited',
                    },
                };
            }
        } catch (error) {
            console.error('❌ Google Sheets health check failed:', error);
            return {
                status: 'error' as const,
                issues: ['Google Sheets connectivity failed'],
                recommendations: ['Check Google Sheets API credentials and permissions'],
                details: { error: error instanceof Error ? error.message : 'Unknown error' },
            };
        }
    }

    /**
     * Determine overall system health based on individual components
     */
    private determineOverallHealth(healthReport: any): 'healthy' | 'warning' | 'unhealthy' {
        // Unhealthy if any core system is down
        if (
            healthReport.fplApi === 'critical' ||
            healthReport.firebase === 'error' ||
            healthReport.googleSheets === 'error'
        ) {
            return 'unhealthy';
        }

        // Warning if any system has warnings
        if (healthReport.fplApi === 'warning') {
            return 'warning';
        }

        // Healthy if all systems are good
        if (
            healthReport.fplApi === 'healthy' &&
            healthReport.firebase === 'connected' &&
            healthReport.googleSheets === 'connected'
        ) {
            return 'healthy';
        }

        // Default to warning for unknown states
        return 'warning';
    }

    /**
     * Get detailed system status for admin dashboard
     */
    async getDetailedSystemStatus() {
        try {
            console.log('🔄 Getting detailed system status...');

            const healthResult = await this.executeSystemHealthCheck();

            if (!healthResult.success || !healthResult.data) {
                return {
                    health: 'unhealthy' as const,
                    issues: healthResult.data?.issues || ['System health check failed'],
                    recommendations: healthResult.data?.recommendations || ['Check system connectivity'],
                    lastChecked: new Date().toISOString(),
                    components: {},
                    error: healthResult.data?.error || 'Health check failed',
                };
            }

            const data = healthResult.data;

            // Type guard to ensure data has the expected structure
            if (!data.overallHealth) {
                return {
                    health: 'unhealthy' as const,
                    issues: ['Invalid health check response'],
                    recommendations: ['Retry health check'],
                    lastChecked: new Date().toISOString(),
                    components: {},
                };
            }

            return {
                health: data.overallHealth,
                issues: data.issues || [],
                recommendations: data.recommendations || [],
                components: {
                    fplApi: {
                        status: data.fplApi || 'unknown',
                        details: data.details?.fplApiDetails || {},
                    },
                    firebase: {
                        status: data.firebase || 'unknown',
                        details: data.details?.firebaseDetails || {},
                    },
                    googleSheets: {
                        status: data.googleSheets || 'unknown',
                        details: data.details?.googleSheetsDetails || {},
                    },
                },
                lastChecked: data.timestamp || new Date().toISOString(),
            };
        } catch (error) {
            console.error('❌ Failed to get detailed system status:', error);
            return {
                health: 'unhealthy' as const,
                issues: ['Failed to retrieve system status'],
                recommendations: ['Contact system administrator'],
                lastChecked: new Date().toISOString(),
                components: {},
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
