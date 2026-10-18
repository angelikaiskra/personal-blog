'use client';

import { navigationLinks, socialLinks } from '@/config/links';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { type Dispatch, type SetStateAction, useEffect } from 'react';

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
        className={cn(
          'relative z-50 inline-flex size-11 items-center justify-center rounded-md bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current motion-reduce:transition-none',
          isOpen
            ? 'text-menu-light hover:bg-white/10 hover:text-white'
            : 'text-muted-fg hover:bg-muted hover:text-foreground dark:text-foreground dark:hover:bg-muted-hover dark:hover:text-menu-cream',
        )}
      >
        <span className="relative flex size-7 items-center justify-center" aria-hidden="true">
          <span
            className={cn(
              'absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-200 ease-out motion-reduce:transition-none',
              isOpen ? 'scale-x-125 rotate-45' : '-translate-y-1.5',
            )}
          />
          <span
            className={cn(
              'absolute h-0.5 w-4 rounded-full bg-current transition-opacity duration-200 ease-out motion-reduce:transition-none',
              isOpen ? 'opacity-0' : 'opacity-100',
            )}
          />
          <span
            className={cn(
              'absolute h-0.5 w-4 rounded-full bg-current transition-transform duration-200 ease-out motion-reduce:transition-none',
              isOpen ? 'scale-x-125 -rotate-45' : 'translate-y-1.5',
            )}
          />
        </span>
      </button>

      <div
        id="mobile-menu-panels"
        className={cn(
          'fixed inset-x-0 top-0 z-40 h-dvh overflow-hidden transition-[visibility] duration-0',
          isOpen ? 'visible' : 'invisible delay-500',
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
          className={cn(
            'absolute inset-0 z-0 bg-menu-dark transition-opacity duration-500 ease-out',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div
          id="black-opacity"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-10 bg-menu-dark transition-opacity duration-300 ease-out',
            isOpen ? 'opacity-70' : 'opacity-0',
          )}
        />

        <div
          id="dark-panel"
          className={cn(
            'absolute top-0 left-0 z-20 h-2/3 w-full rounded-2xl border border-black bg-menu-dark transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] [@media(max-height:749px)]:h-3/5',
            isOpen ? 'translate-x-0 delay-100' : '-translate-x-full delay-0',
          )}
        >
          <nav className="pt-32 pl-6 [@media(max-height:749px)]:pt-26">
            <ul className="space-y-6">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="font-heading text-4xl font-bold tracking-tight text-menu-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div
            className="pointer-events-none absolute right-4 bottom-3 h-[40%] max-h-56 w-[52%] max-w-52"
            aria-hidden="true"
          >
            <Image src="/cat-menu.png" alt="" fill sizes="208px" className="object-contain object-bottom-right" />
          </div>
        </div>

        <div
          id="light-panel"
          className={cn(
            'absolute top-2/3 right-0 z-20 h-1/3 w-full rounded-2xl border border-black bg-menu-light transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] [@media(max-height:749px)]:top-3/5 [@media(max-height:749px)]:h-2/5',
            isOpen ? 'translate-x-0 delay-100' : 'translate-x-full delay-0',
          )}
        >
          <nav className="pt-8 pl-6 [@media(max-height:749px)]:pt-6">
            <ul className="space-y-4 [@media(max-height:749px)]:space-y-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-3 font-sans text-lg whitespace-nowrap text-menu-dark transition-colors hover:text-menu-muted"
                    >
                      <Icon className="size-8" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
