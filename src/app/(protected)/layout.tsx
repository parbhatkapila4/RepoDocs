"use client";

import React from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import UserProvider from "@/components/UserProvider";
import { ProjectsProvider } from "@/context/ProjectsContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProjectsProvider>
        <SidebarProvider>
          <div className="flex h-screen w-full text-white">
            <AppSidebar />
            <SidebarInset className="flex-1 h-full overflow-y-auto scrollbar-hide">
              <div className="flex items-center gap-2 p-2 sm:p-4 border-b border-white/10 md:hidden">
                <SidebarTrigger />
              </div>
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ProjectsProvider>
    </UserProvider>
  );
}
