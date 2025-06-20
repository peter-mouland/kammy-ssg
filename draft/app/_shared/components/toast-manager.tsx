/* Location: app/_shared/components/toast-manager.tsx */

// components/toast-manager/toast-manager.tsx
import { useState, useCallback, useEffect } from 'react';
import styles from './toast-manager.module.css';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface ToastManagerProps {
    maxToasts?: number;
}

// biome-ignore lint/correctness/noUnusedVariables: <is used>
let showToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;
let dismissAllToasts: (() => void) | null = null;

export function ToastManager({ maxToasts = 3 }: ToastManagerProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const dismissAll = useCallback(() => {
        setToasts([]);
    }, []);

    const addToast = useCallback(
        (toast: Omit<Toast, 'id'>) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newToast: Toast = {
                ...toast,
                id,
                duration: toast.duration || 5000,
            };

            setToasts((prev) => {
                const updated = [newToast, ...prev];
                // Keep only the most recent toasts
                return updated.slice(0, maxToasts);
            });

            // Auto-dismiss after duration
            setTimeout(() => {
                dismissToast(id);
            }, newToast.duration);
        },
        [maxToasts, dismissToast],
    );

    // Expose methods via global function for easy access
    useEffect(() => {
        showToast = addToast;
        dismissAllToasts = dismissAll;

        return () => {
            showToast = null;
            dismissAllToasts = null;
        };
    }, [addToast, dismissAll]);

    return (
        <div className={styles.toastContainer}>
            {toasts.map((toast, index) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} index={index} />
            ))}
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onDismiss: () => void;
    index: number;
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleDismiss = () => {
        setIsLeaving(true);
        setTimeout(onDismiss, 300); // Wait for exit animation
    };

    return (
        <div
            className={`${styles.toast} ${styles[toast.type]} ${isVisible ? styles.visible : ''} ${
                isLeaving ? styles.leaving : ''
            }`}
            style={
                {
                    '--toast-index': index,
                    top: `${index * 80}px`, // Stack toasts
                } as React.CSSProperties
            }
        >
            <div className={styles.toastContent}>
                <span className={styles.toastMessage}>{toast.message}</span>
                <button
                    onClick={handleDismiss}
                    type={'button'}
                    className={styles.dismissButton}
                    aria-label="Dismiss notification"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

// Hook for easy toast usage
export function useToast() {
    const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
        if (showToast) {
            showToast(toast);
        }
    }, []);

    const dismissAll = useCallback(() => {
        if (dismissAllToasts) {
            dismissAllToasts();
        }
    }, []);

    return { showToast, dismissAll };
}
