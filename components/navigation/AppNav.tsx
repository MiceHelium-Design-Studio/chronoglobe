'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AppNavItem {
  href: string;
  label: string;
}

interface AppNavProps {
  items: AppNavItem[];
  className?: string;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ items, className }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-cyan-400/15 text-cyan-100'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
