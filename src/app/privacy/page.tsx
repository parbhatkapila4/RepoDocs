import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - RepoDoc",
  description:
    "How RepoDoc collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
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
        <Eyebrow>privacy policy</Eyebrow>
        <h1 className="mt-6 text-[clamp(2rem,4.4vw,3.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-white">
          Your data, handled deliberately.
          <br />
          <span className="text-white/45">No selling. No surprises.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.6] text-white/55">
          How RepoDoc collects, uses, and protects your information. This
          policy covers personal data, repository content, and the AI-generated
          artifacts produced during indexing and querying.
        </p>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
          last updated · May 2026
        </p>
      </section>

      <Section label="01 / introduction" title="Scope of this policy">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          This Privacy Policy describes how RepoDoc (&quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;) collects, uses, and discloses your
          information when you use the platform. By using RepoDoc you agree to
          the practices described here.
        </p>
        <Surface label="commitment">
          We are committed to protecting your privacy and handling your data
          with the highest standards of security and transparency. Source code
          and personal information are treated with the same care as our own.
        </Surface>
      </Section>

      <Section label="02 / what we collect" title="Information we collect">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          We collect only what is necessary to operate the retrieval and
          indexing surface and to maintain your account.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="personal information">
            <BulletList
              items={[
                <>
                  <Strong>Account data:</Strong> email address, GitHub
                  username, profile information.
                </>,
                <>
                  <Strong>Usage data:</Strong> how you interact with the
                  platform, queries made, features used.
                </>,
                <>
                  <Strong>Communication:</Strong> support requests and
                  feedback you send.
                </>,
              ]}
            />
          </Surface>
          <Surface label="repository data">
            <BulletList
              items={[
                <>
                  <Strong>Code content:</Strong> source files, documentation,
                  and project structure of repos you index.
                </>,
                <>
                  <Strong>Metadata:</Strong> repository information, commit
                  history, file structure.
                </>,
                <>
                  <Strong>Generated data:</Strong> AI summaries, embeddings,
                  and answers produced during use.
                </>,
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="03 / how we use it" title="How your information is used">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Information is used solely to operate and improve the service. We do
          not use repository content to train external models.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="service provision">
            <BulletList
              items={[
                "Process and analyze your codebase",
                "Generate grounded answers to queries",
                "Maintain your project history and chat history",
                "Provide technical support",
              ]}
            />
          </Surface>
          <Surface label="platform improvement">
            <BulletList
              items={[
                "Improve retrieval and ranking quality",
                "Optimize indexing and search latency",
                "Identify and fix bugs through error telemetry",
                "Develop new features",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="04 / data sharing" title="Data sharing and disclosure">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          We do not sell your personal data. Limited disclosure happens only
          in two cases.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="service providers">
            Trusted vendors that help us operate the platform (hosting,
            authentication, AI providers). All providers are bound by
            confidentiality terms and process data on our behalf.
          </Surface>
          <Surface label="legal requirements">
            When required by law, valid court order, or to protect the rights,
            property, or safety of RepoDoc, our users, or the public.
          </Surface>
        </div>
      </Section>

      <Section label="05 / data security" title="How your data is protected">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Industry-standard controls protect your data at rest and in transit.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="technical safeguards">
            <BulletList
              items={[
                "TLS for data in transit",
                "Encryption at rest provided by our database host",
                "Stored GitHub tokens encrypted with AES-256-GCM",
                "Authenticated, owner-scoped access on every API route",
              ]}
            />
          </Surface>
          <Surface label="operational security">
            <BulletList
              items={[
                "RepoDoc is operated by one person; access is limited to that operator",
                "Every AI request logged with model, tokens, latency and cost",
                "Backups handled by our managed database provider",
                "Lint, typecheck and tests run in CI on every push",
              ]}
            />
          </Surface>
        </div>
      </Section>

      <Section label="06 / your rights" title="What you can do with your data">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          You retain control over your personal data. To exercise any of these
          rights, email us at the address below.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Surface label="access &amp; portability">
            Request a copy of all personal data we hold about you in a
            structured, machine-readable format.
          </Surface>
          <Surface label="correction">
            Update or correct any inaccurate or incomplete information in your
            account.
          </Surface>
          <Surface label="deletion">
            Request deletion of your personal data, subject to legal
            obligations and legitimate business interests.
          </Surface>
          <Surface label="objection">
            Object to specific types of processing where we rely on legitimate
            interests rather than consent.
          </Surface>
        </div>
      </Section>

      <Section label="07 / contact" title="Reach out about privacy">
        <p className="text-[14.5px] leading-[1.7] text-white/65">
          Questions about this policy or want to exercise your rights? We
          respond to privacy inquiries within two business days.
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
          <Surface label="policy updates">
            We may update this policy. Material changes will be announced by
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

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-white/90">{children}</span>;
}
