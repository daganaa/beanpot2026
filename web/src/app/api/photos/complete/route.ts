import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { photoId } = await req.json();

        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        // Verify ownership (or admin)
        // For now, only uploader can complete
        // We need to fetch the user first to compare IDs, but session.user.sub is auth0Id, not internal ID.
        // So let's fetch user.
        const user = await prisma.user.findUnique({ where: { auth0Id: session.user.sub } });

        if (!user || user.id !== photo.uploaderId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.photo.update({
            where: { id: photoId },
            data: { status: 'PROCESSING' },
        });

        // Trigger Async Worker (Inline for MVP)
        // In a real app, send to SQS or use Inngest
        (async () => {
            try {
                const { indexReferenceFace, processEventPhoto } = await import('@/lib/rekognition');

                if (photo.isReference) {
                    await indexReferenceFace(user.id, photo.s3Key);
                    await prisma.photo.update({
                        where: { id: photoId },
                        data: { status: 'READY' }, // Reference photo is ready
                    });
                } else {
                    const processor = await processEventPhoto(photo.id, photo.s3Key);
                    const matches = await processor.process();

                    // Store matches
                    if (matches.length > 0) {
                        await prisma.photoPeople.createMany({
                            data: matches.map(m => ({
                                photoId: photo.id,
                                userId: m.userId,
                                confidence: m.confidence,
                                source: 'FACE_MATCH'
                            })),
                            skipDuplicates: true
                        });
                    }

                    // Also grant Uploader access
                    await prisma.photoPeople.create({
                        data: {
                            photoId: photo.id,
                            userId: photo.uploaderId,
                            confidence: 100,
                            source: 'UPLOADER'
                        }
                    }).catch(() => { }); // Ignore if already exists

                    await prisma.photo.update({
                        where: { id: photoId },
                        data: { status: 'READY' },
                    });
                }
            } catch (err) {
                console.error('Processing failed for photo', photoId, err);
                await prisma.photo.update({
                    where: { id: photoId },
                    data: { status: 'FAILED' },
                });
            }
        })();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Complete upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
