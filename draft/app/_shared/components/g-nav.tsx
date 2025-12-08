/* Location: app/_shared/components/mobile-nav.tsx */

import { useEffect, useState } from 'react';
import styles from './g-nav.module.css';

interface NavItem {
    href: string;
    label: string;
}

interface MobileNavProps {
    items: NavItem[];
    logo?: {
        href: string;
        text: string;
    };
    statusBadge?: React.ReactNode;
}

export function MobileNav({ items, logo, statusBadge }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close menu when clicking outside or on escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest(`.${styles.mobileNav}`)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('click', handleClickOutside);
            // Prevent body scrolling when menu is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    return (
        <div className={styles.mobileNav}>
            {/* Header with logo and hamburger */}
            <div className={styles.mobileHeader}>
                {logo && (
                    <a href={logo.href} className={styles.mobileLogo}>
                        {logo.text}
                        {statusBadge}
                    </a>
                )}

                <button
                    className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`}
                    onClick={toggleMenu}
                    aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isOpen}
                >
                    <span className={styles.hamburgerLine} />
                    <span className={styles.hamburgerLine} />
                    <span className={styles.hamburgerLine} />
                </button>
            </div>

            {/* Overlay */}
            {isOpen && <div className={styles.overlay} onClick={closeMenu} />}

            {/* Mobile menu */}
            <nav className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ''}`} aria-hidden={!isOpen}>
                <ul className={styles.mobileMenuList}>
                    {items.map((item, index) => (
                        <li key={item.href} className={styles.mobileMenuItem}>
                            <a
                                href={item.href}
                                className={styles.mobileMenuLink}
                                onClick={closeMenu}
                                tabIndex={isOpen ? 0 : -1}
                                style={{
                                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                                }}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}

/**
 * Desktop navigation component
 */
interface DesktopNavProps {
    items: NavItem[];
    logo?: {
        href: string;
        text: string;
    };
    statusBadge?: React.ReactNode;
}

export function DesktopNav({ items, logo, statusBadge }: DesktopNavProps) {
    return (
        <nav className={styles.desktopNav}>
            {logo && (
                <a href={logo.href} className={styles.desktopLogo}>
                    {logo.text}
                    {statusBadge}
                </a>
            )}

            <div className={styles.desktopNavLinks}>
                {items.map((item) => (
                    <a key={item.href} href={item.href} className={styles.desktopNavLink}>
                        {item.label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
