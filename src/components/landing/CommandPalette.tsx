"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ArrowRight,
  FileText,
  GitBranch,
  Github,
  Home,
  LogIn,
  MessageSquareQuote,
  Sparkles,
  Tag,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import { SUGGESTED_QUESTIONS } from "./system/graph-data";

export interface CommandPaletteHandle {
  open: () => void;
}

interface Props {
  onAskQuestion?: (id: string) => void;
}

export default function CommandPalette({ onAskQuestion }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const ask = useCallback(
    (id: string) => {
      setOpen(false);
      if (onAskQuestion) {
        onAskQuestion(id);
        return;
      }
      const target = isSignedIn
        ? "/create"
        : "/sign-in?redirect_url=" + encodeURIComponent("/create");
      router.push(target);
    },
    [isSignedIn, onAskQuestion, router]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search RepoDoc"
      className="max-w-2xl border border-white/10 bg-[#0b0b0e] text-white shadow-2xl"
    >
      <CommandInput placeholder="Type a command, route, or question…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Try a question">
          {SUGGESTED_QUESTIONS.map((q) => (
            <CommandItem
              key={q.id}
              value={`question ${q.short} ${q.prompt}`}
              onSelect={() => ask(q.id)}
            >
              <MessageSquareQuote className="text-violet-300" />
              <span>{q.short}</span>
              <CommandShortcut className="ml-auto">demo</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem value="home landing" onSelect={() => go("/")}>
            <Home />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            value="dashboard projects"
            onSelect={() => go(isSignedIn ? "/dashboard" : "/sign-in")}
          >
            <Sparkles />
            <span>{isSignedIn ? "Dashboard" : "Sign in to dashboard"}</span>
          </CommandItem>
          <CommandItem value="pricing plans" onSelect={() => go("/pricing")}>
            <Tag />
            <span>Pricing</span>
          </CommandItem>
          <CommandItem value="documentation docs" onSelect={() => go("/documentation")}>
            <FileText />
            <span>Documentation</span>
          </CommandItem>
          <CommandItem value="changelog releases" onSelect={() => go("/changelog")}>
            <GitBranch />
            <span>Changelog</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Get started">
          <CommandItem
            value="connect github repo new project"
            onSelect={() => go(isSignedIn ? "/create" : "/sign-in")}
          >
            <Github />
            <span>Connect a GitHub repo</span>
            <CommandShortcut className="ml-auto inline-flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
            </CommandShortcut>
          </CommandItem>
          {!isSignedIn && (
            <CommandItem value="sign in login" onSelect={() => go("/sign-in")}>
              <LogIn />
              <span>Sign in</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
