"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from "lucide-react"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"
import { useUser as useClerkUser, useClerk } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isSignedIn } = useClerkUser()
  const { signOut } = useClerk()
  const pathname = usePathname()

  return (
    <nav className="bg-transparent">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto py-4 pl-0 pr-4">
        <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <RepoDocLogo size="md" className="text-white" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">RepoDoc</span>
        </Link>

        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
          {isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  id="user-menu-button"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="w-8 h-8 rounded-full"
                    src={user.imageUrl || "/docs/images/people/profile-picture-3.jpg"}
                    alt="user photo"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600 w-56"
              >
                <ul className="py-2" aria-labelledby="user-menu-button">
                  <li>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/sign-in"
                className="text-sm text-white hover:text-blue-400 transition"
              >
                Sign In
              </Link>
            </div>
          )}

          <button
            data-collapse-toggle="navbar-user"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-user"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <div
          className={`items-center justify-between w-full md:flex md:w-auto md:order-1 md:-ml-[5rem] ${isMobileMenuOpen ? 'flex' : 'hidden'}`}
          id="navbar-user"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent dark:bg-gray-800 md:dark:bg-transparent">
            <li>
              <Link
                href="/"
                className={`block py-2 px-3 rounded-sm md:p-0 ${
                  pathname === "/"
                    ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                    : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                }`}
                aria-current={pathname === "/" ? "page" : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className={`block py-2 px-3 rounded-sm md:p-0 ${
                  pathname === "/about"
                    ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                    : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                }`}
                aria-current={pathname === "/about" ? "page" : undefined}
              >
                About
              </Link>
            </li>
            {isSignedIn ? (
              <li>
                <Link
                  href="/dashboard"
                  className={`block py-2 px-3 rounded-sm md:p-0 ${
                    pathname === "/dashboard"
                      ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                      : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  }`}
                  aria-current={pathname === "/dashboard" ? "page" : undefined}
                >
                  Dashboard
                </Link>
              </li>
            ) : (
              <li>
                <Link
                  href="/contact"
                  className={`block py-2 px-3 rounded-sm md:p-0 ${
                    pathname === "/contact"
                      ? "text-blue-400 bg-blue-700 md:bg-transparent md:text-blue-400"
                      : "text-white hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                  }`}
                  aria-current={pathname === "/contact" ? "page" : undefined}
                >
                  Contact
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
