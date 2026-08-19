"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Github, Mail } from "lucide-react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/LoadingButton";

const TOPICS = ["sales", "support", "feedback", "partnership"] as const;
type Topic = (typeof TOPICS)[number];

const CONTACT_EMAIL = "parbhat@parbhat.work";

export default function ContactPage() {
  const [topic, setTopic] = useState<Topic>("sales");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          name: String(data.get("name") ?? ""),
          email: String(data.get("email") ?? ""),
          company: String(data.get("company") ?? ""),
          message: String(data.get("message") ?? ""),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const fallback = body?.fallbackEmail ?? CONTACT_EMAIL;
        toast.error(body?.error ?? "Could not send your message", {
          description: `Email ${fallback} directly and it will reach the same place.`,
        });
        return;
      }

      toast.success("Message sent", {
        description: "It landed in the inbox. Expect a reply from a human.",
      });
      form.reset();
    } catch {
      toast.error("Could not reach the server", {
        description: `Email ${CONTACT_EMAIL} directly and it will reach the same place.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040406]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh]"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(245,158,11,0.04), transparent 70%)",
        }}
      />

      <TopBar />

      <section className="relative mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 pt-20 pb-12">
        <Eyebrow>contact</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          Talk to a human.
          <br />
          <span className="text-white/45">We read everything.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          Sales, support, partnership, or product feedback  -  pick the right
          channel and we&apos;ll get back to you. For anything urgent, GitHub
          issues are the fastest path.
        </p>
      </section>

      <section>
        <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <aside className="space-y-3 lg:col-span-4">
              <Channel
                href={`mailto:${CONTACT_EMAIL}`}
                icon={<Mail className="h-3.5 w-3.5" />}
                label="email"
                value={CONTACT_EMAIL}
                hint="best for sales and partnership"
              />
              <Channel
                href="https://github.com/parbhatkapila4/RepoDocs/issues"
                external
                icon={<Github className="h-3.5 w-3.5" />}
                label="github issues"
                value="parbhatkapila4 / RepoDocs"
                hint="best for bugs and feature requests"
              />
              <Channel
                href="/documentation"
                label="documentation"
                value="self-serve answers"
                hint="end-to-end product walkthrough"
              />

              <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.015] px-5 py-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
                  response time
                </div>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">
                  We aim to reply within one business day. Enterprise inquiries
                  go straight to the founders.
                </p>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 sm:p-8"
              >
                <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
                  send a message
                </div>

                <div className="mt-6">
                  <Label>topic</Label>
                  <div
                    role="tablist"
                    className="mt-3 inline-flex flex-wrap gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] p-1"
                  >
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="tab"
                        aria-selected={topic === t}
                        onClick={() => setTopic(t)}
                        className={[
                          "rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                          topic === t
                            ? "bg-white text-black"
                            : "text-white/55 hover:text-white",
                        ].join(" ")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field
                    id="name"
                    label="name"
                    placeholder="your name"
                    required
                  />
                  <Field
                    id="email"
                    label="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                  />
                </div>

                <div className="mt-5">
                  <Field
                    id="company"
                    label="company"
                    placeholder="optional"
                  />
                </div>

                <div className="mt-5">
                  <Label htmlFor="message">message</Label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    placeholder="tell us what you're working on…"
                    className="mt-2 w-full resize-none rounded-md border border-white/[0.08] bg-white/[0.015] px-3.5 py-3 text-[14px] text-white placeholder-white/30 transition-colors focus:border-white/20 focus:bg-white/[0.03] focus:outline-none"
                  />
                </div>

                <div className="mt-7 flex items-center justify-between gap-4">
                  <p className="text-[12px] text-white/35">
                    by sending, you agree to our{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-4 transition-colors hover:text-white/60"
                    >
                      privacy policy
                    </Link>
                    .
                  </p>
                  <LoadingButton
                    type="submit"
                    loading={submitting}
                    className="rounded-md bg-white px-4 py-2 text-[13px] font-medium text-black transition-all hover:bg-white/95 disabled:opacity-60"
                  >
                    Send message
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Channel({
  href,
  external,
  icon,
  label,
  value,
  hint,
}: {
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  const className =
    "group block rounded-lg border border-white/[0.06] bg-white/[0.015] px-5 py-4 transition-colors hover:border-white/[0.14]";

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
          {icon}
          {label}
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white/60" />
      </div>
      <div className="mt-2 text-[14.5px] font-medium tracking-[-0.01em] text-white">
        {value}
      </div>
      <p className="mt-1 text-[12.5px] text-white/40">{hint}</p>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[10px] uppercase tracking-[0.22em] text-white/35"
    >
      {children}
    </label>
  );
}

function Field({
  id,
  label,
  type = "text",
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-md border border-white/[0.08] bg-white/[0.015] px-3.5 py-2.5 text-[14px] text-white placeholder-white/30 transition-colors focus:border-white/20 focus:bg-white/[0.03] focus:outline-none"
      />
    </div>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/[0.05]">
      <div className="flex items-center px-6 sm:px-8 lg:px-12 py-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/40 transition-all group-hover:-translate-x-0.5 group-hover:text-white/70" />
          <Image
            src="/repodoc.png"
            alt="RepoDoc"
            width={20}
            height={20}
            className="rounded-[5px]"
          />
          <span className="text-[13.5px] font-medium tracking-[-0.01em] text-white/85 transition-colors group-hover:text-white">
            RepoDoc
          </span>
        </Link>
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/45">
      <span className="h-1 w-1 rounded-full bg-amber-400" />
      {children}
    </div>
  );
}
