"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Github, Play } from "lucide-react"
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'

export default function FinalCTA() {
  const { isAuthenticated } = useUser()
  const router = useRouter()

  const handleTryWithGitHub = () => {
    if (isAuthenticated) {
      router.push('/create')
    } else {
      router.push('/sign-up')
    }
  }

  return (
    <section className="py-20 relative">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-12 rounded-3xl border-subtle shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your repositories?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join thousands of developers who are already using RepoDoc to create better documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white/10 hover:bg-white/20 text-white h-12 px-8 text-lg border border-subtle glow-subtle"
              onClick={handleTryWithGitHub}
            >
              <Github className="w-5 h-5 mr-2" />
              Try with GitHub
            </Button>
            
          </div>
        </div>
      </div>
    </section>
  )
}
