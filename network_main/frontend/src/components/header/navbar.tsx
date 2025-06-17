'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/zustand_store/authStore';
import { logoutUser, getUserInfo } from '@/services/auth';
import IconComponent from './icon_component';
import AuthModalController from '../auth/AuthModalController';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const router = useRouter();
  const { hasHydrated, user, isAuthenticated, isLoading, setLoading, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  if (!hasHydrated || isLoading || (isAuthenticated && !user)) {
    return null;
  }

  return (
    <nav className="fixed h-[60px] top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-[var(--background)] dark:border-[var(--border)]">
      <div className="px-2 py-1.5">
        <div className="flex items-center justify-between">

          <div className="flex items-center">
            <a href="/" className="flex items-center ms-2">
              <IconComponent />
              <span className="ml-2 py-2 text-2xl font-semibold whitespace-nowrap dark:text-white">
                Network
              </span>
            </a>
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
              <span className="text-gray-500 dark:text-gray-400">Loading...</span>
            ) : isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="flex items-center text-sm rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden relative">
                    <span className="sr-only">Open user menu</span>
                    <Image
                      src={user.avatar || '/default-avatar.png'}
                      alt={`${user.username}'s avatar`}
                      fill
                      className="object-cover"
                    />
                  </div>

                </button>
                <div
                  className={`absolute right-0 mt-2 w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-lg shadow-black dark:bg-gray-700 dark:divide-gray-600 ${isDropdownOpen ? '' : 'hidden'}`}
                  id="dropdown-user"
                >
                  <div className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-300">
                      {user.email}
                    </p>
                  </div>
                  <ul className="py-1">
                    <li>
                      <a
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        Dashboard
                      </a>
                    </li>
                    <li>
                      <a
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        Settings
                      </a>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white"
                        disabled={isLoading}
                      >
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
                  className="cursor-pointer text-sm text-white bg-[var(--button-login-background)] hover:bg-[var(--button-login-background-hover)] px-4 py-2.5 rounded-full"
                >
                  Log in
                </button>

                {showAuthModal && (
                  <AuthModalController onCloseAll={() => setShowAuthModal(false)} />
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}