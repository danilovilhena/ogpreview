'use client';

import Logo from '@/components/logo';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-5xl mx-auto flex items-center justify-center">
        <Link href="/" className="flex items-center gap-1.5 text-2xl font-serif text-sky-600 italic font-medium hover:text-sky-700 transition-colors">
          <Logo className="size-6" />
          ogpreview.co
        </Link>
      </div>
    </header>
  );
}
