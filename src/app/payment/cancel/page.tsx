"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  useEffect(() => {
    // Show error message
    toast.error('Payment Cancelled', {
      description: 'Your payment was cancelled. Please try again when you\'re ready.',
      duration: 5000,
    })

    // Redirect to home page after 2 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen black-bg flex items-center justify-center">
      <div className="text-center">
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h1>
        <p className="text-white/70 mb-4">Redirecting you to the home page...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  )
}

