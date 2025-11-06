'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/zustand_store/authStore';
import { logoutUser, getUserInfo } from '@/services/auth';
import IconComponent from './icon_component';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { hasHydrated, user, isAuthenticated, isLoading, setLoading, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const setShowAuthModal = useAuthStore((s) => s.setShowAuthModal);

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && !user) {
        setLoading(true);
        try {
          const userDetails = await getUserInfo();
          useAuthStore.getState().login(userDetails);
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          logout();
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUser();
  }, [isAuthenticated, user, setLoading, logout, router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      logout();
      window.location.reload();
    } catch (error) {
      console.error('Failed to log out:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  if (!hasHydrated || isLoading || (isAuthenticated && !user)) {
    return null;
  }

  return (
    <nav className="fixed h-[60px] top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-[var(--background)] dark:border-[var(--border)]">
      <div className="px-2 py-1.5">
        <div className="flex items-center justify-between">

          <div className="flex items-center">
            <Link href="/" className="flex items-center ms-2">
              <IconComponent />
              <span className="ml-2 py-2 text-2xl font-semibold whitespace-nowrap dark:text-white">
                Network
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={'/submit'}
              className="cursor-pointer flex gap-x-1 text-sm text-white hover:bg-[var(--button-create-background-hover)] px-3 py-2.5 rounded-full"
            >
              <svg fill="currentColor" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 9.25h-7.25V2a.772.772 0 0 0-.75-.75.772.772 0 0 0-.75.75v7.25H2a.772.772 0 0 0-.75.75c0 .398.352.75.75.75h7.25V18c0 .398.352.75.75.75s.75-.352.75-.75v-7.25H18c.398 0 .75-.352.75-.75a.772.772 0 0 0-.75-.75Z"></path>
              </svg>
              Create
            </Link>
            {isLoading ? (
              <span className="text-zinc-500 dark:text-zinc-400">Loading...</span>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  onClick={toggleDropdown}
                  className="cursor-pointer flex items-center text-sm rounded-full 
                  focus:ring-4 focus:ring-zinc-300 dark:focus:ring-zinc-600 hover:shadow-xl hover:ring-3 hover:ring-zinc-300 dark:hover:ring-zinc-600 
                  transition-all duration-200
                  "
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden relative">
                    <span className="sr-only">Open user menu</span>
                    <Image
                      src={`${user.avatar}`}
                      alt={`${user.username}'s avatar`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </button>
                <div
                  ref={dropdownRef}
                  className={`absolute right-0 mt-3 w-72 bg-white divide-y divide-zinc-100 rounded-xl shadow-xl border border-zinc-200 dark:bg-zinc-800 dark:divide-zinc-600 dark:border-zinc-700 transition-all duration-150 ease-out ${isDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                    }`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0">
                        <Image
                          src={`${user.avatar}`}
                          alt={`${user.username}'s avatar`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-md font-medium text-zinc-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-[140px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <ul className="py-2" role="none">
                    <li>
                      <Link
                        href={`/user/${user.slug}`}
                        onClick={closeDropdown}
                        className="group flex items-center px-7 py-3 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors duration-150"
                        role="menuitem"
                      >
                        <UserIcon size={19} className="mr-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors duration-150 flex-shrink-0" />
                        View Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/settings"
                        onClick={closeDropdown}
                        className="group flex items-center px-7 py-3 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors duration-150"
                        role="menuitem"
                      >
                        <Settings size={19} className="mr-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors duration-150 flex-shrink-0" />
                        Settings
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="group cursor-pointer flex items-center w-full text-left px-7 py-3 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors duration-150 disabled:opacity-50"
                        disabled={isLoading}
                        role="menuitem"
                      >
                        <LogOut size={19} className="mr-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors duration-150 flex-shrink-0" />
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="cursor-pointer text-sm text-white bg-[var(--button-login-background)] hover:bg-[var(--button-login-background-hover)] px-4 py-2.5 rounded-full transition-colors duration-150"
                >
                  Log in
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}