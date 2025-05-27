import { useRevalidator } from 'react-router';
import { useEffect, useState } from 'react';

const useNotification = (last_updated) => {
    const revalidator = useRevalidator();
    const [notifications, setNotifications] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>(last_updated);

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
    return { notifications, isConnected, lastUpdateTime }
}

export const Notifications = ({ lastUpdated }) => {
    const { notifications, isConnected, lastUpdateTime } = useNotification(lastUpdated);
    return (
        <div>

            <header style={{ marginBottom: "30px", textAlign: "center" }}>
                <h1 style={{
                    color: "#37003c",
                    margin: "0 0 10px 0",
                    fontSize: "2.5rem",
                    fontWeight: "700"
                }}>
                    ⚽ FPL Live Tracker
                </h1>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "20px",
                    fontSize: "14px",
                    color: "#6b7280"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: isConnected ? "#10b981" : "#ef4444"
                        }}></div>
                        <span>{isConnected ? "Live Updates" : "Disconnected"}</span>
                    </div>
                    <span>Updated: {new Date(lastUpdateTime).toLocaleTimeString()}</span>
                </div>
            </header>

            {
                notifications.length > 0 && (
                    <div style={{
                        backgroundColor: "#f0f9ff",
                        border: "1px solid #0ea5e9",
                        borderRadius: "12px",
                        padding: "20px",
                        marginBottom: "25px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                    }}>
                        <h3 style={{
                            margin: "0 0 15px 0",
                            color: "#0369a1",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}>
                            📢 Live Updates
                        </h3>
                        {notifications.map((notification, index) => (
                            <div key={index} style={{
                                padding: "8px 0",
                                    borderBottom: index < notifications.length - 1 ? "1px solid #bae6fd" : "none",
                                    fontFamily: "monospace",
                                    fontSize: "13px"
                            }}>
                                {notification}
                            </div>
                        ))}
                    </div>
                )
            }
    </div>
    )
}
