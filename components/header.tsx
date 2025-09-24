'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        console.log('Auto-searching for:', searchQuery);
        // TODO: Implement actual search functionality
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center  gap-3 text-3xl font-serif text-sky-600 italic font-medium hover:text-sky-700 transition-colors">
          ogpreview.co
        </Link>

        <div className="relative w-full max-w-64">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400 size-3" />
          <Input //
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search websites..."
            className="text-[12px]! py-1.5 px-2 pl-7 h-auto placeholder:text-[12px]! bg-white/50"
          />
        </div>
      </div>
    </header>
  );
}
