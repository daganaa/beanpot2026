'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Event {
    id: string;
    name: string;
    joinCode: string;
    createdAt: string;
    _count: { photos: number, members: number };
}

export default function EventsPage() {
    const { user, isLoading } = useUser();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetch('/api/events')
                .then(res => res.json())
                .then(data => {
                    if (data.events) setEvents(data.events);
                    setLoading(false);
                });
        }
    }, [user]);

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <div>Please log in.</div>;

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Events</h1>
                <Link href="/events/new" className="bg-blue-600 text-white px-4 py-2 rounded">
                    + Create Event
                </Link>
            </div>

            {loading ? (
                <div>Loading events...</div>
            ) : events.length === 0 ? (
                <div className="text-gray-500">No events found. Create one to get started!</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(event => (
                        <Link key={event.id} href={`/events/${event.id}`} className="block border rounded-lg p-6 hover:shadow-lg transition">
                            <h2 className="text-xl font-bold mb-2">{event.name}</h2>
                            <div className="text-sm text-gray-600 mb-4">
                                Code: <span className="font-mono bg-gray-100 px-1 rounded">{event.joinCode}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{event._count.photos} Photos</span>
                                <span>{event._count.members} Members</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
