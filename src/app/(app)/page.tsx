"use client"
import React, { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
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

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    
    if (paymentStatus === 'failed') {
      toast.error('Payment Failed', {
        description: 'Your payment could not be processed. Please try again.',
        duration: 5000,
      })
      
      // Clean up the URL by removing the query parameter
      router.replace('/', { scroll: false })
    }
  }, [searchParams, router])

  return null
}

function LandingPageContent() {
  return (
    <div className="min-h-screen black-bg relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl floating"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/3 rounded-full blur-3xl floating" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/2 rounded-full blur-3xl floating" style={{animationDelay: '6s'}}></div>
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
