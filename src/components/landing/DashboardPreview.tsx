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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <Card className="glass-card border-subtle shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FileText className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
                <span className="text-lg sm:text-xl">Repository Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-3 glass-card rounded-lg border-subtle gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-3">
                    <div className="w-12 h-12 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center border border-subtle glow-subtle flex-shrink-0">
                      <span className="text-white text-base sm:text-sm font-bold">R</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-base sm:text-base">react-dashboard</p>
                      <p className="text-sm sm:text-sm text-white/60">Last updated 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-10 h-10 sm:w-auto sm:h-auto">
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-10 h-10 sm:w-auto sm:h-auto">
                      <Download className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-3 glass-card rounded-lg border-subtle gap-3 sm:gap-0">
                  <div className="flex items-center space-x-3 sm:space-x-3">
                    <div className="w-12 h-12 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center border border-subtle glow-subtle flex-shrink-0">
                      <span className="text-white text-base sm:text-sm font-bold">A</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-base sm:text-base">api-server</p>
                      <p className="text-sm sm:text-sm text-white/60">Last updated 1 day ago</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-10 h-10 sm:w-auto sm:h-auto">
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-10 h-10 sm:w-auto sm:h-auto">
                      <Download className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-subtle shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Globe className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
                <span className="text-lg sm:text-xl">Public Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-5 sm:p-4 glass-card border-subtle rounded-lg">
                  <div className="flex items-center justify-between mb-3 sm:mb-2">
                    <h4 className="font-medium text-white text-base sm:text-base">react-dashboard docs</h4>
                    <Badge variant="secondary" className="glass-card border-subtle text-white/80 text-xs sm:text-xs px-2 py-1">Public</Badge>
                  </div>
                  <p className="text-sm sm:text-sm text-white/60 mb-4 sm:mb-3">
                    Comprehensive documentation for the React dashboard project
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-full sm:w-auto">
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-full sm:w-auto">
                      <GitBranch className="w-5 h-5 sm:w-4 sm:h-4 mr-1" />
                      Create PR
                    </Button>
                  </div>
                </div>
                
                <div className="p-5 sm:p-4 glass-card border-subtle rounded-lg">
                  <div className="flex items-center justify-between mb-3 sm:mb-2">
                    <h4 className="font-medium text-white text-base sm:text-base">api-server docs</h4>
                    <Badge variant="secondary" className="glass-card border-subtle text-white/80 text-xs sm:text-xs px-2 py-1">Public</Badge>
                  </div>
                  <p className="text-sm sm:text-sm text-white/60 mb-4 sm:mb-3">
                    API documentation and usage examples
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-full sm:w-auto">
                      <ExternalLink className="w-5 h-5 sm:w-4 sm:h-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="glass-card border-subtle text-white/70 hover:text-white hover:bg-white/5 w-full sm:w-auto">
                      <GitBranch className="w-5 h-5 sm:w-4 sm:h-4 mr-1" />
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
