'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { searchQuery, SearchResult } from '@/services/api';
import { Search, Loader2 } from 'lucide-react';

export default function SearchComponent() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const debounceTimer = setTimeout(async () => {
            try {
                const data = await searchQuery(query);
                setResults(data);
            } catch (error) {
                console.error("Failed to fetch search results:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLinkClick = () => {
        setIsDropdownVisible(false);
        setQuery('');
    };

    return (
        <div className="relative w-full max-w-xl" ref={searchRef}>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsDropdownVisible(true)}
                    placeholder="Search Network..."
                    className="block w-full rounded-full max-h-[42px] border border-gray-300 bg-gray-100 py-2.5 pl-10 pr-4 text-base text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-zinc-400 focus:outline-none"
                />
            </div>

            {isDropdownVisible && query.length >= 2 && (
                <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[var(--border)] dark:bg-zinc-800">
                    {isLoading && (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    )}

                    {!isLoading && results.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            No results found for "{query}".
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <ul className="max-h-80 overflow-y-auto">
                            {results.map((result) => (
                                <li key={`${result.type}-${result.id}`}>
                                    <Link
                                        href={result.type === 'user' ? `/user/${result.slug}` : `/communities/${result.slug}`}
                                        onClick={handleLinkClick}
                                        className="group flex items-center px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-700"
                                    >
                                        {result.type === 'community' ? (
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600">
                                                <Image src={result.icon} alt={result.name} width={36} height={36} className="rounded-full object-cover" />

                                            </div>
                                        ) : (
                                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600">
                                                <Image src={result.avatar} alt={result.username} width={36} height={36} className="rounded-full object-cover" />
                                            </div>
                                        )}
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {result.type === 'community' ? result.name : result.username}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                                {result.type}
                                            </p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}