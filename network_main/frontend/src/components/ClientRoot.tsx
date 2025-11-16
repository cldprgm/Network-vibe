'use client';

import { useAuthStore } from '@/zustand_store/authStore';
import AuthModalController from './auth/AuthModalController';
import { useHeartbeat } from '@/services/hooks/useHeartbeat';

export default function ClientRoot() {
    const showAuthModal = useAuthStore((s) => s.showAuthModal);
    const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);

    useHeartbeat();

    return (
        <>
            {showAuthModal && (
                <AuthModalController onCloseAll={() => setShowAuthModal(false)} />
            )}
        </>
    );
}