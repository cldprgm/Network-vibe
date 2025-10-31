import { useEffect, useRef, useCallback } from 'react';
import { sendHeartbeat } from '../api';
import { useAuthStore } from '@/zustand_store/authStore';

const HEARTBEAT_INTERVAL_MS = 60 * 3000;

export const useHeartbeat = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastSentRef = useRef<number | null>(null);

    const stopHeartbeat = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const sendHeartbeatAndUpdateTimestamp = useCallback(async () => {
        await sendHeartbeat();
        lastSentRef.current = Date.now();
    }, []);


    const startHeartbeat = useCallback(() => {
        stopHeartbeat();

        const now = Date.now();
        const lastSent = lastSentRef.current;

        if (!lastSent || now - lastSent >= HEARTBEAT_INTERVAL_MS) {
            sendHeartbeatAndUpdateTimestamp();
        }

        intervalRef.current = setInterval(sendHeartbeatAndUpdateTimestamp, HEARTBEAT_INTERVAL_MS);

    }, [stopHeartbeat, sendHeartbeatAndUpdateTimestamp]);


    useEffect(() => {
        if (isAuthenticated) {
            startHeartbeat();

            const handleVisibilityChange = () => {
                if (document.hidden) {
                    stopHeartbeat();
                } else {
                    startHeartbeat();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                stopHeartbeat();
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        } else {
            stopHeartbeat();
            lastSentRef.current = null;
        }
    }, [isAuthenticated, startHeartbeat, stopHeartbeat]);
};