'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Photo {
    id: string;
    url: string;
    confidence: number;
}

export default function PhotoGrid({ endpoint = '/api/photos/me' }: { endpoint?: string }) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPhotos() {
            try {
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    setPhotos(data.photos || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchPhotos();
    }, [endpoint]);

    if (loading) return <div className="text-center p-10">Loading photos...</div>;

    if (photos.length === 0) {
        return <div className="text-center p-10 text-gray-500">No photos found.</div>;
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {photos.map((photo) => (
                <div key={photo.id} className="aspect-square relative group overflow-hidden rounded-lg bg-gray-100">
                    <Image
                        src={photo.url}
                        alt="Event Photo"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        unoptimized // Using Presigned URLs
                    />
                    {photo.confidence < 100 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                            Matched: {Math.round(photo.confidence)}%
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
