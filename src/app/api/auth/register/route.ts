import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
    generateVerificationToken,
    getVerificationTokenExpiry,
    sendVerificationEmail,
} from '@/lib/email';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const result = signupSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { email, password } = result.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiry();

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken);

        if (!emailResult.success) {
            console.error('Failed to send verification email:', emailResult.error);
            // Don't fail registration if email fails, user can resend
        }

        // Remove sensitive data from response
        const { password: _, verificationToken: __, ...userWithoutPassword } = user;

        return NextResponse.json({
            ...userWithoutPassword,
            message: 'Account created! Please check your email to verify your account.',
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
