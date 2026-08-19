import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  rateLimit,
  rateLimitResponse,
  getRateLimitIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limiter";

const ContactSchema = z.object({
  topic: z.enum(["sales", "support", "feedback", "partnership"]),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(1).max(5000),
});

const CONTACT_RATE_LIMIT = { windowMs: 60 * 60 * 1000, maxRequests: 5 };

const DEFAULT_TO_EMAIL = "parbhat@parbhat.work";

const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

const TO_EMAIL = process.env.CONTACT_TO_EMAIL?.trim() || DEFAULT_TO_EMAIL;
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;

export async function POST(request: NextRequest) {
  const rl = await rateLimit(
    getRateLimitIdentifier(request),
    CONTACT_RATE_LIMIT,
  );
  if (!rl.success) return rateLimitResponse(rl.resetTime);

  const parsed = ContactSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please fill in your name, a valid email, and a message." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not configured; refusing send.");
    return NextResponse.json(
      { error: "Email delivery is not configured.", fallbackEmail: TO_EMAIL },
      { status: 503 },
    );
  }

  const { topic, name, email, company, message } = parsed.data;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: `RepoDoc Contact <${FROM_EMAIL}>`,
      to: [TO_EMAIL],
      replyTo: email,
      subject: `[RepoDoc ${topic}] ${name}${company ? ` (${company})` : ""}`,
      text: [
        `Topic:   ${topic}`,
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Company: ${company || "-"}`,
        "",
        message,
      ].join("\n"),
    });

    if (error) {
      console.error("[contact] Resend rejected the message:", error);
      return NextResponse.json(
        { error: "Could not send your message.", fallbackEmail: TO_EMAIL },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] Unexpected failure sending message:", err);
    return NextResponse.json(
      { error: "Could not send your message.", fallbackEmail: TO_EMAIL },
      { status: 502 },
    );
  }
}
