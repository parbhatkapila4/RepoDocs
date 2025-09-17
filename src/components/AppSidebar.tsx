"use client"

import React, { useState } from 'react'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  LayoutDashboard, 
  FileText,
  Github,
  Brain,
  LogOut,
  BookOpen,
  Code,
  Plus,
  Trash2
} from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useProjectsContext } from "@/context/ProjectsContext"
import { useClerk } from "@clerk/nextjs"

type NavigationItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    title: "My Repos",
    url: "/dashboard",
    icon: Github,
  },
  {
    title: "Generated Docs",
    url: "/docs",
    icon: BookOpen,
  },
  {
    title: "Generate Readme",
    url: "/readme",
    icon: Brain,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  
]



export default function AppSidebar() {
  const { user, isLoading: userLoading } = useUser()
  const { projects, selectedProjectId, selectProject, deleteProject } = useProjectsContext()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjectToDelete(projectId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete)
      } catch (error) {
        console.error('Failed to delete project:', error)
      }
    }
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setProjectToDelete(null)
  }

  const handleLogout = () => {
    signOut()
  }

  return (
    <Sidebar variant="inset" className="border-white/15 border-r">
      <SidebarHeader className=" p-2 ">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8  rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <Link href="/">
          <span className="text-xl font-bold text-white">RepoDoc</span>
          </Link>
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
                      <div className="group relative">
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
                        <button
                          onClick={(e) => handleDeleteClick(project.id, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                          title="Delete project"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
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
                  {userLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0) || user?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="text-white font-medium">
                  {userLoading ? "Loading..." : (user?.firstName || user?.emailAddress?.split('@')[0] || "User")}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}
