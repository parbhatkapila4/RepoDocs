import React from 'react'

interface RepoDocLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RepoDocLogo({ size = 'md', className = '' }: RepoDocLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* GitHub Repository (Left) - Source code files */}
        <rect x="10" y="15" width="25" height="70" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
        
        {/* Code files in repo */}
        <rect x="15" y="25" width="15" height="3" fill="#06b6d4" rx="1"/>
        <rect x="15" y="32" width="12" height="3" fill="#06b6d4" rx="1"/>
        <rect x="15" y="39" width="18" height="3" fill="#06b6d4" rx="1"/>
        <rect x="15" y="46" width="10" height="3" fill="#06b6d4" rx="1"/>
        
        {/* RAG Processing Pipeline (Center) */}
        {/* Vector embeddings */}
        <circle cx="50" cy="30" r="4" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1.5"/>
        <circle cx="50" cy="45" r="4" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1.5"/>
        <circle cx="50" cy="60" r="4" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1.5"/>
        <circle cx="50" cy="75" r="4" fill="#7c3aed" stroke="#5b21b6" strokeWidth="1.5"/>
        
        {/* Processing arrows */}
        <path d="M40 30 L46 30" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <path d="M40 45 L46 45" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <path d="M40 60 L46 60" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <path d="M40 75 L46 75" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        
        {/* Knowledge Base (Right) - Queryable database */}
        <rect x="65" y="20" width="25" height="60" rx="3" fill="#f8fafc" stroke="#06b6d4" strokeWidth="2"/>
        
        {/* Database structure */}
        <rect x="70" y="30" width="15" height="8" fill="#e0f2fe" stroke="#06b6d4" strokeWidth="1" rx="1"/>
        <rect x="70" y="45" width="15" height="8" fill="#e0f2fe" stroke="#06b6d4" strokeWidth="1" rx="1"/>
        <rect x="70" y="60" width="15" height="8" fill="#e0f2fe" stroke="#06b6d4" strokeWidth="1" rx="1"/>
        
        {/* Search/Query interface */}
        <circle cx="77" cy="25" r="2" fill="#7c3aed"/>
        <path d="M75 25 L79 25 M77 23 L77 27" stroke="#7c3aed" strokeWidth="1"/>
        
        {/* Connection lines showing RAG flow */}
        <path d="M35 50 L40 50" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,3"/>
        <path d="M54 50 L60 50" stroke="#06b6d4" strokeWidth="2" strokeDasharray="3,3"/>
        
        {/* Arrow markers */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#06b6d4"/>
          </marker>
        </defs>
      </svg>
    </div>
  )
}

export default RepoDocLogo
