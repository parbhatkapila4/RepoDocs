"use client"
import React, { useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUser } from '@/hooks/useUser'
import {
  Navigation,
  Hero,
  Features,
  HowItWorks,
  Demo,
  DashboardPreview,
  SocialProof,
  FinalCTA,
  Footer
} from '@/components/landing'

function PaymentStatusHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useUser()
  const hasHandledPayment = useRef(false)

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const plan = searchParams.get('plan')
    
    // Prevent handling the same payment multiple times
    if (hasHandledPayment.current) return
    
    if (paymentStatus === 'success' && plan) {
      hasHandledPayment.current = true
      const planName = plan === 'enterprise' ? 'Enterprise' : 'Professional'
      
      toast.success('Payment Successful! 🎉', {
        description: `Welcome to ${planName}! Your plan has been activated.`,
        duration: 5000,
      })
      
      // Force update the plan directly from the URL parameter
      // This bypasses webhook delays and ensures the plan is set correctly
      const syncAndRedirect = async () => {
        try {
          console.log('🔄 Force syncing plan to:', plan)
          
          // FORCE the plan from URL - don't rely on Stripe subscription detection
          // This is more reliable because Stripe API can have delays
          const response = await fetch('/api/sync-plan', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forcePlan: plan })
          })
          
          const result = await response.json()
          console.log('✅ Plan sync result:', result)
          
          if (!response.ok) {
            console.error('❌ Sync failed:', result)
          }
          
          // Wait a moment for DB to settle
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Refresh user data to get updated plan
          console.log('🔄 Refreshing user data...')
          await refreshUser()
          console.log('✅ User refreshed')
          
          // Wait another moment then redirect
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard')
            router.push('/dashboard')
          }, 500)
        } catch (error) {
          console.error('❌ Error syncing plan:', error)
          // Still redirect even if sync fails
          router.push('/dashboard')
        }
      }
      
      syncAndRedirect()
    }
    
    if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      hasHandledPayment.current = true
      toast.error(paymentStatus === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed', {
        description: paymentStatus === 'cancelled' 
          ? 'You cancelled the payment. Feel free to try again when you\'re ready.'
          : 'Your payment could not be processed. Please try again.',
        duration: 5000,
      })
      
      // Clean up the URL by removing the query parameter
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router, refreshUser])

  return null
}

function LandingPageContent() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      {/* Subtle Background Elements - Optimized for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/3 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/2 rounded-full blur-2xl"></div>
      </div>
      
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
      <DashboardPreview />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusHandler />
      <LandingPageContent />
    </Suspense>
  )
}
