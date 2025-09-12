import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Globe, ExternalLink, Download, GitBranch } from "lucide-react"

export default function DashboardPreview() {
  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your documentation dashboard
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Manage all your generated docs in one place with powerful sharing and collaboration features.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-card border-subtle shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FileText className="w-5 h-5 mr-2" />
                Repository Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass-card rounded-lg border-subtle">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-subtle glow-subtle">
                      <span className="text-white text-sm font-bold">R</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">react-dashboard</p>
                      <p className="text-sm text-white/60">Last updated 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 glass-card rounded-lg border-subtle">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-subtle glow-subtle">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">api-server</p>
                      <p className="text-sm text-white/60">Last updated 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-subtle shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Globe className="w-5 h-5 mr-2" />
                Public Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 glass-card border-subtle rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">react-dashboard docs</h4>
                    <Badge variant="secondary" className="glass-card border-subtle text-white/80">Public</Badge>
                  </div>
                  <p className="text-sm text-white/60 mb-3">
                    Comprehensive documentation for the React dashboard project
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <GitBranch className="w-4 h-4 mr-1" />
                      Create PR
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 glass-card border-subtle rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">api-server docs</h4>
                    <Badge variant="secondary" className="glass-card border-subtle text-white/80">Public</Badge>
                  </div>
                  <p className="text-sm text-white/60 mb-3">
                    API documentation and usage examples
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5">
                      <GitBranch className="w-4 h-4 mr-1" />
                      Create PR
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
