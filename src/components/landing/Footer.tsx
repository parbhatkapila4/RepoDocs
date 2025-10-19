import React from 'react'
import Link from 'next/link'
import { FileText, Github, ExternalLink } from "lucide-react"

export default function Footer() {
  return (
    <footer className="glass-dark py-12 border-t border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">RepoDoc</span>
            </div>
            <p className="text-white/60 text-sm max-w-md">
              Turn your GitHub repositories into queryable knowledge bases with RAG technology. 
              Ask questions about your code and get instant, accurate answers.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-white/60 hover:text-white transition-colors text-sm">Dashboard</Link></li>
              <li><Link href="/about" className="text-white/60 hover:text-white transition-colors text-sm">About RepoDoc</Link></li>
              <li><a href="https://repodoc.parbhat.dev/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm flex items-center">
                Live Demo <ExternalLink className="w-3 h-3 ml-1" />
              </a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="https://github.com/parbhatkapila4/RepoDocs" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors text-sm flex items-center">
                GitHub <Github className="w-3 h-3 ml-1" />
              </a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              © 2025 RepoDoc. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="https://github.com/parbhatkapila4/RepoDocs" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
