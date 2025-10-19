import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Shield,
  BookOpen,
  Mail,
  Clock,
  Users,
  FileText,
  ArrowLeft,
  Lock,
  Eye,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import Link from 'next/link'

export default function PrivacyPolicyPage() {
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
            <Shield className="w-4 h-4 mr-2 text-white/80" />
            Privacy Policy
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Privacy Policy
          </h1>
          
          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            How RepoDoc collects, uses, and protects your information. Your privacy is our priority.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          <div className="lg:col-span-1">
            <Card className="glass-card border-subtle sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#introduction" className="block text-white/60 hover:text-white transition-colors text-sm">Introduction</a>
                <a href="#information-collection" className="block text-white/60 hover:text-white transition-colors text-sm">Information We Collect</a>
                <a href="#how-we-use" className="block text-white/60 hover:text-white transition-colors text-sm">How We Use Information</a>
                <a href="#data-sharing" className="block text-white/60 hover:text-white transition-colors text-sm">Data Sharing</a>
                <a href="#data-security" className="block text-white/60 hover:text-white transition-colors text-sm">Data Security</a>
                <a href="#your-rights" className="block text-white/60 hover:text-white transition-colors text-sm">Your Rights</a>
                <a href="#contact" className="block text-white/60 hover:text-white transition-colors text-sm">Contact Us</a>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-12">
            {/* Introduction Section */}
            <section id="introduction">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BookOpen className="w-6 h-6 mr-3 text-white/80" />
                    Introduction
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    This Privacy Policy describes how RepoDoc ("we," "us," or "our") collects, uses, and discloses your information when you use our RAG-powered codebase intelligence platform.
                  </p>
                  
                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-3">Our Commitment</h4>
                    <p className="text-white/70">
                      We are committed to protecting your privacy and handling your data with the highest standards of security and transparency. 
                      Your code and personal information are treated with the utmost care and respect.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Information Collection Section */}
            <section id="information-collection">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="w-6 h-6 mr-3 text-white/80" />
                    Information We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    We collect information necessary to provide our RAG-powered codebase intelligence services.
                  </p>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-400" />
                        Personal Information
                      </h4>
                      <ul className="space-y-3 text-white/70">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Account Data:</strong> Email address, GitHub username, and profile information
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Usage Data:</strong> How you interact with our platform, queries made, and features used
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Communication Data:</strong> Support requests and feedback you provide
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <Database className="w-5 h-5 mr-2 text-green-400" />
                        Repository Data
                      </h4>
                      <ul className="space-y-3 text-white/70">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Code Content:</strong> Source code files, documentation, and project structure
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Metadata:</strong> Repository information, commit history, and file structure
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <div>
                            <strong className="text-white">Generated Data:</strong> AI-generated embeddings and knowledge base content
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* How We Use Information Section */}
            <section id="how-we-use">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Settings className="w-6 h-6 mr-3 text-white/80" />
                    How We Use Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    We use your information solely to provide and improve our RAG-powered codebase intelligence services.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Service Provision</h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Process and analyze your codebase</li>
                        <li>• Generate intelligent responses to queries</li>
                        <li>• Maintain your knowledge base</li>
                        <li>• Provide technical support</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Platform Improvement</h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Enhance AI model performance</li>
                        <li>• Optimize search algorithms</li>
                        <li>• Improve user experience</li>
                        <li>• Develop new features</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Data Sharing Section */}
            <section id="data-sharing">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Lock className="w-6 h-6 mr-3 text-white/80" />
                    Data Sharing & Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    We do not sell your personal data. We may share information only in the following limited circumstances:
                  </p>

                  <div className="space-y-4">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        Service Providers
                      </h4>
                      <p className="text-white/70 text-sm">
                        Trusted third-party vendors who help us operate our platform (hosting, analytics, AI services). 
                        All service providers are bound by strict confidentiality agreements.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
                        Legal Requirements
                      </h4>
                      <p className="text-white/70 text-sm">
                        When required by law, court order, or to protect our rights and the safety of our users.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Data Security Section */}
            <section id="data-security">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-white/80" />
                    Data Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    We implement industry-leading security measures to protect your data from unauthorized access, alteration, or disclosure.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Technical Safeguards</h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• End-to-end encryption</li>
                        <li>• Secure data transmission (HTTPS)</li>
                        <li>• Encrypted data storage</li>
                        <li>• Regular security audits</li>
                        <li>• Access controls and monitoring</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Operational Security</h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Limited data access</li>
                        <li>• Employee training</li>
                        <li>• Incident response plans</li>
                        <li>• Regular backups</li>
                        <li>• Compliance monitoring</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Your Rights Section */}
            <section id="your-rights">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-white/80" />
                    Your Rights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    You have control over your personal data. Here are your rights and how to exercise them:
                  </p>

                  <div className="space-y-4">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Data Access & Portability</h4>
                      <p className="text-white/70 text-sm mb-3">
                        Request a copy of all personal data we have about you in a structured, machine-readable format.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Data Correction</h4>
                      <p className="text-white/70 text-sm mb-3">
                        Update or correct any inaccurate or incomplete personal information in your account.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Data Deletion</h4>
                      <p className="text-white/70 text-sm mb-3">
                        Request deletion of your personal data, subject to legal obligations and legitimate business interests.
                      </p>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">Data Processing Objection</h4>
                      <p className="text-white/70 text-sm mb-3">
                        Object to certain types of data processing where we rely on legitimate interests.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Contact Section */}
            <section id="contact">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mail className="w-6 h-6 mr-3 text-white/80" />
                    Contact Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Have questions about this Privacy Policy or want to exercise your rights? We're here to help.
                  </p>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-3">Get in Touch</h4>
                    <div className="space-y-3">
                      <p className="text-white/70">
                        <strong className="text-white">Email:</strong> help@productsolution.net
                      </p>
                      <p className="text-white/70">
                        <strong className="text-white">Response Time:</strong> We respond to all privacy inquiries within 48 hours
                      </p>
                      <p className="text-white/70">
                        <strong className="text-white">Data Protection Officer:</strong> Available for complex privacy matters
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">Policy Updates</h4>
                    <p className="text-white/70 text-sm mb-3">
                      We may update this Privacy Policy from time to time. We will notify you of any material changes 
                      by email or through our platform.
                    </p>
                    <p className="text-white/50 text-sm">
                      Last Updated: October 2025
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
