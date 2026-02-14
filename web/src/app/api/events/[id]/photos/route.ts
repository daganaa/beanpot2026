import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/aws';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Check membership (simplified for photos list)
        // We can assume valid access if they know the ID? No, strictly check.
        const member = await prisma.eventMember.findUnique({
            where: { eventId_userId: { eventId: id, userId: user.id } }
        });
        // Or creator
        const event = await prisma.event.findUnique({ where: { id }, select: { createdBy: true } });

        if (!event) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        if (event.createdBy !== user.id && !member) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch photos
        const photos = await prisma.photo.findMany({
            where: { eventId: id, status: 'READY' },
            orderBy: { createdAt: 'desc' }
        });

        const photosWithUrls = await Promise.all(photos.map(async (photo) => {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: photo.s3Key,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return {
                id: photo.id,
                url,
                confidence: 100, // Explicitly 100 for event gallery
                createdAt: photo.createdAt,
            };
        }));

        return NextResponse.json({ photos: photosWithUrls });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
