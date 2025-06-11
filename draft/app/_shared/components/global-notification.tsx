import { useRevalidator } from 'react-router';
import { useEffect, useState } from 'react';
import styles from './global-notification.module.css';

interface NotificationProps {
    lastUpdated: string;
}

const useNotification = (lastUpdated: string) => {
    const revalidator = useRevalidator();
    const [notifications, setNotifications] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>(lastUpdated);

    // Real-time updates using Server-Sent Events
    useEffect(() => {
        const eventSource = new EventSource("/api/live-scores");

        eventSource.onopen = () => {
            setIsConnected(true);
            console.log("Connected to live FPL updates");
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "score_update") {
                // Add notification with timestamp
                const timestamp = new Date().toLocaleTimeString();
                setNotifications(prev => [
                    `[${timestamp}] ${data.player_name} ${data.action}! (+${data.points} points)`,
                    ...prev.slice(0, 4) // Keep only 5 most recent
                ]);

                // Update last refresh time
                setLastUpdateTime(new Date().toISOString());

                // Refresh data from server
                revalidator.revalidate();
            } else if (data.type === "gameweek_update") {
                setNotifications(prev => [
                    `🏆 Gameweek ${data.gameweek} started!`,
                    ...prev.slice(0, 4)
                ]);
            }
        };

        eventSource.onerror = () => {
            setIsConnected(false);
            console.log("Disconnected from live updates");
        };

        return () => {
            eventSource.close();
        };
    }, [revalidator]);

    return { notifications, isConnected, lastUpdateTime };
};

export function Notifications({ lastUpdated }: NotificationProps) {
    const { notifications, isConnected, lastUpdateTime } = useNotification(lastUpdated);

    return (
        <div>
            <header className={styles.header}>
                <h1 className={styles.mainTitle}>
                    ⚽ FPL Live Tracker
                </h1>
                <div className={styles.statusContainer}>
                    <div className={styles.statusItem}>
                        <div
                            className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}
                        />
                        <span>{isConnected ? "Live Updates" : "Disconnected"}</span>
                    </div>
                    <span>Updated: {new Date(lastUpdateTime).toLocaleTimeString()}</span>
                </div>
            </header>

            {notifications.length > 0 && (
                <div className={styles.notificationsContainer}>
                    <h3 className={styles.notificationsTitle}>
                        📢 Live Updates
                    </h3>
                    {notifications.map((notification, index) => (
                        <div key={index} className={styles.notificationItem}>
                            {notification}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
