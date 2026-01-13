"use client";

import { useState, useEffect, useRef } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Globe, Github } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Suspense } from "react";

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !isMountedRef.current) return;

    setIsLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (!isMountedRef.current) return;

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        if (!isMountedRef.current) return;

        toast.success("Welcome back!");
        router.push(redirectUrl);
        router.refresh();
      } else {
        if (isMountedRef.current) {
          toast.error("Sign in incomplete. Please try again.");
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        toast.error(err.errors?.[0]?.message || "Failed to sign in");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSocialSignIn = async (
    strategy: "oauth_google" | "oauth_github"
  ) => {
    if (!isLoaded || !isMountedRef.current) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: redirectUrl,
        redirectUrlComplete: redirectUrl,
      });
    } catch (err: any) {
      if (isMountedRef.current) {
        toast.error(
          err.errors?.[0]?.message || `Failed to sign in with ${strategy}`
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f6] via-[#fefcf8] to-[#faf9f6] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-[#f4a460]/8 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#f4a460]/3 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#f4a460/10,_transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#f4a460/8,_transparent_50%)] pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute top-24 left-16 w-32 h-32 opacity-28"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 32 Q32 22, 52 32 T92 32"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 68 Q28 58, 48 68 T88 68"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="50" r="3" fill="#4a4a4a" />
          <circle cx="74" cy="60" r="3" fill="#4a4a4a" />
          <path
            d="M38 18 Q48 8, 58 18"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M20 45 Q35 40, 50 45 Q65 50, 80 45"
            stroke="#4a4a4a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="absolute top-56 left-32 w-24 h-24 opacity-22"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="12"
            y="12"
            width="76"
            height="76"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
            rx="3"
          />
          <line
            x1="12"
            y1="50"
            x2="88"
            y2="50"
            stroke="#4a4a4a"
            strokeWidth="2.2"
          />
          <line
            x1="50"
            y1="12"
            x2="50"
            y2="88"
            stroke="#4a4a4a"
            strokeWidth="2.2"
          />
          <circle
            cx="50"
            cy="50"
            r="10"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
          />
          <circle cx="50" cy="50" r="4" fill="#4a4a4a" />
        </svg>

        <svg
          className="absolute bottom-32 left-24 w-28 h-28 opacity-24"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 12 L50 42 L78 12"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="50"
            cy="70"
            r="20"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
          />
          <path
            d="M32 55 Q50 50, 68 55"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M35 60 Q50 65, 65 60"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute top-40 left-14 w-28 h-24 bg-gradient-to-br from-[#f4a460] via-[#f0a050] to-[#e89a3d] border-2 border-black/12 rounded-lg opacity-85 shadow-xl transform rotate-[-2deg]">
          <div className="w-full h-full bg-[radial-gradient(circle,_black_2.5px,_transparent_2.5px)] bg-[length:8px_8px] opacity-65" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-lg" />
        </div>

        <div className="absolute top-64 left-8 w-20 h-40 bg-white/97 border-2 border-black/12 rounded-lg opacity-95 shadow-lg backdrop-blur-md transform rotate-[1deg]">
          <svg
            className="w-full h-full p-4"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 12 Q80 28, 50 58 Q20 28, 50 12"
              stroke="#3a3a3a"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="50"
              y1="12"
              x2="50"
              y2="58"
              stroke="#3a3a3a"
              strokeWidth="2"
            />
            <circle cx="50" cy="35" r="3" fill="#3a3a3a" />
          </svg>
        </div>

        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="relative">
            <div className="absolute -top-4 -right-4 w-32 h-40 bg-gradient-to-br from-[#f4a460] via-[#f0a050] to-[#e89a3d] border-2 border-black/12 rounded-lg opacity-85 shadow-2xl transform rotate-[3deg]">
              <div className="w-full h-full bg-[radial-gradient(circle,_black_2.5px,_transparent_2.5px)] bg-[length:10px_10px] opacity-75" />
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/15 to-transparent rounded-lg" />
            </div>

            <div className="absolute -top-2 -right-2 w-30 h-38 bg-gradient-to-br from-[#f4a460]/60 to-[#e89a3d]/60 border border-black/10 rounded-lg opacity-50 shadow-lg transform rotate-[1deg]" />

            <div className="relative w-48 h-56 bg-white/99 border-2 border-black/12 rounded-2xl shadow-2xl backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/30 rounded-2xl" />
              <svg
                className="absolute inset-0 w-full h-full p-5"
                viewBox="0 0 100 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="50" cy="20" r="12" fill="#1a1a1a" />
                <ellipse cx="50" cy="16" rx="9" ry="7" fill="#1a1a1a" />
                <circle cx="45" cy="18" r="1.5" fill="white" />
                <circle cx="55" cy="18" r="1.5" fill="white" />
                <path
                  d="M42 22 Q50 24, 58 22"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />

                <rect
                  x="36"
                  y="32"
                  width="28"
                  height="30"
                  fill="#1a1a1a"
                  rx="3"
                />
                <circle cx="42" cy="42" r="2.5" fill="white" />
                <circle cx="50" cy="45" r="2.5" fill="white" />
                <circle cx="58" cy="42" r="2.5" fill="white" />
                <circle cx="45" cy="50" r="2.5" fill="white" />
                <circle cx="55" cy="50" r="2.5" fill="white" />
                <circle cx="50" cy="56" r="2" fill="white" />
                <circle cx="43" cy="54" r="1.5" fill="white" />
                <circle cx="57" cy="54" r="1.5" fill="white" />

                <rect
                  x="38"
                  y="62"
                  width="24"
                  height="24"
                  fill="white"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                  rx="2"
                />
                <line
                  x1="38"
                  y1="74"
                  x2="62"
                  y2="74"
                  stroke="#1a1a1a"
                  strokeWidth="1"
                />

                <rect
                  x="38"
                  y="86"
                  width="11"
                  height="7"
                  fill="#1a1a1a"
                  rx="1.5"
                />
                <rect
                  x="51"
                  y="86"
                  width="11"
                  height="7"
                  fill="#1a1a1a"
                  rx="1.5"
                />
                <line
                  x1="38"
                  y1="89"
                  x2="49"
                  y2="89"
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                <line
                  x1="51"
                  y1="89"
                  x2="62"
                  y2="89"
                  stroke="white"
                  strokeWidth="0.5"
                  opacity="0.3"
                />

                <rect
                  x="30"
                  y="52"
                  width="40"
                  height="22"
                  fill="#90EE90"
                  stroke="#1a1a1a"
                  strokeWidth="2.5"
                  rx="3"
                />
                <line
                  x1="30"
                  y1="63"
                  x2="70"
                  y2="63"
                  stroke="#1a1a1a"
                  strokeWidth="2"
                />
                <rect
                  x="34"
                  y="68"
                  width="32"
                  height="5"
                  fill="#1a1a1a"
                  rx="1.5"
                />
                <circle cx="50" cy="70.5" r="1.5" fill="#90EE90" />
                <rect
                  x="36"
                  y="66"
                  width="28"
                  height="1.5"
                  fill="#1a1a1a"
                  rx="0.5"
                />

                <rect
                  x="18"
                  y="93"
                  width="64"
                  height="20"
                  fill="white"
                  stroke="#1a1a1a"
                  strokeWidth="2.5"
                  rx="3"
                />
                <line
                  x1="18"
                  y1="103"
                  x2="82"
                  y2="103"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                />
                <rect
                  x="22"
                  y="106"
                  width="58"
                  height="2"
                  fill="#1a1a1a"
                  rx="1"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="absolute top-16 right-40 w-5 h-5 bg-[#4a4a4a] rounded-full opacity-28 shadow-md" />
        <div className="absolute bottom-24 right-16 w-4 h-4 bg-[#4a4a4a] rounded-full opacity-28 shadow-md" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-[#4a4a4a] rounded-full opacity-28" />
        <div className="absolute bottom-1/4 right-1/3 w-3.5 h-3.5 bg-[#4a4a4a] rounded-full opacity-22" />
        <div className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-[#4a4a4a] rounded-full opacity-25" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-[#4a4a4a] rounded-full opacity-20" />

        <svg
          className="absolute bottom-16 right-8 w-40 h-24 opacity-20"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 20 Q20 10, 34 20 T62 20"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 36 Q28 30, 44 36 T76 36"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="28" r="2" fill="#4a4a4a" />
          <circle cx="58" cy="30" r="2" fill="#4a4a4a" />
          <path
            d="M25 15 Q35 12, 45 15"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <svg
          className="absolute top-1/4 right-1/3 w-20 h-20 opacity-18"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M28 18 L50 48 L72 18"
            stroke="#4a4a4a"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="50"
            cy="72"
            r="14"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M38 60 Q50 55, 62 60"
            stroke="#4a4a4a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <svg
          className="absolute top-40 right-24 w-24 h-24 opacity-16"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 30 Q40 20, 60 30 Q80 40, 60 50 Q40 60, 20 50 Q10 45, 20 30"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="40" r="3" fill="#4a4a4a" />
          <circle cx="60" cy="40" r="3" fill="#4a4a4a" />
        </svg>

        <div className="absolute top-80 left-20 w-14 h-14 border-2 border-[#4a4a4a]/20 rounded-lg opacity-30 transform rotate-12" />
        <div className="absolute bottom-48 left-16 w-10 h-10 border-2 border-[#4a4a4a]/20 rounded-full opacity-25" />

        <div className="absolute top-96 left-24 w-18 h-18 bg-gradient-to-br from-[#f4a460]/40 via-[#f0a050]/30 to-[#e89a3d]/40 border-2 border-black/10 rounded-md opacity-70 shadow-lg transform rotate-[5deg]" />
        <div className="absolute bottom-32 left-12 w-16 h-12 bg-white/90 border-2 border-black/10 rounded-lg opacity-80 shadow-md backdrop-blur-sm transform rotate-[-3deg]" />
        <div className="absolute top-52 left-4 w-12 h-12 bg-gradient-to-br from-[#f4a460]/50 to-[#e89a3d]/50 border border-black/8 rounded-full opacity-60 shadow-sm" />

        <div className="absolute top-32 right-32 w-20 h-16 bg-white/92 border-2 border-black/10 rounded-lg opacity-85 shadow-lg backdrop-blur-sm transform rotate-[2deg]" />
        <div className="absolute bottom-40 right-28 w-14 h-14 bg-gradient-to-br from-[#f4a460]/45 via-[#f0a050]/35 to-[#e89a3d]/45 border-2 border-black/10 rounded-md opacity-75 shadow-md transform rotate-[-4deg]" />
        <div className="absolute top-72 right-20 w-10 h-10 bg-[#4a4a4a]/15 border border-[#4a4a4a]/20 rounded-full opacity-30" />

        <svg
          className="absolute top-12 left-1/3 w-20 h-20 opacity-19"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 20 L50 50 L80 20"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="50"
            cy="70"
            r="15"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
          />
          <path
            d="M30 50 Q50 45, 70 50"
            stroke="#4a4a4a"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <svg
          className="absolute bottom-12 left-1/2 w-24 h-24 opacity-17"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="20"
            y="20"
            width="60"
            height="60"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            rx="4"
          />
          <line
            x1="20"
            y1="50"
            x2="80"
            y2="50"
            stroke="#4a4a4a"
            strokeWidth="1.5"
          />
          <line
            x1="50"
            y1="20"
            x2="50"
            y2="80"
            stroke="#4a4a4a"
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="8"
            stroke="#4a4a4a"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 opacity-12"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 30 Q50 20, 70 30 Q80 50, 70 70 Q50 80, 30 70 Q20 50, 30 30"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="5" fill="#4a4a4a" />
        </svg>

        <div className="absolute top-24 right-52 w-3 h-3 bg-[#4a4a4a] rounded-full opacity-26 shadow-sm" />
        <div className="absolute bottom-36 left-1/3 w-2.5 h-2.5 bg-[#4a4a4a] rounded-full opacity-24" />
        <div className="absolute top-3/4 right-1/3 w-3 h-3 bg-[#4a4a4a] rounded-full opacity-22 shadow-sm" />
        <div className="absolute top-1/5 left-2/3 w-2 h-2 bg-[#4a4a4a] rounded-full opacity-20" />
        <div className="absolute bottom-1/5 right-2/5 w-2.5 h-2.5 bg-[#4a4a4a] rounded-full opacity-23" />
        <div className="absolute top-2/5 left-1/5 w-2 h-2 bg-[#4a4a4a] rounded-full opacity-21" />
        <div className="absolute bottom-2/5 right-1/5 w-3 h-3 bg-[#4a4a4a] rounded-full opacity-25 shadow-sm" />

        <svg
          className="absolute top-28 right-16 w-32 h-20 opacity-16"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 15 Q25 8, 40 15 T70 15"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 32 Q30 26, 45 32 T75 32"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="25" cy="23" r="1.5" fill="#4a4a4a" />
          <circle cx="65" cy="25" r="1.5" fill="#4a4a4a" />
        </svg>

        <svg
          className="absolute bottom-28 left-1/4 w-28 h-18 opacity-15"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 18 Q28 12, 44 18 T76 18"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 35 Q34 30, 50 35 T82 35"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="absolute top-44 right-48 w-12 h-12 border-2 border-[#4a4a4a]/18 rounded-lg opacity-28 transform rotate-45" />
        <div className="absolute bottom-56 left-40 w-8 h-8 border-2 border-[#4a4a4a]/18 rounded-md opacity-25 transform rotate-12" />
        <div className="absolute top-88 right-1/4 w-10 h-10 border-2 border-[#4a4a4a]/18 rounded-full opacity-27" />
        <div className="absolute bottom-20 left-2/3 w-9 h-9 border-2 border-[#4a4a4a]/18 rounded-lg opacity-24 transform rotate-[-15deg]" />

        <svg
          className="absolute top-64 right-40 w-22 h-22 opacity-14"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 25 L50 50 L75 25"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 75 L50 50 L75 75"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="50"
            cy="50"
            r="12"
            stroke="#4a4a4a"
            strokeWidth="1.8"
            fill="none"
          />
        </svg>

        <svg
          className="absolute bottom-64 left-1/3 w-20 h-20 opacity-13"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 20 Q50 15, 70 20 Q75 50, 70 80 Q50 85, 30 80 Q25 50, 30 20"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="6" fill="#4a4a4a" />
        </svg>

        <div className="absolute top-36 left-48 w-6 h-6 bg-[#f4a460]/30 border border-black/8 rounded-sm opacity-50 transform rotate-12" />
        <div className="absolute bottom-52 right-44 w-5 h-5 bg-white/80 border border-black/8 rounded-sm opacity-60 transform rotate-[-8deg]" />
        <div className="absolute top-76 left-2/5 w-7 h-7 bg-[#f4a460]/25 border border-black/8 rounded-md opacity-45 transform rotate-[10deg]" />
        <div className="absolute bottom-36 right-1/3 w-6 h-6 bg-white/75 border border-black/8 rounded-sm opacity-55 transform rotate-[-12deg]" />

        <svg
          className="absolute top-20 left-2/5 w-26 h-16 opacity-16"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 25 Q20 15, 35 25 T65 25 T95 25"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 40 Q25 35, 40 40 T70 40 T100 40"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="absolute bottom-20 right-1/4 w-24 h-14 opacity-15"
          viewBox="0 0 100 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 20 Q22 12, 36 20 T64 20 T92 20"
            stroke="#4a4a4a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="30" r="2" fill="#4a4a4a" />
          <circle cx="60" cy="32" r="2" fill="#4a4a4a" />
        </svg>

        <div className="absolute top-60 left-56 w-16 h-12 bg-gradient-to-br from-white/85 to-white/70 border-2 border-black/10 rounded-lg opacity-75 shadow-md backdrop-blur-sm transform rotate-[3deg]" />
        <div className="absolute bottom-60 right-36 w-14 h-10 bg-gradient-to-br from-[#f4a460]/35 via-[#f0a050]/25 to-[#e89a3d]/35 border-2 border-black/10 rounded-md opacity-70 shadow-sm transform rotate-[-2deg]" />
      </div>

      <header className="relative z-10 px-6 py-6 flex justify-between items-center">
        <div>
          <Link href="/" className="text-2xl font-bold text-black">
            Repodoc
          </Link>
          <p className="text-sm text-gray-600 mt-1">parbhat@parbhat.dev</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Sign up
          </Link>
          <Link
            href="/pricing"
            className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            Request Demo
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-md border border-gray-100/50 p-8 md:p-10 backdrop-blur-sm">
            <div className="mb-8">
              <h1 className="text-[2.5rem] md:text-[3rem] font-black text-[#0a0a0a] mb-3 leading-[1.15] tracking-[-0.02em]">
                Repodoc Login
              </h1>
              <p className="text-[0.95rem] md:text-[1.05rem] text-[#3a3a3a] leading-[1.5] font-medium">
                Enter your details to get Login to your Repodoc account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email / Phone No"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all text-black placeholder:text-gray-400 bg-white"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-gray-300 rounded-full" />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Passcode"
                    className="w-full pl-12 pr-20 py-3.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all text-black placeholder:text-gray-400 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 transition-colors z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full py-3.5 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 active:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  — Or Sign in with —
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialSignIn("oauth_google")}
                disabled={!isLoaded}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-sm font-medium text-black">Google</span>
              </button>
              <button
                onClick={() => handleSocialSignIn("oauth_github")}
                disabled={!isLoaded}
                className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-all disabled:opacity-50 shadow-sm"
              >
                <Github className="w-5 h-5 text-black" />
                <span className="text-sm font-medium text-black">GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-6 text-sm text-gray-600">
        Copyright @Repodoc 2026 |{" "}
        <Link href="/privacy" className="hover:text-gray-800">
          Privacy Policy
        </Link>
      </footer>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
