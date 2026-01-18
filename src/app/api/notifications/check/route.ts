import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const expiringItems = await prisma.item.findMany({
            where: {
                expiryDate: {
                    lte: threeDaysFromNow,
                },
                status: 'available',
            },
        });

        // Filter out already expired items if we only want "expiring soon"? 
        // Or include them. Let's include everything expiring or expired.

        return NextResponse.json({
            count: expiringItems.length,
            items: expiringItems.map((i) => ({
                name: i.name,
                days: Math.ceil((new Date(i.expiryDate!).getTime() - Date.now()) / (1000 * 3600 * 24))
            }))
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to check notifications' }, { status: 500 });
    }
}
