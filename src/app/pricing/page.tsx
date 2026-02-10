"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for trying out RepoDoc",
    features: [
      "AI-powered README generation",
      "AI-powered documentation generation",
      "Chat with your codebase",
      "Up to 3 Projects",
      "GitHub repository integration",
      "Basic repository analytics",
    ],
    buttonText: "Start Free",
    buttonStyle: "default",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$20",
    period: "/month",
    description: "Perfect for professional developers and small teams",
    features: [
      "Everything in Starter",
      "Up to 10 Projects",
      "Advanced AI code understanding",
      "Repository intelligence & insights",
      "One-click PR & documentation sharing",
      "Priority processing",
      "Email support",
    ],
    buttonText: "Pay $20",
    buttonStyle: "primary",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    description: "For teams and organizations with unlimited needs",
    features: [
      "Everything in Professional",
      "Unlimited Projects",
      "Advanced security & compliance",
      "Team collaboration features",
      "SLA guarantees & uptime",
      "Priority support & onboarding",
      "Custom integrations available",
    ],
    buttonText: "Pay $49",
    buttonStyle: "default",
    highlighted: false,
  },
];

export default function PricingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleButtonClick = async (plan: (typeof plans)[0]) => {
    if (plan.name === "Starter") {
      if (isSignedIn) {
        router.push("/dashboard");
      } else {
        router.push("/sign-up");
      }
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in first", {
        description: "You need to be signed in to purchase a plan.",
      });
      router.push("/sign-up");
      return;
    }

    if (plan.name === "Professional" || plan.name === "Enterprise") {
      const planKey = plan.name.toLowerCase();
      setLoadingPlan(plan.name);

      try {
        const response = await fetch("/api/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan: planKey }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Error creating checkout:", error);
        toast.error("Failed to start checkout", {
          description: "Please try again or contact support.",
        });
        setLoadingPlan(null);
      }
    } else {
      router.push("/contact");
    }
  };

  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/3 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
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
        </motion.div>

        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-white/60 font-medium">
            Choose the perfect plan to document and understand your codebase
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-3xl overflow-hidden ${
                plan.highlighted
                  ? "md:-mt-4 md:mb-4 glow-accent"
                  : "glow-subtle"
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="glass-card border-subtle p-4">
                <div
                  className={`p-6 pb-8 rounded-2xl relative overflow-hidden min-h-[160px] ${
                    plan.highlighted
                      ? "bg-linear-to-br from-amber-400 via-orange-400/90 to-slate-500"
                      : "bg-linear-to-r from-gray-200 via-gray-100 to-white"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute inset-0 bg-linear-to-br from-yellow-400/20 via-orange-300/10 to-slate-600/60"></div>
                  )}

                  <div className="relative z-10 h-full">
                    <Badge
                      variant="secondary"
                      className={`mb-6 px-4 py-1.5 text-sm font-medium rounded-full ${
                        plan.highlighted
                          ? "bg-white/90 text-gray-800 shadow-md"
                          : "bg-white text-gray-700 border border-gray-200"
                      }`}
                    >
                      {plan.name}
                    </Badge>

                    <div className="flex items-baseline">
                      <span
                        className={`text-5xl font-bold tracking-tight ${
                          plan.highlighted ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={`text-lg ml-1 ${
                          plan.highlighted ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {plan.period}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-6">
                  <p className="text-white font-semibold mb-6">
                    {plan.description}
                  </p>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/70 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full py-6 text-base font-semibold rounded-full transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle hover:glow-accent"
                        : "bg-white/10 hover:bg-white/20 text-white border border-subtle"
                    }`}
                    onClick={() => handleButtonClick(plan)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>

                  {plan.highlighted && (
                    <p className="text-center text-white/50 text-sm mt-4">
                      Cancel Anytime
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-white/60 mb-4">
            Need a custom plan? We&apos;ve got you covered.
          </p>
          <Button
            variant="outline"
            className="rounded-full px-8 py-5 text-white/70 border-subtle hover:text-white hover:bg-white/5 glass-card"
            asChild
          >
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </motion.div>

        <motion.div
          className="mt-24 mb-12 perspective-1000"
          initial={{ opacity: 0, rotateX: -15 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="relative max-w-3xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                style={{
                  left: `${15 + i * 15}%`,
                  top: i % 2 === 0 ? "-10px" : "auto",
                  bottom: i % 2 !== 0 ? "-10px" : "auto",
                }}
                animate={{
                  y: i % 2 === 0 ? [0, -15, 0] : [0, 15, 0],
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}

            <motion.div
              className="relative group"
              whileHover={{ scale: 1.02, rotateY: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-60"></div>

              <div className="relative rounded-2xl p-[2px] bg-linear-to-br from-cyan-400 via-purple-500 to-pink-500">
                <div className="relative rounded-2xl bg-gray-950/95 backdrop-blur-xl overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-linear-to-b from-cyan-400/10 via-cyan-400/5 to-transparent"
                    style={{ height: "30%" }}
                    animate={{ top: ["-30%", "130%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  ></div>

                  <div className="relative z-10 px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <motion.div
                            className="w-3 h-3 rounded-full bg-red-500"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <span className="text-cyan-400/60 text-xs font-mono">
                          system://payment-gateway
                        </span>
                      </div>
                      <motion.div
                        className="flex items-center gap-2 px-3 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/30"
                        animate={{
                          borderColor: [
                            "rgba(234, 179, 8, 0.3)",
                            "rgba(234, 179, 8, 0.6)",
                            "rgba(234, 179, 8, 0.3)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <motion.div
                          className="w-2 h-2 rounded-full bg-yellow-400"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-yellow-400 text-xs font-bold font-mono uppercase tracking-wider">
                          Test Mode
                        </span>
                      </motion.div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="text-cyan-400 font-mono text-sm">
                          &gt;
                        </span>
                        <p className="text-white/90 text-base sm:text-lg font-medium">
                          Due to Stripe unavailability, the current pricing
                          models are under
                          <span className="mx-1.5 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-sm">
                            test mode
                          </span>
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-purple-400 font-mono text-sm">
                          &gt;
                        </span>
                        <p className="text-white/60 text-sm sm:text-base flex items-center gap-1">
                          Once everything is sorted, we&apos;ll move this to
                          <span className="mx-1.5 px-2 py-0.5 rounded bg-green-500/20 text-green-300 font-mono text-sm">
                            live mode
                          </span>
                          <motion.span
                            className="inline-block w-2 h-4 bg-cyan-400 ml-1"
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="h-1 w-20 rounded-full bg-linear-to-r from-cyan-500 to-purple-500"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <span className="text-white/30 text-xs font-mono">
                          stripe.connection.pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-3 rounded-sm bg-cyan-400"
                            animate={{ scaleY: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-cyan-400/50"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-cyan-400/50"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-purple-400/50"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-purple-400/50"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
