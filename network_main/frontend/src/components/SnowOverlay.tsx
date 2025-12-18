'use client';

import React from 'react';
import ReactSnowfall from 'react-snowfall';
import { useSnowStore } from '@/zustand_store/snowStore';

export default function SnowOverlay() {
    const { isSnowing } = useSnowStore();

    if (!isSnowing) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            pointerEvents: 'none'
        }}>
            <ReactSnowfall
                color="#ffffff"

                radius={[0.5, 1.5]}

                snowflakeCount={400}
                style={{ position: 'absolute' }}
            />
        </div>
    );
}