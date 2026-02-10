import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.arrayBuffer();

    const rawBody = Buffer.from(body);

    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("Missing stripe-signature header");
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail =
        session.customer_email || session.customer_details?.email;

      let planToAssign: "professional" | "enterprise" | null = null;

      if (session.metadata?.plan) {
        planToAssign = session.metadata.plan as "professional" | "enterprise";
      }

      if (!planToAssign && session.amount_total) {
        const amount = session.amount_total / 100;
        if (amount >= 49) {
          planToAssign = "enterprise";
        } else if (amount >= 20) {
          planToAssign = "professional";
        }
      }

      if (!planToAssign) {
        console.error("Could not determine plan for session:", session.id);
        planToAssign = "professional";
      }

      let userUpdated = false;

      if (session.metadata?.userId) {
        try {
          const updatedUser = await prisma.user.update({
            where: { id: session.metadata.userId },
            data: { plan: planToAssign },
          });
          userUpdated = true;
        } catch (err) {}
      }

      if (!userUpdated && customerEmail) {
        try {
          const updatedUser = await prisma.user.update({
            where: { emailAddress: customerEmail },
            data: { plan: planToAssign },
          });
          userUpdated = true;
        } catch (dbError: unknown) {
          const existingUser = await prisma.user.findFirst({
            where: {
              emailAddress: {
                equals: customerEmail,
                mode: "insensitive",
              },
            },
          });

          if (existingUser) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { plan: planToAssign },
            });
            userUpdated = true;
          }
        }
      }

      if (!userUpdated) {
        console.error(
          "Could not find user to update. Session:",
          session.id,
          "Email:",
          customerEmail
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
