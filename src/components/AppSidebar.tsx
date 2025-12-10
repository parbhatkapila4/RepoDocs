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
  SidebarSeparator,
  useSidebar
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
  Github,
  Brain,
  LogOut,
  BookOpen,
  Code,
  Plus,
  Trash2,
  MessageSquare,
  X,
  Crown,
  Zap,
  RefreshCw,
  BarChart3
} from "lucide-react"
import { RepoDocLogo } from "@/components/ui/repodoc-logo"
import { useUser } from "@/hooks/useUser"
import { useProjectsContext } from "@/context/ProjectsContext"
import { useClerk } from "@clerk/nextjs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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
    title: "Chat with Code",
    url: "/chat",
    icon: MessageSquare,
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
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  
]



export default function AppSidebar() {
  const { user, isLoading: userLoading, refreshUser } = useUser()
  const { projects, selectedProjectId, selectProject, deleteProject } = useProjectsContext()
  const { signOut } = useClerk()
  const pathname = usePathname()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { setOpenMobile, isMobile } = useSidebar()

  const handleSyncPlan = async (forcePlan?: string) => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/sync-plan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: forcePlan ? JSON.stringify({ forcePlan }) : undefined
      })
      const data = await response.json()
      console.log('Sync result:', data)
      
      if (data.success) {
        await refreshUser()
      }
    } catch (error) {
      console.error('Error syncing plan:', error)
    } finally {
      setIsSyncing(false)
    }
  }
  
  // Handle clicking on Pro badge sync button - try to sync, if still pro after sync, 
  // show option to force enterprise
  const handleProSyncClick = async () => {
    // First try normal sync
    await handleSyncPlan()
    
    // If user claims they purchased enterprise but still showing pro,
    // offer a quick prompt (using browser confirm for simplicity)
    setTimeout(() => {
      if (user?.plan === 'professional' || user?.plan === 'pro') {
        const shouldForce = window.confirm(
          'Still showing Pro? If you just purchased Enterprise, click OK to force update to Enterprise.'
        )
        if (shouldForce) {
          handleSyncPlan('enterprise')
        }
      }
    }, 1500)
  }

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Delete button clicked for project:', projectId)
    setProjectToDelete(projectId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        console.log('Deleting project:', projectToDelete)
        await deleteProject(projectToDelete)
        console.log('Project deleted successfully')
      } catch (error) {
        console.error('Failed to delete project:', error)
        alert('Failed to delete project. Please try again.')
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

  const handleCloseSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar variant="inset" className="border-white/15 border-r">
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RepoDocLogo size="sm" className="text-white" />
            <Link href="/">
              <span className="text-xl font-bold text-white">RepoDoc</span>
            </Link>
          </div>
          <button
            onClick={handleCloseSidebar}
            className="md:hidden p-1.5 hover:bg-white/10 rounded transition-colors text-white/70 hover:text-white"
            aria-label="Close sidebar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
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
                          className={`h-10 px-3 pr-8 rounded-lg transition-colors relative cursor-pointer ${
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
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 z-10"
                          title="Delete project"
                          type="button"
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
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage 
                      src={user?.imageUrl || undefined} 
                      alt={user?.firstName || user?.emailAddress || "User"} 
                    />
                    <AvatarFallback className="bg-gray-700 text-white text-sm">
                      {user?.firstName?.charAt(0) || user?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-medium text-sm truncate">
                      {userLoading ? "Loading..." : (user?.firstName || user?.emailAddress?.split('@')[0] || "User")}
                    </span>
                    {/* Plan Badge */}
                    {!userLoading && user?.plan && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {user.plan === 'professional' ? (
                          <>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full shadow-lg shadow-amber-500/20">
                              <Zap className="w-3 h-3 text-white" />
                              <span className="text-[10px] font-bold text-white tracking-wide uppercase">Pro</span>
                            </div>
                            <button
                              onClick={handleProSyncClick}
                              disabled={isSyncing}
                              className="p-1 hover:bg-white/10 rounded-full transition-colors"
                              title="Sync plan (click if you upgraded to Enterprise)"
                            >
                              <RefreshCw className={`w-3 h-3 text-gray-400 hover:text-white ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                          </>
                        ) : user.plan === 'enterprise' ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg shadow-purple-500/20">
                            <Crown className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">Enterprise</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSyncPlan()}
                            disabled={isSyncing}
                            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
                            title="Sync plan from Stripe"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Plan'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1 hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                </button>
              </div>
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
