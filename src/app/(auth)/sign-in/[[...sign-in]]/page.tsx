"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff, Github, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { LoadingButton } from "@/components/LoadingButton";

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMountedRef = useRef(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rawRedirect = searchParams.get("redirect_url") || "/dashboard";
  const redirectPath = rawRedirect.startsWith("/") ? rawRedirect : "/dashboard";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace(redirectPath);
    }
  }, [isLoaded, isSignedIn, redirectPath]);

  const ssoCallbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sign-in/sso-callback`
      : "/sign-in/sso-callback";
  const completeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${redirectPath}`
      : redirectPath;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !isMountedRef.current) return;

    setSubmitting(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (!isMountedRef.current) return;

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (!isMountedRef.current) return;
        toast.success("Welcome back");
        window.location.replace(redirectPath);
      } else {
        toast.error("Sign in incomplete. Please try again.");
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      toast.error(message || "Failed to sign in");
    } finally {
      if (isMountedRef.current) setSubmitting(false);
    }
  }

  async function handleSocial(strategy: "oauth_google" | "oauth_github") {
    if (!isLoaded || !signIn || !isMountedRef.current) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: ssoCallbackUrl,
        redirectUrlComplete: completeUrl,
      });
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const message =
        err instanceof Error
          ? err.message
          : (err as { errors?: { message?: string }[] })?.errors?.[0]?.message;
      toast.error(message || "Provider sign-in failed.");
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white text-zinc-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <section className="relative flex min-h-screen flex-col">
        <div className="flex flex-1 items-center justify-center px-8 py-14 sm:px-10 lg:px-14">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900">
              Sign in
            </h1>
            <p className="mt-3 text-[14px] leading-[1.6] text-zinc-500">
              Welcome back. Sign in to access your indexed projects and chat
              history. New here? Continue with Google or GitHub below. Your
              account is created on the first sign-in.
            </p>

            <form onSubmit={handleSubmit} className="mt-9 space-y-4">
              <FieldGroup label="Email address">
                <Field
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />
              </FieldGroup>

              <FieldGroup label="Password">
                <Field
                  icon={<Lock className="h-4 w-4" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  required
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-zinc-400 transition-colors hover:text-zinc-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
              </FieldGroup>

              <LoadingButton
                type="submit"
                disabled={!isLoaded}
                loading={submitting}
                className="mt-2 h-11 w-full rounded-md bg-zinc-900 text-[14px] font-medium text-white transition-all hover:bg-zinc-800 active:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sign in
              </LoadingButton>
            </form>

            <div className="mt-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-zinc-200" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                or
              </span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <SocialButton
                onClick={() => handleSocial("oauth_google")}
                disabled={!isLoaded}
                label="Continue with Google"
                icon={<GoogleIcon />}
              />
              <SocialButton
                onClick={() => handleSocial("oauth_github")}
                disabled={!isLoaded}
                label="Continue with GitHub"
                icon={<Github className="h-4 w-4 text-zinc-900" />}
              />
            </div>

            <p className="mt-10 text-[12.5px] leading-[1.55] text-zinc-500">
              By signing in you agree to RepoDoc&apos;s{" "}
              <Link
                href="/privacy"
                className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-zinc-700 underline underline-offset-4 hover:text-zinc-900"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
      <AuthBrandPanel />
    </main>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12.5px] font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Field({
  icon,
  trailing,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`h-11 w-full rounded-md border border-zinc-200 bg-white pr-10 text-[14px] text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 ${
          icon ? "pl-10" : "pl-3.5"
        }`}
      />
      {trailing && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </div>
  );
}

function SocialButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2.5 rounded-md border border-zinc-200 bg-white text-[13px] font-medium text-zinc-900 transition-all hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
    </svg>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
