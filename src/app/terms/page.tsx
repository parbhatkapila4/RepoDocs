import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service - RepoDoc",
  description:
    "The terms governing your use of RepoDoc.",
};

export default function TermsOfServicePage() {
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
        <Eyebrow>terms of service</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          The terms of using RepoDoc.
          <br />
          <span className="text-white/45">Plain language. No traps.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          The rules of the road for using RepoDoc: what we provide, what
          you&apos;re responsible for, who owns what, and what happens when
          either side wants out.
        </p>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
          last updated · May 2026
        </p>
      </section>

      <Section label="01 / acceptance" title="Acceptance of terms">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          By accessing or using RepoDoc you agree to be bound by these Terms
          of Service and all applicable laws and regulations. If you do not
          agree, do not use the service.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="agreement">
            The materials on this platform are protected by applicable
            copyright and trademark law. Unauthorized use may violate those
            laws and these terms.
          </Surface>
          <Surface label="updates">
            We may modify these terms. Continued use after changes constitutes
            acceptance of the updated version. Material changes are announced
            by email or in-product notice.
          </Surface>
        </div>
      </Section>

      <Section label="02 / service" title="What RepoDoc does">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          RepoDoc transforms GitHub repositories into queryable knowledge
          bases: code search, documentation generation, and grounded chat.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="what we provide">
            <BulletList
              items={[
                "Codebase indexing and embeddings storage",
                "Natural-language Q&A grounded in retrieved files",
                "README and documentation generation",
                "Architecture and dependency graph extraction",
              ]}
            />
          </Surface>
          <Surface label="availability">
            <BulletList
              items={[
                "We aim for 99.9% monthly uptime; not contractually guaranteed at the free tier",
                "Scheduled maintenance is announced in advance when possible",
                "Email support during business hours",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="03 / accounts" title="Your account">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          You must create an account and provide accurate information to use
          RepoDoc. You are responsible for activity that occurs under your
          account.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="requirements">
            <BulletList
              items={[
                "A valid email address",
                "Connection of a GitHub identity for OAuth or repo access",
                "Accurate registration information",
                "Age 13 or older",
              ]}
            />
          </Surface>
          <Surface label="security">
            <BulletList
              items={[
                "Keep credentials confidential",
                "Notify us immediately of any unauthorized access",
                "Use strong, unique passwords",
                "Two-factor authentication where supported",
              ]}
            />
          </Surface>
        </div>
        <Surface label="responsibility">
          You are responsible for everything that happens under your account.
          Suspected misuse should be reported via the contact email below.
        </Surface>
      </Section>

      <Section label="04 / acceptable use" title="What you can and can't do">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Use RepoDoc only for lawful purposes and in accordance with these
          terms.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="permitted">
            <BulletList
              items={[
                "Indexing and querying repositories you own or are authorized to access",
                "Generating documentation and READMEs for your projects",
                "Sharing knowledge with your team through tokenized public links",
                "Improving your team's codebase understanding and onboarding",
              ]}
            />
          </Surface>
          <Surface label="prohibited">
            <BulletList
              items={[
                "Violating laws, regulations, or third-party rights",
                "Infringing intellectual property or licensing terms",
                "Reverse engineering or scraping the platform",
                "Using the service to facilitate harm or abuse",
                "Sharing credentials or distributing unauthorized access",
                "Spamming, automating heavy load, or evading rate limits",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="05 / intellectual property" title="Who owns what">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          You keep the rights to your code. We keep the rights to our
          platform.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="your content">
            <BulletList
              items={[
                "You retain ownership of your code and documentation",
                "We do not claim ownership of repository content you index",
                "You can delete your data at any time",
                "We respect the licenses under which your repositories are published",
              ]}
            />
          </Surface>
          <Surface label="our platform">
            <BulletList
              items={[
                "Our retrieval pipeline, prompts, and ranking logic",
                "Platform UI, design system, and code",
                "Indexing and observability infrastructure",
                "Service architecture and integrations",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="06 / privacy" title="Privacy and data protection">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Privacy practices are described in detail in the Privacy Policy.
          Highlights below.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="data handling">
            <BulletList
              items={[
                "Encrypted storage and TLS in transit",
                "Limited retention; you can delete on request",
                "Repository content is not used to train external models",
                "We do not sell your data",
              ]}
            />
          </Surface>
          <Surface label="your rights">
            <BulletList
              items={[
                "Access a copy of your data",
                "Correct inaccuracies",
                "Delete your data",
                "Port your data to another provider",
              ]}
            />
          </Surface>
        </div>
        <Surface label="full policy">
          For details, see the{" "}
          <Link
            href="/privacy"
            className="text-white underline underline-offset-4 hover:text-white/75"
          >
            Privacy Policy
          </Link>
          .
        </Surface>
      </Section>

      <Section label="07 / limitations" title="Limitations and disclaimers">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Read the limits below before relying on the service for anything
          high-stakes.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="service limits">
            <BulletList
              items={[
                "AI responses may be incorrect or incomplete",
                "Service availability is not guaranteed",
                "Indexing latency depends on repo size and load",
                "Repository size and rate limits apply",
                "Third-party providers (LLM, GitHub) introduce upstream risk",
              ]}
            />
          </Surface>
          <Surface label="disclaimer">
            RepoDoc is provided &quot;as is,&quot; without warranties of any
            kind, express or implied. We do not guarantee the accuracy or
            completeness of AI-generated answers. Use at your own risk.
          </Surface>
        </div>
      </Section>

      <Section label="08 / termination" title="Ending the relationship">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Either side can end this agreement at any time.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="your rights">
            <BulletList
              items={[
                "Cancel your account at any time",
                "Delete all your data on request",
                "Export your data before deletion",
                "No cancellation fees",
                "Changes take effect immediately",
              ]}
            />
          </Surface>
          <Surface label="our rights">
            <BulletList
              items={[
                "Suspend or terminate accounts that violate these terms",
                "Suspend accounts engaged in illegal activity",
                "Suspend accounts engaged in service abuse",
                "Suspend accounts for non-payment, where applicable",
                "Discontinue features or the service with notice",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="09 / contact" title="Questions about these terms">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          We respond to legal and account inquiries within two business days.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="email">
            <a
              href="mailto:parbhat@parbhat.work"
              className="text-white underline underline-offset-4 transition-colors hover:text-white/75"
            >
              parbhat@parbhat.work
            </a>
          </Surface>
          <Surface label="updates">
            We may update these terms. Material changes will be announced by
            email or through the platform. The &quot;last updated&quot; date
            at the top reflects the current version.
          </Surface>
        </div>
      </Section>
    </main>
  );
}

function TopBar() {
  return (
    <div className="border-b border-white/[0.05]">
      <div className="flex items-center px-6 sm:px-8 lg:px-12 py-4">
        <Link href="/" className="group inline-flex items-center gap-2">
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

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mx-auto max-w-[1800px] px-6 sm:px-10 lg:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
              {label}
            </div>
            <h2 className="mt-3 text-[22px] font-medium tracking-[-0.02em] text-white">
              {title}
            </h2>
          </div>
          <div className="md:col-span-9">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Surface({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.12]">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </div>
      <div className="mt-3 text-[13.5px] leading-[1.65] text-white/65">
        {children}
      </div>
    </div>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => (
        <li
          key={i}
          className="flex items-start gap-3 text-[13.5px] leading-[1.6] text-white/65"
        >
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/30" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
