'use client';

import { Settings, Calendar, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type UserPreferences = {
    showExpiryAsDays: boolean;
};

export function PreferencesToggle() {
    const [isOpen, setIsOpen] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({ showExpiryAsDays: true });
    const [isSaving, setIsSaving] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch preferences on mount
        fetch('/api/user/preferences')
            .then(res => res.json())
            .then(data => {
                if (!data.error) setPreferences(data);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const togglePreference = async () => {
        const newValue = !preferences.showExpiryAsDays;
        setIsSaving(true);

        try {
            const res = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ showExpiryAsDays: newValue }),
            });

            if (res.ok) {
                setPreferences({ showExpiryAsDays: newValue });
                // Trigger page refresh to update all dates
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to update preferences:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl backdrop-blur-sm transition-all"
                title="Settings"
            >
                <Settings size={20} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 p-4 min-w-[240px] z-50 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Display Preferences</h3>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {preferences.showExpiryAsDays ? (
                                    <Clock size={16} className="text-gray-500" />
                                ) : (
                                    <Calendar size={16} className="text-gray-500" />
                                )}
                                <span className="text-sm text-gray-700">
                                    {preferences.showExpiryAsDays ? 'Days until expiry' : 'Actual date'}
                                </span>
                            </div>
                            <button
                                onClick={togglePreference}
                                disabled={isSaving}
                                className={`relative w-12 h-6 rounded-full transition-colors ${preferences.showExpiryAsDays ? 'bg-green-500' : 'bg-gray-300'
                                    } ${isSaving ? 'opacity-50' : ''}`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.showExpiryAsDays ? 'left-7' : 'left-1'
                                        }`}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            {preferences.showExpiryAsDays
                                ? 'Showing "3 days left"'
                                : 'Showing "Feb 4, 2026"'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
