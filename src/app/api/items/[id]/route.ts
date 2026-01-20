import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        // Verify ownership
        const item = await prisma.item.findUnique({
            where: { id },
        });

        if (!item || item.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        await prisma.item.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
}
