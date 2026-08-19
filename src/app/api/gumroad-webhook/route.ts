import { log } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROFESSIONAL_PERMALINK =
  process.env.GUMROAD_PROFESSIONAL_PERMALINK?.trim() || "nvfiwo";
const ENTERPRISE_PERMALINK =
  process.env.GUMROAD_ENTERPRISE_PERMALINK?.trim() || "sesqgd";

function permalinkToPlan(
  permalink: string
): "professional" | "enterprise" | null {
  if (!permalink) return null;
  const slug = permalink.includes("/")
    ? permalink.split("/").filter(Boolean).pop() || ""
    : permalink;
  if (slug === PROFESSIONAL_PERMALINK) return "professional";
  if (slug === ENTERPRISE_PERMALINK) return "enterprise";
  return null;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.GUMROAD_WEBHOOK_SECRET;
  if (!expected) {
    console.error(
      "[gumroad-webhook] GUMROAD_WEBHOOK_SECRET is not configured; rejecting."
    );
    return false;
  }
  const provided = req.nextUrl.searchParams.get("secret") || "";
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, string> = {};
  try {
    const text = await req.text();
    payload = Object.fromEntries(new URLSearchParams(text).entries());
  } catch (error) {
    console.error("[gumroad-webhook] failed to parse body:", error);
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const buyerEmail = (payload.email || "").trim().toLowerCase();
  const saleId = payload.sale_id || payload.subscription_id || "(none)";

  if (!buyerEmail) {
    console.warn("[gumroad-webhook] payload has no buyer email", { saleId });
    return NextResponse.json(
      { received: true, ignored: "no_email" },
      { status: 200 }
    );
  }

  const isRevoked =
    payload.refunded === "true" ||
    payload.disputed_won === "true" ||
    payload.chargedback === "true" ||
    payload.cancelled === "true" ||
    payload.ended === "true";

  if (isRevoked) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          emailAddress: { equals: buyerEmail, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "starter" },
        });
        log.info("[gumroad-webhook] downgrade -> starter", {
          email: buyerEmail,
          saleId,
        });
      } else {
        console.warn("[gumroad-webhook] revoke for unknown user", {
          email: buyerEmail,
          saleId,
        });
      }
    } catch (error) {
      console.error("[gumroad-webhook] downgrade failed:", error);
    }
    return NextResponse.json(
      { received: true, action: "downgrade" },
      { status: 200 }
    );
  }

  const permalink = (
    payload.permalink ||
    payload.product_permalink ||
    ""
  ).trim();
  const plan = permalinkToPlan(permalink);
  if (!plan) {
    console.warn("[gumroad-webhook] unknown product permalink", {
      permalink,
      saleId,
    });
    return NextResponse.json(
      { received: true, ignored: "unknown_product" },
      { status: 200 }
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailAddress: { equals: buyerEmail, mode: "insensitive" } },
      select: { id: true, plan: true },
    });
    if (!user) {
      console.warn("[gumroad-webhook] sale for unknown user", {
        email: buyerEmail,
        saleId,
      });
      return NextResponse.json(
        { received: true, ignored: "user_not_found" },
        { status: 200 }
      );
    }
    if (user.plan === plan) {
      return NextResponse.json(
        { received: true, action: "noop", plan },
        { status: 200 }
      );
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { plan },
    });
    log.info("[gumroad-webhook] upgrade", {
      email: buyerEmail,
      previousPlan: user.plan,
      plan,
      saleId,
    });
    return NextResponse.json(
      { received: true, action: "upgrade", plan },
      { status: 200 }
    );
  } catch (error) {
    console.error("[gumroad-webhook] upgrade failed:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
