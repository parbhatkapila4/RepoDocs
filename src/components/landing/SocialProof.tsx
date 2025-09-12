import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Star, Users, Code, FileText, Globe } from "lucide-react"

export default function SocialProof() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by developers worldwide
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join thousands of developers who are already using RepoDoc to improve their documentation.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-white/60">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-white/60 mb-4">
                &quot;RepoDoc saved me hours of documentation work. The AI-generated README was spot-on and included everything my team needed.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <p className="font-medium text-white">Sarah Chen</p>
                  <p className="text-sm text-white/60">Senior Developer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-white/60">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-white/60 mb-4">
                &quot;The architecture diagrams are incredibly helpful for onboarding new team members. It&apos;s like having a technical writer on demand.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                  <span className="text-white font-bold">M</span>
                </div>
                <div>
                  <p className="font-medium text-white">Mike Rodriguez</p>
                  <p className="text-sm text-white/60">Engineering Manager</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-subtle shadow-2xl hover:border-accent transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-white/60">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-white/60 mb-4">
                &quot;Perfect for open source projects. The one-click PR feature makes it so easy to contribute documentation back to the community.&quot;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3 border border-subtle glow-subtle">
                  <span className="text-white font-bold">A</span>
                </div>
                <div>
                  <p className="font-medium text-white">Alex Kim</p>
                  <p className="text-sm text-white/60">Open Source Maintainer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-40">
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-sm text-white/40">Open Source Maintainers</p>
            </div>
            <div className="text-center">
              <Code className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-sm text-white/40">Engineering Teams</p>
            </div>
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-sm text-white/40">Technical Writers</p>
            </div>
            <div className="text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 text-white/40" />
              <p className="text-sm text-white/40">Startup Founders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
