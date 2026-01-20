import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    providers: [], // Configured in main auth.ts
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            // Allow access to everything for now, we control visibility in UI
            return true;
        },
    },
} satisfies NextAuthConfig;
