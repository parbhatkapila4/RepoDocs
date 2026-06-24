"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  BarChart3,
  Search,
  FileDiff,
  GitCompare,
  Network,
  Activity,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { RepoDocLogo } from "@/components/ui/repodoc-logo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@/hooks/useUser";
import { useProjectsContext } from "@/context/ProjectsContext";
import { useClerk } from "@clerk/nextjs";
import { UserAvatar } from "@/components/ui/user-avatar";

type NavigationItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    title: "My Repos",
    url: "/dashboard",
    icon: Github,
  },
  {
    title: "Create",
    url: "/create",
    icon: Plus,
  },
  {
    title: "Chat with Code",
    url: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Architecture",
    url: "/architecture",
    icon: Network,
  },
  {
    title: "Analyze Diff",
    url: "/diff",
    icon: FileDiff,
  },
  {
    title: "Drift",
    url: "/drift",
    icon: GitCompare,
  },
  {
    title: "Observability",
    url: "/observability",
    icon: Activity,
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
];

export default function AppSidebar() {
  const { user, isLoading: userLoading } = useUser();
  const {
    projects,
    selectedProjectId,
    selectProject,
    deleteProject,
    loadError,
    isLoading: projectsLoading,
    loadProjects,
  } = useProjectsContext();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { setOpenMobile, isMobile } = useSidebar();

  // On mobile, once navigation lands on a new route, close the slide-in
  // sidebar so the loaded page is visible. No-op on desktop (isMobile === false),
  // where the sidebar is persistent.
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
      } catch (error) {
        alert("Failed to delete project. Please try again.");
      }
    }
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar
      variant="inset"
      className="border-white/15 border-r scrollbar-hide"
    >
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

      <SidebarContent className="py-3 scrollbar-hide">
        {loadError && (
          <div className="px-2 mb-3">
            <Alert
              variant="destructive"
              className="border-red-500/40 bg-red-950/40 text-red-100 [&>svg]:text-red-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Database unreachable</AlertTitle>
              <AlertDescription className="text-xs text-red-200/90 leading-snug space-y-2">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadProjects()}
                  className="text-xs font-medium text-white underline underline-offset-2 hover:text-red-50"
                >
                  Retry
                </button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`h-10 px-3 rounded-lg transition-colors ${isActive
                        ? "bg-white/20 text-white"
                        : "hover:bg-white/10 text-gray-300"
                        }`}
                    >
                      <Link
                        href={item.url}
                        target={item.external ? "_blank" : undefined}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
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
              {projectsLoading ? (
                <SidebarMenuItem>
                  <div className="h-10 px-3 flex items-center text-gray-500 text-sm">
                    Loading projects…
                  </div>
                </SidebarMenuItem>
              ) : projects.length > 0 ? (
                projects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <div className="group relative">
                        <SidebarMenuButton
                          onClick={() => selectProject(project.id)}
                          className={`h-10 px-3 pr-8 rounded-lg transition-colors relative cursor-pointer overflow-hidden ${isSelected ? " text-white " : " text-white/40"
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
                  );
                })
              ) : loadError ? (
                <SidebarMenuItem>
                  <div className="h-auto min-h-10 px-3 py-2 text-gray-400 text-xs leading-snug">
                    Fix the connection above, then retry.
                  </div>
                </SidebarMenuItem>
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
                  <UserAvatar
                    src={user?.imageUrl}
                    name={[user?.firstName, user?.lastName]
                      .filter(Boolean)
                      .join(" ")}
                    email={user?.emailAddress}
                    className="h-8 w-8"
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-white font-medium text-sm truncate">
                      {userLoading
                        ? "Loading..."
                        : user?.firstName ||
                        user?.emailAddress?.split("@")[0] ||
                        "User"}
                    </span>
                    {!userLoading && user?.plan && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {user.plan === "professional" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-linear-to-r from-amber-500 via-orange-500 to-amber-500 rounded-full shadow-lg shadow-amber-500/20">
                            <Zap className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                              Pro
                            </span>
                          </div>
                        ) : user.plan === "enterprise" ? (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-full shadow-lg shadow-purple-500/20">
                            <Crown className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                              Enterprise
                            </span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  aria-busy={isLoggingOut}
                  aria-label={isLoggingOut ? "Signing out" : "Sign out"}
                  className="relative p-1.5 rounded-md hover:bg-white/10 transition-colors shrink-0 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  title={isLoggingOut ? "Signing out…" : "Logout"}
                  type="button"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isLoggingOut ? (
                      <motion.span
                        key="loader"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="block"
                      >
                        <LogOut className="w-4 h-4 text-gray-400" />
                      </motion.span>
                    )}
                  </AnimatePresence>
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
              Are you sure you want to delete this project? This action cannot
              be undone.
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

      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            key="logout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-md"
            aria-live="polite"
            role="status"
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#0c0c0e]/80 px-10 py-8 shadow-2xl shadow-black/40"
            >
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-10 w-10 rounded-full bg-white/5 blur-md" />
                <Loader2 className="relative w-6 h-6 text-white animate-spin" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-white text-sm font-medium tracking-tight">
                  Signing out
                </span>
                <span className="text-[#888] text-xs font-mono tracking-wide">
                  Ending session…
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sidebar>
  );
}
