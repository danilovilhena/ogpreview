/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useTransition } from 'react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    setSearchQuery(initialSearch);
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    if (!isFocused && currentSearch !== searchQuery) {
      setSearchQuery(currentSearch);
    }
  }, [searchParams, isFocused, searchQuery]);

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFocused && searchQuery) {
          setSearchQuery('');
          performSearch('');
        } else if (!isFocused) {
          inputRef.current?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isFocused, searchQuery]);

  const performSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    startTransition(() => {
      const params = new URLSearchParams(searchParams);

      if (query.trim()) {
        params.set('search', query.trim());
      } else {
        params.delete('search');
      }

      params.delete('page');

      const queryString = params.toString();
      const newUrl = queryString ? `/?${queryString}` : '/';

      router.replace(newUrl, { scroll: false });
    });
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const currentSearch = searchParams.get('search') || '';
    if (searchQuery === currentSearch) {
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      performSearch(searchQuery);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 size-4 z-10" />
      <Input
        ref={inputRef}
        type="search"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search websites..."
        className="pl-10 py-2.5 text-sm bg-white/80 border-neutral-200 focus:border-sky-300 focus:ring-sky-200"
      />
    </div>
  );
}
