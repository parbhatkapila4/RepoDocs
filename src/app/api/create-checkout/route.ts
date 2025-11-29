import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Price IDs from Stripe Dashboard
const PRICE_IDS = {
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || '',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
};

// Plan amounts in cents (for price_data fallback)
const PLAN_AMOUNTS = {
  professional: 2000, // $20
  enterprise: 4900, // $49
};

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { plan } = body;

    if (!plan || !['professional', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Get user email for Stripe
    let customerEmail: string | undefined;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { emailAddress: true },
      });
      customerEmail = user?.emailAddress;
    } catch {
      // Continue without email
    }

    // Get the origin for redirect URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    
    // Build line items - use price ID if available, otherwise create inline price
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `RepoDoc ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: plan === 'enterprise' 
                ? 'Unlimited projects, advanced security, team features, SLA guarantees'
                : 'Up to 10 projects, advanced AI features, priority support',
            },
            unit_amount: PLAN_AMOUNTS[plan as keyof typeof PLAN_AMOUNTS],
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${origin}/?payment=success&plan=${plan}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        plan: plan,
        userId: userId,
      },
      customer_email: customerEmail,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

