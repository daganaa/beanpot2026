'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import PhotoGrid from '@/components/PhotoGrid';

export default function MyPhotosPage() {
    const { user, error, isLoading } = useUser();

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <div className="text-center mt-20">Please log in to view your photos.</div>;

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold p-8">My Photos</h1>
            <PhotoGrid />
        </div>
    );
}
