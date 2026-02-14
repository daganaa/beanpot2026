'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import PhotoGrid from '@/components/PhotoGrid';
import PhotoUpload from '@/components/PhotoUpload';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Event {
    id: string;
    name: string;
    joinCode: string;
}

export default function EventDetailPage() {
    const { user, isLoading } = useUser();
    const params = useParams();
    const id = params?.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [refreshGrid, setRefreshGrid] = useState(0);

    useEffect(() => {
        if (user && id) {
            fetch(`/api/events/${id}`)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to load event');
                })
                .then(data => setEvent(data.event))
                .catch(console.error);
        }
    }, [user, id]);

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <div>Please log in.</div>;
    if (!event) return <div>Loading event...</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="mb-8 border-b pb-4">
                <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
                <p className="text-gray-600">Join Code: <span className="font-mono font-bold">{event.joinCode}</span></p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-semibold mb-4">Event Gallery</h2>
                    <PhotoGrid key={refreshGrid} endpoint={`/api/events/${id}/photos`} />
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Add Photos</h3>
                        <PhotoUpload
                            eventId={id}
                            onUploadComplete={() => {
                                // Refresh grid after 2 seconds to allow processing
                                setTimeout(() => setRefreshGrid(prev => prev + 1), 2000);
                            }}
                        />
                        <p className="text-xs text-gray-500 mt-4">
                            Photos will appear in the gallery after processing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
