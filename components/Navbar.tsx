'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { linkStyles } from '@/lib/ui-utils';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - App name/logo */}
          <div className="flex-shrink-0">
            <Link href="/" className={linkStyles.brand}>
              Dodo Payments Demo
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link 
                href="/pricing" 
                className={linkStyles.navbar}
              >
                Pricing
              </Link>
              
              {user && (
                <Link 
                  href="/dashboard" 
                  className={linkStyles.navbar}
                >
                  Dashboard
                </Link>
              )}

              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">
                    {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className={linkStyles.navbar}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className={linkStyles.navbar}
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white focus:outline-none focus:text-white cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-800">
              <Link 
                href="/pricing" 
                className={linkStyles.navbarMobile}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              
              {user && (
                <Link 
                  href="/dashboard" 
                  className={linkStyles.navbarMobile}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {user ? (
                <>
                  <div className="text-gray-300 px-3 py-2 text-sm border-t border-gray-800 mt-2 pt-2">
                    Signed in as: {user.email}
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`${linkStyles.navbarMobile} w-full text-left`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link 
                  href="/login" 
                  className={linkStyles.navbarMobile}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
