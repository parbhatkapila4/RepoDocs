"use client"
import React from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, ArrowLeft } from "lucide-react"
import Link from 'next/link'
import { motion } from "motion/react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for Small Teams",
    features: [
      "Access to basic tools",
      "Up to 3 Projects",
      "Standard Integration",
      "Secure data usage"
    ],
    buttonText: "Start Free",
    buttonStyle: "default",
    highlighted: false
  },
  {
    name: "Professional",
    price: "$20",
    period: "/month",
    description: "Perfect for Professionals",
    features: [
      "Access to all the Tools and Features",
      "Unlimited Projects",
      "Team Collaboration Features",
      "Integration with popular platforms",
      "Analytics, Reporting or Customization",
      "High Security Features",
      "Priority Support"
    ],
    buttonText: "Pay $20",
    buttonStyle: "primary",
    highlighted: true,
    badge: "Popular"
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    description: "Advanced tools and dedicated support for growing teams.",
    features: [
      "Access to all the Tools and Features",
      "Unlimited Projects",
      "Advanced Security Features",
      "Integration with popular platforms",
      "SLA Guarantees"
    ],
    buttonText: "Pay $49",
    buttonStyle: "default",
    highlighted: false
  }
]

export default function PricingPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()

  const handleButtonClick = (plan: typeof plans[0]) => {
    if (plan.name === "Starter") {
      if (isSignedIn) {
        router.push('/dashboard')
      } else {
        router.push('/sign-up')
      }
    } else if (plan.name === "Professional") {
      // Redirect to Stripe Checkout
      // Note: Success and cancel URLs must be configured in Stripe Dashboard
      window.location.href = 'https://buy.stripe.com/test_eVq00leeag3bep2dMx6AM01'
    } else if (plan.name === "Enterprise") {
      // Redirect to Stripe Checkout
      // Note: Success and cancel URLs must be configured in Stripe Dashboard
      window.location.href = 'https://buy.stripe.com/test_9B6dRb5HEbMV80E8sd6AM00'
    } else {
      router.push('/contact')
    }
  }

  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/3 rounded-full blur-3xl floating" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/2 rounded-full blur-3xl floating" style={{animationDelay: '6s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back to Home Button */}
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

        {/* Coming Soon Banner */}
        <motion.div
          className="text-center mb-16 relative py-8"
          initial={{ opacity: 0, scale: 0.8, y: -30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-block relative px-8 py-4">
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-2xl"></div>
            
            {/* Main text with gradient */}
            <motion.h1
              className="relative text-6xl sm:text-7xl lg:text-9xl font-black tracking-tighter mb-4 leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              <motion.span
                className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] text-glow-subtle"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                COMING
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto] text-glow-subtle"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                SOON
              </motion.span>
            </motion.h1>
            
            {/* Decorative elements */}
            <motion.div
              className="absolute -top-4 -left-4 w-4 h-4 bg-blue-400 rounded-full animate-ping shadow-lg shadow-blue-400/50"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            ></motion.div>
            <motion.div
              className="absolute -top-2 -right-8 w-3 h-3 bg-purple-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"
              style={{animationDelay: '0.5s'}}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            ></motion.div>
            <motion.div
              className="absolute -bottom-2 -left-8 w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50"
              style={{animationDelay: '1s'}}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            ></motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4 w-4 h-4 bg-purple-400 rounded-full animate-ping shadow-lg shadow-purple-400/50"
              style={{animationDelay: '1.5s'}}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            ></motion.div>
          </div>
          
          {/* Subtitle */}
          <motion.p
            className="text-xl sm:text-2xl text-white/70 font-medium mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            We're crafting something amazing for you
          </motion.p>
        </motion.div>

        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Pricing That Scales With You
          </h1>
          <p className="text-xl text-white/60 font-medium">
            Choose a Plan that Suits You
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-3xl overflow-hidden ${
                plan.highlighted 
                  ? 'md:-mt-4 md:mb-4 glow-accent' 
                  : 'glow-subtle'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Card Background */}
              <div className="glass-card border-subtle p-4">
                
                {/* Inner Price Card */}
                <div className={`p-6 pb-8 rounded-2xl relative overflow-hidden min-h-[160px] ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-amber-400 via-orange-400/90 to-slate-500' 
                    : 'bg-gradient-to-r from-gray-200 via-gray-100 to-white'
                }`}>
                  {/* Gradient Overlay for Pro Plan */}
                  {plan.highlighted && (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-300/10 to-slate-600/60"></div>
                  )}
                  
                  <div className="relative z-10 h-full">
                    {/* Plan Badge */}
                    <Badge 
                      variant="secondary" 
                      className={`mb-6 px-4 py-1.5 text-sm font-medium rounded-full ${
                        plan.highlighted 
                          ? 'bg-white/90 text-gray-800 shadow-md' 
                          : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      {plan.name}
                    </Badge>

                    {/* Price */}
                    <div className="flex items-baseline">
                      <span className={`text-5xl font-bold tracking-tight ${
                        plan.highlighted ? 'text-white' : 'text-gray-900'
                      }`}>
                        {plan.price}
                      </span>
                      <span className={`text-lg ml-1 ${
                        plan.highlighted ? 'text-white/80' : 'text-gray-500'
                      }`}>
                        {plan.period}
                      </span>
                    </div>

                    {/* Popular Badge for Pro Plan - positioned at bottom right */}
                    {plan.badge && (
                      <Badge 
                        className="absolute bottom-4 right-4 bg-white text-gray-800 shadow-lg px-3 py-1 text-xs font-semibold rounded-full"
                      >
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Features Section */}
                <div className="p-6 pt-6">
                  <p className="text-white font-semibold mb-6">
                    {plan.description}
                  </p>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/70 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full py-6 text-base font-semibold rounded-full transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-subtle glow-subtle hover:glow-accent'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-subtle'
                    }`}
                    onClick={() => handleButtonClick(plan)}
                  >
                    {plan.buttonText}
                  </Button>

                  {/* Cancel Anytime text for Pro plan */}
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

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-white/60 mb-4">
            Need a custom plan? We've got you covered.
          </p>
          <Button 
            variant="outline"
            className="rounded-full px-8 py-5 text-white/70 border-subtle hover:text-white hover:bg-white/5 glass-card"
            asChild
          >
            <Link href="/contact">
              Contact Sales
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

