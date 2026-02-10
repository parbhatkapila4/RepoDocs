import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

function normalizePlanName(
  plan: string
): "starter" | "professional" | "enterprise" {
  const planLower = plan.toLowerCase();
  if (planLower === "pro" || planLower === "professional") {
    return "professional";
  }
  if (planLower === "enterprise" || planLower === "ent") {
    return "enterprise";
  }
  return "starter";
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let forcePlan: string | null = null;
    try {
      const body = await req.json();
      forcePlan = body?.forcePlan;
    } catch {}

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, emailAddress: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (forcePlan && ["professional", "enterprise"].includes(forcePlan)) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: forcePlan },
      });
      return NextResponse.json({
        success: true,
        plan: forcePlan,
        previousPlan: user.plan,
        message: `Plan force-updated to ${forcePlan}`,
      });
    }

    const customers = await stripe.customers.list({
      email: user.emailAddress,
      limit: 1,
    });

    if (customers.data.length === 0) {
      const normalizedPlan = user.plan
        ? normalizePlanName(user.plan)
        : "starter";
      if (normalizedPlan !== user.plan) {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: normalizedPlan },
        });
        return NextResponse.json({
          success: true,
          plan: normalizedPlan,
          previousPlan: user.plan,
          message: `Plan name normalized from ${user.plan} to ${normalizedPlan}`,
        });
      }

      return NextResponse.json({
        success: true,
        plan: user.plan,
        message: "No Stripe customer found, keeping current plan",
      });
    }

    const customer = customers.data[0];

    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      if (user.plan !== "starter") {
        await prisma.user.update({
          where: { id: userId },
          data: { plan: "starter" },
        });
        return NextResponse.json({
          success: true,
          plan: "starter",
          message: "No active subscription found, reverted to starter plan",
        });
      }
      return NextResponse.json({
        success: true,
        plan: user.plan,
        message: "No active subscription, already on starter plan",
      });
    }

    let newPlan: "starter" | "professional" | "enterprise" = "starter";
    let highestAmount = 0;

    for (const subscription of subscriptions.data) {
      const amount = subscription.items.data[0]?.price?.unit_amount || 0;
      const amountInDollars = amount / 100;

      if (amount > highestAmount) {
        highestAmount = amount;

        if (amountInDollars >= 49) {
          newPlan = "enterprise";
        } else if (amountInDollars >= 20) {
          newPlan = "professional";
        }
      }
    }

    if (user.plan !== newPlan) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: newPlan },
      });

      return NextResponse.json({
        success: true,
        plan: newPlan,
        previousPlan: user.plan,
        message: `Plan updated from ${user.plan} to ${newPlan}`,
      });
    }

    return NextResponse.json({
      success: true,
      plan: user.plan,
      message: "Plan is already in sync",
    });
  } catch (error) {
    console.error("Error syncing plan:", error);
    return NextResponse.json({ error: "Failed to sync plan" }, { status: 500 });
  }
}
