import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  BookOpen,
  Mail,
  Clock,
  Users,
  Shield,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Scale,
  Gavel,
  Settings,
  Database,
} from "lucide-react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/3 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-6 px-4 py-2 text-sm glass-card text-white/90 border-subtle"
          >
            <FileText className="w-4 h-4 mr-2 text-white/80" />
            Terms of Service
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Terms of Service
          </h1>

          <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8">
            The terms and conditions governing your use of RepoDoc's RAG-powered
            codebase intelligence platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          <div className="lg:col-span-1">
            <Card className="glass-card border-subtle sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a
                  href="#acceptance"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Acceptance of Terms
                </a>
                <a
                  href="#description"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Service Description
                </a>
                <a
                  href="#user-accounts"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  User Accounts
                </a>
                <a
                  href="#acceptable-use"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Acceptable Use
                </a>
                <a
                  href="#intellectual-property"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Intellectual Property
                </a>
                <a
                  href="#privacy"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Privacy & Data
                </a>
                <a
                  href="#limitations"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Limitations
                </a>
                <a
                  href="#termination"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Termination
                </a>
                <a
                  href="#contact"
                  className="block text-white/60 hover:text-white transition-colors text-sm"
                >
                  Contact
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-12">
            <section id="acceptance">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Gavel className="w-6 h-6 mr-3 text-white/80" />
                    Acceptance of Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    By accessing or using RepoDoc, you agree to be bound by
                    these Terms of Service and all applicable laws and
                    regulations.
                  </p>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-3">
                      Agreement to Terms
                    </h4>
                    <p className="text-white/70">
                      If you do not agree with any of these terms, you are
                      prohibited from using or accessing this site. The
                      materials contained in this website are protected by
                      applicable copyright and trademark law.
                    </p>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Updates to Terms
                    </h4>
                    <p className="text-white/70 text-sm">
                      We reserve the right to modify these terms at any time.
                      Continued use of the service after changes constitutes
                      acceptance of the new terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="description">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Database className="w-6 h-6 mr-3 text-white/80" />
                    Service Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    RepoDoc is a RAG-powered platform that transforms your
                    GitHub repositories into queryable knowledge bases.
                  </p>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        What We Provide
                      </h4>
                      <ul className="space-y-3 text-white/70">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">
                              Codebase Analysis:
                            </strong>{" "}
                            AI-powered analysis of your repository structure and
                            content
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">
                              Intelligent Queries:
                            </strong>{" "}
                            Natural language questions about your codebase
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">
                              Knowledge Base:
                            </strong>{" "}
                            Searchable repository documentation and insights
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">
                              Code References:
                            </strong>{" "}
                            Direct links to relevant code sections and files
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-blue-400" />
                        Service Availability
                      </h4>
                      <ul className="space-y-3 text-white/70">
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">Uptime:</strong> We
                            strive for 99.9% service availability
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">Maintenance:</strong>{" "}
                            Scheduled maintenance with advance notice
                          </div>
                        </li>
                        <li className="flex items-start">
                          <div className="w-2 h-2 bg-white/40 rounded-full mt-2 mr-3 shrink-0"></div>
                          <div>
                            <strong className="text-white">Support:</strong>{" "}
                            Technical support during business hours
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="user-accounts">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-6 h-6 mr-3 text-white/80" />
                    User Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    To use RepoDoc, you must create an account and provide
                    accurate information.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Account Requirements
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Valid email address</li>
                        <li>• GitHub account connection</li>
                        <li>• Accurate personal information</li>
                        <li>• Secure password</li>
                        <li>• Age 13 or older</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Account Security
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Keep credentials secure</li>
                        <li>• Notify us of breaches</li>
                        <li>• Regular password updates</li>
                        <li>• Two-factor authentication</li>
                        <li>• Account monitoring</li>
                      </ul>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Account Responsibilities
                    </h4>
                    <p className="text-white/70 text-sm">
                      You are responsible for all activities that occur under
                      your account. You must notify us immediately of any
                      unauthorized use of your account.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="acceptable-use">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-white/80" />
                    Acceptable Use
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    You agree to use RepoDoc only for lawful purposes and in
                    accordance with these terms.
                  </p>

                  <div className="space-y-4">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        Permitted Uses
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Analyze your own code repositories</li>
                        <li>• Generate documentation for your projects</li>
                        <li>• Query your codebase for development insights</li>
                        <li>• Share knowledge with your development team</li>
                        <li>• Improve code understanding and onboarding</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                        Prohibited Uses
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Violate any applicable laws or regulations</li>
                        <li>• Infringe on intellectual property rights</li>
                        <li>• Attempt to reverse engineer our platform</li>
                        <li>• Use for malicious or harmful purposes</li>
                        <li>• Share unauthorized access to repositories</li>
                        <li>• Spam or abuse our systems</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="intellectual-property">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Scale className="w-6 h-6 mr-3 text-white/80" />
                    Intellectual Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Respect for intellectual property is fundamental to our
                    service.
                  </p>

                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Your Content
                      </h4>
                      <p className="text-white/70 text-sm mb-3">
                        You retain all rights to your code and repository
                        content. We only process and analyze your content to
                        provide our services.
                      </p>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• You own your code and documentation</li>
                        <li>• We don't claim ownership of your content</li>
                        <li>• You can delete your data at any time</li>
                        <li>• We respect your repository licenses</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Our Platform
                      </h4>
                      <p className="text-white/70 text-sm mb-3">
                        RepoDoc's platform, algorithms, and technology are
                        protected by intellectual property laws.
                      </p>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Our AI models and algorithms</li>
                        <li>• Platform interface and design</li>
                        <li>• Processing methodologies</li>
                        <li>• Service architecture</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="privacy">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3 text-white/80" />
                    Privacy & Data Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Your privacy and data protection are our top priorities.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Data Handling
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Secure data processing</li>
                        <li>• Encrypted data storage</li>
                        <li>• Limited data retention</li>
                        <li>• No data selling</li>
                        <li>• User data control</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Your Rights
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Access your data</li>
                        <li>• Correct inaccuracies</li>
                        <li>• Delete your data</li>
                        <li>• Data portability</li>
                        <li>• Processing objections</li>
                      </ul>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Privacy Policy
                    </h4>
                    <p className="text-white/70 text-sm">
                      For detailed information about how we collect, use, and
                      protect your data, please review our{" "}
                      <Link
                        href="/privacy"
                        className="text-white hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="limitations">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-6 h-6 mr-3 text-white/80" />
                    Service Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Please understand the limitations and disclaimers of our
                    service.
                  </p>

                  <div className="space-y-4">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Service Limitations
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• AI responses may not always be accurate</li>
                        <li>• Service availability not guaranteed</li>
                        <li>• Processing time may vary</li>
                        <li>• Repository size limitations</li>
                        <li>• Third-party dependency risks</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Disclaimers
                      </h4>
                      <p className="text-white/70 text-sm">
                        RepoDoc is provided "as is" without warranties of any
                        kind. We do not guarantee the accuracy, completeness, or
                        reliability of AI-generated responses. Use our service
                        at your own risk.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section id="termination">
              <Card className="glass-card border-subtle">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-white/80" />
                    Termination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70 text-lg leading-relaxed">
                    Either party may terminate this agreement at any time.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Your Termination Rights
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Cancel account anytime</li>
                        <li>• Delete all your data</li>
                        <li>• Export data before deletion</li>
                        <li>• No cancellation fees</li>
                        <li>• Immediate effect</li>
                      </ul>
                    </div>

                    <div className="glass-card p-6 rounded-lg border-subtle">
                      <h4 className="text-white font-semibold mb-3">
                        Our Termination Rights
                      </h4>
                      <ul className="space-y-2 text-white/70 text-sm">
                        <li>• Violation of terms</li>
                        <li>• Illegal activities</li>
                        <li>• Service abuse</li>
                        <li>• Non-payment (if applicable)</li>
                        <li>• Platform discontinuation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

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
                    Questions about these Terms of Service? We're here to help.
                  </p>

                  <div className="glass-card p-6 rounded-lg border-subtle">
                    <h4 className="text-white font-semibold mb-3">
                      Get in Touch
                    </h4>
                    <div className="space-y-3">
                      <p className="text-white/70">
                        <strong className="text-white">Email:</strong>{" "}
                        help@productsolution.net
                      </p>
                      <p className="text-white/70">
                        <strong className="text-white">Response Time:</strong>{" "}
                        We respond to all legal inquiries within 48 hours
                      </p>
                      <p className="text-white/70">
                        <strong className="text-white">Support:</strong>{" "}
                        Available for technical and account issues
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg border-subtle bg-white/5">
                    <h4 className="text-white font-semibold mb-3">
                      Terms Updates
                    </h4>
                    <p className="text-white/70 text-sm mb-3">
                      We may update these Terms of Service from time to time. We
                      will notify you of any material changes by email or
                      through our platform.
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
  );
}
