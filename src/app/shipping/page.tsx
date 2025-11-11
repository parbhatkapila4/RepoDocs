import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Shipping Policy | RepoDoc",
  description: "Understand how digital RepoDoc subscriptions are fulfilled and delivered.",
}

export default function ShippingPolicyPage() {
  return (
    <main className="black-bg min-h-screen px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Shipping Policy</h1>
            <p className="mt-4 text-white/70">
              RepoDoc is a 100% digital service. There are no physical goods and therefore no physical shipping
              logistics. Access to the platform is provisioned instantly after checkout.
            </p>
          </div>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link href="/">Back to Home</Link>
          </Button>
        </header>

        <section className="space-y-8 rounded-3xl border border-white/10 bg-white/[0.03] p-10 shadow-xl backdrop-blur-xl text-white/80">
          <div>
            <h2 className="text-xl font-semibold text-white">Digital Delivery</h2>
            <p className="mt-3">
              After purchasing a plan, RepoDoc activates your account immediately. You receive a confirmation email and
              retain access through your Clerk login. No physical shipments, tracking numbers, or packaging are involved.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Service Availability</h2>
            <p className="mt-3">
              Our infrastructure runs on globally distributed servers. Downtime is rare, but in the unlikely event of an
              outage we communicate status updates via{" "} {"This functionaility is coming soon. Demo is below."}
              <a href="https://status.repodoc.dev" className="text-white underline underline-offset-4">
                status.repodoc.dev
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            <p className="mt-3">
              If you have questions about your subscription delivery, email{" "}
              <a href="mailto:help@productsolution.net" className="text-white underline underline-offset-4">
                help@productsolution.net
              </a>{" "}
              and we&rsquo;ll respond within one business day.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}


