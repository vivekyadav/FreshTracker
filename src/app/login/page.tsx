import LoginForm from '@/components/LoginForm';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                            <ChefHat size={40} className="text-green-600" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to access your inventory</p>
                </div>

                <LoginForm />

                <div className="text-center text-sm text-gray-500">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-green-600 font-semibold hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
