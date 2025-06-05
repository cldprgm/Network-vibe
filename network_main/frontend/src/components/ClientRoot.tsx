'use client';

import { useAuthStore } from '@/zustand_store/authStore';
import AuthModalController from './auth/AuthModalController';

export default function ClientRoot() {
    const showAuthModal = useAuthStore((s) => s.showAuthModal);
    const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);

    return (
        <>
            {showAuthModal && (
                <AuthModalController onCloseAll={() => setShowAuthModal(false)} />
            )}
        </>
    );
}
