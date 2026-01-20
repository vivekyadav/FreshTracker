import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
    generateVerificationToken,
    getVerificationTokenExpiry,
    sendVerificationEmail,
} from '@/lib/email';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return NextResponse.json({
                message: 'If an account exists, a verification email has been sent.',
            });
        }

        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { error: 'Email is already verified' },
                { status: 400 }
            );
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiry();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken);

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send verification email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: 'Verification email sent! Please check your inbox.',
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json(
            { error: 'Failed to resend verification email' },
            { status: 500 }
        );
    }
}
