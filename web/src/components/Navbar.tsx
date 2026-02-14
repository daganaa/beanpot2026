'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function Navbar() {
    const { user, isLoading } = useUser();
    const pathname = usePathname();

    const links = [
        { href: '/my-photos', label: 'My Photos' },
        { href: '/upload', label: 'Upload' },
        { href: '/enroll', label: 'Setup FaceID' },
    ];

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-blue-600">PhotoApp</Link>

                <div className="flex items-center space-x-4">
                    {user ? (
                        <>
                            {links.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={clsx(
                                        "text-sm font-medium hover:text-blue-600 transition-colors",
                                        pathname === link.href ? "text-blue-600" : "text-gray-600"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <a href="/api/auth/logout" className="text-sm text-gray-500 hover:text-black ml-4">Logout</a>
                        </>
                    ) : (
                        !isLoading && <a href="/api/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Login</a>
                    )}
                </div>
            </div>
        </nav>
    );
}
