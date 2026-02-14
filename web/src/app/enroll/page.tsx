'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import PhotoUpload from '@/components/PhotoUpload';
import { useRouter } from 'next/navigation';

export default function EnrollPage() {
    const { user, error, isLoading } = useUser();
    const router = useRouter();

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>{error.message}</div>;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-2xl font-bold mb-4">Please Log In to Enroll</h1>
                <a href="/api/auth/login" className="bg-blue-500 text-white px-4 py-2 rounded">Login</a>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">Setup Face Matching</h1>
            <p className="text-gray-600 mb-8 text-center">
                Upload a clear photo of yourself (a selfie works best).
                We use this to find you in event photos automatically.
                This photo is kept private and only used for matching.
            </p>

            <div className="w-full">
                <PhotoUpload
                    isReference={true}
                    onUploadComplete={() => {
                        // Redirect to gallery or show success
                        setTimeout(() => router.push('/'), 2000);
                    }}
                />
            </div>
        </div>
    );
}
