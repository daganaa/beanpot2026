import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/aws';

export async function GET(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find all photos where the user appears (PhotoPeople)
        const matches = await prisma.photoPeople.findMany({
            where: { userId: user.id },
            include: { photo: true },
            orderBy: { photo: { createdAt: 'desc' } },
        });

        // Generate presigned URLs for each photo
        const photosWithUrls = await Promise.all(matches.map(async (match) => {
            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: match.photo.s3Key,
            });
            const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
            return {
                id: match.photo.id,
                url,
                confidence: match.confidence,
                source: match.source,
                createdAt: match.photo.createdAt,
            };
        }));

        return NextResponse.json({ photos: photosWithUrls });
    } catch (error) {
        console.error('Error fetching photos:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
