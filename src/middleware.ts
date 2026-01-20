import NextAuth from 'next-auth';
// We need to import the config separately to avoid hydration issues with full auth
import { authConfig } from './auth.config';

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
    // We can add route protection logic here if needed,
    // but for now we'll handle it in the components/api
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
