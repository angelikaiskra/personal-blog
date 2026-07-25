'use client';

import { EnvelopeIcon } from "@/components/icons/envelope-icon";
import { GithubIcon } from "@/components/icons/github-icon";
import { LinkedinIcon } from "@/components/icons/linkedin-icon";
import { RssIcon } from "@/components/icons/rss-icon";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { type Dispatch, type SetStateAction, useEffect } from "react";

const mobileLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
];

const socialLinks = [
    {
        href: 'https://github.com/angela-iskra',
        label: 'GitHub',
        icon: GithubIcon,
        external: true,
    },
    {
        href: 'https://www.linkedin.com',
        label: 'LinkedIn',
        icon: LinkedinIcon,
        external: true,
    },
    {
        href: 'mailto:hello@angelaiskra.com',
        label: 'Email',
        icon: EnvelopeIcon,
    },
    {
        href: '/feed.xml',
        label: 'RSS',
        icon: RssIcon,
    },
];

type MobileMenuProps = {
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function MobileMenu({ isOpen, setIsOpen }: MobileMenuProps) {
    useEffect(() => {
        document.documentElement.classList.toggle('mobile-menu-scroll-lock', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';

        return () => {
            document.documentElement.classList.remove('mobile-menu-scroll-lock');
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <div className="sm:hidden">
            <button
                type="button"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-menu-panels"
                onClick={() => setIsOpen((open) => !open)}
                className="relative z-50 inline-flex h-10 items-center gap-3 rounded-md border border-white px-4 font-sans text-sm uppercase tracking-normal text-white mix-blend-difference transition-colors hover:bg-white/10"
            >
                <span>Menu</span>
                <span id="burger-lines" className="flex h-4 w-8 flex-col justify-between" aria-hidden="true">
                    <span
                        className={cn(
                            'h-0.5 rounded-full bg-current transition-transform duration-300 ease-out',
                            { 'translate-y-[7px] rotate-45': isOpen }
                        )}
                    />
                    <span
                        className={cn(
                            'h-0.5 rounded-full bg-current transition-opacity duration-200 ease-out',
                            { 'opacity-0': isOpen }
                        )}
                    />
                    <span
                        className={cn(
                            'h-0.5 rounded-full bg-current transition-transform duration-300 ease-out',
                            { '-translate-y-[7px] -rotate-45': isOpen }
                        )}
                    />
                </span>
            </button>

            <div
                id="mobile-menu-panels"
                className={cn(
                    'fixed inset-0 z-40 transition-[visibility] duration-0',
                    isOpen ? 'visible' : 'invisible delay-500'
                )}
            >
                <button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        'absolute inset-0 z-0 bg-foreground transition-opacity duration-500 ease-out',
                        isOpen ? 'opacity-100' : 'opacity-0'
                    )}
                />

                <div
                    id="black-opacity"
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute inset-0 z-10 bg-foreground opacity-0 transition-opacity duration-300 ease-out',
                        isOpen ? 'opacity-70' : 'opacity-0'
                    )}
                />

                <div
                    id="dark-panel"
                    className={cn(
                        'absolute left-0 top-0 z-20 h-2/3 w-full border border-black bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] rounded-2xl',
                        isOpen ? 'translate-x-0 delay-100' : '-translate-x-full delay-0'
                    )}
                >
                    <nav className="pt-32 pl-6">
                        <ul className="space-y-6">
                            {mobileLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="font-heading text-4xl font-bold tracking-tight text-muted"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                <div
                    id="light-panel"
                    className={cn(
                        'absolute right-0 top-2/3 z-20 h-1/3 w-full border border-black bg-muted transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] rounded-2xl',
                        isOpen ? 'translate-x-0 delay-100' : 'translate-x-full delay-0'
                    )}
                >
                    <nav className="pt-8 pl-6">
                        <ul className="space-y-4">
                            {socialLinks.map((link) => {
                                const Icon = link.icon;

                                return (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            target={link.external ? '_blank' : undefined}
                                            rel={link.external ? 'noopener noreferrer' : undefined}
                                            onClick={() => setIsOpen(false)}
                                            className="inline-flex items-center gap-3 whitespace-nowrap font-sans text-lg text-foreground transition-colors hover:text-muted-fg"
                                        >
                                            <Icon className="size-8" />
                                            <span>{link.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    <div
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute right-2 bottom-0 origin-bottom-right transition-all duration-300 ease-out',
                        )}
                    >
                        <Image
                            src="/cat-menu.png"
                            alt=""
                            width={1122}
                            height={1402}
                            className="h-auto w-36"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
