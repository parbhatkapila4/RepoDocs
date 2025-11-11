import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | RepoDoc",
  description: "Learn how RepoDoc handles cancellations, refunds, and pro-rated charges.",
}

export default function CancellationPolicyPage() {
  return (
    <main className="black-bg min-h-screen px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Cancellation & Refund Policy</h1>
            <p className="mt-4 text-white/70">
              RepoDoc is billed monthly. You can cancel anytime from the dashboard billing screen. We believe in keeping
              policies transparent and free of surprises.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </header>

        <section className="space-y-8 rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-xl backdrop-blur-xl text-white/80">
          <div>
            <h2 className="text-xl font-semibold text-white">Cancelling</h2>
            <p className="mt-3">
              You can cancel a subscription at any time. Access remains active until the end of the current billing
              cycle, at which point your account automatically downgrades to the free plan.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Refunds</h2>
            <p className="mt-3">
              Because RepoDoc provides immediate access to digital infrastructure and AI usage, refunds are not issued
              retroactively. If you believe you were charged in error, contact{" "}
              <a href="mailto:help@productsolution.net" className="text-white underline underline-offset-4">
                help@productsolution.net
              </a>{" "}
              with the receipt ID and we&rsquo;ll review the charge.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Custom Agreements</h2>
            <p className="mt-3">
              Enterprise customers may have bespoke cancellation terms documented in their contract. Those terms take
              precedence over the policy outlined here.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}


