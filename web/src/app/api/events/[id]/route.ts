import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                _count: { select: { photos: true, members: true } },
                members: { where: { userId: user.id } }
            }
        });

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

        // Check membership
        const isMember = event.createdBy === user.id || event.members.length > 0;
        if (!isMember) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ event });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
