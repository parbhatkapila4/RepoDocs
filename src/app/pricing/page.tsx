import Link from "next/link"
import type { Metadata } from "next"
import Footer from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Pricing | RepoDoc",
  description:
    "Find the RepoDoc plan that fits your team. Compare Basic, Premium, and Enterprise options for automated documentation with GitHub integration.",
}

const plans = [
  {
    name: "Basic",
    price: "$10",
    cadence: "per month",
    description: "For solo builders who want automated README generation and essential insights.",
    href: "/sign-up",
    cta: "Start a 7-day trial",
    highlight: false,
    features: [
      "10 README generations per month",
      "10 documentation builds per month",
      "40 AI chats with RepoDoc Assistant",
      "GitHub integration",
      "Export to Markdown & PDF",
    ],
  },
  {
    name: "Premium",
    price: "$60",
    cadence: "per month",
    description: "Best for small teams collaborating on documentation and code analysis.",
    href: "/sign-up",
    cta: "Upgrade to Premium",
    highlight: true,
    features: [
      "40 README generations per month",
      "40 documentation builds per month",
      "100 AI chats with RepoDoc Assistant",
      "Team workspaces with shared history",
      "Advanced architecture diagrams",
      "Custom templates & branding",
      "Priority chat support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "let's talk",
    description: "Purpose-built enablement for large engineering orgs with advanced compliance needs.",
    href: "mailto:hello@repodoc.dev",
    cta: "Contact sales",
    highlight: false,
    features: [
      "SOC2 & ISO 27001 ready controls",
      "Self-hosting & VPC deployments",
      "Role-based access control (RBAC)",
      "Dedicated success manager",
      "Custom usage limits & SLA-backed support",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="black-bg text-white">
      <div className="relative min-h-screen w-full overflow-hidden">
        <BackgroundGlow />
        <div className="relative z-10 flex min-h-screen flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-24 sm:px-6 lg:px-8">
            <div className="mb-10 flex justify-start">
              <Button
                asChild
                variant="outline"
                className="border-white/25 bg-white/10 text-white transition hover:bg-white/20 hover:text-white"
              >
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <section className="mx-auto max-w-4xl space-y-6 text-center">
              <Badge className="mx-auto border border-white/20 bg-white/10 text-white/90">Pricing</Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Choose the plan that scales with your repo</h1>
              <p className="text-lg text-white/70">
                Transparent pricing for teams of every size. Start with a trial, level up when your documentation needs grow,
                and talk to us for enterprise-grade security.
              </p>
              <p className="text-sm text-white/55">
                Every account starts on the Free plan with 3 README generations, 3 documentation builds, and 5 AI chats per month.
              </p>
            </section>

            <section className="mt-16 grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    "glass-card border-white/10 bg-black/40 text-white transition-all duration-300 hover:-translate-y-2 hover:border-white/30",
                    plan.highlight && "border-white/40 shadow-[0_0_45px_rgba(255,255,255,0.15)]"
                  )}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-semibold tracking-tight">{plan.name}</span>
                      {plan.highlight && <Badge className="border-white/20 bg-white text-black">Most popular</Badge>}
                    </div>
                    <CardTitle className="flex items-baseline gap-2 text-4xl font-bold">
                      {plan.price}
                      <span className="text-base font-medium text-white/60">{plan.cadence}</span>
                    </CardTitle>
                    <p className="text-sm leading-relaxed text-white/70">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm text-white/75">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/60" aria-hidden="true" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-8">
                    <Button asChild variant={plan.highlight ? "default" : "outline"} size="lg" className="w-full">
                      <Link href={plan.href} target={plan.href.startsWith("mailto:") ? "_blank" : undefined}>
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </section>

            <section className="mx-auto mt-24 max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center shadow-xl backdrop-blur-xl">
              <h2 className="text-2xl font-semibold tracking-tight">Need a tailored plan?</h2>
              <p className="mt-4 text-white/70">
                We partner with engineering leaders to roll out RepoDoc across complex orgs. Let&rsquo;s chat about custom
                onboarding, integrations, and compliance workflows.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg">
                  <Link href="mailto:parbhat@parbhat.dev">Talk to sales</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-white hover:bg-white/10">
                  <Link href="/about">Learn more about RepoDoc</Link>
                </Button>
              </div>
            </section>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-48 right-1/3 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute bottom-10 left-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"></div>
      <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>
    </div>
  )
}


