'use client';

import { useEffect } from 'react';

export function NotificationManager({ items }: { items: any[] }) {
    useEffect(() => {
        const checkNotifications = async () => {
            // Check permission
            if (!('Notification' in window)) return;

            // Only check if we have items
            if (!items || items.length === 0) return;

            let permission = Notification.permission;
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }

            if (permission !== 'granted') return;

            // Check items specifically
            const now = new Date();
            const expiringCount = items.filter(item => {
                if (!item.expiryDate) return false;
                const expiry = new Date(item.expiryDate);
                const diffTime = expiry.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 3 && diffDays >= 0;
            }).length;

            if (expiringCount > 0) {
                // Basic throttling: Don't spam on reload.
                const lastNotified = localStorage.getItem('lastNotified');
                const lastNotifiedTime = lastNotified ? parseInt(lastNotified) : 0;

                if (Date.now() - lastNotifiedTime < 1000 * 60 * 60 * 12) { // 12h throttle
                    return;
                }

                new Notification('FreshKeeper Alert', {
                    body: `You have ${expiringCount} items expiring soon!`,
                    icon: '/icon.png'
                });

                localStorage.setItem('lastNotified', Date.now().toString());
            }
        };

        checkNotifications();
    }, [items]);

    return null; // Renderless component
}
