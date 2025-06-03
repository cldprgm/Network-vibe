'use client';

import React, { useState } from 'react';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

export default function AuthModalController({
    initial = 'login',
    onCloseAll,
}: {
    initial?: 'login' | 'register';
    onCloseAll: () => void;
}) {
    const [mode, setMode] = useState<'login' | 'register'>(initial);

    return (
        <>
            {mode === 'login' && (
                <LoginModal
                    onClose={onCloseAll}
                    onSwitchToRegister={() => setMode('register')}
                />
            )}
            {mode === 'register' && (
                <RegisterModal
                    onClose={onCloseAll}
                    onSwitchToLogin={() => setMode('login')}
                />
            )}
        </>
    );
}
