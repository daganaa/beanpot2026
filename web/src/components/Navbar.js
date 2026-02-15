'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0';
import styles from './Navbar.module.css';

export default function Navbar() {
    const pathname = usePathname();
    const { user, isLoading } = useUser();

    const navLinks = [
        { href: '/gallery', label: 'Gallery' },
        { href: '/upload', label: 'Upload' },
        { href: '/profile', label: 'Profile' },
    ];

    return (
        <nav className={styles.nav}>
            <div className={styles.navInner}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>📸</span>
                    SnapFind
                </Link>

                {user && (
                    <div className={styles.links}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`${styles.link} ${pathname === link.href ? styles.linkActive : ''
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}

                <div className={styles.actions}>
                    {isLoading ? null : user ? (
                        <div className={styles.userMenu}>
                            <span className={styles.userName}>
                                {user.name?.split(' ')[0]}
                            </span>
                            {user.picture && (
                                <Link href="/profile">
                                    <img
                                        src={user.picture}
                                        alt={user.name}
                                        className={styles.avatar}
                                    />
                                </Link>
                            )}
                            <a href="/auth/logout" className="btn btn-ghost">
                                Log out
                            </a>
                        </div>
                    ) : (
                        <a href="/auth/login" className="btn btn-primary">
                            Get Started
                        </a>
                    )}
                </div>
            </div>
        </nav>
    );
}
