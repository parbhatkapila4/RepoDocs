import type { Metadata } from "next";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/provider/ThemeProvider";
import { ReduxProvider } from "@/provider/ReduxProvider";
import { MotionProvider } from "@/provider/MotionProvider";
import { ConsoleFilter } from "@/components/ConsoleFilter";


export const metadata: Metadata = {
  title: "RepoDoc  -  AI infrastructure for understanding code",
  description:
    "Connect any GitHub repository. Ask questions in plain English. Every answer cites the source files it was drawn from. Built with Next.js, Clerk, pgvector.",
  keywords: [
    "GitHub",
    "README",
    "documentation",
    "developer tools",
    "RAG",
    "code search",
    "pgvector",
  ],
  authors: [{ name: "Parbhat Kapila" }],
  creator: "Parbhat Kapila",
  publisher: "RepoDoc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://repodoc.parbhat.dev"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "any" }],
    apple: [{ url: "/favicon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "RepoDoc  -  AI infrastructure for understanding code",
    description:
      "Connect any GitHub repository. Ask questions in plain English. Every answer cites the source files it was drawn from.",
    url: "https://repodoc.parbhat.dev",
    siteName: "RepoDoc",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "RepoDoc  -  AI infrastructure for understanding code",
    description:
      "Connect any GitHub repository. Ask questions in plain English. Every answer cites the source files it was drawn from.",
    creator: "@Parbhat03",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      signInForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className="dark"
        style={{ colorScheme: "dark" }}
        suppressHydrationWarning
      >
        <head>
          <link rel="apple-touch-icon" href="/favicon.png" />
          <link rel="manifest" href="/site.webmanifest" />
        </head>
        <body className="antialiased" suppressHydrationWarning>
          <ConsoleFilter />
          <ReduxProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              forcedTheme="dark"
              disableTransitionOnChange
            >
              <MotionProvider>{children}</MotionProvider>
            </ThemeProvider>
            <Toaster />
          </ReduxProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
