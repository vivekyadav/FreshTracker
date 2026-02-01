import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export type UserPreferences = {
    showExpiryAsDays: boolean;
};

const defaultPreferences: UserPreferences = {
    showExpiryAsDays: true,
};

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { preferences: true },
        });

        const preferences = user?.preferences
            ? { ...defaultPreferences, ...(user.preferences as UserPreferences) }
            : defaultPreferences;

        return NextResponse.json(preferences);
    } catch (error) {
        console.error('Get Preferences Error:', error);
        return NextResponse.json({ error: 'Failed to get preferences' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const preferences: UserPreferences = {
            showExpiryAsDays: body.showExpiryAsDays ?? true,
        };

        await prisma.user.update({
            where: { id: session.user.id },
            data: { preferences },
        });

        return NextResponse.json(preferences);
    } catch (error) {
        console.error('Update Preferences Error:', error);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }
}
