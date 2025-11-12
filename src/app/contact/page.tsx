import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Mail,
  MessageSquare,
  Github,
  ArrowLeft,
  Send,
  MapPin,
  Phone
} from "lucide-react"
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/3 rounded-full blur-3xl floating" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Home Button */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            className="border-subtle text-white/70 hover:text-white hover:bg-white/5 glass-card"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm glass-card text-white/90 border-subtle">
            <MessageSquare className="w-4 h-4 mr-2 text-white/80" />
            Get in Touch
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Contact Us
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            Have questions, feedback, or want to collaborate? We'd love to hear from you!
          </p>
        </div>

        {/* Contact Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card border-subtle">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="w-6 h-6 mr-3 text-white/80" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:help@productsolutions.net" 
                  className="text-white/70 hover:text-white transition-colors text-lg"
                >
                  help@productsolutions.net
                </a>
              </CardContent>
            </Card>

            <Card className="glass-card border-subtle">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Github className="w-6 h-6 mr-3 text-white/80" />
                  GitHub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="https://github.com/parbhatkapila4/RepoDocs" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white transition-colors text-lg"
                >
                  github.com/parbhatkapila4/RepoDocs
                </a>
              </CardContent>
            </Card>

            <Card className="glass-card border-subtle">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-3 text-white/80" />
                  Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">
                  For technical support, feature requests, or bug reports, please open an issue on our GitHub repository.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-subtle">
              <CardHeader>
                <CardTitle className="text-white">Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-4 py-3 bg-white/5 border border-subtle rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-3 bg-white/5 border border-subtle rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-white/80 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="w-full px-4 py-3 bg-white/5 border border-subtle rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                      placeholder="What's this about?"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      className="w-full px-4 py-3 bg-white/5 border border-subtle rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    className="w-full bg-white/10 hover:bg-white/20 text-white h-12 text-lg border border-subtle glow-subtle"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="glass-card border-subtle mt-6">
              <CardHeader>
                <CardTitle className="text-white">Other Ways to Connect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white/70">
                    <strong className="text-white">Open Source Contributions:</strong> We welcome contributions! Check out our GitHub repository for open issues and contribution guidelines.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white/70">
                    <strong className="text-white">Feature Requests:</strong> Have an idea for a new feature? Open a discussion on GitHub or send us an email.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <p className="text-white/70">
                    <strong className="text-white">Partnerships:</strong> Interested in partnering with RepoDoc? Reach out to discuss collaboration opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

