'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link');
            return;
        }

        async function verify() {
            try {
                const response = await fetch(`/api/auth/verify?token=${token}`);
                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                    // Redirect to login after 3 seconds
                    setTimeout(() => router.push('/login'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Verification failed');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Something went wrong. Please try again.');
            }
        }

        verify();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 text-center">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Verifying Your Email</h1>
                        <p className="text-white/80">Please wait...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-6">✅</div>
                        <h1 className="text-2xl font-bold text-white mb-4">Email Verified!</h1>
                        <p className="text-white/90 mb-6">{message}</p>
                        <p className="text-white/70 text-sm">Redirecting to login...</p>
                        <Link
                            href="/login"
                            className="inline-block mt-4 bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors"
                        >
                            Go to Login
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-6">❌</div>
                        <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
                        <p className="text-white/90 mb-6">{message}</p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/signup"
                                className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-50 transition-colors"
                            >
                                Create New Account
                            </Link>
                            <Link
                                href="/login"
                                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
