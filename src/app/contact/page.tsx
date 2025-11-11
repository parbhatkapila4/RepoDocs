import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export const metadata: Metadata = {
  title: "Contact Us | RepoDoc",
  description: "Reach out to the RepoDoc team for support, partnership discussions, or billing questions.",
}

export default function ContactPage() {
  return (
    <main className="black-bg min-h-screen px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Get in Touch</h1>
            <p className="mt-4 max-w-2xl text-white/70">
              Need help with RepoDoc, want to explore enterprise plans, or planning to partner with us? Use the form
              below or email{" "}
              <a href="mailto:help@productsolution.net" className="underline underline-offset-4 text-white">
                help@productsolution.net
              </a>{" "}
              and we&rsquo;ll respond within one business day.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-xl backdrop-blur-xl">
          <form className="grid gap-6">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium text-white/80">
                Name
              </label>
              <Input
                id="name"
                placeholder="Your name"
                required
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-white/80">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@productsolution.net"
                required
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium text-white/80">
                Message
              </label>
              <Textarea
                id="message"
                rows={6}
                placeholder="Tell us about your question or request…"
                required
                className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Send Message
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-xl backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-tight">Stay in the loop</h2>
          <p className="mt-4 max-w-2xl text-white/70">
            Subscribe to RepoDoc updates for feature launches, pricing changes, and best practices on turning codebases
            into documentation.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="your@email.com"
              required
              className="border-white/10 bg-black/40 text-white placeholder:text-white/40"
            />
            <Button type="submit" className="sm:ml-3">
              Join Newsletter
            </Button>
          </form>
          <p className="mt-3 text-xs text-white/50">
            We send one concise update per month. You can unsubscribe anytime via the link in the email footer.
          </p>
        </section>
      </div>
    </main>
  )
}


