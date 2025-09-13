"use client"

import React from 'react'
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import AppSidebar from "@/components/AppSidebar"

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full  text-white">
        <AppSidebar />
          <main className="w-[80vw]">
            {children}
          </main>
      </div>
    </SidebarProvider>
  )
}
