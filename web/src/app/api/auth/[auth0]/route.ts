import { handleAuth, handleCallback, Session } from '@auth0/nextjs-auth0';
import { NextApiRequest, NextApiResponse } from 'next';

const authHandler = handleAuth({
    callback: handleCallback({
        afterCallback: async (req: any, session: Session, state: any) => {
            if (session?.user) {
                try {
                    console.log('Syncing user:', session.user.sub);
                    // Ensure the Prisma client is imported and used here
                    // We need to import prisma from lib
                    const { prisma } = await import('@/lib/prisma');

                    await prisma.user.upsert({
                        where: { auth0Id: session.user.sub },
                        update: {
                            name: session.user.name || session.user.nickname || 'Unknown',
                            // Update other fields if necessary
                        },
                        create: {
                            auth0Id: session.user.sub,
                            name: session.user.name || session.user.nickname || 'Unknown',
                        },
                    });
                } catch (error) {
                    console.error('Error syncing user:', error);
                }
            }
            return session;
        }
    })
});

export const GET = async (req: Request, props: { params: Promise<{ auth0: string }> }) => {
    const params = await props.params;
    return authHandler(req, { params });
};
