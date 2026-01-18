'use client';

import { useEffect } from 'react';

export function NotificationManager() {
    useEffect(() => {
        const checkNotifications = async () => {
            // Check permission
            if (!('Notification' in window)) return;

            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if (permission !== 'granted') return;

            // Check server
            try {
                const res = await fetch('/api/notifications/check');
                const data = await res.json();

                if (data.count > 0) {
                    // Basic throttling: Don't spam on reload.
                    // In real app, store "lastNotified" timestamp.
                    const lastNotified = localStorage.getItem('lastNotified');
                    const now = Date.now();
                    if (lastNotified && now - parseInt(lastNotified) < 1000 * 60 * 60 * 24) {
                        // Already notified in last 24h
                        return;
                    }

                    new Notification('FreshKeeper Alert', {
                        body: `You have ${data.count} items expiring soon!`,
                        icon: '/icon.png' // we don't have icon yet, but valid prop
                    });

                    localStorage.setItem('lastNotified', now.toString());
                }
            } catch (e) {
                console.error('Notification check failed', e);
            }
        };

        checkNotifications();

        // Maybe interval check?
        // setInterval(checkNotifications, 1000 * 60 * 60); 
    }, []);

    return null; // Renderless component
}
