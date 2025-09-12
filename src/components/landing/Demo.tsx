import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Code, Globe, Zap } from "lucide-react"

export default function Demo() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Try it yourself
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            See RepoDoc in action with our interactive demo. No signup required.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="glass-card border-subtle shadow-2xl">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input 
                    placeholder="https://github.com/username/repository"
                    className="flex-1 h-12 text-lg bg-white/5 border-subtle text-white placeholder:text-white/40"
                    aria-label="Enter GitHub repository URL"
                  />
                  <Button 
                    size="lg" 
                    className="bg-white/10 hover:bg-white/20 text-white h-12 px-8 border border-subtle glow-subtle"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Analyze
                  </Button>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-12 justify-start glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                    <FileText className="w-4 h-4 mr-2" />
                    React App Demo
                  </Button>
                  <Button variant="outline" className="h-12 justify-start glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                    <Code className="w-4 h-4 mr-2" />
                    FastAPI Demo
                  </Button>
                  <Button variant="outline" className="h-12 justify-start glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                    <Globe className="w-4 h-4 mr-2" />
                    Next.js Demo
                  </Button>
                </div>
                
                <div className="glass-card rounded-lg p-6 text-center border-subtle">
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-1/4 mx-auto mb-2"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-sm text-white/60 mt-4">
                    Click &quot;Analyze&quot; or try a demo to see the magic happen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
