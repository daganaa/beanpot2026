'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import PhotoUpload from '@/components/PhotoUpload';

export default function UploadPage() {
    const { user, error, isLoading } = useUser();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error.message}</div>;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Please Log In to Upload</h1>
                <a href="/api/auth/login" className="bg-blue-500 text-white px-4 py-2 rounded">Login</a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-8">
            <h1 className="text-2xl font-bold mb-8">Upload Photos</h1>
            <PhotoUpload />
        </div>
    );
}
