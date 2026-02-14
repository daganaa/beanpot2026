import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const events = await prisma.event.findMany({
            where: {
                OR: [
                    { createdBy: user.id },
                    { members: { some: { userId: user.id } } }
                ]
            },
            include: {
                _count: { select: { photos: true, members: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name } = await req.json();
        const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Simple random join code
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const event = await prisma.event.create({
            data: {
                name,
                joinCode,
                createdBy: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: 'ADMIN'
                    }
                }
            }
        });

        return NextResponse.json({ event });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
