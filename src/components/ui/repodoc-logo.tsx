"use client";
import { useState } from "react";
import Image from "next/image";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepoDocLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RepoDocLogo({ size = "md", className = "" }: RepoDocLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 56,
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  if (imageError) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "relative flex items-center justify-center rounded-full border border-gray-600 bg-linear-to-br from-gray-700 to-gray-900",
          className,
        )}
      >
        <Github className={`${iconSizes[size]} text-gray-300`} />
      </div>
    );
  }

  return (
    <Image
      src="/repodoc.png"
      alt="RepoDoc Logo"
      width={pixelSizes[size]}
      height={pixelSizes[size]}
      className={cn(sizeClasses[size], "object-contain", className)}
      priority
      onError={() => setImageError(true)}
    />
  );
}

export default RepoDocLogo;
