import styles from './system-status.module.css';

export function SystemStatus() {
    const systemServices = [
        {
            name: 'FPL API',
            status: 'Connected',
            isOnline: true
        },
        {
            name: 'Google Sheets',
            status: 'Synced',
            isOnline: true
        },
        {
            name: 'Live Updates',
            status: 'Active',
            isOnline: true
        },
        {
            name: 'Draft System',
            status: 'Ready',
            isOnline: true
        }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">🟢 System Status</h2>
                <p className={styles.subtitle}>
                    All systems operational
                </p>
            </div>

            <div className={styles.servicesList}>
                {systemServices.map((service, index) => (
                    <div key={index} className={styles.serviceItem}>
            <span className={styles.serviceName}>
              {service.name}
            </span>
                        <span className={`${styles.serviceStatus} ${service.isOnline ? styles.online : styles.offline}`}>
              {service.isOnline ? '✓' : '✗'} {service.status}
            </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
