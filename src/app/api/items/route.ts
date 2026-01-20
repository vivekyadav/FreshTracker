import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json([]); // Return empty list for guests/unauthenticated
        }

        const items = await prisma.item.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                expiryDate: 'asc',
            },
        });

        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, category, expiryDate, quantity } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newItem = await prisma.item.create({
            data: {
                name,
                category: category || 'General',
                quantity: quantity || 1,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                status: 'available',
                imageUrl: null, // Allow UI to fallback to category icons
                userId: session.user.id
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error('Manual Entry Error:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
