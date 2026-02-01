'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailPendingContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [resending, setResending] = useState(false);
    const [message, setMessage] = useState('');
    const [canResend, setCanResend] = useState(false);

    // Enable resend after 60 seconds
    useEffect(() => {
        const timer = setTimeout(() => setCanResend(true), 60000);
        return () => clearTimeout(timer);
    }, []);

    async function handleResend() {
        setResending(true);
        setMessage('');

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('✅ Verification email sent! Check your inbox.');
                setCanResend(false);
                setTimeout(() => setCanResend(true), 60000);
            } else {
                setMessage(`❌ ${data.error || 'Failed to send email'}`);
            }
        } catch (error) {
            setMessage('❌ Something went wrong. Please try again.');
        } finally {
            setResending(false);
        }
    }

    return (
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">📧</div>

            <h1 className="text-3xl font-bold text-white mb-4">Check Your Email!</h1>

            <p className="text-white/90 mb-2">
                We've sent a verification link to:
            </p>
            <p className="text-white font-semibold text-lg mb-6">
                {email}
            </p>

            <div className="bg-white/5 rounded-xl p-4 mb-6">
                <p className="text-white/80 text-sm">
                    Click the link in the email to verify your account and start using FreshTracker.
                </p>
            </div>

            <div className="space-y-3">
                {message && (
                    <div className={`p-3 rounded-lg ${message.startsWith('✅')
                        ? 'bg-green-500/20 text-green-100'
                        : 'bg-red-500/20 text-red-100'
                        }`}>
                        {message}
                    </div>
                )}

                <button
                    onClick={handleResend}
                    disabled={!canResend || resending}
                    className="w-full bg-white/20 backdrop-blur text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {resending ? 'Sending...' : canResend ? 'Resend Verification Email' : 'Resend in 60s'}
                </button>

                <Link
                    href="/login"
                    className="block bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                >
                    Back to Login
                </Link>
            </div>

            <p className="text-white/60 text-xs mt-6">
                Didn't receive the email? Check your spam folder.
            </p>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        </div>
    );
}

export default function VerifyEmailPendingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 flex items-center justify-center p-4">
            <Suspense fallback={<LoadingFallback />}>
                <VerifyEmailPendingContent />
            </Suspense>
        </div>
    );
}
