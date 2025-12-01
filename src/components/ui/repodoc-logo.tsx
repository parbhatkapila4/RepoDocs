"use client"
import React, { useState } from 'react'
import Image from 'next/image'
import { Github } from 'lucide-react'

interface RepoDocLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RepoDocLogo({ size = 'md', className = '' }: RepoDocLogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-14 h-14'
  }

  const pixelSizes = {
    sm: 32,
    md: 40,
    lg: 56
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  }

  // Fallback to GitHub icon if image fails to load
  if (imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600`}>
        <Github className={`${iconSizes[size]} text-gray-300`} />
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-xl overflow-hidden`}>
      <Image
        src="/repodoc.png"
        alt="RepoDoc Logo"
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className="w-full h-full object-cover rounded-xl mix-blend-lighten"
        priority
        onError={() => setImageError(true)}
      />
    </div>
  )
}

export default RepoDocLogo
