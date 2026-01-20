import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Verification token is required' },
                { status: 400 }
            );
        }

        // Find user with matching token
        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            return NextResponse.json(
                { error: 'Verification token has expired' },
                { status: 400 }
            );
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: 'Email already verified' },
                { status: 200 }
            );
        }

        // Verify the user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
        });
    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        );
    }
}
