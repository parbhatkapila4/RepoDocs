"use client";

import { useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MotionConfig } from "motion/react";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { Navigation, Footer, CommandPalette } from "@/components/landing";

import SectionHero from "@/components/landing/SectionHero";
import Problem from "@/components/landing/sections/Problem";
import Intro from "@/components/landing/sections/Intro";
import Spotlight from "@/components/landing/sections/Spotlight";
import Approach from "@/components/landing/sections/Approach";
import Pricing from "@/components/landing/sections/Pricing";
import Capabilities from "@/components/landing/sections/Capabilities";
import Engineered from "@/components/landing/sections/Engineered";
import Faq from "@/components/landing/sections/Faq";

function PaymentStatusHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useUser();
  const hasHandledPayment = useRef(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const plan = searchParams.get("plan");

    if (hasHandledPayment.current) return;

    if (paymentStatus === "success" && plan) {
      hasHandledPayment.current = true;
      const planName = plan === "enterprise" ? "Enterprise" : "Professional";

      toast.success("Payment Successful! 🎉", {
        description: `Welcome to ${planName}! Your plan has been activated.`,
        duration: 5000,
      });

      const syncAndRedirect = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 800));
          await refreshUser();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await refreshUser();
        } catch {}
        router.push("/dashboard");
      };

      syncAndRedirect();
    }

    if (paymentStatus === "failed" || paymentStatus === "cancelled") {
      hasHandledPayment.current = true;
      toast.error(
        paymentStatus === "cancelled" ? "Payment Cancelled" : "Payment Failed",
        {
          description:
            paymentStatus === "cancelled"
              ? "You cancelled the payment. Feel free to try again when you're ready."
              : "Your payment could not be processed. Please try again.",
          duration: 5000,
        },
      );

      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, refreshUser]);

  return null;
}

function LandingPageContent() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#040406]">
        <Navigation />
        <SectionHero />
        <Problem />
        <Intro />
        <Spotlight />
        <Approach />
        <Pricing />
        <Capabilities />
        <Engineered />
        <Faq />
        <Footer />
        <CommandPalette />
      </div>
    </MotionConfig>
  );
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
          </div>
        </div>
      }
    >
      <PaymentStatusHandler />
      <LandingPageContent />
    </Suspense>
  );
}
