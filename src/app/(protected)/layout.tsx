"use client"

import React from 'react'
import { 
  SidebarProvider
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/AppSidebar"
import UserProvider from "@/components/UserProvider"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full  text-white">
          <AppSidebar />
            <main className="w-[80vw]">
              {children}
            </main>
        </div>
      </SidebarProvider>
    </UserProvider>
  )
}
