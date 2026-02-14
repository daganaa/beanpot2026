'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewEventPage() {
    const { user } = useUser();
    const router = useRouter();
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/events/${data.event.id}`);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-xl">
            <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border rounded p-2 border-gray-300"
                        placeholder="e.g. Beanpot 2026"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
                >
                    {submitting ? 'Creating...' : 'Create Event'}
                </button>
            </form>
        </div>
    );
}
