import { getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, BUCKET_NAME } from '@/lib/aws';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { filename, contentType, eventId, isReference } = await req.json();
        const user = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub },
        });

        if (!user) {
            // Just in case sync didn't happen, though it should have on login
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const fileExtension = filename.split('.').pop();
        const key = `uploads/${uuidv4()}.${fileExtension}`;

        // Create Photo record
        const photo = await prisma.photo.create({
            data: {
                uploaderId: user.id,
                s3Key: key,
                status: 'PENDING_UPLOAD',
                eventId: eventId || null,
                isReference: !!isReference,
            },
        });

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return NextResponse.json({
            uploadUrl,
            photoId: photo.id,
            key,
        });
    } catch (error) {
        console.error('Presign error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
