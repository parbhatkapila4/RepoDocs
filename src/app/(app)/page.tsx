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
      const syncAndRedirect = async () => {
        try {
          console.log('🔄 Force syncing plan to:', plan)
          
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
      <SocialProof />
      <FinalCTA />
      <Footer />
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
        </div>
      </div>
    }>
      <PaymentStatusHandler />
      <LandingPageContent />
    </Suspense>
  )
}
