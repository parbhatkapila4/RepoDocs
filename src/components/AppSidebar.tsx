"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarSeparator
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  FileText,
  Github,
  Brain,
  LogOut,
  BookOpen,
  Code,
  Plus
} from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useProjectsContext } from "@/context/ProjectsContext"

type NavigationItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Repos",
    url: "/repos",
    icon: Github,
  },
  {
    title: "Generated Docs",
    url: "/docs",
    icon: BookOpen,
  },
  {
    title: "AI Analysis",
    url: "/analysis",
    icon: Brain,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  
]



export default function AppSidebar() {
  const { user } = useUser()
  const { projects, selectedProjectId, selectProject } = useProjectsContext()
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" className="border-white/15 border-r">
      <SidebarHeader className=" p-2 ">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8  rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">RepoDoc</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="  py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`h-10 px-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <Link href={item.url} target={item.external ? "_blank" : undefined}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-4 bg-gray-800" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 px-2">
            My Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length > 0 ? (
                projects.map((project) => {
                  const isSelected = selectedProjectId === project.id
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton 
                        onClick={() => selectProject(project.id)}
                        className={`h-10 px-3 rounded-lg transition-colors relative cursor-pointer ${
                          isSelected 
                            ? " text-white " 
                            : " text-white/40"
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        <span className="truncate">{project.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              ) : (
                <SidebarMenuItem>
                  <div className="h-10 px-3 flex items-center text-gray-500 text-sm">
                    No projects yet
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>

      <SidebarFooter className=" p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || "P"}
                  </span>
                </div>
                <span className="text-white font-medium">
                  {user?.firstName || "Parbhat"}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-800 rounded transition-colors">
                <LogOut className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
