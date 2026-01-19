import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
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
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error('Manual Entry Error:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
